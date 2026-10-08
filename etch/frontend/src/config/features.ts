import { DEMO_MODE } from "./demo";

// 선택 서비스는 명시적으로 활성화한 경우에만 호출한다.
export const features = {
  chat: !DEMO_MODE && import.meta.env.VITE_ENABLE_CHAT === "true",
  recommendations: !DEMO_MODE && import.meta.env.VITE_ENABLE_RECOMMENDATIONS === "true",
  uploads: !DEMO_MODE && import.meta.env.VITE_ENABLE_UPLOADS === "true",
  oauth: !DEMO_MODE && import.meta.env.VITE_ENABLE_OAUTH === "true",
};

export const CHAT_API = import.meta.env.VITE_CHAT_API_BASE_URL || "/api/chat";
export const OAUTH_URL = import.meta.env.VITE_OAUTH_URL || "/oauth2/authorization/google";

export function requireUploads(hasFiles: boolean): void {
  if (hasFiles && !features.uploads) {
    throw new Error("파일 업로드가 비활성화되어 있습니다. 파일을 제외하고 저장해주세요.");
  }
}
