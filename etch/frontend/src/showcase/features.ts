// Build-selected display capabilities. No OAuth, sockets or uploads are initialized.
export const features = { chat: false, recommendations: true, uploads: false, oauth: false };
export const CHAT_API = "";
export const OAUTH_URL = "";
export function requireUploads(hasFiles: boolean) {
  if (hasFiles) throw new Error("화면 체험판에서는 파일을 전송하지 않습니다.");
}
