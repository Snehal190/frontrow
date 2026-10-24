"use client";
// A physical ticket that turns itself over: the front is the artist banner
// (their photo — BACKEND: Spotify artist image once connected) with the stub,
// the back carries the gig details. Flips on its own every few seconds,
// staggered per ticket; pauses while you hover or focus it. Past shows render
// as torn, faded stubs and stay still.
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ShowWithArtist } from "@/data/api";
import { formatINR } from "@/lib/math";
import { dateTile, SOURCE_LABEL, STATUS_META } from "@/lib/status";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useEnterShow } from "../cards/ShowCard";
import { ArtistImg } from "../ui/ArtistImg";

const FLIP_EVERY_MS = 6000;
const STAGGER_MS = 1400;

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

function Stub({ show }: { show: ShowWithArtist }) {
  const d = dateTile(show.date);
  return (
    <div className="flex w-32 shrink-0 flex-col justify-between bg-[#efe6d8] p-4 text-house sm:w-36">
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
  );
}

function Perforation() {
  return (
    <div aria-hidden className="relative w-0 border-l-2 border-dashed border-house/40">
      <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-house" />
      <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-house" />
    </div>
  );
}

export function TicketStub({ show, past = false, index = 0 }: { show: ShowWithArtist; past?: boolean; index?: number }) {
  const img = useRef<HTMLImageElement>(null);
  const enter = useEnterShow(show);
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [paused, setPaused] = useState(false);
  const [a, b] = show.artist.hue;
  const live = show.tiers.find((t) => t.status === "live") ?? show.tiers[0];

  // Auto-flip: each ticket on its own offset so the wall of tickets ripples.
  useEffect(() => {
    if (past || reduced || paused) return;
    let interval = 0;
    const start = window.setTimeout(() => {
      setFlipped((f) => !f);
      interval = window.setInterval(() => setFlipped((f) => !f), FLIP_EVERY_MS);
    }, FLIP_EVERY_MS / 2 + index * STAGGER_MS);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [past, reduced, paused, index]);

  const shell = `relative flex h-full overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]`;

  const front = (
    <div className={shell} style={{ background: `linear-gradient(120deg, ${a}, ${b})` }}>
      <button
        type="button"
        onClick={() => enter(img.current)}
        className="relative flex min-h-[13rem] min-w-0 flex-1 cursor-pointer items-end overflow-hidden p-5 text-left"
        aria-label={`Open ${show.artist.name} at ${show.venue}`}
      >
        <ArtistImg ref={img} artist={show.artist} className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="relative">
          <p className="label text-white/75">{past ? "Admitted" : "Admit one · GA"}</p>
          <p className="display mt-1 text-4xl leading-[0.9] text-white">{show.artist.name}</p>
          <p className="mt-1 text-sm text-white/85">
            {show.venue.split(",")[0]} · {show.city}
          </p>
        </div>
      </button>
      <Perforation />
      <Stub show={show} />
    </div>
  );

  const back = (
    <div className={`${shell} bg-[#efe6d8] text-house`}>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-5">
        <div>
          <p className="label text-house/60">Your ticket · {STATUS_META[show.status].label}</p>
          <p className="display mt-1 text-3xl leading-[0.9]">{show.artist.name}</p>
          <p className="mt-1 text-sm text-house/80">
            {show.venue}, {show.city}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="label !text-[0.6rem] text-house/55">Doors</dt>
            <dd className="font-mono">{show.doors}</dd>
          </div>
          <div>
            <dt className="label !text-[0.6rem] text-house/55">Show</dt>
            <dd className="font-mono">{show.start}</dd>
          </div>
          <div>
            <dt className="label !text-[0.6rem] text-house/55">{live?.name ?? "Tier"}</dt>
            <dd className="font-mono">{live ? formatINR(live.priceINR) : "—"}</dd>
          </div>
        </dl>
        <p className="label !text-[0.6rem] text-house/55">
          Found by {show.foundBy[0].crawler} on {SOURCE_LABEL[show.foundBy[0].source]}
        </p>
      </div>
      <Perforation />
      <Stub show={show} />
    </div>
  );

  if (past)
    return (
      <div
        className="rotate-[-1.2deg] opacity-75 saturate-50"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 82%, 2% 78%, 0 70%, 2% 62%, 0 55%)" }}
      >
        {front}
      </div>
    );

  return (
    <div
      className="group [perspective:1400px]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        className="grid [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
      >
        <div className="[grid-area:1/1] [backface-visibility:hidden]" aria-hidden={flipped} inert={flipped}>
          {front}
        </div>
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!flipped} inert={!flipped}>
          {back}
        </div>
      </motion.div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={() => setFlipped((f) => !f)} className="label rounded-full px-3 py-1.5 text-dim ring-1 ring-white/10 hover:text-white" aria-pressed={flipped}>
          {flipped ? "Show front" : "Flip ticket"}
        </button>
      </div>
    </div>
  );
}
