import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import OAuthLoadingPage from "../src/components/pages/oauthLoadingPage";
import { getMemberInfo } from "../src/api/authApi";
import TokenManager from "../src/utils/tokenManager";

vi.mock("../src/api/authApi", () => ({ getMemberInfo: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetAllMocks();
});
afterEach(cleanup);

// 프런트의 전달/이동 계약용 합성 JWT. 서명 검증·API 권한 검사는 백엔드 테스트에서 수행한다.
const fixtureToken = (role: string) => `e30.${btoa(JSON.stringify({ role }))}.synthetic-signature`;
function mount() {
  const router = createMemoryRouter([
    { path: "/Oauth", element: <OAuthLoadingPage /> },
    { path: "/additional-info", element: <p>추가 정보</p> },
    { path: "/", element: <p>로그인 완료</p> },
  ], { initialEntries: ["/Oauth"] });
  render(<StrictMode><RouterProvider router={router} /></StrictMode>);
}

it("GUEST의 fragment 토큰을 저장하고 URL에서 지운 뒤 추가 정보로 이동한다", async () => {
  const token = fixtureToken("GUEST");
  window.history.replaceState(null, "", `/Oauth#token=${token}`);
  mount();
  await screen.findByText("추가 정보");
  expect(TokenManager.getToken()).toBe(token);
  expect(window.location.hash).toBe("");
  expect(window.location.search).toBe("");
  expect(getMemberInfo).not.toHaveBeenCalled();
});

it("USER는 StrictMode에서도 토큰을 한 번 처리하고 회원 정보 조회 후 이동한다", async () => {
  window.history.replaceState(null, "", `/Oauth#token=${fixtureToken("USER")}`);
  vi.mocked(getMemberInfo).mockResolvedValue({ id: 1, nickname: "합성회원" } as never);
  mount();
  await screen.findByText("로그인 완료");
  await waitFor(() => expect(getMemberInfo).toHaveBeenCalledTimes(1));
  expect(window.location.hash).toBe("");
});

it("갱신 응답의 Bearer 접두사는 저장 시 제거하여 요청에 중복되지 않는다", () => {
  const token = fixtureToken("USER");
  TokenManager.setToken(`Bearer ${token}`);
  expect(TokenManager.getToken()).toBe(token);
  expect(TokenManager.getRole()).toBe("USER");
});
