"use client";
import Link from "next/link";
import { getMe, getMyShows } from "@/data/api";
import { useSceneMode } from "@/lib/venueMode";
import { useData } from "../useData";
import { ConnectionsPanel } from "./ConnectionCard";

export function Profile({ connectionsOnly = false }: { connectionsOnly?: boolean }) {
  useSceneMode("calendar");
  const { data: me } = useData(getMe, "me");
  const { data: shows } = useData(getMyShows, "my-shows");
  const going = shows?.filter((s) => s.user.going).length ?? 0;
  const saved = shows?.filter((s) => s.user.saved).length ?? 0;

  return (
    <div className="relative px-4 pt-24 pb-32 sm:px-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-gradient-to-b from-house/75 via-house/50 to-house/85" />
      <div className="relative mx-auto max-w-4xl">
        {connectionsOnly ? (
          <>
            <Link href="/profile" className="label text-dim hover:text-white">
              ← Profile
            </Link>
            <h1 className="display mt-2 mb-8 text-display text-white">Connections</h1>
          </>
        ) : (
          <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-stage to-haze-2 text-3xl font-bold text-white ring-2 ring-white/15">{me?.initials ?? "··"}</div>
            <div className="flex-1">
              <p className="label text-lilac">{me ? `${me.city} · member since ${new Date(me.memberSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : "Loading"}</p>
              <h1 className="display mt-1 text-display text-white">{me?.name ?? "—"}</h1>
              <p className="text-dim">{me?.email}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="panel px-5 py-3 text-center">
                <dt className="label text-dim">Going</dt>
                <dd className="display text-4xl text-white">{going}</dd>
              </div>
              <div className="panel px-5 py-3 text-center">
                <dt className="label text-dim">Saved</dt>
                <dd className="display text-4xl text-white">{saved}</dd>
              </div>
            </dl>
          </header>
        )}
        <ConnectionsPanel />
        {!connectionsOnly && (
          <section className="mt-12 space-y-3" aria-labelledby="prefs-h">
            <h2 id="prefs-h" className="label text-lilac">
              Alert preferences
            </h2>
            {[
              ["New show announced", "Any artist you follow, anywhere in India"],
              ["Early bird opens", "The cheapest tier — usually gone in hours"],
              ["Travel-worthy shows", "Outside Bengaluru, only for artists you play a lot"],
            ].map(([t, d]) => (
              <label key={t} className="panel flex cursor-pointer items-center justify-between gap-4 p-4">
                <span>
                  <span className="block font-semibold text-white">{t}</span>
                  <span className="text-sm text-dim">{d}</span>
                </span>
                <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#e0569f]" />
              </label>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
