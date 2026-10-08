import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { useDialogFocus } from "../src/hooks/useDialogFocus";
import FallbackImage from "../src/components/atoms/fallbackImage";
import StatusChangeModal from "../src/components/organisms/mypage/statusChangeModal";
import { experienceText, notifyUser } from "../src/config/experienceText";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("a conditionally opened dialog includes textarea in its focus loop and restores focus", () => {
  function Example() {
    const [open, setOpen] = useState(false);
    const dialog = useDialogFocus(() => setOpen(false), open);
    return <><button onClick={() => setOpen(true)}>열기</button>{open && <div ref={dialog} role="dialog"><button>닫기 버튼</button><textarea aria-label="댓글" /><button disabled>비활성 등록</button></div>}</>;
  }
  render(<Example />);
  const open = screen.getByRole("button", { name: "열기" }); open.focus(); fireEvent.click(open);
  const first = screen.getByRole("button", { name: "닫기 버튼" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(screen.getByLabelText("댓글"));
  fireEvent.keyDown(document.activeElement!, { key: "Tab" }); expect(document.activeElement).toBe(first);
  fireEvent.keyDown(first, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(open);
});

it("failed image retries the local fallback once, then presents a text alternative", () => {
  render(<FallbackImage src="/missing.jpg" fallback="/placeholder.svg" alt="프로젝트" />);
  fireEvent.error(screen.getByRole("img")); expect(screen.getByRole("img").getAttribute("src")).toBe("/placeholder.svg");
  fireEvent.error(screen.getByRole("img")); expect(screen.getByRole("img", { name: "프로젝트 없음" }).textContent).toBe("이미지 없음");
  expect(document.querySelector("img")).toBeNull();
});

it("the real API application retains its normal feedback and update wording", () => {
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  notifyUser("처리 완료"); expect(alert).toHaveBeenCalledWith("처리 완료");
  expect(experienceText.jobUpdates).toBe("매일 새로운 공고 업데이트");
});

it("application status dialog keeps the original status payload and adds keyboard close", async () => {
  const save = vi.fn().mockResolvedValue(undefined), close = vi.fn();
  render(<StatusChangeModal appliedJob={{ appliedJobId: 1, jobId: 1001, title: "예시", companyName: "가상", status: "SCHEDULED", companyId: 1, closingDate: "2026-09-10", openingDate: "2026-09-01" }} statusCodes={{ SCHEDULED: "지원 예정", DOCUMENT_DONE: "서류 완료" }} onStatusChange={save} onClose={close} />);
  expect(screen.getByRole("dialog", { name: "지원 상태 변경" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "모달 닫기" }));
  fireEvent.keyDown(document.activeElement!, { key: "Escape" }); expect(close).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});
