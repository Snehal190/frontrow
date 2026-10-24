"use client";
// Shared-element flight: the clicked card's photo expands and flies into the
// LED wall while the venue goes dark behind it (~0.9s flight, then fades into
// the wall's own duotone image).
import { motion } from "motion/react";
import { useState } from "react";
import { peekPendingEnter } from "../cards/enterStore";

export function EnterTransition({ showId }: { showId: string }) {
  const [p] = useState(() => peekPendingEnter(showId));
  const [target] = useState(() => {
    // Roughly where the LED wall sits in the venue camera's back-of-room view.
    const w = Math.min(window.innerWidth * 0.46, 820);
    return { left: (window.innerWidth - w) / 2, top: window.innerHeight * 0.16, width: w, height: w * 0.48 };
  });
  if (!p) return null;
  return (
    <motion.img
      aria-hidden
      src={p.src}
      alt=""
      className="pointer-events-none fixed z-30 object-cover"
      initial={{ left: p.rect.x, top: p.rect.y, width: p.rect.w, height: p.rect.h, borderRadius: 12, opacity: 1, filter: "saturate(1) brightness(1)" }}
      animate={{
        ...target,
        borderRadius: 2,
        opacity: [1, 1, 0],
        filter: ["saturate(1) brightness(1)", "saturate(0.6) brightness(1.2)", "saturate(0.3) brightness(1.6)"],
      }}
      transition={{ duration: 1.3, ease: [0.65, 0, 0.35, 1], opacity: { duration: 1.3, times: [0, 0.65, 1] }, filter: { duration: 1.3 } }}
    />
  );
}
