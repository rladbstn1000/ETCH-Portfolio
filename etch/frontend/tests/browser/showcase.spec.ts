import { test as base, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const assetDirectory = resolve(import.meta.dirname, "../../dist-showcase/assets");
const assets = readdirSync(assetDirectory).map(name => `/assets/${name}`);
const sha256 = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const assetHashes = new Map(assets.map(path => [path, sha256(readFileSync(resolve(assetDirectory, path.slice("/assets/".length))))]));
const licenseHash = sha256(readFileSync(resolve(assetDirectory, "../licenses.html")));

const test = base.extend<{ networkBoundary: () => Promise<void>; verifiedNavigation: Pick<Page, "goto" | "reload" | "goBack">; probeBoundary: boolean }>({
  probeBoundary: [false, { option: true }],
  verifiedNavigation: async ({ page, networkBoundary }, use) => {
    await use({
      goto: async (...args) => { await networkBoundary(); const response = await page.goto(...args); await networkBoundary(); return response; },
      reload: async (...args) => { await networkBoundary(); const response = await page.reload(...args); await networkBoundary(); return response; },
      goBack: async (...args) => { await networkBoundary(); const response = await page.goBack(...args); await networkBoundary(); return response; },
    });
  },
  networkBoundary: [async ({ context, page, probeBoundary, baseURL }, use, testInfo) => {
    const origin = new URL(baseURL!).origin;
    const failures: string[] = [], requests: { path: string; type: string }[] = [];
    const pendingRequests = new Set<Request>();
    const errors: string[] = [], attempts: string[] = [];
    const responses: { path: string; status: number; contentType: string; csp: string; location?: string; sha256?: string; tls?: Awaited<ReturnType<import("@playwright/test").Response["securityDetails"]>> }[] = [];
    const responseChecks: Promise<void>[] = [];
    await context.exposeBinding("__reportShowcaseBoundary", (_source, call: string) => { attempts.push(call); });
    context.on("request", request => { pendingRequests.add(request); requests.push({ path: new URL(request.url()).pathname, type: request.resourceType() }); });
    context.on("requestfinished", request => pendingRequests.delete(request));
    context.on("requestfailed", request => pendingRequests.delete(request));
    context.on("response", response => {
      const path = new URL(response.url()).pathname;
      responseChecks.push((async () => {
        const headers = await response.allHeaders();
        const contentType = headers["content-type"] || "";
        const csp = headers["content-security-policy"] || "";
        const entry: (typeof responses)[number] = { path, status: response.status(), contentType, csp };
        if (headers.location) entry.location = headers.location;
        responses.push(entry);
        // Pages canonicalizes this one real HTML file; no SPA/asset/external redirect exception.
        const canonicalLicenseRedirect = origin.startsWith("https:") && path === "/licenses.html" && response.status() === 308
          && response.request().resourceType() === "document" && ["/licenses", `${origin}/licenses`].includes(headers.location);
        if (response.status() !== 200 && !canonicalLicenseRedirect) failures.push(`HTTP ${response.status()} ${path}`);
        for (const directive of ["connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-src 'none'"]) {
          if (!csp.includes(directive)) failures.push(`CSP missing ${directive}: ${path}`);
        }
        if (response.request().resourceType() === "document") {
          if (!canonicalLicenseRedirect && !/^text\/html(?:;|$)/i.test(contentType)) failures.push(`SPA document content-type: ${path}`);
          if (response.status() === 200 && ["/licenses.html", "/licenses"].includes(path)) {
            entry.sha256 = sha256(await response.body());
            if (entry.sha256 !== licenseHash) failures.push(`License document differs from reviewed build: ${path}`);
          }
        } else if (assets.includes(path)) {
          const expectedType = path.endsWith(".js") ? /^(?:text|application)\/javascript(?:;|$)/i : path.endsWith(".css") ? /^text\/css(?:;|$)/i : path.endsWith(".svg") ? /^image\/svg\+xml(?:;|$)/i : null;
          if (!expectedType?.test(contentType)) failures.push(`Static asset content-type: ${path}`);
          // HTML fallback pages must never count as successfully loaded JS/CSS/images.
          entry.sha256 = sha256(await response.body());
          if (entry.sha256 !== assetHashes.get(path)) failures.push(`Static asset differs from reviewed build: ${path}`);
        }
        if (origin.startsWith("https:")) {
          entry.tls = await response.securityDetails();
          // Certificate trust is enforced by Chromium (ignoreHTTPSErrors=false).
          // Record the negotiated protocol, including HTTPS over QUIC where used.
          if (!entry.tls?.protocol) failures.push(`Missing HTTPS security details: ${path}`);
        }
      })().catch(() => { failures.push(`Response verification could not complete: ${path}`); }));
    });
    await context.route("**/*", async route => {
      const request = route.request(), url = new URL(request.url());
      const path = url.pathname;
      const document = request.resourceType() === "document";
      const allowed = request.method() === "GET" && url.origin === origin && (assets.includes(path) || (document && !/^\/(api|oauth2|login\/oauth2)(\/|$)/.test(path)));
      if (!allowed) { failures.push(`${request.method()} ${url.origin}${path} (${request.resourceType()})`); await route.abort(); }
      else { await route.continue(); }
    });
    page.on("websocket", socket => failures.push(`WebSocket ${new URL(socket.url()).pathname}`));
    page.on("pageerror", error => errors.push(error.message));
    page.on("popup", () => failures.push("unexpected new window"));
    await context.addInitScript(({ allowedAssets }) => {
      const calls = { push: (call: string) => { void (window as unknown as { __reportShowcaseBoundary: (call: string) => Promise<void> }).__reportShowcaseBoundary(call); } };
      Object.defineProperty(window, "__showcaseForbiddenCalls", { value: calls });
      const allowed = (url: string) => { const resolved = new URL(url, location.origin); return resolved.origin === location.origin && allowedAssets.includes(resolved.pathname); };
      const fetchOriginal = window.fetch.bind(window);
      window.fetch = (...args) => { const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url; if (!allowed(url)) { calls.push("fetch"); return Promise.reject(new Error("showcase network boundary")); } return fetchOriginal(...args); };
      XMLHttpRequest.prototype.open = function () { calls.push("XMLHttpRequest"); throw new Error("showcase network boundary"); };
      window.WebSocket = class { constructor() { calls.push("WebSocket"); throw new Error("showcase network boundary"); } } as unknown as typeof WebSocket;
      window.EventSource = class { constructor() { calls.push("EventSource"); throw new Error("showcase network boundary"); } } as unknown as typeof EventSource;
      navigator.sendBeacon = () => { calls.push("sendBeacon"); return false; };
      for (const method of ["getItem", "setItem", "removeItem", "clear", "key"] as const) {
        const original = Storage.prototype[method];
        Object.defineProperty(Storage.prototype, method, { value: function (...args: unknown[]) { calls.push(`Storage.${method}`); return Reflect.apply(original, this, args); } });
      }
      window.open = () => { calls.push("window.open"); return null; };
    }, { allowedAssets: assets });
    page.on("dialog", async dialog => { if (!dialog.message().includes("화면 체험판의 메모리 상태 안내")) failures.push("unlabelled completion dialog"); await dialog.dismiss(); });
    const verifyCompletedResponses = async () => {
      await page.waitForLoadState("load", { timeout: 10_000 });
      // React-rendered images and the favicon can start after the document load event.
      await page.waitForLoadState("networkidle", { timeout: 10_000 });
      await expect.poll(() => [...pendingRequests].map(request => `${request.resourceType()} ${new URL(request.url()).pathname}`), { message: "Complete static requests before navigating", timeout: 10_000, intervals: [25, 50, 100] }).toEqual([]);
      // The browser can discard a previous document's response bodies on navigation.
      // Finish every body/hash check before moving on; never ignore cancelled checks.
      let checked = 0;
      while (checked < responseChecks.length) {
        const current = responseChecks.slice(checked);
        checked = responseChecks.length;
        await Promise.all(current);
      }
    };
    await use(verifyCompletedResponses);
    await verifyCompletedResponses();
    if (responses.some(response => response.path === "/licenses.html" && response.status === 308)
      && !responses.some(response => response.path === "/licenses" && response.status === 200 && response.sha256 === licenseHash)) {
      failures.push("Canonical license redirect did not finish at the matching /licenses document");
    }
    await testInfo.attach("network-boundary", { body: JSON.stringify({ origin, freshContext: true, serviceWorkers: "block", ignoreHTTPSErrors: false, requests, responses, failures, attempts, pageErrors: errors }), contentType: "application/json" });
    expect(failures, "Only matching static assets and valid SPA documents from the selected origin may be requested").toEqual([]);
    expect(attempts, "No backend/socket/token/browser-storage/external-window attempt").toEqual(probeBoundary ? ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon", "window.open", "Storage.getItem"] : []);
    expect(errors, "No uncaught browser error").toEqual([]);
  }, { auto: true }],
});

test("home and complete route inventory, direct navigation and reload", async ({ page, verifiedNavigation: navigation }, testInfo) => {
  test.setTimeout(60_000);
  await navigation.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ETCH를 둘러보세요");
  await page.screenshot({ path: testInfo.outputPath("home-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "검색 체험하기 →" }).click();
  await expect(page.getByRole("heading", { name: "통합 검색" })).toBeVisible();
  await navigation.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ETCH를 둘러보세요");
  const routes = [["/jobs", "채용공고"], ["/news", "뉴스"], ["/news/latest", "최신 뉴스"], ["/projects", "프로젝트"], ["/mypage", "마이페이지"], ["/mypage/coverletters", "자기소개서 예시"], ["/mypage/cover-letter-detail/5001", "자기소개서"], ["/mypage/cover-letter-edit/5001", "자기소개서 예시 편집"], ["/mypage/portfolios", "포트폴리오 예시"], ["/mypage/portfolios/edit/6001", "포트폴리오 예시"], ["/mypage/projects", "내 프로젝트 예시"], ["/mypage/favorites", "관심"], ["/mypage/favorites/projects", "프로젝트"], ["/mypage/applications", "지원"], ["/mypage/followers", "연결 목록 미리보기"], ["/mypage/following", "연결 목록 미리보기"], ["/projects/write", "프로젝트 작성 화면 체험"], ["/chat", "채팅 화면 미리보기"], ["/process", "개발 과정"], ["/login", "체험 범위 밖"], ["/unknown", "체험 범위 밖"]];
  for (const [url, text] of routes) {
    await navigation.goto(url);
    await expect(page.locator("main")).toContainText(text);
    await expect(page.locator("main")).not.toContainText("실패했습니다");
    await expect(page.locator("main")).not.toContainText("해당 예시는 없습니다");
    await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  }
  await navigation.goto("/mypage/coverletters"); await navigation.reload();
  await expect(page.getByRole("heading", { name: "자기소개서 예시", exact: true })).toBeVisible();
  await navigation.goto("/projects/3001/edit");
  await expect(page.getByLabel("예시 프로젝트 제목", { exact: true })).toHaveValue("React로 만든 작은 책장");
  for (const path of ["/mypage/cover-letter-detail/999999", "/mypage/cover-letter-edit/not-a-number", "/mypage/portfolios/999999", "/mypage/portfolios/not-a-number", "/projects/999999/edit"]) {
    await navigation.goto(path);
    await expect(page.locator("main")).toContainText("해당 예시는 없습니다");
    await navigation.reload();
    await expect(page.locator("main")).toContainText("해당 예시는 없습니다");
    await page.getByRole("link", { name: "마이페이지로", exact: true }).click();
    await expect(page.getByRole("heading", { name: "마이페이지", exact: true })).toBeVisible();
    await navigation.goBack();
    await expect(page.locator("main")).toContainText("해당 예시는 없습니다");
  }
  await navigation.goto("/unknown/nested/route"); await navigation.reload();
  await expect(page.getByRole("heading", { name: "이 화면은 체험 범위 밖입니다" })).toBeVisible();
  await navigation.goto("/mypage"); await page.screenshot({ path: testInfo.outputPath("personal-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "저작권·오픈소스 고지" }).click();
  await expect(page.getByRole("heading", { name: "오픈소스 고지", exact: true })).toBeVisible();
  await expect(page.locator("body")).toContainText("Permission is hereby granted");
});

test("four process cases preserve evidence scope, keyboard disclosure and narrow tables", async ({ page, verifiedNavigation: navigation }, testInfo) => {
  test.setTimeout(60_000);
  await navigation.goto("/");
  await page.getByRole("link", { name: "개발 과정 읽기 →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "개발 과정", exact: true })).toBeVisible();
  const caseTitles = [
    "프로젝트를 저장한 뒤, 검색 색인이 실패한다면?",
    "매번 전체 조회 대신, 변경된 상태를 전달하기",
    "검색이 바뀌면, 좋아졌다고 말하기 전에 비교하기",
    "MySQL 프로젝트 목록 조회 개선",
  ];
  await expect(page.locator("main section h2")).toHaveText(caseTitles);
  const mysql = page.getByRole("region", { name: caseTitles[3], exact: true });
  const table = mysql.getByRole("table");
  const summary = mysql.locator("summary");
  await expect(table.locator("thead th")).toHaveText(["반환 건수", "같은 작성자", "서로 다른 작성자"]);
  for (const [i, size, before] of [[0, 1, 3], [1, 3, 5], [2, 10, 12], [3, 30, 32], [4, 100, 102]]) {
    await expect(table.locator("tbody tr").nth(i).locator("th, td")).toHaveText([`${size}건`, "3→2회", `${before}→2회`]);
  }
  await expect(table).toContainText("인기순·조회순·최신순 모두 같은 결과");
  await expect(mysql).toContainText("동일 158조건의 전체 응답 JSON");
  await expect(mysql).toContainText("마지막 페이지는 6→1회, 다음 빈 페이지는 2→2회");
  await expect(mysql).toContainText("운영 응답시간은 측정하지 않았습니다");
  await expect(mysql).toContainText("이 정적 페이지는 해당 DB 조회를 실행하지 않으며");
  // Keep the earlier search loss visible; adding a DB case does not replace it.
  await expect(page.getByRole("region", { name: caseTitles[2], exact: true })).toContainText("0.926045 → 0.881078");
  await expect(page.getByRole("region", { name: caseTitles[2], exact: true })).toContainText("과거 2/30 불일치는 FAIL로 보존");

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await expect(mysql.locator("details")).not.toHaveAttribute("open", "");
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(mysql.locator("details")).toHaveAttribute("open", "");
    await expect(mysql).toContainText("실제 백엔드에서 수행한 로컬 MySQL 검증 기록");
    await expect(mysql).toContainText("Controller 직접 호출→Service/JPA→DTO/JSON");
    await expect(mysql).toContainText("관련 50테스트 통과 중 5개는 실제 MySQL을 사용하는 MockMvc");
    await expect(mysql).toContainText("21개 테이블의 행 fingerprint");
    await expect(mysql).toContainText("JPA/H2의 동일 3건 페이지에서 SQL 7→4회");
    await expect(mysql).toContainText("하나의 연속 측정으로 합치지 않습니다");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await table.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && element.scrollWidth <= element.clientWidth + 1;
    })).toBe(true);
    const numberLayout = await table.locator("td").evaluateAll(cells => cells.map(cell => {
      const rect = cell.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(cell);
      const text = range.getBoundingClientRect();
      const lineHeight = Number.parseFloat(getComputedStyle(cell).lineHeight);
      // React may render one number as several adjacent text nodes. Count line
      // height, not Range fragments, while still rejecting clipping/overflow.
      return { value: cell.textContent, textHeight: text.height, lineHeight,
        fragments: range.getClientRects().length,
        fits: cell.scrollWidth <= cell.clientWidth + 1 && text.left >= rect.left && text.right <= rect.right,
        oneLine: text.height > 0 && text.height <= lineHeight + 1 };
    }));
    await testInfo.attach(`mysql-table-layout-${width}`, { body: JSON.stringify(numberLayout), contentType: "application/json" });
    expect(numberLayout.every(cell => cell.fits && cell.oneLine), "SQL counts fit on one line in their cells").toBe(true);
    await mysql.screenshot({ path: testInfo.outputPath(`mysql-case-${width}.png`) });
    // Also record the actual viewport: very tall element captures can include
    // fixed off-screen controls outside the viewport's normal clipping area.
    await table.scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: "본문으로 이동", exact: true })).not.toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`mysql-table-viewport-${width}.png`) });
    await summary.focus(); await page.keyboard.press("Space");
    await expect(mysql.locator("details")).not.toHaveAttribute("open", "");
  }

  await navigation.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ETCH를 둘러보세요");
  await navigation.goto("/process");
  await expect(mysql).toBeVisible();
  await navigation.reload();
  await expect(page.locator("main section h2")).toHaveText(caseTitles);
  await expect(mysql.locator("details")).not.toHaveAttribute("open", "");
  await page.getByRole("link", { name: "← 화면 체험으로 돌아가기", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ETCH를 둘러보세요");
  await navigation.goBack();
  await expect(mysql).toBeVisible();
});

test("search types, filters, quote, zero results and changed keyword", async ({ page, verifiedNavigation: navigation }) => {
  await navigation.goto("/search?q=React");
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^채용/ }).click();
  await page.getByLabel("지역").selectOption("서울");
  await page.getByLabel("직무").selectOption("프론트엔드");
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^React와 TypeScript/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^뉴스/ }).click();
  await expect(page.locator("summary", { hasText: "React 화면의 키보드" })).toBeVisible();
  await page.getByLabel("검색어", { exact: true }).fill("검색"); await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator("summary", { hasText: "팀의 작은 검색" })).toBeVisible();
  await expect(page.locator("summary", { hasText: "React 화면의 키보드" })).toHaveCount(0);
  await page.getByLabel("검색어", { exact: true }).fill('"빈 화면"'); await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.locator("summary", { hasText: '"빈 화면"' })).toBeVisible();
  await page.getByLabel("검색어", { exact: true }).fill("zzzz-no-match"); await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByText("검색 결과가 없습니다", { exact: true })).toHaveCount(3);
  await navigation.goto("/search?q=React&VITE_API_BASE_URL=https%3A%2F%2Finvalid.example&mode=api");
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
});

