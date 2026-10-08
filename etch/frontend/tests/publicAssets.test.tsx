import { describe, expect, it } from "vitest";
import { publicAssetReplacements, publicDemoHtml } from "../config/publicAssets";

describe("public demo asset boundary", () => {
  it("removes the unused photographic preload and replaces the legacy favicon before HTML assets are bundled", () => {
    const source = '<link rel="icon" type="image/png" href="src/assets/mainLogo.png" />\n<link rel="preload" as="image" href="src/assets/landing/landing1.webp" /><script type="module" src="/src/main.tsx"></script>';
    const publicHtml = publicDemoHtml(source);
    expect(publicHtml).not.toContain("landing1.webp");
    expect(publicHtml).not.toContain("mainLogo.png");
    expect(publicHtml).toContain('/src/assets/public/etch.svg');
    expect(publicHtml).toContain('/src/main.tsx');
    expect(publicAssetReplacements.find(({ find }) => find.test("../../../assets/noImg.png"))?.file).toBe("placeholder.svg");
    expect(publicAssetReplacements.some(({ find }) => find.test("../assets/public/etch.svg"))).toBe(false);
  });
});
