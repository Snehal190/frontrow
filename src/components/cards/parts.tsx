"use client";
// Small pieces shared by every card: status ribbon, date tile, source badges,
// travel line mini-map.
import type { ShowWithArtist, TicketStatus } from "@/data/api";
import { ago, dateTile, SOURCE_LABEL, STATUS_META } from "@/lib/status";
import { CITIES_HOME } from "./cities";

export function StatusRibbon({ status, onFlip, flipped }: { status: TicketStatus; onFlip?: () => void; flipped?: boolean }) {
  const m = STATUS_META[status];
  const loud = status === "live" || status === "early_bird";
  return (
    <div
      className={`relative flex items-center justify-between overflow-hidden px-4 py-1.5 ${loud ? "beat-glow" : ""}`}
      style={{ background: m.color, color: m.text, ["--glow-rgb" as string]: m.rgb }}
    >
      <span className="label flex items-center gap-2 font-medium">
        {loud && <span aria-hidden className="beat-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />}
        {m.short}
      </span>
      {onFlip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          className="label -mr-2 flex items-center gap-1.5 rounded-full px-2 py-0.5 hover:bg-black/10"
          aria-pressed={flipped}
          aria-label={flipped ? "Show the front of the card" : "Flip for ticket tiers and sources"}
        >
          <span aria-hidden className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
          {flipped ? "Back" : "Flip"}
        </button>
      )}
      {/* Light-sweep sheen every 6s. */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-sheen bg-gradient-to-r from-transparent via-white/45 to-transparent" />
    </div>
  );
}

export function DateTile({ iso, size = "md" }: { iso: string; size?: "md" | "lg" }) {
  const d = dateTile(iso);
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl bg-black/30 ring-1 ring-white/10 ${size === "lg" ? "h-24 w-20" : "h-[4.5rem] w-14"}`}
      aria-label={d.long}
    >
      <span className="label !text-[0.6rem] text-dim">{d.dow}</span>
      <span className={`display leading-none text-white ${size === "lg" ? "text-5xl" : "text-3xl"}`}>{d.day}</span>
      <span className="label !text-[0.6rem] text-lilac">{d.mon}</span>
    </div>
  );
}

export function Sources({ show }: { show: ShowWithArtist }) {
  const handle = `@${show.artist.slug.replace(/-/g, "")}`;
  const names = [...new Set(show.foundBy.map((f) => (f.source === "instagram" ? `${handle} IG` : SOURCE_LABEL[f.source])))];
  return (
    <p className="label truncate text-dim">
      Found on: <span className="text-smoke">{names.join(" · ")}</span>
    </p>
  );
}

const R = 6371;
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** A tiny dot-grid of India with a dashed travel line from home to the venue city. */
export function TravelLine({ show }: { show: ShowWithArtist }) {
  const home = CITIES_HOME;
  // India bounds ≈ lat 8–35, lng 68–97.
  const px = (lng: number) => ((lng - 68) / 29) * 180 + 10;
  const py = (lat: number) => 110 - ((lat - 8) / 27) * 100;
  const km = distanceKm(home, show);
  const same = show.city === home.city;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 200 120" className="h-16 w-28 shrink-0" aria-hidden>
        {Array.from({ length: 11 * 7 }, (_, i) => (
          <circle key={i} cx={10 + (i % 11) * 18} cy={10 + Math.floor(i / 11) * 17} r="1" fill="#ffffff" opacity="0.12" />
        ))}
        {!same && <line x1={px(home.lng)} y1={py(home.lat)} x2={px(show.lng)} y2={py(show.lat)} stroke="rgb(var(--stage-rgb))" strokeWidth="1.5" strokeDasharray="4 4" />}
        <circle cx={px(home.lng)} cy={py(home.lat)} r="4" fill="#cfc4dc" />
        <circle cx={px(show.lng)} cy={py(show.lat)} r="5" fill="rgb(var(--stage-rgb))" />
      </svg>
      <p className="text-sm text-smoke">
        {same ? (
          <>In your city · {show.city}</>
        ) : (
          <>
            {home.city} → {show.city}
            <span className="block font-mono text-xs text-dim">{km.toLocaleString("en-IN")} km</span>
          </>
        )}
      </p>
    </div>
  );
}

export function FoundList({ show }: { show: ShowWithArtist }) {
  return (
    <ul className="space-y-1">
      {show.foundBy.map((f, i) => (
        <li key={i} className="flex items-center justify-between gap-2 text-sm">
          <span className="text-smoke">
            <span className="label mr-2 text-stage">{f.crawler}</span>
            {f.source === "instagram" ? "Artist Instagram" : SOURCE_LABEL[f.source]}
          </span>
          <span className="font-mono text-xs text-dim">{ago(f.at)}</span>
        </li>
      ))}
    </ul>
  );
}

export function statusRgb(status: TicketStatus) {
  return STATUS_META[status].rgb;
}
