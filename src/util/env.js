export function isBrowser() {
  return typeof document !== "undefined";
}

export function getWindow(settings) {
  const globalWindow = typeof window !== "undefined" ? window : null;
  return settings.window || globalWindow;
}
