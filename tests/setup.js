// Simple requestAnimationFrame/cancelAnimationFrame polyfill for Engine tests
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb) =>
    setTimeout(() => cb(performance.now?.() ?? Date.now()), 0);
}
if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Provide a minimal CustomEvent polyfill for code that dispatches events
if (typeof globalThis.CustomEvent !== "function") {
  globalThis.CustomEvent = function CustomEvent(type, options) {
    return { type, detail: options?.detail ?? null };
  };
}

// Ensure timers are always restored between tests even if a test early-returns
import { afterEach, vi } from "vitest";
afterEach(() => {
  try {
    vi.useRealTimers();
  } catch {}
  vi.restoreAllMocks();
});
