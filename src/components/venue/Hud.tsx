"use client";
// Telemetry HUD: thin bracket corners, mono readouts. The energy meter and
// visibility are driven per-frame by the parent through refs.
import { forwardRef, type ReactNode } from "react";
import type { ShowWithArtist } from "@/data/api";

function Corner({ pos, children }: { pos: "tl" | "tr" | "bl" | "br"; children: ReactNode }) {
  const place = {
    tl: "top-20 left-4 sm:left-6 items-start text-left",
    tr: "top-20 right-4 sm:right-6 items-end text-right",
    bl: "bottom-6 left-6 hidden md:flex items-start text-left",
    br: "bottom-6 right-6 hidden md:flex items-end text-right",
  }[pos];
  const bracket = {
    tl: "border-t border-l -top-2 -left-2",
    tr: "border-t border-r -top-2 -right-2",
    bl: "border-b border-l -bottom-2 -left-2",
    br: "border-b border-r -bottom-2 -right-2",
  }[pos];
  return (
    <div className={`absolute flex flex-col gap-1 ${place}`}>
      <span aria-hidden className={`absolute h-3 w-3 border-white/40 ${bracket}`} />
      {children}
    </div>
  );
}

const fmtCoord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;

export const Hud = forwardRef<HTMLDivElement, { show: ShowWithArtist; meterRef: (el: HTMLDivElement | null) => void; reduced: boolean }>(function Hud(
  { show, meterRef, reduced },
  ref,
) {
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 font-mono text-[0.6875rem] tracking-[0.18em] text-smoke uppercase opacity-0">
      <Corner pos="tl">
        <span className="text-dim">Doors {show.doors}</span>
        <span>Show {show.start}</span>
      </Corner>
      <Corner pos="tr">
        <span className="text-dim">Crowd energy</span>
        <div ref={meterRef} className="flex h-5 items-end gap-[3px]" role="meter" aria-label="Crowd energy" aria-valuenow={0} aria-valuemin={0} aria-valuemax={12}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="w-[5px] rounded-[1px] bg-white/15 transition-colors duration-100" style={{ height: `${30 + i * 6}%` }} />
          ))}
        </div>
      </Corner>
      <Corner pos="bl">
        <span className="text-white">{show.venue.split(",")[0]}</span>
        <span className="text-dim">{show.city}</span>
        <span className="text-dim">
          {fmtCoord(show.lat, "N", "S")} · {fmtCoord(show.lng, "E", "W")}
        </span>
      </Corner>
      {!reduced && (
        <Corner pos="br">
          <span data-scroll-cue className="flex items-center gap-2">
            Scroll <span className="inline-block animate-bob">↓</span>
          </span>
        </Corner>
      )}
    </div>
  );
});
