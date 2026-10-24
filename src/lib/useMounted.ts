"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false during SSR and hydration, true after: the hydration-safe "client only" gate. */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
