"use client";
// Merch bag: client state in React context, persisted to localStorage.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MerchItem } from "@/data/api";

export interface BagLine {
  key: string;
  item: MerchItem;
  size?: string;
  qty: number;
}

interface Bag {
  lines: BagLine[];
  open: boolean;
  count: number;
  subtotal: number;
  setOpen: (o: boolean) => void;
  add: (item: MerchItem, size?: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const KEY = "frontrow.bag.v1";
const BagCtx = createContext<Bag | null>(null);

function load(): BagLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as BagLine[];
  } catch {
    return [];
  }
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Restore from localStorage after mount (server render has no storage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(load());
    setHydrated(true);
    const reset = () => setLines([]);
    window.addEventListener("frontrow:reset", reset);
    return () => window.removeEventListener("frontrow:reset", reset);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const add = useCallback((item: MerchItem, size?: string) => {
    const key = `${item.id}:${size ?? ""}`;
    setLines((ls) => {
      const hit = ls.find((l) => l.key === key);
      if (hit) return ls.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, item.stock) } : l));
      return [...ls, { key, item, size, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty } : l))));
  }, []);

  const value = useMemo<Bag>(
    () => ({
      lines,
      open,
      setOpen,
      add,
      setQty,
      clear: () => setLines([]),
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.item.priceINR, 0),
    }),
    [lines, open, add, setQty],
  );

  return <BagCtx.Provider value={value}>{children}</BagCtx.Provider>;
}

export function useBag() {
  const b = useContext(BagCtx);
  if (!b) throw new Error("useBag outside BagProvider");
  return b;
}
