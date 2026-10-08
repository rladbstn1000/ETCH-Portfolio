import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { publicAssetReplacements, publicDemoHtml } from "./config/publicAssets";
import { showcaseLicenses } from "./config/showcaseLicenses";

const root = import.meta.dirname;
const showcase = (name: string) => resolve(root, "src/showcase", name);
const apiNames = ["searchApi", "jobApi", "newsApi", "companyApi", "projectApi", "memberApi", "likeApi", "appliedJobApi", "followApi", "commentApi", "coverLetterApi", "portfolioApi", "authApi"];
const csp = "default-src 'self'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; frame-ancestors 'none'";
let watchBuild = false;

export default defineConfig({
  // .env*, shell VITE_* and the real API config are not showcase inputs.
  envDir: false,
  envPrefix: "ETCH_SHOWCASE_PUBLIC_UNUSED_",
  publicDir: false,
  resolve: { alias: [
    { find: "./router/router.tsx", replacement: showcase("router.tsx") },
    ...apiNames.map(name => ({ find: new RegExp(`(?:^|.*\\/)api/${name}(?:\\.tsx?)?$`), replacement: showcase(`api/${name}.ts`) })),
    { find: /(?:^|.*\/)store\/userStore(?:\.tsx?)?$/, replacement: showcase("userStore.ts") },
    { find: /(?:^|.*\/)hooks\/useLikedItems(?:\.tsx?)?$/, replacement: showcase("useLikedItems.ts") },
    { find: /(?:^|.*\/)config\/features(?:\.ts)?$/, replacement: showcase("features.ts") },
    { find: /(?:^|.*\/)config\/demo(?:\.ts)?$/, replacement: showcase("presentation.ts") },
    { find: /(?:^|.*\/)config\/experienceText(?:\.ts)?$/, replacement: showcase("experienceText.ts") },
    { find: /(?:^|.*\/)mypage\/profileCard(?:\.tsx)?$/, replacement: showcase("ProfileCard.tsx") },
    { find: /(?:^|.*\/)favorite\/favoriteNewsList(?:\.tsx)?$/, replacement: showcase("FavoriteNewsList.tsx") },
    { find: /(?:^|.*\/)home\/newsCard(?:\.tsx)?$/, replacement: showcase("NewsCard.tsx") },
    { find: /(?:^|.*\/)job\/jobDetailModal(?:\.tsx)?$/, replacement: showcase("JobDetailModal.tsx") },
    { find: /(?:^|.*\/)project\/projectModalCard(?:\.tsx)?$/, replacement: showcase("ProjectDetails.tsx") },
    ...publicAssetReplacements.map(({ find, file }) => ({ find, replacement: resolve(root, "src/assets/public", file) })),
  ] },
  plugins: [react(), tailwindcss(), {
    name: "showcase-boundary",
    configResolved(config) { watchBuild = Boolean(config.build.watch); },
    configureServer() { throw new Error("소켓 없는 정적 개발 명령 npm run dev:showcase를 사용하세요."); },
    transformIndexHtml: { order: "pre", handler(html) {
      return publicDemoHtml(html)
        .replace(/<link\b[^>]*rel="(?:dns-prefetch|preconnect)"[^>]*>\s*/g, "")
        .replace('<html lang="en">', '<html lang="ko">')
        .replace(/<meta\b[^>]*name=["']description["'][^>]*>\s*/g, "")
        .replace(/<title>.*?<\/title>/, '<title>ETCH · 화면 체험판</title>\n    <meta name="description" content="가상 데이터로 ETCH의 검색·채용·뉴스·프로젝트와 개인 화면을 둘러보는 정적 체험판입니다. 실제 로그인, 지원서 제출, 메시지 전송은 수행하지 않습니다." />');
    } },
    generateBundle(_options, bundle) {
      const modules = [...new Set(Object.values(bundle).flatMap(item => item.type === "chunk" ? Object.keys(item.modules) : []))].sort();
      const forbidden = modules.filter(id => /\/src\/api\/|\/src\/store\/userStore|\/src\/(?:utils\/.*(?:[Tt]oken|jwt)|services\/chatService|contexts\/chatContext)|\/node_modules\/(?:axios|jwt-decode|sockjs-client|@stomp)\//.test(id));
      if (forbidden.length) this.error(`실제 통신/인증 모듈이 showcase에 포함됨: ${forbidden.join(", ")}`);
      this.emitFile({ type: "asset", fileName: "licenses.html", source: showcaseLicenses(root, modules) });
      const evidence = resolve(root, "../../.local/showcase");
      if (!watchBuild) {
        mkdirSync(evidence, { recursive: true });
        writeFileSync(resolve(evidence, "build-modules.json"), JSON.stringify(modules.map(id => id.replace(root + "/", "")), null, 2) + "\n");
      }
      this.emitFile({ type: "asset", fileName: "_headers", source: `/*\n  Content-Security-Policy: ${csp}\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n` });
      // Cloudflare Pages serves index.html for SPA routes when no top-level 404.html exists.
      // A catch-all _redirects rule would also precede static asset responses.
    },
  }],
  build: { outDir: "dist-showcase", sourcemap: false, assetsInlineLimit: 0, emptyOutDir: true },
  server: { host: "127.0.0.1", port: 5196, strictPort: true, hmr: false },
  preview: { host: "127.0.0.1", port: 5207, strictPort: true, headers: { "Content-Security-Policy": csp, "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } },
});
