export type TicketStatus = "rumour" | "announced" | "early_bird" | "live" | "sold_out";
export type Source = "bookmyshow" | "district" | "insider" | "skillboxes" | "instagram" | "venue_site";
export type CrawlerName = "TICKETS" | "SOCIALS" | "VENUES";

export interface Artist {
  slug: string;
  name: string;
  genres: string[];
  image: string;
  spotifyPlays30d: number;
  followed: boolean;
  /** Duotone pair used by placeholders, the LED wall and ticket stubs. */
  hue: [string, string];
  /** Offline fallback when the remote photo can't load. */
  fallbackImage: string;
  /** Attribution for the photo (mock photos are Wikimedia Commons, mostly CC BY-SA). */
  imageCredit?: { author: string; license: string; url: string };
}

export interface TicketTier {
  name: string;
  priceINR: number;
  status: "upcoming" | "live" | "sold_out";
  soldPct?: number;
  closesAt?: string;
}

export interface ShowUserFlags {
  going: boolean;
  saved: boolean;
  inCalendar: boolean;
  dismissed: boolean;
}

export interface Show {
  id: string;
  artistSlug: string;
  title: string;
  venue: string;
  city: string;
  lat: number;
  lng: number;
  date: string;
  doors: string;
  start: string;
  status: TicketStatus;
  tiers: TicketTier[];
  ticketUrl?: string;
  foundBy: { crawler: CrawlerName; source: Source; at: string }[];
  travelNote?: string;
  isFestival?: boolean;
  user: ShowUserFlags;
}

export interface MerchItem {
  id: string;
  artistSlug: string;
  name: string;
  priceINR: number;
  image: string;
  sizes?: string[];
  stock: number;
  kind: "tee" | "tote" | "poster" | "vinyl";
}

export interface Connection {
  id: "spotify" | "telegram" | "gcal";
  connected: boolean;
  detail?: string;
  paused?: boolean;
}

export interface Me {
  name: string;
  firstName: string;
  email: string;
  city: string;
  initials: string;
  memberSince: string;
}

export interface CrawlerStatus {
  name: CrawlerName;
  label: string;
  lastRunAt: string;
  sourcesChecked: number;
}

/** A show joined with its artist: what nearly every card needs. */
export interface ShowWithArtist extends Show {
  artist: Artist;
}

export interface RadarData {
  city: string;
  shows: ShowWithArtist[];
  crawlers: CrawlerStatus[];
}
