// The one door between components and data. Every function here returns mocks
// after a fake 250–600ms latency; each `BACKEND:` note is the endpoint it will
// call once the real API lands. Components import from this file only.
import { ARTISTS } from "./mock/artists";
import { MERCH } from "./mock/merch";
import { DISCOVERY_POOL, buildShows, seedToShow } from "./mock/shows";
import { CONNECTIONS, ME, SPOTIFY_SUMMARY, buildCrawlers } from "./mock/user";
import type {
  Artist,
  Connection,
  CrawlerStatus,
  Me,
  MerchItem,
  RadarData,
  Show,
  ShowUserFlags,
  ShowWithArtist,
  TicketStatus,
} from "./types";

export type * from "./types";

const FLAGS_KEY = "frontrow.flags.v1";
const CONN_KEY = "frontrow.connections.v1";

interface Db {
  shows: Show[];
  connections: Connection[];
  crawlers: CrawlerStatus[];
  discovered: number;
}

let db: Db | null = null;
const listeners = new Set<() => void>();
let version = 0;

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: state just won't persist */
  }
}

function getDb(): Db {
  if (db) return db;
  const now = Date.now();
  const shows = buildShows(now);
  const savedFlags = typeof window !== "undefined" ? readJSON<Record<string, ShowUserFlags>>(FLAGS_KEY) : null;
  if (savedFlags) for (const s of shows) if (savedFlags[s.id]) s.user = savedFlags[s.id];
  const savedConn = typeof window !== "undefined" ? readJSON<Connection[]>(CONN_KEY) : null;
  db = {
    shows,
    connections: savedConn ?? CONNECTIONS.map((c) => ({ ...c })),
    crawlers: buildCrawlers(now),
    discovered: 0,
  };
  return db;
}

function emit() {
  version++;
  if (db) {
    writeJSON(FLAGS_KEY, Object.fromEntries(db.shows.map((s) => [s.id, s.user])));
    writeJSON(CONN_KEY, db.connections);
  }
  listeners.forEach((l) => l());
}

/** Re-fetch hint: fires whenever mock state changes (flags, discoveries, demo). */
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export const getVersion = () => version;

const latency = () => new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
const clone = <T,>(v: T): T => structuredClone(v);
const artistBySlug = (slug: string) => ARTISTS.find((a) => a.slug === slug)!;
const withArtist = (s: Show): ShowWithArtist => ({ ...clone(s), artist: clone(artistBySlug(s.artistSlug)) });
const upcoming = (s: Show) => new Date(s.date).getTime() > Date.now() - 6 * 3_600_000;

// BACKEND: GET /api/me
export async function getMe(): Promise<Me> {
  await latency();
  return clone(ME);
}

// BACKEND: GET /api/radar?city=… (crawled shows matched against the user's Spotify artists)
export async function getRadar(): Promise<RadarData> {
  await latency();
  const d = getDb();
  return {
    city: ME.city,
    shows: d.shows.filter((s) => upcoming(s) && !s.user.dismissed).map(withArtist),
    crawlers: clone(d.crawlers),
  };
}

// BACKEND: GET /api/me/shows (going, saved, past — includes dismissed=false history)
export async function getMyShows(): Promise<ShowWithArtist[]> {
  await latency();
  return getDb().shows.map(withArtist);
}

// BACKEND: GET /api/shows/:id
export async function getShow(id: string): Promise<ShowWithArtist | null> {
  await latency();
  const s = getDb().shows.find((x) => x.id === id);
  return s ? withArtist(s) : null;
}

// BACKEND: GET /api/artists/:slug (with their upcoming shows)
export async function getArtist(slug: string): Promise<(Artist & { shows: ShowWithArtist[] }) | null> {
  await latency();
  const a = ARTISTS.find((x) => x.slug === slug);
  if (!a) return null;
  return { ...clone(a), shows: getDb().shows.filter((s) => s.artistSlug === slug && upcoming(s)).map(withArtist) };
}

// BACKEND: GET /api/artists/:slug/merch
export async function getMerch(artistSlug: string): Promise<MerchItem[]> {
  await latency();
  return clone(MERCH.filter((m) => m.artistSlug === artistSlug));
}

