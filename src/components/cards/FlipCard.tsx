"use client";
import { motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * 3D card flip (perspective 1200px, 0.7s) wrapped in a cursor tilt (≤6°) and a
 * soft stage-coloured spotlight that follows the pointer. Pointer effects
 * write CSS variables directly — no React state per move.
 */
export function FlipCard({ front, back, flipped, className = "" }: { front: ReactNode; back: ReactNode; flipped: boolean; className?: string }) {
  const tilt = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    const el = tilt.current;
    if (!el || reduced || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`); // ±6°
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--spot", "1");
  };
  const onLeave = () => {
    const el = tilt.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--spot", "0");
  };

  return (
    <div className={`[perspective:1200px] ${className}`}>
      <div
        ref={tilt}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="group/tilt relative h-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
      >
        <motion.div
          className="grid h-full [transform-style:preserve-3d]"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: [0.6, 0.05, 0.3, 1] }}
        >
          <div className="relative [grid-area:1/1] [backface-visibility:hidden]" aria-hidden={flipped} inert={flipped}>
            {front}
          </div>
          <div className="relative [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!flipped} inert={!flipped}>
            {back}
          </div>
        </motion.div>
        {/* Cursor spotlight: stage colour at 12%. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[14px] opacity-[var(--spot,0)] transition-opacity duration-300"
          style={{ background: "radial-gradient(260px circle at var(--mx,50%) var(--my,50%), rgb(var(--stage-rgb) / 0.12), transparent 70%)" }}
        />
      </div>
    </div>
  );
}
