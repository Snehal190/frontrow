"use client";
// A physical ticket: perforated edge, barcode, artist duotone and a holo foil
// that follows the cursor (or device tilt). Past shows render as torn stubs.
import { useEffect, useRef } from "react";
import type { ShowWithArtist } from "@/data/api";
import { dateTile } from "@/lib/status";
import { useEnterShow } from "../cards/ShowCard";

function Barcode({ seed }: { seed: string }) {
  const bars = [...seed.repeat(6)].slice(0, 34).map((c, i) => ((c.charCodeAt(0) * (i + 7)) % 4) + 1);
  return (
    <div aria-hidden className="flex h-12 items-stretch gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-house" style={{ width: w }} />
      ))}
    </div>
  );
}

export function TicketStub({ show, past = false }: { show: ShowWithArtist; past?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const enter = useEnterShow(show);
  const d = dateTile(show.date);
  const [a, b] = show.artist.hue;

  useEffect(() => {
    const node = el.current;
    if (!node || past) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const set = (x: number, y: number) => {
      node.style.setProperty("--hx", `${x * 100}%`);
      node.style.setProperty("--hy", `${y * 100}%`);
      node.style.setProperty("--hr", `${(x - 0.5) * 8}deg`);
    };
    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    // Phones: device tilt drives the foil instead of the cursor.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      set(0.5 + e.gamma / 60, 0.5 + (e.beta - 45) / 60);
    };
    node.addEventListener("pointermove", onMove);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      node.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [past]);

  return (
    <div
      ref={el}
      className={`group relative flex overflow-hidden rounded-2xl text-house shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] transition-transform duration-300 ${past ? "rotate-[-1.2deg] opacity-75 saturate-50" : "hover:-translate-y-1"}`}
      style={{
        background: `linear-gradient(120deg, ${a}, ${b})`,
        clipPath: past ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 82%, 2% 78%, 0 70%, 2% 62%, 0 55%)" : undefined,
        transform: past ? undefined : "perspective(900px) rotateY(var(--hr, 0deg))",
      }}
    >
      {/* Artist half */}
      <button
        type="button"
        onClick={() => enter(img.current)}
        className="relative flex min-w-0 flex-1 cursor-pointer items-end overflow-hidden p-5 text-left"
        aria-label={`Open ${show.artist.name} at ${show.venue}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={show.artist.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="relative">
          <p className="label text-white/75">{past ? "Admitted" : "Admit one · GA"}</p>
          <p className="display mt-1 text-4xl leading-[0.9] text-white">{show.artist.name}</p>
          <p className="mt-1 text-sm text-white/80">
            {show.venue.split(",")[0]} · {show.city}
          </p>
        </div>
        {/* Holographic foil */}
        {!past && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-color-dodge transition-opacity group-hover:opacity-70"
            style={{
              background:
                "radial-gradient(circle at var(--hx,30%) var(--hy,30%), rgba(255,255,255,0.65), transparent 35%), linear-gradient(115deg, transparent 20%, rgba(255,0,170,0.35) 35%, rgba(0,220,255,0.35) 50%, rgba(255,240,0,0.3) 65%, transparent 80%)",
              backgroundSize: "100% 100%, 220% 220%",
              backgroundPosition: "0 0, var(--hx,30%) var(--hy,30%)",
            }}
          />
        )}
      </button>
      {/* Perforation */}
      <div aria-hidden className="relative w-0 border-l-2 border-dashed border-house/40">
        <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-house" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-house" />
      </div>
      {/* Stub */}
      <div className="flex w-32 shrink-0 flex-col justify-between bg-[#efe6d8] p-4 sm:w-36">
        <div>
          <p className="label !text-[0.6rem] text-house/60">{d.dow}</p>
          <p className="display text-5xl leading-none">{d.day}</p>
          <p className="label !text-[0.6rem] text-house/70">
            {d.mon} · {show.start}
          </p>
        </div>
        <div>
          <Barcode seed={show.id + show.artistSlug} />
          <p className="mt-1 font-mono text-[0.55rem] tracking-widest text-house/60">FR-{show.id.toUpperCase()}-GA</p>
        </div>
      </div>
    </div>
  );
}
