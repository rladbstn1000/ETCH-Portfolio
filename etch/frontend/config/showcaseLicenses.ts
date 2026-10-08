import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
interface LockPackage { version?: string; license?: string; }

/** Bundle에 실제 포함된 패키지와 ETCH 원본의 배포 고지를 HTML로 보존한다. */
export function showcaseLicenses(frontendRoot: string, modules: string[]): string {
  const lock = JSON.parse(readFileSync(resolve(frontendRoot, 'package-lock.json'), 'utf8')) as { packages: Record<string, LockPackage> };
  const packageNames = [...new Set(modules.filter(id => id.includes('node_modules/')).map(id => {
    const pieces = id.split('node_modules/').at(-1)!.split('/');
    return pieces[0].startsWith('@') ? pieces.slice(0, 2).join('/') : pieces[0];
  }))].sort();
  const notices = [{ name: 'ETCH Team · 기존 구현 및 정적 화면 체험판', version: '', license: 'MIT', text: readFileSync(resolve(frontendRoot, '../../LICENSE'), 'utf8') }];
  for (const name of packageNames) {
    const metadata = lock.packages[`node_modules/${name}`];
    const directory = resolve(frontendRoot, 'node_modules', name);
    const filename = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md', 'LICENCE.txt'].find(file => existsSync(resolve(directory, file)));
    if (!metadata?.version || !metadata?.license || !filename) throw new Error(`정적 배포 라이선스 확인 필요: ${name}`);
    notices.push({ name, version: metadata.version, license: metadata.license, text: readFileSync(resolve(directory, filename), 'utf8') });
  }
  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ETCH · 오픈소스 고지</title><style>body{font-family:system-ui,sans-serif;line-height:1.6;max-width:880px;padding:24px;margin:auto;color:#17233b}a{color:#0068d1}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:#f5f7fa;font-size:14px}section{margin:40px 0}a:focus-visible{outline:3px solid #007dfc;outline-offset:4px}</style></head><body><a href="/">← 화면 체험판</a><h1>오픈소스 고지</h1><p>기존 ETCH 구현과 이 정적 빌드에 실제 포함된 런타임 패키지의 라이선스입니다. 아래 연락처와 저작권자 표기는 공개 라이선스 원문에 포함된 고지이며 예시 회원 데이터가 아닙니다.</p>${notices.map(notice => `<section><h2>${escapeHtml(notice.name)} ${escapeHtml(notice.version)}</h2><p>${escapeHtml(notice.license)}</p><pre>${escapeHtml(notice.text)}</pre></section>`).join('')}</body></html>\n`;
}
