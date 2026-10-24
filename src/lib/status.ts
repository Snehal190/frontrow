import type { TicketStatus } from "@/data/types";

export const STATUS_META: Record<TicketStatus, { label: string; short: string; color: string; rgb: string; text: string }> = {
  rumour: { label: "Rumour", short: "RUMOUR", color: "var(--color-rumour)", rgb: "124 140 255", text: "#0b0d2a" },
  announced: { label: "Announced", short: "ANNOUNCED", color: "var(--color-announced)", rgb: "242 165 74", text: "#2a1606" },
  early_bird: { label: "Early bird live", short: "EARLY BIRD LIVE", color: "var(--color-early)", rgb: "255 181 71", text: "#2a1606" },
  live: { label: "Tickets live", short: "TICKETS LIVE", color: "var(--color-live)", rgb: "255 77 94", text: "#2a0509" },
  sold_out: { label: "Sold out", short: "SOLD OUT", color: "var(--color-sold)", rgb: "107 97 120", text: "#f1ecf6" },
};

export const SOURCE_LABEL: Record<string, string> = {
  bookmyshow: "BookMyShow",
  district: "District",
  insider: "Insider",
  skillboxes: "Skillboxes",
  instagram: "IG",
  venue_site: "Venue site",
};

export function dateTile(iso: string) {
  const d = new Date(iso);
  return {
    dow: d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
    day: d.getDate(),
    mon: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    long: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }).toUpperCase(),
    month: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase(),
  };
}

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
