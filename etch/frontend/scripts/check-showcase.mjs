import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, lstat, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = content => createHash('sha256').update(content).digest('hex');
const argumentsList = process.argv.slice(2);
const option = (name, fallback) => { const index = argumentsList.indexOf(name); return index < 0 ? fallback : argumentsList[index + 1]; };
const dist = resolve(option('--dist', join(frontend, 'dist-showcase')));
const modulesPath = resolve(frontend, '../../.local/showcase/build-modules.json');
const auditPath = resolve(frontend, '../../.local/showcase/npm-audit-production.json');
if (argumentsList.includes('--refresh-audit')) {
  const lockBefore = sha256(await readFile(join(frontend, 'package-lock.json')));
  const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], { cwd: frontend, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const parsed = JSON.parse(result.stdout || '{}');
  if (result.error || parsed.error || !parsed.metadata) throw new Error('npm audit 실행 실패: 원문 값은 출력하지 않습니다.');
  if (sha256(await readFile(join(frontend, 'package-lock.json'))) !== lockBefore) throw new Error('감사 도중 lock 변경: 다시 실행하세요.');
  await mkdir(dirname(auditPath), { recursive: true });
  await writeFile(auditPath, result.stdout);
  await writeFile(resolve(frontend, '../../.local/showcase/npm-audit-input.json'), JSON.stringify({ packageLockSha256: lockBefore, auditResponseSha256: sha256(result.stdout) }, null, 2) + '\n');
}
const findings = [];
const flag = (rule, file, count = 1) => findings.push({ rule, file, count });

async function filesIn(directory) {
  const result = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = join(directory, name);
    const info = await lstat(path);
    if (info.isSymbolicLink()) { flag('unexpected-public-link', relative(dist, path)); continue; }
    if (info.isDirectory()) {
      if (['functions', '_worker.js'].includes(name.toLowerCase())) { flag('server-runtime-directory', relative(dist, path)); continue; }
      result.push(...await filesIn(path));
    }
    else result.push(path);
  }
  return result;
}

