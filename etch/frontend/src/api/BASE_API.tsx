import { PUBLIC_DEMO } from "../config/publicDemo";
// 로컬 Vite 프록시와 배포 리버스 프록시에서 같은 API 경로를 사용한다.
export const BASE_API = PUBLIC_DEMO ? "/api/v1" : (import.meta.env.VITE_API_BASE_URL || "/api/v1");
