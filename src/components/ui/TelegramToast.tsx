"use client";
// A fake Telegram push that slides down from the top, like the real thing.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { onNotify, type TelegramMsg } from "@/lib/notify";

export function TelegramBubble({ text, time = "now" }: { text: string; time?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2aa3df] to-[#1c7fc0] text-lg">
        🎟
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-white">FrontRow Show Bot</span>
          <span className="font-mono text-[0.65rem] text-white/50">{time}</span>
        </div>
        <p className="mt-0.5 text-[0.9rem] leading-snug text-white/85">{text}</p>
      </div>
    </div>
  );
}

export function TelegramToastLayer() {
  const [msg, setMsg] = useState<TelegramMsg | null>(null);

  useEffect(() => {
    let timer = 0;
    const off = onNotify((e) => {
      if (e.kind !== "telegram") return;
      setMsg(e.msg);
      clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 5200);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-3">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            role="status"
            initial={{ y: -140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -140, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
            className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#1f2630]/90 p-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-2xl"
          >
            <div className="label mb-2 flex items-center gap-1.5 !text-[0.6rem] text-white/50">
              <span className="inline-block h-3 w-3 rounded-[4px] bg-[#2aa3df]" aria-hidden /> Telegram
            </div>
            <TelegramBubble text={msg.text} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
