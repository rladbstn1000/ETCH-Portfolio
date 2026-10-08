import { expect, it, vi } from "vitest";
import { createShowcaseRouterWindow } from "./routerWindow";

it("router transition state stays in memory without reading or clearing browser storage", () => {
  const read = vi.spyOn(Storage.prototype, "getItem");
  const write = vi.spyOn(Storage.prototype, "setItem");
  const remove = vi.spyOn(Storage.prototype, "removeItem");
  const clear = vi.spyOn(Storage.prototype, "clear");
  const routerWindow = createShowcaseRouterWindow(window);
  routerWindow.sessionStorage.setItem("react-router-transitions", "example");
  expect(routerWindow.sessionStorage.getItem("react-router-transitions")).toBe("example");
  expect(routerWindow.location).toBe(window.location);
  routerWindow.sessionStorage.clear();
  expect(routerWindow.sessionStorage.length).toBe(0);
  for (const spy of [read, write, remove, clear]) { expect(spy).not.toHaveBeenCalled(); spy.mockRestore(); }
});
