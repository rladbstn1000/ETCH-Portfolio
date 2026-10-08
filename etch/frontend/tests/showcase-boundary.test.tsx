// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadConfigFromFile, resolveConfig } from 'vite';

const temporaryDirectories: string[] = [];
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('showcase 빌드 입력 경계', () => {
  it('기존 모드와 독립적으로 dotenv와 shell VITE 변수들을 읽지 않는다', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'etch-showcase-env-'));
    temporaryDirectories.push(temporaryRoot);
    await writeFile(join(temporaryRoot, '.env'), 'VITE_API_BASE_URL=ETCH_SHOWCASE_DOTENV_CANARY\nVITE_DEMO_MODE=true\n');
    await writeFile(join(temporaryRoot, '.env.local'), 'VITE_CLIENT_SECRET=ETCH_SHOWCASE_LOCAL_CANARY\nVITE_PUBLIC_DEMO=true\n');
    const keys = ['VITE_API_BASE_URL', 'VITE_CLIENT_SECRET', 'VITE_DEMO_MODE', 'VITE_PUBLIC_DEMO', 'NODE_ENV'];
    const prior = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    try {
      process.env.VITE_API_BASE_URL = 'ETCH_SHOWCASE_SHELL_CANARY';
      process.env.VITE_CLIENT_SECRET = 'ETCH_SHOWCASE_SHELL_CANARY';
      process.env.VITE_DEMO_MODE = 'true';
      process.env.VITE_PUBLIC_DEMO = 'true';
      process.env.NODE_ENV = 'production';
      const loaded = await loadConfigFromFile({ command: 'build', mode: 'showcase' }, resolve('vite.showcase.config.ts'));
      expect(loaded?.config.envDir).toBe(false);
      const config = await resolveConfig({ ...loaded!.config, configFile: false, root: temporaryRoot, logLevel: 'silent' }, 'build', 'showcase');
      expect(config.env).toMatchObject({ MODE: 'showcase', PROD: true, DEV: false });
      expect(Object.keys(config.env).filter(key => key.startsWith('VITE_'))).toEqual([]);
      expect(JSON.stringify(config.env)).not.toContain('CANARY');
      expect(config.publicDir).toBe('');
      expect(config.server.proxy).toBeUndefined();
      expect(config.preview.proxy).toBeUndefined();
      expect(config.build.sourcemap).toBe(false);
    } finally {
      keys.forEach(key => { if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key]; });
    }
  });
});
