"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onFrame, scrollState } from "@/lib/scroll";
import { clamp } from "@/lib/math";
import { useSceneMode, venue } from "@/lib/venueMode";
import { CountUp } from "../ui/CountUp";

const STATS = [
  { n: 228, label: "shows tracked", sub: "across 9 cities this season" },
  { n: 181, label: "indie artists", sub: "matched from Spotify follows" },
  { n: 72, label: "early-bird alerts sent", sub: "before the tier closed" },
];

const STEPS = [
  { k: "01", t: "Connect Spotify", d: "We read the artists you follow and the ones you play on repeat." },
  { k: "02", t: "Three crawlers go out", d: "Ticketing platforms, artist socials and venue listings, every few minutes." },
  { k: "03", t: "Telegram pings you", d: "The second a date drops — and again when early bird opens." },
];

export function Landing() {
  useSceneMode("lobby");
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  // Scrolling the landing walks the camera 0 → 40% of the way to the stage.
  useEffect(
    () =>
      onFrame(() => {
        if (venue.mode === "lobby") venue.progress = clamp(scrollState.y / Math.max(1, scrollState.limit));
      }),
    [],
  );

  const google = () => {
    setConnecting(true);
    // BACKEND: next-auth Google sign-in. Mock: a 900ms handshake.
    setTimeout(() => router.push("/onboarding"), 900);
  };

  return (
    <div className="relative">
      {/* Keep text readable over the lit stage. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(90%_70%_at_50%_40%,transparent,rgb(7_5_11/0.75))]" />

      <section className="relative flex min-h-svh flex-col justify-end px-4 pb-28 sm:px-8 md:justify-center md:pb-0">
        <div className="mx-auto w-full max-w-6xl">
          <p className="label mb-6 text-lilac/90 opacity-0 animate-[fadein_0.8s_ease_1.4s_forwards]">India · Live shows · Alerts</p>
          <h1 className="relative inline-block text-mega display" aria-label="FrontRow">
            {/* The beam reveal: letters are masked by a sweeping edge for 1.6s, then fully lit. */}
            <span className="beam-reveal block">
              <span className="block text-white">Front</span>
              <span className="block text-lilac">Row</span>
            </span>
            <span aria-hidden className="beam-sweep pointer-events-none absolute inset-y-[-10%] left-0 w-[30%]" />
          </h1>
          <p className="mt-8 max-w-xl text-lead text-smoke opacity-0 animate-[fadein_0.8s_ease_1.9s_forwards]">
            Be the first to know about a show. Tell us the artists you love and FrontRow messages you the moment one of them
            announces a date in India.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 opacity-0 animate-[fadein_0.8s_ease_2.1s_forwards]">
            <button type="button" onClick={google} disabled={connecting} className="btn btn-primary relative overflow-hidden !px-6 !py-3.5 !opacity-100">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              {connecting ? "Connecting…" : "Continue with Google"}
              {connecting && <span aria-hidden className="absolute inset-0 animate-[shimmer_0.9s_linear_infinite] bg-[linear-gradient(100deg,transparent,rgba(224,86,159,0.35),transparent)]" />}
            </button>
            <Link href="/radar" className="btn btn-ghost !px-6 !py-3.5">
              See a live demo →
            </Link>
          </div>
        </div>
        <p aria-hidden className="label absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-dim md:block">
          <span className="inline-block animate-bob">↓</span> Walk in
        </p>
      </section>

      <section className="relative px-4 py-24 sm:px-8" aria-label="FrontRow in numbers">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="panel grain p-6">
              <p className="label text-dim">This season</p>
              <p className="display mt-3 text-7xl text-white">
                <CountUp to={s.n} />
              </p>
              <p className="mt-1 font-semibold text-smoke">{s.label}</p>
              <p className="text-sm text-dim">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative px-4 pb-32 sm:px-8" aria-labelledby="how">
        <div className="mx-auto max-w-6xl">
          <h2 id="how" className="display text-display text-white">
            Indie shows get lost.
            <br />
            <span className="text-lilac">Not on our watch.</span>
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.k} className="panel grain p-6">
                <span className="font-mono text-sm text-stage">{s.k}</span>
                <h3 className="display mt-2 text-3xl text-white">{s.t}</h3>
                <p className="mt-2 text-smoke">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap items-center gap-3">
            <button type="button" onClick={google} className="btn btn-primary !px-6 !py-3.5">
              Get your wristband
            </button>
            <Link href="/radar" className="btn btn-ghost !px-6 !py-3.5">
              See a live demo →
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes shimmer { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
        .beam-reveal {
          -webkit-mask-image: linear-gradient(100deg, #000 40%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0) 60%);
          mask-image: linear-gradient(100deg, #000 40%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0) 60%);
          -webkit-mask-size: 300% 100%; mask-size: 300% 100%;
          -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
          animation: beamReveal 1.6s cubic-bezier(.5,.1,.3,1) 0.5s both;
        }
        @keyframes beamReveal { from { -webkit-mask-position: 100% 0; mask-position: 100% 0 } to { -webkit-mask-position: 0% 0; mask-position: 0% 0 } }
        .beam-sweep {
          background: linear-gradient(100deg, transparent, rgba(255,240,250,0.0) 30%, rgba(255,230,245,0.55) 50%, rgba(255,240,250,0) 70%, transparent);
          mix-blend-mode: overlay;
          filter: blur(6px);
          opacity: 0;
          animation: beamSweep 1.6s cubic-bezier(.5,.1,.3,1) 0.5s both;
        }
        @keyframes beamSweep { 0% { transform: translateX(-60%); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateX(360%); opacity: 0 } }
      `}</style>
    </div>
  );
}
