"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { crawlerTick, getRadar, type ShowWithArtist } from "@/data/api";
import { demoNewShow } from "@/lib/demo";
import { dateTile } from "@/lib/status";
import { useNow } from "@/lib/useNow";
import { popWash, pushWash, useSceneMode } from "@/lib/venueMode";
import { ShowCard } from "../cards/ShowCard";
import { useData } from "../useData";
import { CrawlerStrip } from "./CrawlerStrip";
import { Rail } from "./Rail";

type Filter = "city" | "all" | "festivals" | "rumours";
const DISCOVERY_EVERY_MS = 45_000;
const FRESH_MS = 90_000;

function SectionHead({ kicker, title, dot, tone = "var(--color-live)", id }: { kicker?: string; title: string; dot?: boolean; tone?: string; id: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 id={id} className="display flex items-center gap-3 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-none text-white">
        {dot && <span aria-hidden className="beat-dot inline-block h-3 w-3 rounded-full" style={{ background: tone, boxShadow: `0 0 16px ${tone}` }} />}
        {title}
      </h2>
      {kicker && <span className="label hidden text-dim sm:block">{kicker}</span>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-busy>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="panel h-60 animate-pulse" />
      ))}
    </div>
  );
}

export function Radar() {
  useSceneMode("radar");
  const { data } = useData(getRadar, "radar");
  const [filter, setFilter] = useState<Filter>("all");
  const now = useNow();
  const earlyRef = useRef<HTMLElement>(null);

  // Crawlers: a heartbeat every ~6s, and a discovery every ~45s while you're here.
  useEffect(() => {
    const beat = setInterval(crawlerTick, 6000);
    const found = setInterval(demoNewShow, DISCOVERY_EVERY_MS);
    return () => {
      clearInterval(beat);
      clearInterval(found);
    };
  }, []);

  // While the early-bird section is on screen, the whole venue washes amber.
  useEffect(() => {
    const el = earlyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? pushWash("radar-early", "early_bird") : popWash("radar-early")), {
      rootMargin: "-25% 0px -25% 0px",
    });
    io.observe(el);
    return () => {
      io.disconnect();
      popWash("radar-early");
    };
  }, [data === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const shows = useMemo(() => data?.shows ?? [], [data]);
  const byDate = (a: ShowWithArtist, b: ShowWithArtist) => +new Date(a.date) - +new Date(b.date);
  const fresh = shows.filter((s) => now && now - new Date(s.foundBy[0].at).getTime() < FRESH_MS && s.id.startsWith("n"));
  const flashCrawler = fresh[0]?.foundBy[0].crawler ?? null;
  const live = shows.filter((s) => s.status === "live").sort(byDate);
  const featured = live.find((s) => s.city === data?.city) ?? live[0];
  const railShows = live.filter((s) => s !== featured);
  const early = shows.filter((s) => s.status === "early_bird").sort(byDate);

  const counts = {
    city: shows.filter((s) => s.city === data?.city).length,
    all: shows.length,
    festivals: shows.filter((s) => s.isFestival).length,
    rumours: shows.filter((s) => s.status === "rumour").length,
  };
  const board = shows
    .filter((s) =>
      filter === "city" ? s.city === data?.city : filter === "festivals" ? s.isFestival : filter === "rumours" ? s.status === "rumour" : true,
    )
    .sort(byDate);
  const months = board.reduce<Record<string, ShowWithArtist[]>>((acc, s) => {
    const m = dateTile(s.date).month;
    (acc[m] ??= []).push(s);
    return acc;
  }, {});

  const chips: { id: Filter; label: string }[] = [
    { id: "city", label: data?.city ?? "Bengaluru" },
    { id: "all", label: "All India" },
    { id: "festivals", label: "Festivals" },
    { id: "rumours", label: "Rumours" },
  ];

  return (
    <div className="relative px-4 pt-24 pb-32 sm:px-8">
      {/* Readability scrim: dark at the top and through the dense board. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-b from-house/70 via-house/20 to-house/70" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6">
          <p className="label text-lilac">
            {data?.city ?? "Bengaluru"} · {data ? shows.length : "··"} shows on your radar
          </p>
          <h1 className="display mt-2 text-display text-white">Your radar</h1>
        </header>

        <div className="mb-10">{data ? <CrawlerStrip crawlers={data.crawlers} flash={flashCrawler} /> : <div className="panel h-11 animate-pulse" />}</div>

        {!data ? (
          <Skeleton />
        ) : (
          <>
            <AnimatePresence initial={false}>
              {fresh.length > 0 && (
                <motion.section
                  key="fresh"
                  aria-labelledby="fresh-h"
                  className="mb-12"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <SectionHead id="fresh-h" title="Just found" dot tone="rgb(var(--stage-rgb))" kicker="Live from the crawlers" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence>
                      {fresh.map((s) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: -60, rotateX: -18 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: "spring", bounce: 0.35, duration: 0.8 }}>
                          <ShowCard show={s} fresh />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {featured && (
              <section aria-labelledby="onsale-h" className="mb-14">
                <SectionHead id="onsale-h" title="On sale now" dot kicker={`${live.length} with tickets live`} />
                <ShowCard show={featured} variant="featured" />
                {railShows.length > 0 && (
                  <div className="mt-8">
                    <p className="label mb-1 text-dim">Also on sale across India</p>
                    <Rail label="Also on sale across India">
                      {railShows.map((s) => (
                        <ShowCard key={s.id} show={s} variant="rail" />
                      ))}
                    </Rail>
                  </div>
                )}
              </section>
            )}

            <section ref={earlyRef} aria-labelledby="early-h" className="relative mb-16 rounded-[22px] p-4 sm:p-6" style={{ background: "linear-gradient(180deg, rgb(255 181 71 / 0.07), transparent 70%)" }}>
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-early/20" />
              <SectionHead id="early-h" title="Early bird live" dot tone="var(--color-early)" kicker="Cheapest tickets · closing soon" />
              {early.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {early.map((s) => (
                    <ShowCard key={s.id} show={s} variant="early" />
                  ))}
                </div>
              ) : (
                <p className="text-dim">No early-bird tiers open right now. We&apos;ll ping you the second one opens.</p>
              )}
            </section>

            <section aria-labelledby="board-h">
              <SectionHead id="board-h" title="On the board" />
              <div role="tablist" aria-label="Filter shows" className="mb-8 inline-flex flex-wrap gap-1 rounded-full bg-black/30 p-1 ring-1 ring-white/10">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    type="button"
                    aria-selected={filter === c.id}
                    onClick={() => setFilter(c.id)}
                    className={`label relative rounded-full px-4 py-2 transition-colors ${filter === c.id ? "text-house" : "text-smoke hover:text-white"}`}
                  >
                    {filter === c.id && <motion.span layoutId="chip-pill" className="absolute inset-0 rounded-full bg-smoke" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                    <span className="relative">
                      {c.label} <span className="opacity-60">{counts[c.id]}</span>
                    </span>
                  </button>
                ))}
              </div>
              {Object.entries(months).map(([month, list]) => (
                <div key={month} className="mb-10">
                  <h3 className="label sticky top-16 z-10 -mx-2 mb-4 inline-block rounded-full bg-house/70 px-3 py-1.5 text-lilac backdrop-blur-md">{month}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {list.map((s) => (
                      <ShowCard key={s.id} show={s} />
                    ))}
                  </div>
                </div>
              ))}
              {!board.length && <p className="text-dim">Nothing here yet.</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
