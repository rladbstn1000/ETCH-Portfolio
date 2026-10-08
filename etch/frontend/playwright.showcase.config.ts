import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

// 검사기 전용 입력이며 앱의 빌드/런타임 설정으로 전달하지 않는다.
const publicOrigin = process.env.SHOWCASE_TEST_ORIGIN;
if (publicOrigin) {
  const parsed = new URL(publicOrigin);
  if (parsed.protocol !== "https:" || parsed.origin !== publicOrigin || parsed.username || parsed.password) {
    throw new Error("SHOWCASE_TEST_ORIGIN에는 경로·자격증명·쿼리가 없는 HTTPS origin만 지정하세요.");
  }
}
const runId = process.env.SHOWCASE_TEST_RUN || "verify";
if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error("SHOWCASE_TEST_RUN에는 영문·숫자·밑줄·하이픈만 사용할 수 있습니다.");
// Worker에는 같은 stamp를 상속하고, 새 명령 실행은 새 증거 폴더를 만든다.
const stamp = process.env.SHOWCASE_TEST_RUN_STAMP ||= `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
if (!/^[a-zA-Z0-9_-]+$/.test(stamp)) throw new Error("Invalid showcase evidence stamp");
const evidence = resolve(import.meta.dirname, "../../.local/showcase", `${publicOrigin ? "deployment" : "local"}-${runId}-${stamp}`);

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "showcase.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: publicOrigin ? 60_000 : 30_000,
  outputDir: resolve(evidence, "artifacts"),
  reporter: [["list"], ["json", { outputFile: resolve(evidence, "browser-report.json") }]],
  use: { baseURL: publicOrigin || "http://127.0.0.1:5207", browserName: "chromium", channel: "chrome", serviceWorkers: "block", ignoreHTTPSErrors: false, viewport: { width: 1440, height: 1000 }, screenshot: "only-on-failure", trace: "off" },
});
