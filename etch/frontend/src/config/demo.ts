// 데모 표시 범위만 제어한다. 인증, API 권한, 동기화 시계는 변경하지 않는다.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const DEMO_REFERENCE_DATE = "2026-09-01";
export const DEMO_QUERIES = ["Spring", "React", "검색"] as const;
export const demoSearchPath = (tab = "all") => `/search?q=Spring&tab=${tab}`;
