"use client";
import type { CrawlerStatus } from "@/data/api";
import { ago } from "@/lib/status";
import { useNow } from "@/lib/useNow";

export function RadarIcon({ size = 18, color = "rgb(var(--stage-rgb))" }: { size?: number; color?: string }) {
  return (
    <span aria-hidden className="relative inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-white/15" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 animate-sweep rounded-full"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${color} 360deg)` }}
      />
      <span className="absolute inset-[30%] rounded-full ring-1 ring-white/20" />
    </span>
  );
}

export function CrawlerStrip({ crawlers, flash }: { crawlers: CrawlerStatus[]; flash?: string | null }) {
  const now = useNow();
  return (
    <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5" aria-label="Crawler status">
      <span className="label text-dim">Crawlers</span>
      {crawlers.map((c) => (
        <div
          key={c.name}
          className={`flex items-center gap-2 rounded-full transition-colors duration-500 ${flash === c.name ? "bg-stage/20 px-2 text-white" : ""}`}
          title={c.label}
        >
          <RadarIcon />
          <span className="label text-smoke">{c.name}</span>
          <span className="label text-dim">
            scanning · {now ? ago(c.lastRunAt, now) : "—"} · <span className="tabular-nums text-smoke">{c.sourcesChecked.toLocaleString("en-IN")}</span> checked
          </span>
        </div>
      ))}
    </div>
  );
}
