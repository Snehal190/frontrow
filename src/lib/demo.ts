// Presenter controls. Every beat of the pitch is one key away:
// N new show · E early bird · T telegram · L lights down · S sound · R reset · ` panel
"use client";
import { getRadar, resetAll, setShowStatus, simulateDiscovery } from "@/data/api";
import { toggleSound } from "./audio";
import { telegram, toast } from "./notify";
import { flashBeam, triggerDrop, venue } from "./venueMode";
import { scrollTo } from "./scroll";
import { formatINR } from "./math";

export const TELEGRAM_TEST =
  "🎟 Early bird is LIVE for Saanjh Collective — Zee Studios, Jaipur. ₹1,499. Closes in 2 days.";

export function demoAllowed() {
  if (process.env.NODE_ENV !== "production") return true;
  try {
    return new URL(window.location.href).searchParams.get("demo") === "1" || sessionStorage.getItem("frontrow.demo") === "1";
  } catch {
    return false;
  }
}

export function demoNewShow() {
  const s = simulateDiscovery();
  if (!s) return;
  flashBeam();
  const where = `${s.venue.split(",")[0]}, ${s.city}`;
  telegram(`📡 ${s.foundBy[0].crawler} crawler found a new show: ${s.artist.name} — ${where}.`);
}

/** Flip the featured (first on-sale or nearest) show to EARLY BIRD LIVE. */
export async function demoEarlyBird() {
  const radar = await getRadar();
  const featured =
    radar.shows.find((s) => s.status === "live") ?? radar.shows.find((s) => s.status !== "early_bird") ?? radar.shows[0];
  if (!featured) return;
  const s = setShowStatus(featured.id, "early_bird");
  if (!s) return;
  flashBeam();
  const eb = s.tiers.find((t) => t.status === "live");
  telegram(
    `🎟 Early bird is LIVE for ${s.artist.name} — ${s.venue.split(",")[0]}, ${s.city}. ${eb ? formatINR(eb.priceINR) : ""}. Closes in 2 days.`,
  );
  toast(`${s.artist.name} → Early bird live`, "early");
}

export function demoTelegram() {
  telegram(TELEGRAM_TEST);
}

export function demoLightsDown() {
  if (venue.mode === "venue") {
    const el = document.querySelector("[data-venue-pin]") as HTMLElement | null;
    if (el) {
      // p = 0.5 is the drop; jump there.
      const top = el.getBoundingClientRect().top + window.scrollY;
      scrollTo(top + (el.offsetHeight - window.innerHeight) * 0.52, { duration: 1.2 });
    }
  }
  triggerDrop();
}

export function demoSound() {
  void toggleSound();
}

export function demoReset() {
  resetAll();
  try {
    localStorage.removeItem("frontrow.bag.v1");
  } catch {}
  window.dispatchEvent(new Event("frontrow:reset"));
  toast("Demo state reset");
}
