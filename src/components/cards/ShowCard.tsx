"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { setShowFlag, type ShowWithArtist, type ShowUserFlags } from "@/data/api";
import { formatINR } from "@/lib/math";
import { toast } from "@/lib/notify";
import { STATUS_META } from "@/lib/status";
import { Countdown } from "../ui/Countdown";
import { setPendingEnter } from "./enterStore";
import { FlipCard } from "./FlipCard";
import { DateTile, FoundList, Sources, StatusRibbon, TravelLine } from "./parts";

export type CardVariant = "grid" | "featured" | "rail" | "early";

const FLAG_TOAST: Partial<Record<keyof ShowUserFlags, [string, string]>> = {
  going: ["You're going 🎟", "Removed from Going"],
  saved: ["Saved to your shows", "Removed from Saved"],
  inCalendar: ["Added to calendar ✓", "Removed from calendar"],
};

export function useEnterShow(show: ShowWithArtist) {
  const router = useRouter();
  return (img: HTMLElement | null) => {
    const r = img?.getBoundingClientRect();
    if (r) setPendingEnter({ showId: show.id, src: show.artist.image, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, at: performance.now() });
    router.push(`/show/${show.id}`);
  };
}

function Actions({ show, compact }: { show: ShowWithArtist; compact?: boolean }) {
  const flag = (k: keyof ShowUserFlags) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !show.user[k];
    void setShowFlag(show.id, k, next);
    if (k === "dismissed") toast(`Hidden ${show.artist.name} · ${show.city}`);
    else if (FLAG_TOAST[k]) toast(FLAG_TOAST[k]![next ? 0 : 1], k === "going" && next ? "live" : "default");
  };
  const pill = (on: boolean) =>
    `label rounded-full px-3 py-2 transition ${on ? "bg-stage/20 text-white ring-1 ring-stage/60" : "text-smoke ring-1 ring-white/12 hover:bg-white/5"}`;
  const canBuy = show.ticketUrl && (show.status === "live" || show.status === "early_bird");

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {canBuy ? (
        <a href={show.ticketUrl} target="_blank" rel="noreferrer" className="btn btn-primary !px-4 !py-2 !text-[0.8rem]">
          Get tickets ↗
        </a>
      ) : (
        <span className="label rounded-full px-3 py-2 text-dim ring-1 ring-white/8">
          {show.status === "sold_out" ? "Sold out" : show.status === "rumour" ? "Unconfirmed" : "Not on sale yet"}
        </span>
      )}
      <button type="button" aria-pressed={show.user.going} onClick={flag("going")} className={pill(show.user.going)}>
        {show.user.going ? "Going ✓" : "Going"}
      </button>
      <button type="button" aria-pressed={show.user.saved} onClick={flag("saved")} className={pill(show.user.saved)}>
        {show.user.saved ? "Saved" : "Save"}
      </button>
      {!compact && (
        <button type="button" aria-pressed={show.user.inCalendar} onClick={flag("inCalendar")} className={pill(show.user.inCalendar)}>
          {show.user.inCalendar ? "In calendar" : "Add to calendar"}
        </button>
      )}
      {!show.artist.followed && !compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast(`Following ${show.artist.name}`);
          }}
          className={pill(false)}
        >
          + Follow {show.artist.name.split(" ")[0]}
        </button>
      )}
      <button
        type="button"
        onClick={flag("dismissed")}
        className="label ml-auto grid h-8 w-8 place-items-center rounded-full text-dim ring-1 ring-white/10 hover:text-white"
        aria-label={`Dismiss ${show.artist.name} in ${show.city}`}
      >
        ×
      </button>
    </div>
  );
}

function EarlyMeter({ show }: { show: ShowWithArtist }) {
  const tier = show.tiers.find((t) => t.status === "live");
  if (!tier?.closesAt) return null;
  const pct = tier.soldPct ?? 50;
  return (
    <div className="rounded-xl bg-early/[0.07] p-3 ring-1 ring-early/25">
      <div className="flex items-center justify-between gap-2">
        <span className="label text-early">Early bird · {formatINR(tier.priceINR)}</span>
        <Countdown to={tier.closesAt} className="text-xs text-early" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Early-bird tier sold">
        <div className="h-full rounded-full bg-gradient-to-r from-early/70 to-early" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-dim">{pct}% of early-bird tier sold</p>
    </div>
  );
}

