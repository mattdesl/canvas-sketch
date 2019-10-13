export async function safelyAwait(fn, ...args) {
  const p = fn(...args);
  if (p && typeof p.then === "function") return await p;
  return p;
}