// BACKEND: GET /api/artists (from the user's Spotify follows + top tracks)
export async function getSpotifyArtists(): Promise<{ artists: Artist[]; followed: number; onRepeat: number }> {
  await latency();
  return { artists: clone(ARTISTS), ...SPOTIFY_SUMMARY };
}

// BACKEND: GET /api/connections
export async function getConnections(): Promise<Connection[]> {
  await latency();
  return clone(getDb().connections);
}

// BACKEND: POST /api/connections/:id { connected } (OAuth handshake for spotify/gcal, bot link for telegram)
export async function toggleConnection(id: Connection["id"], patch: Partial<Connection>): Promise<Connection> {
  await latency();
  const c = getDb().connections.find((x) => x.id === id)!;
  Object.assign(c, patch);
  if (id === "gcal" && patch.connected !== undefined)
    c.detail = patch.connected ? "Primary calendar · adds Going shows" : "Add shows you mark as Going";
  emit();
  return clone(c);
}

// BACKEND: PATCH /api/shows/:id/flags { going?, saved?, inCalendar?, dismissed? }
export async function setShowFlag(id: string, flag: keyof ShowUserFlags, value: boolean): Promise<Show> {
  const s = getDb().shows.find((x) => x.id === id)!;
  // Optimistic: update before the fake round trip so buttons feel instant.
  s.user[flag] = value;
  emit();
  await latency();
  return clone(s);
}

// BACKEND: POST /api/telegram/test
export async function sendTestAlert(): Promise<void> {
  await latency();
}

// BACKEND: POST /api/orders (merch)
export async function placeOrder(lines: { id: string; qty: number; size?: string }[]): Promise<{ orderId: string }> {
  await latency();
  await latency();
  return { orderId: `FR-${(Date.now() % 1_000_000).toString(36).toUpperCase()}-${lines.length}` };
}

// ---------------------------------------------------------------------------
// Demo hooks. In production these events arrive over a websocket/SSE stream
// from the crawlers (BACKEND: GET /api/events). The demo panel fires them.

/** A crawler "finds" a show. Returns the new show, or null when the pool is empty. */
export function simulateDiscovery(): ShowWithArtist | null {
  const d = getDb();
  const seed = DISCOVERY_POOL[d.discovered % DISCOVERY_POOL.length];
  const round = Math.floor(d.discovered / DISCOVERY_POOL.length);
  d.discovered++;
  const show = seedToShow(seed, Date.now(), 40 + d.discovered);
  if (round > 0) show.id = `${show.id}-${round}`;
  d.shows.unshift(show);
  const crawler = d.crawlers.find((c) => c.name === show.foundBy[0].crawler)!;
  crawler.lastRunAt = new Date().toISOString();
  crawler.sourcesChecked += 3 + (d.discovered % 9);
  emit();
  return withArtist(show);
}

/** Crawler heartbeat: bump counters so the strip feels alive. */
export function crawlerTick() {
  const d = getDb();
  const c = d.crawlers[Math.floor(Math.random() * d.crawlers.length)];
  c.lastRunAt = new Date().toISOString();
  c.sourcesChecked += 1 + Math.floor(Math.random() * 6);
  emit();
}

/** Flip a show's ticket status (demo key E flips the featured show to early bird). */
export function setShowStatus(id: string, status: TicketStatus): ShowWithArtist | null {
  const d = getDb();
  const s = d.shows.find((x) => x.id === id);
  if (!s) return null;
  const fresh = seedToShow(
    [s.id, s.artistSlug, s.venue, s.city, 0, status, 1299, [["TICKETS", "district", 0]]],
    Date.now(),
    3,
  );
  s.status = status;
  s.tiers = fresh.tiers;
  s.foundBy = [...fresh.foundBy, ...s.foundBy];
  emit();
  return withArtist(s);
}

export function resetAll() {
  try {
    localStorage.removeItem(FLAGS_KEY);
    localStorage.removeItem(CONN_KEY);
  } catch {}
  db = null;
  getDb();
  emit();
}
