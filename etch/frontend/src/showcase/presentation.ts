// Compatibility with shared screen props, independent of VITE_DEMO_MODE.
// Showcase's router and memory provider define its own experience.
export const DEMO_MODE = false;
export const DEMO_REFERENCE_DATE = "2026-09-01";
export const DEMO_QUERIES = ["Spring", "React", "검색"] as const;
export const demoSearchPath = (tab = "all") => `/search?q=Spring&tab=${tab}`;