test("job detail, memory scrap, modal Escape and focus return", async ({ page, verifiedNavigation: navigation }) => {
  await navigation.goto("/search?q=React");
  const open = page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true });
  await open.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "모달 닫기" })).toBeFocused();
  await dialog.getByRole("button", { name: "예시 스크랩 해제", exact: true }).click();
  await dialog.getByRole("button", { name: "예시 스크랩", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "예시 스크랩 해제" })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "기업정보" }).click(); await expect(dialog).toContainText("가상 기업");
  await dialog.getByRole("button", { name: "기업뉴스" }).click(); await expect(dialog.locator("summary").first()).toBeVisible();
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(open).toBeFocused();
  await page.getByRole("link", { name: "가상 마이페이지", exact: true }).click();
  await page.getByRole("link", { name: "스크랩", exact: true }).click();
  await expect(page.locator("main")).toContainText("React 프런트엔드");
  await page.getByRole("button", { name: "예시 초기화", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("처음으로");
});

test("documents can be edited in memory and reset on reload", async ({ page, verifiedNavigation: navigation }) => {
  await navigation.goto("/mypage/cover-letter-edit/5001");
  const first = page.locator("textarea").first(); await expect(first).toBeVisible();
  const original = await first.inputValue();
  await first.fill("브라우저에서 바꾼 가상 문장입니다.");
  await page.getByRole("button", { name: "브라우저 예시에만 반영", exact: true }).click();
  await expect(page.locator("main")).toContainText("서버 저장·지원서 제출은 수행하지 않았습니다");
  await navigation.reload(); await expect(page.locator("textarea").first()).toHaveValue(original);
  await navigation.goto("/mypage/portfolios");
  await page.getByLabel("소개 문장 예시 편집").fill("예시 소개 문장 수정");
  await page.getByRole("button", { name: "소개를 브라우저 예시에만 반영" }).click();
  await expect(page.locator("main")).toContainText("서버에 저장하지 않았습니다");
  await page.getByRole("button", { name: "예시 초기화", exact: true }).click();
  await expect(page.getByLabel("소개 문장 예시 편집")).not.toHaveValue("예시 소개 문장 수정");
});

