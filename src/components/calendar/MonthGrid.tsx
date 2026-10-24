"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ShowWithArtist } from "@/data/api";
import { STATUS_META } from "@/lib/status";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function MiniCard({ show }: { show: ShowWithArtist }) {
  const m = STATUS_META[show.status];
  return (
    <Link href={`/show/${show.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={show.artist.image} alt="" className="h-10 w-10 rounded-md object-cover" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-white">{show.artist.name}</span>
        <span className="label block truncate !text-[0.6rem]" style={{ color: m.color }}>
          {m.short} · {show.city}
        </span>
      </span>
    </Link>
  );
}

export function MonthGrid({ month, shows, today, dir }: { month: Date; shows: ShowWithArtist[]; today: Date | null; dir: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
    const n = i - lead + 1;
    return n >= 1 && n <= days ? new Date(month.getFullYear(), month.getMonth(), n) : null;
  });
  const byDay = shows.reduce<Record<string, ShowWithArtist[]>>((acc, s) => {
    (acc[key(new Date(s.date))] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="panel grain overflow-visible p-3 sm:p-5">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DOW.map((d) => (
          <div key={d} className="label pb-2 text-center text-dim">
            {d}
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={key(first)}
            custom={dir}
            variants={{ enter: (d: number) => ({ x: `${d * 100}%`, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: `${-d * 100}%`, opacity: 0 }) }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            className="grid grid-cols-7 gap-1 sm:gap-2"
          >
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square sm:aspect-[4/3]" />;
              const k = key(d);
              const list = byDay[k] ?? [];
              const isToday = today && key(today) === k;
              const col = i % 7;
              return (
                <div key={k} className="relative" onMouseEnter={() => list.length && setOpen(k)} onMouseLeave={() => setOpen((o) => (o === k ? null : o))}>
                  <button
                    type="button"
                    disabled={!list.length}
                    onFocus={() => list.length && setOpen(k)}
                    onBlur={() => setOpen((o) => (o === k ? null : o))}
                    onClick={() => setOpen((o) => (o === k ? null : k))}
                    aria-label={`${d.toDateString()}${list.length ? `: ${list.map((s) => `${s.artist.name}, ${STATUS_META[s.status].label}`).join("; ")}` : ""}`}
                    aria-expanded={list.length ? open === k : undefined}
                    className={`flex aspect-square w-full flex-col items-start justify-between rounded-lg p-1.5 text-left ring-1 transition sm:aspect-[4/3] sm:p-2.5 ${list.length ? "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]" : "ring-transparent"}`}
                  >
                    <span className={`relative font-mono text-xs sm:text-sm ${isToday ? "text-white" : list.length ? "text-smoke" : "text-dim/70"}`}>
                      {d.getDate()}
                      {isToday && (
                        <span
                          aria-hidden
                          className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-stage"
                          style={{ boxShadow: "0 0 calc(4px + var(--beat) * 10px) rgb(var(--stage-rgb))", opacity: "calc(0.6 + var(--beat) * 0.4)" }}
                        />
                      )}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {list.map((s) => (
                        <span key={s.id} className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s.status].color, boxShadow: `0 0 8px ${STATUS_META[s.status].color}` }} />
                      ))}
                    </span>
                    {list[0] && <span className="hidden w-full truncate text-[0.7rem] text-smoke lg:block">{list[0].artist.name}</span>}
                  </button>
                  <AnimatePresence>
                    {open === k && list.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-full z-30 mt-1 w-64 rounded-xl bg-haze-2/95 p-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl ${col > 3 ? "right-0" : "left-0"}`}
                      >
                        {list.map((s) => (
                          <MiniCard key={s.id} show={s} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
