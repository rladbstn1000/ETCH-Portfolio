import { useCallback, useEffect, useRef, useState } from "react";

export type SearchStatus = "idle" | "loading" | "success" | "error" | "invalid" | "limited" | "unavailable";

// 재요청 시 이전 성공 결과를 숨기고, 늦게 끝난 요청이 최신 상태를 덮지 않게 한다.
// 내부 오류/응답 본문은 UI나 브라우저 콘솔에 전달하지 않는다.
export function useSearchRequest<T>() {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const sequence = useRef(0);

  useEffect(() => () => { sequence.current += 1; }, []);

  const run = useCallback(async (request: () => Promise<T>) => {
    const current = ++sequence.current;
    setData(null);
    setStatus("loading");
    try {
      const result = await request();
      if (current !== sequence.current) return;
      setData(result);
      setStatus("success");
    } catch (error) {
      if (current === sequence.current) {
        // 상태 코드만 분류한다. 서버 오류 본문·주소는 화면에 표시하지 않는다.
        const code = (error as { response?: { status?: number } })?.response?.status;
        setStatus(code === 400 ? "invalid" : code === 429 ? "limited" : code === 503 || code === 504 ? "unavailable" : "error");
      }
    }
  }, []);

  return { data, status, run };
}
