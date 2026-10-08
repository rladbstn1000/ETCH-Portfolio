import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import showcase from "./vite.showcase.config";
export default defineConfig({
  envDir: false,
  resolve: showcase.resolve,
  plugins: [react()],
  test: { environment: "jsdom", include: ["src/showcase/**/*.test.ts", "src/showcase/**/*.test.tsx", "tests/showcase*.test.tsx"] },
});
