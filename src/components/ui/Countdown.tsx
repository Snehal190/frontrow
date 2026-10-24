"use client";
import { useNow } from "@/lib/useNow";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const two = (n: number) => String(n).padStart(2, "0");

/** `closes in 2d 14:07:33`, ticking every second. */
export function Countdown({ to, prefix = "closes in", className = "" }: { to: string; prefix?: string; className?: string }) {
  const now = useNow();
  const p = parts(new Date(to).getTime() - (now ?? 0));
  const text = now === null ? "--d --:--:--" : `${p.d}d ${two(p.h)}:${two(p.m)}:${two(p.s)}`;
  // Screen readers get a calm, minute-level label rather than a ticking second.
  const spoken = now === null ? prefix : `${prefix} ${p.d} days ${p.h} hours ${p.m} minutes`;
  return (
    <span role="timer" aria-label={spoken} className={`font-mono tabular-nums ${className}`}>
      {prefix} {text}
    </span>
  );
}
