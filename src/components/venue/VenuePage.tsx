"use client";
// ENTER THE VENUE. A 320svh pinned section drives the 3D camera from the back
// of the room through the crowd to the barricade, where the band drops and the
// tickets slide in and stay. The DOM HUD, title and ticket panel are
// choreographed off the same progress.
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getRadar, getShow, type ShowWithArtist } from "@/data/api";
import { range } from "@/lib/math";
import { onFrame, scrollState } from "@/lib/scroll";
import { dateTile } from "@/lib/status";
import { useMounted } from "@/lib/useMounted";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { finishEnter, popWash, pushWash, setArtist, startEnter, useSceneMode, venue } from "@/lib/venueMode";
import { rig } from "@/three/rig";
import { ShowCard } from "../cards/ShowCard";
import { Rail } from "../radar/Rail";
import { useData } from "../useData";
import { EnterTransition } from "./EnterTransition";
import { Hud } from "./Hud";
import { TicketActions, TicketPanel, TierTable } from "./TicketPanel";

const NAME_REVEAL_MS = 1600; // the spotlight hits centre stage at ~1.6s

function SlamName({ name, animate }: { name: string; animate: boolean }) {
  let i = 0;
  return (
    <h1 className="display text-[clamp(3.25rem,10vw,10.5rem)] leading-[0.84] text-white [text-shadow:0_0_60px_rgb(var(--stage-rgb)/0.45)]" aria-label={name}>
      {name.split(" ").map((word, w) => (
        <span key={w} className="mr-[0.18em] inline-block overflow-hidden whitespace-nowrap pt-[0.06em] last:mr-0" aria-hidden>
          {[...word].map((ch) => {
            const k = i++;
            return (
              <motion.span
                key={k}
                className="inline-block"
                initial={animate ? { y: "-115%", opacity: 0 } : false}
                animate={{ y: "0%", opacity: 1 }}
                // Firm spring with a barely-there overshoot, letters staggered 40ms.
                transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.9, delay: k * 0.04 }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id={id} className="display text-[clamp(2rem,4vw,3.25rem)] leading-none text-white">
          {title}
        </h2>
        {kicker && <span className="label text-dim">{kicker}</span>}
      </div>
      {children}
    </section>
  );
}

export function VenuePage({ id }: { id: string }) {
  useSceneMode("venue");
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const { data: res } = useData(() => getShow(id).then((s) => ({ s })), `show:${id}`);
  const show = res?.s ?? null;
  const notFound = res !== null && !res.s;
  const { data: radar } = useData(getRadar, "radar");
  const [phase, setPhase] = useState<"intro" | "show">("intro");
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const pin = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  // The enter sequence: house lights down, phones on, spot hits, name slams.
  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startEnter();
    if (isReduced) venue.enterAt = performance.now() - 5000; // straight to the lit frame
    const t = setTimeout(
      () => {
        setPhase("show");
        finishEnter();
      },
      isReduced ? 0 : NAME_REVEAL_MS,
    );
    return () => clearTimeout(t);
  }, [id]);

  // Hand the venue this artist (LED wall) and the status wash.
  const slug = show?.artist.slug;
  const status = show?.status;
  useEffect(() => {
    if (!show) return;
    setArtist({ slug: show.artist.slug, name: show.artist.name, image: show.artist.image, fallbackImage: show.artist.fallbackImage, hue: show.artist.hue });
    pushWash("show", show.status);
    return () => {
      popWash("show");
      setArtist(null);
    };
    // Re-run only when the artist or status changes, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, status]);

  const skip = () => {
    if (phaseRef.current !== "intro") return;
    phaseRef.current = "show";
    venue.enterAt = performance.now() - 2800;
    setPhase("show");
    finishEnter();
  };

  // Per-frame choreography off the pinned section's progress. Direct style writes only.
  useEffect(() => {
    let lastLit = -1;
    return onFrame(() => {
      const el = pin.current;
      if (!el) return;
      const isReduced = venue.reducedMotion;
      const p = isReduced ? 0.5 : scrollState.progressFor(el);
      venue.progress = p;
      const ui = phaseRef.current === "show";
      if (title.current) {
        const out = isReduced ? 0 : range(p, 0.3, 0.42);
        title.current.style.opacity = String(ui ? 1 - out : 0);
        title.current.style.transform = `translateY(${-out * 60}px)`;
      }
      if (hud.current) hud.current.style.opacity = String(ui ? 1 : 0);
      if (meter.current) {
        const lit = Math.round(rig.energy * 12);
        if (lit !== lastLit) {
          lastLit = lit;
          meter.current.setAttribute("aria-valuenow", String(lit));
          Array.from(meter.current.children).forEach((bar, i) => {
            (bar as HTMLElement).style.background = i < lit ? (i >= 9 ? "#ff4d5e" : "rgb(var(--stage-rgb))") : "rgb(255 255 255 / 0.15)";
          });
        }
      }
      const cue = hud.current?.querySelector<HTMLElement>("[data-scroll-cue]");
      if (cue) cue.style.opacity = String(1 - range(p, 0.02, 0.08));
      if (panel.current) {
        // Slides in as you reach the barricade and stays: this is where the walk ends.
        const t = isReduced ? 1 : range(p, 0.46, 0.56);
        panel.current.style.opacity = String(ui ? t : 0);
        panel.current.style.transform = `translateX(${(1 - t) * 110}%)`;
        panel.current.style.pointerEvents = t > 0.5 && ui ? "auto" : "none";
        panel.current.inert = !(t > 0.5 && ui);
      }
    });
  }, []);

  const d = show ? dateTile(show.date) : null;
  const nearby: ShowWithArtist[] = show && radar
    ? radar.shows
        .filter((s) => s.artistSlug !== show.artistSlug)
        .sort((a, b) => Number(b.city === show.city) - Number(a.city === show.city) || Number(b.artist.genres.some((g) => show.artist.genres.includes(g))) - Number(a.artist.genres.some((g) => show.artist.genres.includes(g))))
        .slice(0, 8)
    : [];

  return (
    <div className="relative">
      {mounted && <EnterTransition showId={id} />}
      {phase === "intro" && (
        <button type="button" onClick={skip} className="fixed inset-0 z-20 cursor-default" aria-label="Skip the intro">
          <span className="label absolute right-5 bottom-24 rounded-full bg-black/40 px-3 py-1.5 text-dim ring-1 ring-white/10 md:bottom-6">Skip ⏭</span>
        </button>
      )}

      <section ref={pin} data-venue-pin className="relative" style={{ height: reduced ? "100svh" : "320svh" }} aria-label="The show">
        <div className="sticky top-0 h-svh overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-house/85 via-house/30 to-transparent" />
          {show && (
            <>
              <div ref={title} className="absolute inset-x-0 bottom-[27%] px-4 opacity-0 sm:px-8 md:bottom-[14%]">
                <div className="mx-auto max-w-7xl">
                  <p className="label mb-3 text-lilac">
                    {show.title ? `${show.title} · ` : ""}Live in {show.city} · {d?.long}
                  </p>
                  {phase === "show" && <SlamName name={show.artist.name} animate={!reduced} />}
                </div>
              </div>
              <Hud ref={hud} show={show} meterRef={(el) => void (meter.current = el)} reduced={reduced} />
              <div ref={panel} className="absolute inset-x-3 bottom-20 max-h-[62svh] overflow-y-auto opacity-0 md:inset-x-auto md:right-6 md:bottom-auto md:top-1/2 md:max-h-none md:-translate-y-1/2 md:overflow-visible" style={{ transform: "translateX(110%)" }}>
                <TicketPanel show={show} />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Below the pin: normal page, venue still dimly alive behind. */}
      <div className="relative bg-gradient-to-b from-house/40 via-house/80 to-house/90 pb-28">
        {!show ? (
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            {notFound ? (
              <div className="panel p-8">
                <p className="display text-4xl text-white">This show left the building</p>
                <p className="mt-2 text-dim">It may have been cancelled or the link is wrong.</p>
                <Link href="/radar" className="btn btn-primary mt-5">
                  Back to your radar
                </Link>
              </div>
            ) : (
              <div className="panel h-64 animate-pulse" />
            )}
          </div>
        ) : (
          <>
            <Section id="tickets-h" title="Tickets" kicker={`${show.venue} · ${d?.long} · Doors ${show.doors}`}>
              <div className="panel grain grid gap-8 p-5 sm:p-8 md:grid-cols-[1.4fr_1fr]">
                <TierTable show={show} large />
                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <p className="label text-dim">Show starts</p>
                    <p className="display text-6xl text-white">{show.start}</p>
                    <p className="text-smoke">
                      {show.venue}, {show.city}
                    </p>
                  </div>
                  <TicketActions show={show} />
                </div>
              </div>
            </Section>

            {nearby.length > 0 && (
              <Section id="near-h" title="Also playing near you" kicker="Similar artists">
                <Rail label="Also playing near you">
                  {nearby.map((s) => (
                    <ShowCard key={s.id} show={s} variant="rail" />
                  ))}
                </Rail>
              </Section>
            )}

            <div className="mx-auto max-w-6xl px-4 sm:px-8">
              <p className="label border-t border-white/10 pt-6 text-dim">
                Why you&apos;re seeing this ·{" "}
                <span className="text-smoke normal-case tracking-normal">
                  You&apos;ve played {show.artist.name} {show.artist.spotifyPlays30d} times this month on Spotify
                  {show.artist.followed ? ", and you follow them." : "."}
                </span>
              </p>
              {show.artist.imageCredit && (
                <p className="mt-2 text-xs text-dim">
                  Stand-in photo:{" "}
                  <a href={show.artist.imageCredit.url} target="_blank" rel="noreferrer" className="underline hover:text-smoke">
                    {show.artist.imageCredit.author} / Wikimedia Commons
                  </a>{" "}
                  · {show.artist.imageCredit.license}
                </p>
              )}
              <p className="mt-1 text-xs text-dim">Band: Microsoft Rocketbox avatars (MIT)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
