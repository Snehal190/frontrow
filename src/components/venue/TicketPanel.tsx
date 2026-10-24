"use client";
import { setShowFlag, type ShowWithArtist } from "@/data/api";
import { formatINR } from "@/lib/math";
import { toast } from "@/lib/notify";
import { STATUS_META } from "@/lib/status";
import { StatusRibbon } from "../cards/parts";
import { Countdown } from "../ui/Countdown";

export function TierTable({ show, large }: { show: ShowWithArtist; large?: boolean }) {
  if (!show.tiers.length)
    return <p className="text-sm text-dim">No tiers yet — this one&apos;s still a rumour. We&apos;ll ping you on Telegram the moment it&apos;s real.</p>;
  return (
    <ul className={large ? "divide-y divide-white/8" : "space-y-2"}>
      {show.tiers.map((t) => {
        const live = t.status === "live";
        const gone = t.status === "sold_out";
        return (
          <li
            key={t.name}
            className={`flex items-center justify-between gap-3 ${large ? "py-4" : "rounded-lg px-3 py-2"} ${live && !large ? "beat-glow bg-white/[0.04]" : ""}`}
            style={live ? { ["--glow-rgb" as string]: STATUS_META[show.status === "early_bird" ? "early_bird" : "live"].rgb } : undefined}
          >
            <div className="min-w-0">
              <p className={`${large ? "display text-3xl" : "font-semibold"} ${gone ? "text-dim line-through" : "text-white"}`}>{t.name}</p>
              <p className={`label mt-0.5 ${live ? "text-early" : "text-dim"}`}>
                {live ? `On sale${t.soldPct ? ` · ${t.soldPct}% sold` : ""}` : gone ? "Sold out" : "Opens later"}
              </p>
              {live && t.closesAt && <Countdown to={t.closesAt} className="mt-1 block text-xs text-early" />}
            </div>
            <span className={`font-mono ${large ? "text-xl" : ""} ${gone ? "text-dim line-through" : "text-white"}`}>{formatINR(t.priceINR)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function TicketActions({ show }: { show: ShowWithArtist }) {
  const canBuy = show.ticketUrl && (show.status === "live" || show.status === "early_bird");
  const flag = (k: "going" | "inCalendar") => () => {
    const next = !show.user[k];
    void setShowFlag(show.id, k, next);
    toast(k === "going" ? (next ? "You're going 🎟" : "Removed from Going") : next ? "Added to calendar ✓" : "Removed from calendar", next && k === "going" ? "live" : "default");
  };
  return (
    <div className="flex flex-wrap gap-2">
      {canBuy ? (
        <a href={show.ticketUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
          Get tickets ↗
        </a>
      ) : (
        <span className="btn btn-ghost pointer-events-none opacity-70">{show.status === "sold_out" ? "Sold out" : "Not on sale yet"}</span>
      )}
      <button type="button" className="btn btn-ghost" aria-pressed={show.user.inCalendar} onClick={flag("inCalendar")}>
        {show.user.inCalendar ? "In calendar ✓" : "Add to calendar"}
      </button>
      <button type="button" className="btn btn-ghost" aria-pressed={show.user.going} onClick={flag("going")}>
        {show.user.going ? "Going ✓" : "Going"}
      </button>
    </div>
  );
}

/** The HUD panel that slides in at the barricade. */
export function TicketPanel({ show }: { show: ShowWithArtist }) {
  return (
    <div className="panel grain w-[min(380px,calc(100vw-2rem))] overflow-hidden">
      <StatusRibbon status={show.status} />
      <div className="space-y-4 p-4">
        <p className="label text-dim">Tickets · {show.venue.split(",")[0]}</p>
        <TierTable show={show} />
        <TicketActions show={show} />
      </div>
    </div>
  );
}
