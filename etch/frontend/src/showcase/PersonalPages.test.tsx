import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { ChatPreviewPage, CoverLetterEditPage, PortfolioPage, ProjectEditorPreviewPage } from "./PersonalPages";
import { resetShowcase, showcaseState } from "./state";
import { initialCoverLetters, initialPortfolios } from "./data";

beforeEach(() => { resetShowcase(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("개인 화면의 메모리 체험 경계", () => {
  it.each(["/mypage/portfolios/not-a-number", "/projects/999999/edit"])("없는 예시 경로 %s는 준비중 상태나 작성 화면으로 숨기지 않는다", async path => {
    render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/mypage/portfolios/:userId" element={<PortfolioPage />} /><Route path="/projects/:id/edit" element={<ProjectEditorPreviewPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByText(/해당 예시는 없습니다/)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("자기소개서 편집을 명시적으로 반영하고 초기화하면 가상 원본으로 돌아온다", async () => {
    const storageRead = vi.spyOn(Storage.prototype, "getItem");
    const storageWrite = vi.spyOn(Storage.prototype, "setItem");
    const storageClear = vi.spyOn(Storage.prototype, "clear");
    render(<MemoryRouter initialEntries={["/mypage/cover-letter-edit/5001"]}><Routes><Route path="/mypage/cover-letter-edit/:id" element={<CoverLetterEditPage />} /></Routes></MemoryRouter>);
    const name = await screen.findByLabelText("자기소개서 제목");
    fireEvent.change(name, { target: { value: "브라우저에서 편집한 가상 문서" } });
    fireEvent.change(screen.getAllByLabelText("답변 작성")[0], { target: { value: "새로운 예시 답변" } });
    expect(showcaseState.coverLetters[0].name).toBe(initialCoverLetters[0].name);
    fireEvent.click(screen.getByRole("button", { name: "브라우저 예시에만 반영" }));
    await waitFor(() => expect(showcaseState.coverLetters[0].answer1).toBe("새로운 예시 답변"));
    expect(screen.getByRole("status").textContent).toContain("서버 저장·지원서 제출은 수행하지 않았습니다");
    act(() => resetShowcase());
    await waitFor(() => expect((screen.getByLabelText("자기소개서 제목") as HTMLInputElement).value).toBe(initialCoverLetters[0].name));
    expect(storageRead).not.toHaveBeenCalled();
    expect(storageWrite).not.toHaveBeenCalled();
    expect(storageClear).not.toHaveBeenCalled();
  });

  it("포트폴리오는 소개만 바꾸며 연락처 입력이나 프로젝트 관계 변경을 요구하지 않는다", async () => {
    render(<MemoryRouter initialEntries={["/mypage/portfolios/6001"]}><Routes><Route path="/mypage/portfolios/:userId" element={<PortfolioPage />} /></Routes></MemoryRouter>);
    const introduction = await screen.findByLabelText("소개 문장 예시 편집");
    fireEvent.change(introduction, { target: { value: "가상 소개 문장을 바꿨습니다." } });
    fireEvent.click(screen.getByRole("button", { name: "소개를 브라우저 예시에만 반영" }));
    await waitFor(() => expect(showcaseState.portfolios[0].introduce).toBe("가상 소개 문장을 바꿨습니다."));
    expect(showcaseState.portfolios[0].projectIds).toEqual(initialPortfolios[0].projectIds);
    expect(showcaseState.portfolios[0].email).toBe("");
    expect(showcaseState.portfolios[0].phoneNumber).toBe("");
    expect(document.querySelectorAll('input[type="email"], input[type="password"], input[type="file"]')).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain("서버에 저장하지 않았습니다");
  });

  it("채팅은 예시 대화를 여닫을 수 있지만 메시지 입력·전송은 제공하지 않는다", () => {
    render(<MemoryRouter><ChatPreviewPage /></MemoryRouter>);
    expect(screen.getByText("안녕하세요. 이번 화면은 읽기 전용 예시 대화입니다.")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /전송/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "예시 대화 접기" }));
    expect(screen.queryByText("안녕하세요. 이번 화면은 읽기 전용 예시 대화입니다.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "예시 대화 열기" }));
    expect(screen.getByText("안녕하세요. 이번 화면은 읽기 전용 예시 대화입니다.")).toBeTruthy();
  });
});
