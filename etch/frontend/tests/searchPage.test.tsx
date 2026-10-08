import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import SearchPage from "../src/components/pages/searchPage";
import { searchAll, searchJobs, searchNews, searchProjects } from "../src/api/searchApi";

// 네트워크의 완료 순서를 제어하여 실제 검색 화면 상태와 라우터 전환을 검증한다.
// Elasticsearch/API 통합 검증은 별도 로컬 검증 스크립트에서 수행한다.
vi.mock("../src/api/searchApi", () => ({
  searchAll: vi.fn(), searchJobs: vi.fn(), searchNews: vi.fn(), searchProjects: vi.fn(),
}));
vi.mock("../src/hooks/useLikedItems", () => ({
  useLikedNews: () => ({ isNewsLiked: () => false, addLikedNews: vi.fn(), removeLikedNews: vi.fn() }),
}));
vi.mock("../src/components/organisms/job/jobDetailModal", () => ({ default: () => null }));
vi.mock("../src/components/organisms/job/searchJobList", () => ({
  default: ({ jobs }: { jobs: { id: string; title: string }[] }) => <ul>{jobs.map(job => <li key={job.id}>{job.title}</li>)}</ul>,
}));
vi.mock("../src/components/molecules/home/newsCard", () => ({ default: ({ title }: { title: string }) => <p>{title}</p> }));
vi.mock("../src/components/organisms/project/list/projectListCard", () => ({
  default: ({ projects }: { projects: { id: number; title: string }[] }) => <ul>{projects.map(project => <li key={project.id}>{project.title}</li>)}</ul>,
}));

