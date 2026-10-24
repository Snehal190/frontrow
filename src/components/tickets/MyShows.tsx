"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { getMyShows, type ShowWithArtist } from "@/data/api";
import { useNow } from "@/lib/useNow";
import { useSceneMode } from "@/lib/venueMode";
import { ShowCard } from "../cards/ShowCard";
import { useData } from "../useData";
import { TicketStub } from "./TicketStub";

type Tab = "going" | "saved" | "past";

export function MyShows() {
  useSceneMode("calendar");
  const { data } = useData(getMyShows, "my-shows");
  const now = useNow();
  const [tab, setTab] = useState<Tab>("going");

  const t = now ?? 0;
  const isPast = (s: ShowWithArtist) => new Date(s.date).getTime() < t;
  const byDate = (a: ShowWithArtist, b: ShowWithArtist) => +new Date(a.date) - +new Date(b.date);
  const lists: Record<Tab, ShowWithArtist[]> = {
    going: (data ?? []).filter((s) => s.user.going && !isPast(s)).sort(byDate),
    saved: (data ?? []).filter((s) => s.user.saved && !isPast(s) && !s.user.dismissed).sort(byDate),
    past: (data ?? []).filter((s) => s.user.going && isPast(s)).sort((a, b) => byDate(b, a)),
  };
  const list = lists[tab];

  return (
    <div className="relative px-4 pt-24 pb-32 sm:px-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-b from-house/70 via-house/40 to-house/80" />
      <div className="relative mx-auto max-w-6xl">
        <p className="label text-lilac">Your wristbands</p>
        <h1 className="display mt-2 text-display text-white">My shows</h1>
        <div role="tablist" aria-label="My shows" className="mt-8 mb-10 inline-flex gap-1 rounded-full bg-black/30 p-1 ring-1 ring-white/10">
          {(["going", "saved", "past"] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`label relative rounded-full px-5 py-2 ${tab === k ? "text-house" : "text-smoke hover:text-white"}`}
            >
              {tab === k && <motion.span layoutId="myshows-pill" className="absolute inset-0 rounded-full bg-smoke" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
              <span className="relative">
                {k} <span className="opacity-60">{data ? lists[k].length : ""}</span>
              </span>
            </button>
          ))}
        </div>

        {!data ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="panel h-52 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="panel grain max-w-lg p-8">
            <p className="display text-3xl text-white">{tab === "past" ? "No stubs yet" : tab === "going" ? "Nothing booked yet" : "Nothing saved"}</p>
            <p className="mt-2 text-dim">Mark shows as Going or Save them from your radar.</p>
            <Link href="/radar" className="btn btn-primary mt-5">
              Open radar
            </Link>
          </div>
        ) : tab === "saved" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {list.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <TicketStub show={s} past={tab === "past"} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
