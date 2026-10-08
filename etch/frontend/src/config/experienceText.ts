// Default copy for the real API application. Build-selected showcase copy is separate.
export const experienceText = { jobUpdates: "매일 새로운 공고 업데이트", newsUpdates: "매일 새로운 뉴스 업데이트" };
export function notifyUser(message: string) { window.alert(message); }
export function confirmUser(message: string) { return window.confirm(message); }
