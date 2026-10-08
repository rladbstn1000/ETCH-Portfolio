import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { publicAssetReplacements } from "./config/publicAssets";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: publicAssetReplacements.map(({ find, file }) => ({ find, replacement: resolve(import.meta.dirname, "src/assets/public", file) })) },
  test: { environment: "jsdom", include: ["tests/**/*.test.tsx"] },
});
