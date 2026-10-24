"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getRadar, getSpotifyArtists, toggleConnection, type Artist, type RadarData } from "@/data/api";
import { useSceneMode } from "@/lib/venueMode";
import { CrawlerReveal } from "../radar/CrawlerReveal";
import { CountUp } from "../ui/CountUp";
import { TelegramBubble } from "../ui/TelegramToast";

const STEPS = ["Spotify", "Telegram", "Calendar"] as const;

function Wristband({ done }: { done: number }) {
  return (
    <div className="fixed top-20 right-4 z-30 hidden w-56 sm:block" aria-label={`Wristband: ${done} of 3 stamps`}>
      <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-stage/80 via-lilac/70 to-stage/80 px-4 py-2 shadow-[0_8px_30px_-8px_rgb(var(--stage-rgb)/0.8)]">
        <div className="label flex items-center justify-between !text-[0.6rem] text-house">
          <span className="font-bold">FRONTROW · ALL ACCESS</span>
          <span>{done}/3</span>
        </div>
        <div className="mt-1 flex gap-1.5">
          {STEPS.map((s, i) => (
            <AnimatePresence key={s}>
              {i < done ? (
                <motion.span
                  initial={{ scale: 2.4, opacity: 0, rotate: -25 }}
                  animate={{ scale: 1, opacity: 1, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="label rounded-sm border border-house/70 px-1 !text-[0.55rem] font-bold text-house"
                >
                  {s} ✓
                </motion.span>
              ) : (
                <span className="label rounded-sm border border-dashed border-house/30 px-1 !text-[0.55rem] text-house/40">{s}</span>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpotifyStep({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<"idle" | "pulling" | "done">("idle");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [summary, setSummary] = useState({ followed: 0, onRepeat: 0 });
  const [off, setOff] = useState<Set<string>>(new Set());

  const connect = async () => {
    setState("pulling");
    const r = await getSpotifyArtists();
    setArtists(r.artists);
    setSummary({ followed: r.followed, onRepeat: r.onRepeat });
    // Chips take ~0.12s each to fly out; mark done once the last lands.
    setTimeout(() => setState("done"), r.artists.length * 120 + 600);
  };

  return (
    <div>
      <h2 className="display text-display text-white">Bring your artists</h2>
      <p className="mt-3 max-w-lg text-lead text-smoke">We read who you follow and who you play on repeat. That&apos;s your radar.</p>
      <div className="mt-8 flex flex-col items-start gap-6 md:flex-row md:items-center">
        <button
          type="button"
          onClick={connect}
          disabled={state !== "idle"}
          className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black shadow-[0_0_60px_-10px_#1ed760] transition hover:scale-105 disabled:opacity-100"
          aria-label="Connect Spotify"
        >
          <svg viewBox="0 0 24 24" width="54" height="54" aria-hidden>
            <path
              fill="currentColor"
              d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.6-1.2a.75.75 0 1 1-.3-1.5c4.6-1 8.6-.6 11.7 1.4.4.2.5.7.2 1zm1.5-3.3a.9.9 0 0 1-1.3.3c-3.2-2-8.1-2.6-11.9-1.4a.9.9 0 1 1-.5-1.8c4.3-1.3 9.7-.7 13.4 1.6.4.3.6.9.3 1.3zm.1-3.4C15.3 8.4 8.9 8.2 5.2 9.3a1.1 1.1 0 1 1-.6-2.1c4.2-1.3 11.3-1 15.7 1.6a1.1 1.1 0 0 1-1.2 1.8z"
            />
          </svg>
          {state === "pulling" && <span aria-hidden className="absolute inset-[-6px] animate-ping rounded-full ring-2 ring-[#1ed760]/60" />}
        </button>
        <div aria-live="polite">
          {state === "idle" && <p className="text-smoke">Connect Spotify (read-only — we never post or play anything).</p>}
          {state !== "idle" && (
            <p className="label text-white">
              Pulling your artists… Found <CountUp to={summary.followed} duration={1200} /> artists you follow · <CountUp to={summary.onRepeat} duration={1400} /> you play on repeat
            </p>
          )}
        </div>
      </div>
      <ul className="mt-8 flex flex-wrap gap-2" aria-label="Artists to track (tap to deselect)">
        {artists.map((a, i) => {
          const on = !off.has(a.slug);
          return (
            <motion.li
              key={a.slug}
              initial={{ opacity: 0, x: -120, y: -60, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.7, delay: i * 0.12 }}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setOff((s) => {
                    const n = new Set(s);
                    if (n.has(a.slug)) n.delete(a.slug);
                    else n.add(a.slug);
                    return n;
                  })
                }
                className={`flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-semibold ring-1 transition ${on ? "bg-white/10 text-white ring-white/20" : "text-dim line-through ring-white/10"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.image} alt="" className={`h-7 w-7 rounded-full object-cover ${on ? "" : "opacity-40 grayscale"}`} />
                {a.name}
              </button>
            </motion.li>
          );
        })}
      </ul>
      {state === "done" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center gap-4">
          <button type="button" className="btn btn-primary !px-6 !py-3.5" onClick={onDone}>
            Track {artists.length - off.size} artists →
          </button>
          <span className="text-sm text-dim">Tap an artist to leave them out.</span>
        </motion.div>
      )}
    </div>
  );
}

function TelegramStep({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<"idle" | "linking" | "linked">("idle");
  const link = async () => {
    setState("linking");
    await toggleConnection("telegram", { connected: true, detail: "@you · alerts on" });
    setState("linked");
  };
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <h2 className="display text-display text-white">Get pinged first</h2>
        <p className="mt-3 max-w-lg text-lead text-smoke">Alerts land in Telegram the second a show drops — and again when early bird opens.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary !px-6 !py-3.5" onClick={state === "linked" ? onDone : link} disabled={state === "linking"}>
            {state === "idle" ? "Link @FrontRowShowBot" : state === "linking" ? "Waiting for /start…" : "Linked ✓ · Continue →"}
          </button>
          {state === "idle" && (
            <button type="button" className="btn btn-ghost" onClick={onDone}>
              Skip for now
            </button>
          )}
        </div>
      </div>
      <div className="panel p-4" aria-label="Example alert">
        <p className="label mb-3 text-dim">What an alert looks like</p>
        <div className="space-y-3 rounded-xl bg-[#17212b] p-3">
          <TelegramBubble time="20:14" text="📡 New show: Saanjh Collective — Zee Studios, Jaipur. Sat 14 Nov. Announced 6 minutes ago on District." />
          <TelegramBubble time="20:15" text="🎟 Early bird is LIVE — ₹1,499. Closes in 2 days. Tap to book →" />
        </div>
      </div>
    </div>
  );
}

function CalendarStep({ onDone }: { onDone: () => void }) {
  const [on, setOn] = useState(true);
  const finish = async () => {
    if (on) await toggleConnection("gcal", { connected: true });
    onDone();
  };
  return (
    <div>
      <h2 className="display text-display text-white">Never double-book a gig</h2>
      <p className="mt-3 max-w-lg text-lead text-smoke">Optional. Untick it and everything else still works.</p>
      <label className="panel mt-8 flex max-w-lg cursor-pointer items-center justify-between gap-4 p-5">
        <span>
          <span className="block font-semibold text-white">Google Calendar</span>
          <span className="text-sm text-dim">Add shows I mark as Going</span>
        </span>
        <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span aria-hidden className="relative h-7 w-12 rounded-full bg-white/15 transition peer-checked:bg-stage peer-focus-visible:outline-2 peer-focus-visible:outline-stage">
          <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
        </span>
      </label>
      <button type="button" className="btn btn-primary mt-8 !px-6 !py-3.5" onClick={finish}>
        Send the crawlers out →
      </button>
    </div>
  );
}

export function Onboarding() {
  useSceneMode("lobby");
  const [step, setStep] = useState(0);
  const [radar, setRadar] = useState<RadarData | null>(null);

  useEffect(() => {
    if (step === 3) void getRadar().then(setRadar);
  }, [step]);

  return (
    <div className="relative min-h-svh px-4 pt-24 pb-32 sm:px-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-house/60" />
      <Wristband done={Math.min(step, 3)} />
      <div className="relative mx-auto max-w-5xl">
        {step < 3 && (
          <ol className="mb-12 flex items-center gap-2" aria-label="Setup steps">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2" aria-current={i === step ? "step" : undefined}>
                <span
                  className={`label grid h-8 w-8 place-items-center rounded-full ring-1 transition ${i < step ? "bg-stage text-house ring-stage" : i === step ? "text-white ring-white" : "text-dim ring-white/15"}`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={`label hidden sm:inline ${i === step ? "text-white" : "text-dim"}`}>{s}</span>
                {i < 2 && <span aria-hidden className={`mx-2 h-px w-8 sm:w-16 ${i < step ? "bg-stage" : "bg-white/15"}`} />}
              </li>
            ))}
          </ol>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
            {step === 0 && <SpotifyStep onDone={() => setStep(1)} />}
            {step === 1 && <TelegramStep onDone={() => setStep(2)} />}
            {step === 2 && <CalendarStep onDone={() => setStep(3)} />}
            {step === 3 && (
              <div className="flex flex-col items-center text-center">
                <p className="label text-lilac">You&apos;re on the list</p>
                <h2 className="display mt-2 text-display text-white">The crawlers are out.</h2>
                <p className="mt-3 max-w-xl text-smoke">TICKETS, SOCIALS and VENUES are sweeping every platform for your artists. Here&apos;s what they found already.</p>
                <div className="mt-8 w-full">{radar ? <CrawlerReveal shows={radar.shows} /> : <div className="mx-auto aspect-square w-80 animate-pulse rounded-full bg-white/5" />}</div>
                <Link href="/radar" className="btn btn-primary mt-8 !px-7 !py-4">
                  Take me to my radar →
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
