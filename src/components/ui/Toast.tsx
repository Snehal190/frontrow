"use client";
// Wristband-scan toasts: a scanline sweeps the band as it lands.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { onNotify, type ToastMsg } from "@/lib/notify";

const TONE: Record<NonNullable<ToastMsg["tone"]>, string> = {
  default: "var(--stage-rgb)",
  early: "255 181 71",
  live: "255 77 94",
};

export function ToastLayer() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(
    () =>
      onNotify((e) => {
        if (e.kind !== "toast") return;
        setItems((xs) => [...xs.slice(-2), e.msg]);
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== e.msg.id)), 3200);
      }),
    [],
  );

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
            className="relative flex items-center gap-3 overflow-hidden rounded-full bg-haze-2/90 py-2.5 pr-5 pl-3 text-sm font-semibold text-white shadow-2xl ring-1 backdrop-blur-xl"
            style={{ ["--glow-rgb" as string]: TONE[t.tone ?? "default"], boxShadow: `0 10px 40px -10px rgb(${TONE[t.tone ?? "default"]} / 0.6)`, borderColor: "transparent" }}
          >
            <span aria-hidden className="flex h-6 items-center gap-[2px] rounded-full bg-black/40 px-2">
              {[3, 1, 2, 1, 3, 2, 1].map((w, i) => (
                <span key={i} className="h-3.5 bg-white/70" style={{ width: w }} />
              ))}
            </span>
            {t.text}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/3 animate-[scanx_0.9s_ease-out_1]"
              style={{ background: `linear-gradient(90deg, transparent, rgb(${TONE[t.tone ?? "default"]} / 0.55), transparent)` }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`@keyframes scanx { from { transform: translateX(-100%) } to { transform: translateX(400%) } }`}</style>
    </div>
  );
}
