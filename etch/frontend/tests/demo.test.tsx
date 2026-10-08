import { projectDisplayText } from "../src/utils/projectDisplayText";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import HomePage from "../src/components/pages/homePage";
import NewsCard from "../src/components/molecules/home/newsCard";
import ProjectCard from "../src/components/molecules/project/projectCard";
import Header from "../src/components/common/header";
import { LatestNewsData } from "../src/api/newsApi";
import { useExpiringJobs } from "../src/hooks/useExpiringJobs";
import { useDialogFocus } from "../src/hooks/useDialogFocus";

vi.mock("../src/config/demo", () => ({ DEMO_MODE: true, DEMO_REFERENCE_DATE: "2026-09-01", DEMO_QUERIES: ["Spring", "React", "검색"], demoSearchPath: (tab: string) => `/search?q=Spring&tab=${tab}` }));
vi.mock("../src/api/newsApi", () => ({ LatestNewsData: vi.fn() }));
vi.mock("../src/hooks/useExpiringJobs", () => ({ useExpiringJobs: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("합성 자료 데모의 공개 탐색 범위", () => {
  it("홈은 익명 검색 진입과 실제 코퍼스 예시를 제공하고 기존 최신/마감임박 API는 호출하지 않는다", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "데모 체험하기" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "Spring" }).getAttribute("href")).toBe("/search?q=Spring");
    expect(screen.getByText(/기준일 2026-09-01/)).toBeTruthy();
    expect(screen.getByText(/실제 모집 공고나 기사가 아니며/)).toBeTruthy();
    expect(LatestNewsData).not.toHaveBeenCalled();
    expect(useExpiringJobs).not.toHaveBeenCalled();
  });
  it("헤더는 검색 유형으로 연결하고 로그인·가입 링크를 제공하지 않는다", () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "채용공고" }).getAttribute("href")).toBe("/search?q=Spring&tab=jobs");
    expect(screen.queryByRole("button", { name: "로그인" })).toBeNull();
    expect(screen.queryByRole("button", { name: "회원가입" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "헤더 검색어" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "헤더 검색" })).toBeTruthy();
  });
  it("뉴스는 실제 API에서 받은 요약을 표시하되 합성 URL과 관심 저장을 노출하지 않는다", () => {
    render(<MemoryRouter><NewsCard id={42001} type="news" title="Spring 합성 뉴스" description="API 응답에 포함된 합성 요약" url="https://example.invalid/news/42001" publishedAt="2026-08-01" companyName="가상 회사" /></MemoryRouter>);
    expect(screen.getByText("API 응답에 포함된 합성 요약")).toBeTruthy();
    expect(screen.getByText(/실제 기사 원문과 외부 링크는 제공하지 않습니다/)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("summary")).not.toBeNull();
  });
  it("프로젝트 제목을 키보드용 버튼으로 제공하고 중복 클릭 호출을 막는다", () => {
    const open = vi.fn();
    render(<ProjectCard id={43001} type="project" title="합성 프로젝트" nickname="가상 작성자" viewCount={0} likeCount={0} onCardClick={open} />);
    fireEvent.click(screen.getByRole("button", { name: "합성 프로젝트" }));
    expect(open).toHaveBeenCalledExactlyOnceWith(43001);
  });
});

function Dialog({ close }: { close: () => void }) {
  const ref = useDialogFocus(close);
  return <div ref={ref} role="dialog" aria-label="검사 상세" tabIndex={-1}><button>첫 버튼</button><button>끝 버튼</button></div>;
}
it("상세 모달의 키보드 포커스를 순환하고 Escape로 닫는다", () => {
  const close = vi.fn();
  render(<Dialog close={close} />);
  const first = screen.getByRole("button", { name: "첫 버튼" });
  const last = screen.getByRole("button", { name: "끝 버튼" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Escape" });
  expect(close).toHaveBeenCalledTimes(1);
});

it("합성 프로젝트 HTML은 블록 경계를 유지한 텍스트로 읽고 실행·스타일 내용은 제외한다", () => {
  const text = projectDisplayText('<h2>Spring 프로젝트</h2><p>가상 <strong>본문</strong> &amp; 검색</p><p>두 번째<br>줄</p><script>window.leaked=true</script><style>body{display:none}</style><iframe>비공개</iframe><p>&lt;img src=x onerror=alert(1)&gt;</p>');
  render(<div data-testid="body-text">{text}</div>);
  expect(text).toContain("Spring 프로젝트\n\n가상 본문 & 검색");
  expect(text).toContain("두 번째\n줄");
  expect(text).not.toContain("leaked");
  expect(text).not.toContain("display:none");
  expect(text).not.toContain("비공개");
  expect(screen.getByTestId("body-text").querySelector("img,script,style,iframe")).toBeNull();
  expect(text).toContain("<img src=x onerror=alert(1)>");
});
