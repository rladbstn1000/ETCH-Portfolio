import { useEffect, useRef } from "react";

// 키보드 사용자가 상세 모달 안에서 이동하고, 닫으면 진입 버튼으로 돌아간다.
export function useDialogFocus(onClose: () => void, enabled = true) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!enabled) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    if (!node) return;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')).filter(item => item.getAttribute('aria-hidden') !== 'true' && !item.hidden);
    (focusables()[0] || node).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); node.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", keydown);
    return () => { node.removeEventListener("keydown", keydown); if (previous?.isConnected) previous.focus(); };
  }, [enabled]);
  return dialog;
}
