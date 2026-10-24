"use client";
// One shared 1-second clock for every countdown / "14s ago" label.
import { useSyncExternalStore } from "react";

let now = 0;
let timer = 0;
const subs = new Set<() => void>();

function subscribe(fn: () => void) {
  subs.add(fn);
  if (subs.size === 1) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      subs.forEach((s) => s());
    }, 1000);
  }
  return () => {
    subs.delete(fn);
    if (!subs.size) clearInterval(timer);
  };
}

/** Current time in ms, refreshed every second; null during SSR/hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now || Date.now(),
    () => null,
  );
}
