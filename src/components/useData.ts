"use client";
// Fetch through the api adapter and re-fetch whenever mock state changes.
import { useEffect, useState } from "react";
import { subscribe } from "@/data/api";

export function useData<T>(fetcher: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ key: string; data: T | null }>({ key: "", data: null });

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetcher().then((data) => {
        if (alive) setState({ key, data });
      });
    void load();
    const unsub = subscribe(() => void load());
    return () => {
      alive = false;
      unsub();
    };
    // `fetcher` is expected to be stable per `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const data = state.key === key ? state.data : null;
  return { data, loading: data === null };
}
