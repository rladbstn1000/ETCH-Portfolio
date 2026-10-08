import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { publicAssetReplacements, publicDemoHtml } from "./config/publicAssets";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.LOCAL_API_TARGET || "http://localhost:18476";
  const publicDemo = env.VITE_PUBLIC_DEMO === "true";
  return {
  // 공개 산출물에는 사용하지 않는 템플릿 public/vite.svg를 복사하지 않는다.
  publicDir: publicDemo ? false : "public",
  resolve: { alias: [
    ...(publicDemo ? [{ find: "./router/router.tsx", replacement: resolve(process.cwd(), "src/router/publicRouter.tsx") }] : []),
    ...publicAssetReplacements.map(({ find, file }) => ({ find, replacement: resolve(process.cwd(), "src/assets/public", file) })),
  ] },
  plugins: [
    // public-demo는 SSR/메모리 라우터 없이 실제 브라우저에서만 실행한다.
    // 라이브러리의 가상 URL 기준값도 현재 출처를 사용해 고정 호스트를 번들에 남기지 않는다.
    // API 대상은 별도로 /api/v1에 고정되어 있다. 일반 빌드는 원본 의존성을 사용한다.
    {
      name: "submission-reviewed-assets",
      transformIndexHtml: { order: "pre" as const, handler: publicDemoHtml },
    }, ...(publicDemo ? [{
      name: "public-demo-browser-origin",
      enforce: "pre" as const,
      transform(code: string, id: string) {
        if (!id.includes("/node_modules/react-router/") && !id.includes("/node_modules/axios/")) return null;
        const updated = code.replace(/(["'])http:\/\/localhost\1/g, "window.location.origin");
        return updated === code ? null : { code: updated, map: null };
      },
    }] : []),
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  define: {
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: publicDemo ? undefined : {
          // React 관련 라이브러리들을 별도 청크로 분리
          'react-vendor': ['react', 'react-dom'],
          
          // 라우팅 관련
          'router-vendor': ['react-router'],
          
          // 상태관리 관련
          'state-vendor': ['@reduxjs/toolkit', 'react-redux', 'zustand'],
          
          // FullCalendar 관련 (큰 라이브러리)
          'calendar-vendor': [
            '@fullcalendar/react',
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction'
          ],
          
          // HTTP 통신 관련
          'http-vendor': ['axios'],
          
          // WebSocket 관련
          'websocket-vendor': ['@stomp/stompjs', 'sockjs-client'],
          
          // 유틸리티 라이브러리들
          'utils-vendor': ['jwt-decode'],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/v1": {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ""),
      },
      "/oauth2": { target: apiTarget, changeOrigin: true },
      "/login/oauth2": { target: apiTarget, changeOrigin: true },
      ...(env.VITE_ENABLE_CHAT === "true" ? {
        "/api/chat": {
          target: env.LOCAL_CHAT_TARGET || "http://localhost:18081",
          changeOrigin: true,
          ws: true,
          rewrite: (path: string) => path.replace(/^\/api\/chat/, ""),
        },
      } : {}),
    },
  },
  };
});