test("project long/empty detail, image fallback and keyboard comment field", async ({ page, verifiedNavigation: navigation }) => {
  await navigation.goto("/projects");
  const open = page.getByRole("button", { name: /아주 긴 제목을 가진 프로젝트/ }).first();
  await open.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("등록된 설명이 없습니다");
  const textarea = dialog.locator("textarea");
  for (let i = 0; i < 15 && !(await textarea.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(textarea).toBeFocused();
  await page.keyboard.press("Escape"); await expect(open).toBeFocused();
  // A deliberately failed existing static image request, not an external fixture URL.
  await page.route("**/assets/placeholder-*.svg", route => route.abort());
  await navigation.reload();
  await expect(page.getByRole('img', { name: "카드 이미지 없음" }).first()).toBeVisible();
  await page.unroute("**/assets/placeholder-*.svg");
});

test("mobile navigation and filter/status modal focus", async ({ page, verifiedNavigation: navigation }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await navigation.goto("/jobs");
  await expect(page.getByRole("heading", { name: "채용공고", exact: true })).toBeVisible();
  await expect(page.locator(".fc-toolbar-title")).toContainText("2026");
  await page.getByRole("button", { name: "리스트", exact: true }).click();
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
  const filter = page.getByRole("button", { name: /필터/ }).first(); await filter.click();
  const filterDialog = page.getByRole("dialog", { name: "채용 필터" });
  await expect(filterDialog).toBeVisible();
  await filterDialog.getByText("소프트웨어", { exact: true }).click();
  await filterDialog.getByText("대졸(4년)", { exact: true }).click();
  await filterDialog.getByRole("button", { name: /^필터 적용/ }).click();
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "데이터 엔지니어 · 데이터 흐름 관찰하기", exact: true })).toHaveCount(0);
  await filter.click();
  await page.keyboard.press("Escape"); await expect(filter).toBeFocused();
  await navigation.goto("/mypage/applications");
  const change = page.getByRole("button", { name: /상태 변경/ }).first(); await change.click();
  await expect(page.getByRole("dialog", { name: "지원 상태 변경" })).toBeVisible();
  await page.keyboard.press("Escape"); await expect(change).toBeFocused();
  await navigation.goto("/search?q=React");
  await expect(page.getByRole("button", { name: "React 프런트엔드 개발자 · 접근성 있는 화면 만들기", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("search-mobile.png"), fullPage: true });
  await navigation.goto("/process"); await expect(page.getByRole("heading", { name: "개발 과정", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test.describe("network guard negative control", () => {
  test.use({ probeBoundary: true });
  test("deliberate API/OAuth/socket/storage probes are detected and blocked", async ({ page, verifiedNavigation: navigation }) => {
    await navigation.goto("/");
    await page.evaluate(async () => {
      await fetch("/api/v1/showcase-boundary-probe").catch(() => {});
      try { new XMLHttpRequest().open("GET", "/oauth2/authorization/google"); } catch { /* expected */ }
      try { new WebSocket(`${location.origin.replace(/^http/, "ws")}/guard-probe`); } catch { /* expected */ }
      try { new EventSource("/api/events"); } catch { /* expected */ }
      navigator.sendBeacon("/api/beacon", "public test probe");
      window.open("/oauth2/authorization/google");
      sessionStorage.getItem("showcase-test-only");
    });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ETCH를 둘러보세요");
  });
});
