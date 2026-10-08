// 제출 사본의 모든 빌드는 출처가 확인된 자체 SVG만 사용한다.
// API·라우터 선택은 별도이며 원본 checkout의 자산은 변경하지 않는다.
export const publicAssetReplacements = [
  { find: /^(?:.*\/)?assets\/(?:logo\.webp|mainLogo\.png)$/, file: "etch.svg" },
  { find: /^(?:.*\/)?assets\/(?:default-profile|profile)\.png$/, file: "profile.svg" },
  { find: /^(?:.*\/)?assets\/search\.png$/, file: "search.svg" },
  { find: /^(?:.*\/)?assets\/(?:noImg|google-icon|mainInfo|mainTeam|mianPortfolio|mainReport)\.png$/, file: "placeholder.svg" },
  { find: /^(?:.*\/)?assets\/landing\/landing[1-5]\.webp$/, file: "placeholder.svg" },
];

export function publicDemoHtml(html: string): string {
  return html
    .replace(/<link\b[^>]*rel="preload"[^>]*href="src\/assets\/landing\/landing1\.webp"[^>]*>\s*/g, "")
    .replace(/<link\b[^>]*rel="icon"[^>]*>/g, '<link rel="icon" type="image/svg+xml" href="/src/assets/public/etch.svg" />');
}
