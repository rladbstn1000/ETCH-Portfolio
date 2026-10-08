import { resolve } from 'node:path';
import { build, preview } from 'vite';

// Vite's normal dev client opens its own socket even with server.hmr=false.
// Watch production files instead; the browser receives only the static app.
const configFile = resolve('vite.showcase.config.ts');
const outDir = resolve('../../.local/showcase/dev-build');
const watcher = await build({ configFile, mode: 'showcase', build: { outDir, watch: {} } });
let server;
let starting = false;
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  await watcher.close();
  if (server) await new Promise(done => server.httpServer.close(done));
  process.exit(code);
}
watcher.on('event', async event => {
  if (event.code === 'ERROR') console.error('정적 빌드 오류:', event.error.message);
  if (event.code === 'END' && !starting) {
    starting = true;
    try {
      server = await preview({ configFile, mode: 'showcase', build: { outDir }, preview: { host: '127.0.0.1', port: 5196, strictPort: true } });
      server.printUrls();
      console.info('정적 빌드 변경을 감시합니다. 화면은 수동으로 새로고침하세요.');
    } catch (error) { console.error(error.message); await stop(1); }
  }
});
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