function Back({ show, onFlip }: { show: ShowWithArtist; onFlip: () => void }) {
  return (
    <article className="panel grain flex h-full flex-col overflow-hidden">
      <StatusRibbon status={show.status} onFlip={onFlip} flipped />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <p className="label mb-2 text-dim">Ticket tiers</p>
          {show.tiers.length ? (
            <ul className="space-y-1.5">
              {show.tiers.map((t) => (
                <li key={t.name} className={`flex items-center justify-between text-sm ${t.status === "sold_out" ? "text-dim line-through" : "text-smoke"}`}>
                  <span className="flex items-center gap-2">
                    {t.status === "live" && <span className="beat-dot h-1.5 w-1.5 rounded-full bg-live" aria-hidden />}
                    {t.name}
                    <span className="label !text-[0.6rem] text-dim no-underline">{t.status === "live" ? "on sale" : t.status === "sold_out" ? "gone" : "soon"}</span>
                  </span>
                  <span className="font-mono">{formatINR(t.priceINR)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dim">No tiers yet — it&apos;s a rumour. We&apos;ll ping you the moment it&apos;s real.</p>
          )}
        </div>
        <div>
          <p className="label mb-2 text-dim">Where we found it</p>
          <FoundList show={show} />
        </div>
        <div className="mt-auto">
          <TravelLine show={show} />
        </div>
      </div>
    </article>
  );
}

export function ShowCard({ show, variant = "grid", fresh = false }: { show: ShowWithArtist; variant?: CardVariant; fresh?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const enter = useEnterShow(show);
  const meta = STATUS_META[show.status];
  const featured = variant === "featured";
  const rail = variant === "rail";

  const onCard = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    enter(img.current);
  };

  const front = (
    <article
      onClick={onCard}
      className={`panel grain flex h-full cursor-pointer flex-col overflow-hidden ${fresh ? "ring-2 ring-stage/60" : ""}`}
      style={{ ["--glow-rgb" as string]: meta.rgb }}
    >
      <StatusRibbon status={show.status} onFlip={() => setFlipped(true)} />
      <div className={`flex flex-1 ${featured ? "flex-col sm:flex-row" : "flex-col"}`}>
        {rail && (
          <div className="relative h-36 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={img} src={show.artist.image} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-haze to-transparent" />
          </div>
        )}
        {featured && (
          <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:w-[44%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={img} src={show.artist.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-haze via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-haze/80" />
          </div>
        )}
        <div className={`flex flex-1 flex-col gap-3 ${featured ? "p-5 sm:p-6" : "p-4"}`}>
          <div className="flex items-start gap-3.5">
            <DateTile iso={show.date} size={featured ? "lg" : "md"} />
            <div className="min-w-0 flex-1">
              <Link
                href={`/show/${show.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  enter(img.current);
                }}
                className={`display block leading-[0.92] text-white hover:text-lilac ${featured ? "text-5xl sm:text-6xl" : rail ? "text-[1.7rem]" : "text-[2rem]"}`}
              >
                {show.artist.name}
              </Link>
              {show.title && <p className="label mt-1.5 text-lilac">{show.title}</p>}
              <p className="mt-1.5 truncate text-sm text-smoke">
                {show.venue.split(",")[0]} · <span className="text-white">{show.city}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {show.travelNote && <span className="label rounded-full bg-white/5 px-2.5 py-1 text-smoke ring-1 ring-white/10">✈ {show.travelNote}</span>}
                {show.isFestival && <span className="label rounded-full bg-lilac/10 px-2.5 py-1 text-lilac ring-1 ring-lilac/30">Festival</span>}
              </div>
            </div>
            {!featured && !rail && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={img} src={show.artist.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            )}
          </div>
          {(variant === "early" || (featured && show.status === "early_bird")) && <EarlyMeter show={show} />}
          {featured && show.status === "live" && (
            <p className="text-sm text-smoke">
              From <span className="font-mono text-white">{formatINR(Math.min(...show.tiers.filter((t) => t.status === "live").map((t) => t.priceINR)))}</span> ·{" "}
              {show.tiers.find((t) => t.status === "live")?.soldPct ?? 60}% of this phase sold
            </p>
          )}
          <div className="mt-auto space-y-3">
            <Sources show={show} />
            <Actions show={show} compact={rail} />
          </div>
        </div>
      </div>
    </article>
  );

  return <FlipCard className="h-full" flipped={flipped} front={front} back={<Back show={show} onFlip={() => setFlipped(false)} />} />;
}
