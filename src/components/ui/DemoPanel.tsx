"use client";
// Hidden presenter panel (` to toggle) + global demo shortcuts N E T L S R.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { demoAllowed, demoEarlyBird, demoLightsDown, demoNewShow, demoReset, demoSound, demoTelegram } from "@/lib/demo";
import { getFps, setTier, useTier, type Tier } from "@/lib/quality";

const ACTIONS: { key: string; label: string; run: () => void }[] = [
  { key: "N", label: "Crawler finds a new show", run: demoNewShow },
  { key: "E", label: "Featured show → Early bird live", run: () => void demoEarlyBird() },
  { key: "T", label: "Telegram test alert", run: demoTelegram },
  { key: "L", label: "Lights down (jump to the drop)", run: demoLightsDown },
  { key: "S", label: "Toggle sound", run: demoSound },
  { key: "R", label: "Reset all mock state", run: demoReset },
];

export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const tier = useTier();

  useEffect(() => {
    if (!demoAllowed()) return;
    try {
      if (new URL(window.location.href).searchParams.get("demo") === "1") sessionStorage.setItem("frontrow.demo", "1");
    } catch {}
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "`") {
        setOpen((o) => !o);
        return;
      }
      const a = ACTIONS.find((x) => x.key === e.key.toUpperCase());
      if (a) {
        e.preventDefault();
        a.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setFps(Math.round(getFps())), 500);
    return () => clearInterval(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          className="panel fixed top-20 right-4 z-[70] w-72 p-4"
          aria-label="Demo controls"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="label text-stage">Demo desk</span>
            <span className="label text-dim">
              {tier} · {fps} fps
            </span>
          </div>
          <ul className="space-y-1.5">
            {ACTIONS.map((a) => (
              <li key={a.key}>
                <button type="button" onClick={a.run} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5">
                  <kbd className="grid h-6 w-6 place-items-center rounded bg-white/10 font-mono text-xs text-white">{a.key}</kbd>
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-1.5 border-t border-white/10 pt-3">
            {(["low", "medium", "high"] as Tier[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`label flex-1 rounded-md py-1.5 ${t === tier ? "bg-stage/20 text-stage" : "bg-white/5 text-dim"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-dim">Press ` to hide.</p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
