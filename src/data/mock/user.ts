import type { Connection, CrawlerStatus, Me } from "../types";

export const ME: Me = {
  name: "Ira Menon",
  firstName: "Ira",
  email: "ira@example.com",
  city: "Bengaluru",
  initials: "IM",
  memberSince: "2026-08-14",
};

export const CONNECTIONS: Connection[] = [
  { id: "telegram", connected: true, detail: "@ira_listens · alerts on" },
  { id: "spotify", connected: true, detail: "34 followed · 61 on repeat" },
  { id: "gcal", connected: false, detail: "Add shows you mark as Going" },
];

export function buildCrawlers(now: number): CrawlerStatus[] {
  return [
    { name: "TICKETS", label: "Ticketing platforms", lastRunAt: new Date(now - 14_000).toISOString(), sourcesChecked: 1284 },
    { name: "SOCIALS", label: "Artist Instagram / X", lastRunAt: new Date(now - 41_000).toISOString(), sourcesChecked: 362 },
    { name: "VENUES", label: "Venue & festival listings", lastRunAt: new Date(now - 3 * 60_000).toISOString(), sourcesChecked: 518 },
  ];
}

/** Spotify "pull" during onboarding: followed vs on-repeat counts. */
export const SPOTIFY_SUMMARY = { followed: 34, onRepeat: 61 };