const rootInfo = await lstat(dist);
if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
  console.log(JSON.stringify({ status: 'FAIL', findings: [{ rule: 'unexpected-output-root', file: '<dist>', count: 1 }] }, null, 2));
  process.exit(1);
}
const assetSources = ['etch', 'placeholder', 'profile', 'search'];
const approvedSvgs = new Map();
for (const name of assetSources) approvedSvgs.set(sha256(await readFile(join(frontend, 'src/assets/public', `${name}.svg`))), name);
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['jwt-shaped-value', /\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g],
  ['bearer-value', /Bearer\s+[A-Za-z0-9._~-]{24,}/g],
  ['database-connection', /(?:jdbc:|mongodb(?:\+srv)?:\/\/|mysql:\/\/|postgres(?:ql)?:\/\/)/gi],
  ['credential-assignment', /(?:password|client_secret|api[_-]?key|access[_-]?token|refresh[_-]?token)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/gi],
  ['contact-email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ['korean-mobile-contact', /(?<!\d)01[016789][ -]?\d{3,4}[ -]?\d{4}(?!\d)/g],
  ['backend-or-auth-route', /(?:\/api\/v1|\/oauth2\/|\/login\/oauth2|\/auth\/refresh|wss?:\/\/|https?:\/\/127\.0\.0\.1(?::\d+)?)/g],
  ['private-ip-url', /https?:\/\/(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?/g],
];
const manifest = [];
const seenSvg = new Set();
for (const path of await filesIn(dist)) {
  const file = relative(dist, path).replaceAll('\\', '/');
  const content = await readFile(path);
  const hash = sha256(content);
  manifest.push({ file, bytes: content.length, sha256: hash });
  const allowed = /^(?:index\.html|licenses\.html|_headers|assets\/[A-Za-z0-9_-]+\.(?:js|css|svg))$/.test(file);
  if (!allowed) flag('unexpected-public-file', file);
  if (/(?:^|\/)(?:\.env|stats|.*\.(?:map|log|sql|sqlite|db|tar|gz|zip|tsx?|md|jsonl))\b/i.test(file)) flag('source-or-private-artifact', file);
  if (file.endsWith('.svg')) {
    const source = approvedSvgs.get(hash);
    if (!source) flag('unreviewed-svg', file);
    else seenSvg.add(source);
  }
  const text = content.toString('utf8');
  for (const [rule, pattern] of rules) {
    // Dependency copyright contacts are notices, not fictional user data.
    if (file === 'licenses.html' && rule === 'contact-email') continue;
    const count = [...text.matchAll(pattern)].length;
    if (count) flag(rule, file, count);
  }
  if (/\.map(?:["'\s]|$)/.test(text) && /sourceMappingURL=/.test(text)) flag('sourcemap-reference', file);
  if (/ETCH_SHOWCASE_(?:DOTENV|LOCAL|SHELL)_CANARY/.test(text)) flag('ambient-env-canary', file);
}
for (const name of assetSources) if (!seenSvg.has(name)) flag('missing-reviewed-svg', `src/assets/public/${name}.svg`);
for (const required of ['index.html', 'licenses.html', '_headers']) if (!manifest.some(item => item.file === required)) flag('missing-static-file', required);
const headers = await readFile(join(dist, '_headers'), 'utf8');
if (!headers.includes("connect-src 'none'") || !headers.includes("form-action 'none'")) flag('missing-network-csp', '_headers');
if (manifest.some(item => item.file === '404.html')) flag('cloudflare-spa-fallback-disabled', '404.html');
if (manifest.some(item => item.file === '_redirects')) flag('unexpected-redirect-rule', '_redirects');

const modulesBytes = await readFile(modulesPath);
const modules = JSON.parse(modulesBytes);
const forbidden = modules.filter(id => /\/src\/api\/|(?:^|\/)src\/api\/|(?:^|\/)src\/store\/userStore|(?:^|\/)src\/(?:utils\/.*(?:[Tt]oken|jwt)|services\/chatService|contexts\/chatContext)|(?:^|\/)node_modules\/(?:axios|jwt-decode|sockjs-client|@stomp)\//.test(id.replaceAll('\0', '')));
for (const module of forbidden) flag('real-client-module', module.replaceAll('\0', ''));
const packageNames = [...new Set(modules.filter(id => id.includes('node_modules/')).map(id => {
  const pieces = id.split('node_modules/').at(-1).split('/');
  return pieces[0].startsWith('@') ? pieces.slice(0, 2).join('/') : pieces[0];
}))].sort();
const lockBytes = await readFile(join(frontend, 'package-lock.json'));
const lock = JSON.parse(lockBytes);
const dependencies = packageNames.map(name => {
  const record = lock.packages[`node_modules/${name}`];
  if (!record?.version || !record?.license) flag('unidentified-bundled-dependency', name);
  return { name, version: record?.version ?? null, license: record?.license ?? null };
});
const licenseFile = manifest.find(item => item.file === 'licenses.html');
if (licenseFile) {
  const licenseHtml = await readFile(join(dist, 'licenses.html'), 'utf8');
  const escapeHtml = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const expectedLicenses = [await readFile(resolve(frontend, '../../LICENSE'), 'utf8')];
  for (const { name } of dependencies) {
    let license;
    for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'LICENCE.txt']) {
      try { license = await readFile(join(frontend, 'node_modules', name, filename), 'utf8'); break; } catch { /* Try the next conventional license name. */ }
    }
    if (license) expectedLicenses.push(license);
    else flag('missing-runtime-license-source', name);
  }
  const actualBlocks = [...licenseHtml.matchAll(/<pre>([\s\S]*?)<\/pre>/g)].map(match => match[1]);
  if (JSON.stringify(actualBlocks) !== JSON.stringify(expectedLicenses.map(escapeHtml))) flag('runtime-license-notice-mismatch', 'licenses.html');
}
let audit;
try { audit = JSON.parse(await readFile(auditPath, 'utf8')); } catch { flag('npm-audit-not-executed', 'npm audit --omit=dev'); }
if (audit?.error) flag('npm-audit-error', 'npm audit --omit=dev');
let auditBinding;
try {
  auditBinding = JSON.parse(await readFile(resolve(frontend, '../../.local/showcase/npm-audit-input.json'), 'utf8'));
  if (auditBinding.packageLockSha256 !== sha256(lockBytes) || auditBinding.auditResponseSha256 !== sha256(await readFile(auditPath))) flag('npm-audit-input-changed', 'npm audit --omit=dev');
} catch { flag('npm-audit-binding-missing', 'npm audit --omit=dev'); }
const usedVulnerabilities = Object.entries(audit?.vulnerabilities ?? {}).filter(([name]) => packageNames.includes(name)).map(([name, value]) => ({ name, severity: value.severity, range: value.range, fixAvailable: Boolean(value.fixAvailable) }));
for (const vulnerability of usedVulnerabilities) flag('bundled-dependency-advisory', vulnerability.name);
const report = {
  schemaVersion: 1,
  reviewedAt: new Date().toISOString(),
  status: findings.length ? 'FAIL' : 'PASS',
  scope: '공개 정적 산출물 파일·검토 SVG·실제 포함 모듈·npm production 의존성. 백엔드/과거 Git/운영 자격증명은 미검사.',
  outputDirectory: 'etch/frontend/dist-showcase',
  fileCount: manifest.length,
  totalBytes: manifest.reduce((sum, item) => sum + item.bytes, 0),
  manifest,
  spaRouting: { provider: 'Cloudflare Pages', configuration: '최상위 404.html과 _redirects 없이 Pages 기본 SPA fallback 사용', localBrowserCheck: 'Vite production preview의 별도 경로 재진입 검증은 브라우저 기록 참조' },
  reviewedSvgSources: assetSources.map(name => `etch/frontend/src/assets/public/${name}.svg`),
  moduleEvidenceSha256: sha256(modulesBytes),
  moduleCount: modules.length,
  runtimeDependencies: dependencies,
  npmAudit: { packageLockSha256: sha256(lockBytes), auditResponseSha256: auditBinding?.auditResponseSha256 ?? null, command: 'npm audit --omit=dev --json', wholeProductionGraph: audit?.metadata?.vulnerabilities ?? null, actuallyBundledFindings: usedVulnerabilities, limitation: '감사 시점 npm advisory 결과이며 모든 취약점 부재를 보증하지 않는다. dev 도구·기존 서버 보안 상태는 별도다.' },
  patternReview: { ruleNames: rules.map(([name]) => name), findings, limitation: '패턴 검사와 공개 fixture 필드 검토를 함께 사용한다. 모든 비밀값/개인정보를 자동 판별한다는 의미는 아니다. 검출 값은 출력하지 않는다.' },
  networkLiteralReview: { libraryReferences: ['W3C 네임스페이스', 'React 오류 문서', 'React Router 문서', 'url-search-params 문서'], routerInternalUrlBase: 'react-router 내부 URL 해석용 localhost 상수는 네트워크 호출 증거가 아니다.', emptyCompanyLink: '공개 fixture homepageUrl은 빈 문자열이며 링크를 렌더하지 않는다. 실제 호출 여부는 production 브라우저 네트워크 검사로 별도 검증한다.' },
  unchangedExternalStatus: { BACKEND_SECURITY: '기존 미해결 상태 유지', HISTORICAL_CREDENTIALS: '기존 외부 조치 상태 유지', EXTERNAL_DEPLOYMENT: '이 검사는 배포를 수행하거나 배포 상태를 확인하지 않음' },
};
const output = option('--output', null);
if (output) { await mkdir(dirname(resolve(output)), { recursive: true }); await writeFile(resolve(output), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, fileCount: report.fileCount, totalBytes: report.totalBytes, actualRuntimePackages: dependencies.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
