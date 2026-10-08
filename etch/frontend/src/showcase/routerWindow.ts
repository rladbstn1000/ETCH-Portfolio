// React Router persists view-transition bookkeeping in sessionStorage by default.
// Only this router gets a memory store; no browser storage is read or changed.
export function createShowcaseRouterWindow(browser: Window): Window {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
  };
  return new Proxy(browser, {
    get(target, property) {
      if (property === "sessionStorage" || property === "localStorage") return storage;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
