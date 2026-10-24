"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { getMyShows, type ShowWithArtist } from "@/data/api";
import { dateTile, STATUS_META } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { useSceneMode } from "@/lib/venueMode";
import { useData } from "../useData";
import { MonthGrid } from "./MonthGrid";

type Tab = "all" | "inCalendar" | "going" | "saved";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All shows" },
  { id: "inCalendar", label: "In calendar" },
  { id: "going", label: "Going" },
  { id: "saved", label: "Saved" },
];

export function Calendar() {
  useSceneMode("calendar");
  const { data } = useData(getMyShows, "my-shows");
  const now = useNow();
  const [tab, setTab] = useState<Tab>("all");
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(1);

  const today = now ? new Date(now) : null;
  const base = today ?? new Date(2026, 9, 1);
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const upcoming = (data ?? []).filter((s) => !s.user.dismissed && (!now || new Date(s.date).getTime() > now - 86_400_000));
  const filtered: Record<Tab, ShowWithArtist[]> = {
    all: upcoming,
    inCalendar: upcoming.filter((s) => s.user.inCalendar),
    going: upcoming.filter((s) => s.user.going),
    saved: upcoming.filter((s) => s.user.saved),
  };
  const shows = filtered[tab];
  const inMonth = shows
    .filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const go = (d: number) => {
    setDir(d);
    setOffset((o) => o + d);
  };

  return (
    <div className="relative px-4 pt-24 pb-32 sm:px-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-b from-house/75 via-house/45 to-house/80" />
      <div className="relative mx-auto max-w-6xl">
        <p className="label text-lilac">Plan the season</p>
        <h1 className="display mt-2 text-display text-white">Calendar</h1>

        <div role="tablist" aria-label="Calendar filter" className="mt-8 inline-flex flex-wrap gap-1 rounded-full bg-black/30 p-1 ring-1 ring-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`label relative rounded-full px-4 py-2 ${tab === t.id ? "text-house" : "text-smoke hover:text-white"}`}
            >
              {tab === t.id && <motion.span layoutId="cal-pill" className="absolute inset-0 rounded-full bg-smoke" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
              <span className="relative">
                {t.label} <span className="opacity-60">{data ? filtered[t.id].length : ""}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 mb-4 flex items-center justify-between">
          <h2 className="display text-4xl text-white" aria-live="polite">
            {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} className="label grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/15 hover:bg-white/5" aria-label="Previous month">
              ←
            </button>
            <button type="button" onClick={() => go(1)} className="label grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/15 hover:bg-white/5" aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <MonthGrid month={month} shows={shows} today={today} dir={dir} />

        <div className="mt-4 flex flex-wrap gap-4">
          {(["live", "early_bird", "announced", "rumour", "sold_out"] as const).map((s) => (
            <span key={s} className="label flex items-center gap-2 text-dim">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>

        <section aria-labelledby="agenda-h" className="mt-12">
          <h2 id="agenda-h" className="label mb-4 text-lilac">
            This month · {inMonth.length} {inMonth.length === 1 ? "show" : "shows"}
          </h2>
          <ul className="space-y-2">
            {inMonth.map((s) => {
              const d = dateTile(s.date);
              return (
                <li key={s.id}>
                  <Link href={`/show/${s.id}`} className="panel flex items-center gap-4 p-3 hover:bg-haze-2/70">
                    <span className="w-16 font-mono text-sm text-smoke">
                      {d.dow} {d.day}
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_META[s.status].color }} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-white">{s.artist.name}</span>
                    <span className="hidden truncate text-sm text-dim sm:block">
                      {s.venue.split(",")[0]} · {s.city}
                    </span>
                    <span className="label shrink-0" style={{ color: STATUS_META[s.status].color }}>
                      {STATUS_META[s.status].short}
                    </span>
                  </Link>
                </li>
              );
            })}
            {data && !inMonth.length && <li className="text-dim">Nothing this month in this view.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
