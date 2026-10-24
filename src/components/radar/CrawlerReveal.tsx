"use client";
// The crawlers, visualised: three rings, a rotating sweep arm, and a blip per
// found show that lights up the first time the arm passes over it.
import { useEffect, useMemo, useRef } from "react";
import type { ShowWithArtist } from "@/data/api";
import { mulberry32 } from "@/lib/math";
import { CountUp } from "../ui/CountUp";

const SWEEP_MS = 3200;
const SIZE = 420;
const C = SIZE / 2;

export function CrawlerReveal({ shows }: { shows: ShowWithArtist[] }) {
  const arm = useRef<SVGGElement>(null);
  const blipEls = useRef<(SVGGElement | null)[]>([]);

  const blips = useMemo(() => {
    const rand = mulberry32(7);
    const n = Math.min(shows.length, 12);
    return shows.slice(0, n).map((s, i) => {
      const angle = (i / n) * 360 + rand() * 10;
      // Alternate rings so neighbouring labels never collide.
      const ring = [0.42, 0.68, 0.92][i % 3] + rand() * 0.04;
      const rad = ((angle - 90) * Math.PI) / 180;
      return { id: s.id, angle, x: C + Math.cos(rad) * ring * (C - 14), y: C + Math.sin(rad) * ring * (C - 14), label: `${s.artist.name} · ${s.city}` };
    });
  }, [shows]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      blipEls.current.forEach((b) => b && (b.style.opacity = "1"));
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      const deg = ((elapsed / SWEEP_MS) * 360) % 360;
      const laps = elapsed / SWEEP_MS;
      arm.current?.setAttribute("transform", `rotate(${deg} ${C} ${C})`);
      blips.forEach((b, i) => {
        const el = blipEls.current[i];
        if (!el) return;
        const passed = laps >= 1 || deg >= b.angle;
        // Bright right after the arm passes, settling to a steady glow.
        const since = (((deg - b.angle) % 360) + 360) % 360;
        const glow = passed ? 0.55 + 0.45 * Math.max(0, 1 - since / 90) : 0;
        el.style.opacity = String(glow);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [blips]);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`-130 -10 ${SIZE + 260} ${SIZE + 20}`} className="w-full max-w-[640px]" role="img" aria-label={`Radar sweep: ${shows.length} shows found`}>
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgb(var(--stage-rgb))" stopOpacity="0.15" />
            <stop offset="1" stopColor="rgb(var(--stage-rgb))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="armg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgb(var(--stage-rgb))" stopOpacity="0" />
            <stop offset="1" stopColor="rgb(var(--stage-rgb))" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx={C} cy={C} r={C - 4} fill="url(#rg)" />
        {[0.33, 0.66, 1].map((r) => (
          <circle key={r} cx={C} cy={C} r={(C - 6) * r} fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeDasharray={r === 1 ? undefined : "2 6"} />
        ))}
        <line x1={C} y1={6} x2={C} y2={SIZE - 6} stroke="#fff" strokeOpacity="0.06" />
        <line x1={6} y1={C} x2={SIZE - 6} y2={C} stroke="#fff" strokeOpacity="0.06" />
        <g ref={arm}>
          {/* The sweep: a 40° wedge trailing the arm. */}
          <path d={`M${C} ${C} L${C} 6 A${C - 6} ${C - 6} 0 0 0 ${C - (C - 6) * Math.sin((40 * Math.PI) / 180)} ${C - (C - 6) * Math.cos((40 * Math.PI) / 180)} Z`} fill="url(#armg)" opacity="0.6" />
          <line x1={C} y1={C} x2={C} y2={6} stroke="rgb(var(--stage-rgb))" strokeWidth="2" />
        </g>
        {blips.map((b, i) => (
          <g key={b.id} ref={(el) => void (blipEls.current[i] = el)} style={{ opacity: 0 }}>
            <circle cx={b.x} cy={b.y} r="9" fill="rgb(var(--stage-rgb))" opacity="0.25" />
            <circle cx={b.x} cy={b.y} r="3.5" fill="#fff" />
            <text x={b.x + (b.x > C ? 10 : -10)} y={b.y + 3.5} textAnchor={b.x > C ? "start" : "end"} className="fill-smoke font-mono" fontSize="9" letterSpacing="0.5">
              {b.label}
            </text>
          </g>
        ))}
        <circle cx={C} cy={C} r="4" fill="#fff" />
      </svg>
      <p className="label mt-6 text-center text-smoke">
        Scanned <CountUp to={6} duration={800} /> platforms · <CountUp to={412} /> listings ·{" "}
        <span className="text-white">
          <CountUp to={shows.length} /> shows match your artists
        </span>
      </p>
    </div>
  );
}
