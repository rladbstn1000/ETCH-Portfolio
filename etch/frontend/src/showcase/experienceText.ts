export const experienceText = { jobUpdates: "기준일에 고정된 가상 공고", newsUpdates: "기준일에 고정된 가상 뉴스" };
export function notifyUser(message: string) {
  window.alert(`화면 체험판의 메모리 상태 안내\n${message}\n서버 저장·제출은 수행하지 않습니다. 새로고침하면 초기화됩니다.`);
}
export function confirmUser(message: string) {
  return window.confirm(`화면 체험판의 메모리 상태 안내\n${message}\n가상 상태만 변경하며 새로고침하면 초기화됩니다.`);
}