function page(title?: string) {
  return {
    content: title ? [{ id: 1, title, companyName: "합성회사", regions: [], industries: [], jobCategories: [] }] : [],
    page: { totalElements: title ? 1 : 0, totalPages: 1, size: 10, number: 0 },
  };
}
function projectPage(title?: string, number = 0, hasNext = false) {
  return {
    content: title ? [{ projectId: 7, title, memberName: "합성작성자", thumbnailUrl: null, likeCount: 0, viewCount: 0 }] : [],
    page: { number, size: 8, totalElements: null, totalPages: null, totalExact: false,
      hasNext, hasPrevious: number > 0, nextPage: hasNext ? number + 1 : null },
  };
}
function results(title?: string) {
  return { jobs: page(title), news: page(), projects: projectPage() };
}
function mount() {
  const router = createMemoryRouter([{ path: "/search", element: <SearchPage /> }], { initialEntries: ["/search?q=alpha"] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("검색어에 따른 화면 상태 분리", () => {
  it("검색어 변경 시 방문했던 채용 탭 캐시와 페이지를 초기화하고 새 검색어로 조회한다", async () => {
    vi.mocked(searchAll).mockImplementation(async keyword => results(`${keyword} 전체`) as never);
    vi.mocked(searchJobs).mockImplementation(async filters => page(`${filters.keyword} 채용`) as never);
    const router = mount();
    await screen.findByText("alpha 전체");
    fireEvent.click(screen.getByRole("button", { name: /^채용/ }));
    await screen.findByText("alpha 채용");
    await act(async () => { await router.navigate("/search?q=beta"); });
    await waitFor(() => expect(searchAll).toHaveBeenLastCalledWith("beta", 0, 4));
    fireEvent.click(screen.getByRole("button", { name: /^채용/ }));
    await screen.findByText("beta 채용");
    expect(screen.queryByText("alpha 채용")).toBeNull();
    expect(searchJobs).toHaveBeenLastCalledWith({ keyword: "beta", page: 0, size: 9 });
  });

  it("이전 검색의 늦은 응답이 다음 검색 결과를 덮어쓰지 않는다", async () => {
    let finishOldAll!: (value: never) => void;
    vi.mocked(searchAll).mockImplementation(keyword => keyword === "alpha"
      ? new Promise(resolve => { finishOldAll = resolve; })
      : Promise.resolve(results("beta 전체") as never));
    const router = mount();
    await waitFor(() => expect(searchAll).toHaveBeenCalled());
    await act(async () => { await router.navigate("/search?q=beta"); });
    await screen.findByText("beta 전체");
    await act(async () => { finishOldAll(results("alpha 전체") as never); });
    expect(screen.queryByText("alpha 전체")).toBeNull();
    expect(screen.getByText("beta 전체")).toBeTruthy();
  });

  it("검색어를 지우면 이전 결과를 표시하거나 빈 검색 API를 호출하지 않는다", async () => {
    vi.mocked(searchAll).mockResolvedValue(results("alpha 전체") as never);
    const router = mount();
    await screen.findByText("alpha 전체");
    await act(async () => { await router.navigate("/search"); });
    expect(screen.queryByText("alpha 전체")).toBeNull();
    expect(searchAll).toHaveBeenCalledTimes(1);
    expect((screen.getByPlaceholderText("검색어를 입력하세요") as HTMLInputElement).value).toBe("");
  });
});

describe("검색 요청의 로딩·실패·0건 구분", () => {
  it("통합검색 실패를 0건으로 표시하지 않고 안전한 안내 후 재시도로 복구한다", async () => {
    let finishRetry!: (value: never) => void;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(searchAll)
      .mockRejectedValueOnce(new Error("internal-service.invalid credential=not-for-ui"))
      .mockImplementationOnce(() => new Promise(resolve => { finishRetry = resolve; }));
    mount();
    expect(screen.getByRole("status").textContent).toContain("검색 중입니다");
    expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    await screen.findByRole("alert");
    expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    expect(document.body.textContent).not.toContain("internal-service");
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(screen.getByRole("status").textContent).toContain("검색 중입니다");
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => { finishRetry(results("복구된 결과") as never); });
    await screen.findByText("복구된 결과");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(searchAll).toHaveBeenCalledTimes(2);
  });

  it("성공한 0건 응답에서만 빈 결과를 표시하고 전체·프로젝트 미검증 총건수를 만들지 않는다", async () => {
    vi.mocked(searchAll).mockResolvedValue(results() as never);
    mount();
    await waitFor(() => expect(screen.getAllByText("검색 결과가 없습니다")).toHaveLength(3));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("button", { name: "전체" }).textContent).toBe("전체");
    expect(screen.getByRole("button", { name: /프로젝트/ }).textContent).toBe("프로젝트건수 미집계");
    expect(screen.getByRole("heading", { name: "채용 (0)" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "프로젝트 (건수 미집계)" })).toBeTruthy();
  });

  it.each([
    ["채용", searchJobs, page("복구된 채용")],
    ["뉴스", searchNews, page("복구된 뉴스")],
    ["프로젝트", searchProjects, projectPage("복구된 프로젝트")],
  ] as const)("%s 개별 탭도 실패·로딩·재시도 성공을 구분한다", async (label, api, payload) => {
    vi.mocked(searchAll).mockResolvedValue(results("전체 결과") as never);
    let finishRetry!: (value: never) => void;
    vi.mocked(api).mockRejectedValueOnce(new Error("sensitive internal exception"))
      .mockImplementationOnce(() => new Promise(resolve => { finishRetry = resolve; }));
    mount();
    await screen.findByText("전체 결과");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
    await screen.findByRole("alert");
    expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    expect(screen.queryByText("전체 결과")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(screen.getByRole("status").textContent).toContain("검색 중입니다");
    await act(async () => { finishRetry(payload as never); });
    await screen.findByText(`복구된 ${label}`);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("페이지 변경 실패 시 이전 성공 페이지를 숨기고 실패한 페이지를 다시 요청한다", async () => {
    vi.mocked(searchAll).mockResolvedValue(results() as never);
    vi.mocked(searchProjects).mockResolvedValueOnce(projectPage("이전 페이지", 0, true) as never)
      .mockRejectedValueOnce(new Error("ES unavailable"))
      .mockResolvedValueOnce(projectPage("다음 페이지", 1) as never);
    mount();
    fireEvent.click(screen.getByRole("button", { name: /^프로젝트/ }));
    await screen.findByText("이전 페이지");
    fireEvent.click(screen.getByRole("button", { name: "다음 결과" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("이전 페이지")).toBeNull();
    expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await screen.findByText("다음 페이지");
    expect(searchProjects).toHaveBeenLastCalledWith({ keyword: "alpha", page: 1, size: 8 });
  });
});

describe("DB 공개 검증 후 프로젝트 후보 페이지", () => {
  it("비공개 hit만 있던 구간을 전체 0건으로 표시하지 않고 다음 공개 결과로 이동한다", async () => {
    vi.mocked(searchAll).mockResolvedValue({ ...results(), projects: projectPage(undefined, 0, true) } as never);
    vi.mocked(searchProjects).mockResolvedValueOnce(projectPage(undefined, 0, true) as never)
      .mockResolvedValueOnce(projectPage("공개 확인된 프로젝트", 1, false) as never);
    mount();
    await screen.findByText("이 구간의 공개 결과가 없습니다. 다음 결과를 확인해 주세요.");
    fireEvent.click(screen.getByRole("button", { name: /^프로젝트/ }));
    await screen.findByText("이 구간의 공개 결과가 없습니다. 다음 결과를 확인해 주세요.");
    expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    expect((screen.getByRole("button", { name: "이전 결과" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "다음 결과" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "다음 결과" }));
    await screen.findByText("공개 확인된 프로젝트");
    expect(searchProjects).toHaveBeenLastCalledWith({ keyword: "alpha", page: 1, size: 8 });
    expect((screen.getByRole("button", { name: "다음 결과" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("heading", { name: "프로젝트 검색 결과 (건수 미집계)" })).toBeTruthy();
    expect(document.body.textContent).not.toContain("총 1");
  });

  it("첫 구간이 비었고 다음 후보가 없을 때에만 프로젝트 검색 결과 없음을 표시한다", async () => {
    vi.mocked(searchAll).mockResolvedValue(results() as never);
    vi.mocked(searchProjects).mockResolvedValue(projectPage() as never);
    mount();
    fireEvent.click(screen.getByRole("button", { name: /^프로젝트/ }));
    await screen.findByText("검색 결과가 없습니다");
    expect(screen.queryByRole("button", { name: "다음 결과" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("지역·직무 필터와 주소 탐색", () => {
  it("정확 조건을 API로 보내며 필터 변경·해제·뒤로가기를 URL로 복원한다", async () => {
    vi.mocked(searchAll).mockResolvedValue(results() as never);
    vi.mocked(searchJobs).mockImplementation(async filters => page(`${filters.regions?.join() || "전체"}-${filters.jobCategories?.join() || "전체"}`) as never);
    const router = mount();
    fireEvent.click(screen.getByRole("button", { name: /^채용/ }));
    await screen.findByText("전체-전체");
    fireEvent.change(screen.getByRole("combobox", { name: "채용 지역" }), { target: { value: "서울" } });
    await screen.findByText("서울-전체");
    fireEvent.change(screen.getByRole("combobox", { name: "채용 직무" }), { target: { value: "백엔드" } });
    await screen.findByText("서울-백엔드");
    expect(searchJobs).toHaveBeenLastCalledWith({ keyword: "alpha", regions: ["서울"], jobCategories: ["백엔드"], page: 0, size: 9 });
    expect(router.state.location.search).toContain("tab=jobs");
    fireEvent.click(screen.getByRole("button", { name: "필터 해제" }));
    await screen.findByText("전체-전체");
    expect(router.state.location.search).not.toContain("region=");
    await act(async () => { await router.navigate(-1); });
    await screen.findByText("서울-백엔드");
    expect((screen.getByRole("combobox", { name: "채용 지역" }) as HTMLSelectElement).value).toBe("서울");
    expect((screen.getByRole("combobox", { name: "채용 직무" }) as HTMLSelectElement).value).toBe("백엔드");
    fireEvent.change(screen.getByRole("combobox", { name: "채용 직무" }), { target: { value: "DevOps/클라우드" } });
    await screen.findByText("서울-DevOps/클라우드");
    expect(searchJobs).toHaveBeenLastCalledWith({ keyword: "alpha", regions: ["서울"], jobCategories: ["DevOps/클라우드"], page: 0, size: 9 });
  });

  it("직접 URL로 채용 탭·필터를 열고 늦은 이전 필터 응답을 버린다", async () => {
    let finishOld!: (value: never) => void;
    vi.mocked(searchAll).mockResolvedValue(results() as never);
    vi.mocked(searchJobs).mockImplementation(filters => filters.regions?.includes("서울")
      ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve(page("부산 결과") as never));
    const router = createMemoryRouter([{ path: "/search", element: <SearchPage /> }], { initialEntries: ["/search?q=React&tab=jobs&region=서울"] });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(searchJobs).toHaveBeenCalledWith({ keyword: "React", page: 0, size: 9, regions: ["서울"] }));
    fireEvent.change(screen.getByRole("combobox", { name: "채용 지역" }), { target: { value: "부산" } });
    await screen.findByText("부산 결과");
    await act(async () => finishOld(page("이전 서울 결과") as never));
    expect(screen.queryByText("이전 서울 결과")).toBeNull();
  });
});

// 서버에서 분류한 공개 오류를 정상 0건과 구분하고 내부 응답 본문은 표시하지 않는다.
it.each([
  [400, "검색 조건이 올바르지 않습니다."],
  [429, "요청이 많습니다."],
  [503, "검색 서비스에 연결할 수 없습니다."],
])("HTTP %s 오류를 구분한다", async (status, message) => {
  vi.mocked(searchAll).mockRejectedValueOnce({response: {status, data: {secret: "DO_NOT_RENDER_INTERNAL"}}});
  mount();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain(message));
  expect(screen.queryByText(/DO_NOT_RENDER_INTERNAL/)).toBeNull();
  expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
});
