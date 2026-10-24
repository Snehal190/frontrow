import type { CrawlerName, Show, Source, TicketStatus, TicketTier } from "../types";

// All dates are relative to the moment the module loads, so countdowns and
// "found 14s ago" always look live during a demo, whatever the calendar says.
const DAY = 86_400_000;

export const CITIES: Record<string, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Goa: { lat: 15.4909, lng: 73.8278 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Shillong: { lat: 25.5788, lng: 91.8933 },
};

const PLATFORM_URL: Partial<Record<Source, string>> = {
  district: "https://www.district.in",
  insider: "https://insider.in",
  bookmyshow: "https://in.bookmyshow.com",
  skillboxes: "https://www.skillboxes.com",
};

function startOfDay(now: number, offsetDays: number, hour = 20, minute = 30) {
  const d = new Date(now + offsetDays * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function tiersFor(status: TicketStatus, base: number, now: number, seed: number): TicketTier[] {
  const p = (m: number) => Math.round((base * m) / 50) * 50 - 1;
  const closes = new Date(now + (1.6 + (seed % 4) * 0.9) * DAY + seed * 3_517_000).toISOString();
  switch (status) {
    case "rumour":
      return [];
    case "announced":
      return [
        { name: "Early bird", priceINR: p(0.75), status: "upcoming" },
        { name: "Phase 1", priceINR: p(1), status: "upcoming" },
        { name: "Phase 2", priceINR: p(1.3), status: "upcoming" },
      ];
    case "early_bird":
      return [
        { name: "Early bird", priceINR: p(0.75), status: "live", soldPct: 48 + ((seed * 7) % 40), closesAt: closes },
        { name: "Phase 1", priceINR: p(1), status: "upcoming" },
        { name: "Phase 2", priceINR: p(1.3), status: "upcoming" },
        { name: "VIP", priceINR: p(2.6), status: "upcoming" },
      ];
    case "live":
      return [
        { name: "Early bird", priceINR: p(0.75), status: "sold_out", soldPct: 100 },
        { name: "Phase 1", priceINR: p(1), status: "live", soldPct: 55 + ((seed * 5) % 35) },
        { name: "Phase 2", priceINR: p(1.3), status: "upcoming" },
        { name: "VIP", priceINR: p(2.6), status: "live", soldPct: 30 + ((seed * 3) % 50) },
      ];
    case "sold_out":
      return [
        { name: "Early bird", priceINR: p(0.75), status: "sold_out", soldPct: 100 },
        { name: "Phase 1", priceINR: p(1), status: "sold_out", soldPct: 100 },
        { name: "Phase 2", priceINR: p(1.3), status: "sold_out", soldPct: 100 },
      ];
  }
}

type Seed = [
  id: string,
  artistSlug: string,
  venue: string,
  city: string,
  dayOffset: number,
  status: TicketStatus,
  price: number,
  sources: [CrawlerName, Source, number][], // crawler, source, minutes ago
  extra?: { title?: string; festival?: boolean; travel?: string; doors?: string; start?: string },
];

const SEEDS: Seed[] = [
  // --- Bengaluru (home city of the demo user)
  ["s01", "saanjh-collective", "The Courtyard Room, Indiranagar", "Bengaluru", 6, "live", 1200, [["TICKETS", "district", 52], ["SOCIALS", "instagram", 140]]],
  ["s02", "neon-monsoon", "Loft 21, Koramangala", "Bengaluru", 13, "early_bird", 999, [["TICKETS", "insider", 18], ["SOCIALS", "instagram", 26]]],
  ["s03", "ruh-radio", "Echo Hall, Church Street", "Bengaluru", 34, "announced", 899, [["SOCIALS", "instagram", 300]]],
  ["s04", "khasi-skies", "Bangalore Open Air Grounds", "Bengaluru", 58, "live", 2499, [["VENUES", "venue_site", 900], ["TICKETS", "skillboxes", 600]], { title: "Hilltop Sessions Festival", festival: true, doors: "14:00", start: "15:30" }],
  // --- Mumbai
  ["s05", "laal-pari", "antiSOCIAL Hall, Lower Parel", "Mumbai", 9, "live", 1499, [["TICKETS", "district", 75]], { travel: "Mumbai · 1h flight" }],
  ["s06", "mehfil-machine", "The Pier, Bandra", "Mumbai", 21, "announced", 1299, [["SOCIALS", "instagram", 44]]],
  ["s07", "static-sitar", "Bay Stage, Worli", "Mumbai", 44, "early_bird", 1199, [["TICKETS", "bookmyshow", 33], ["VENUES", "venue_site", 210]]],
  ["s08", "kavya-tidelines", "Tidal Basin Fest Grounds", "Mumbai", 87, "announced", 3499, [["VENUES", "venue_site", 1440]], { title: "Tidal Basin Weekender", festival: true, doors: "13:00", start: "14:00" }],
  // --- Delhi
  ["s09", "kavya-tidelines", "Lotus Box, Hauz Khas", "Delhi", 11, "early_bird", 1099, [["TICKETS", "insider", 9], ["SOCIALS", "instagram", 12]], { travel: "Delhi · 2h40 flight" }],
  ["s10", "dhool", "Kiln Warehouse, Okhla", "Delhi", 27, "live", 999, [["TICKETS", "district", 130]]],
  ["s11", "the-chai-dialectic", "Studio Peepal, Saket", "Delhi", 70, "rumour", 0, [["SOCIALS", "instagram", 400]]],
  // --- Pune
  ["s12", "paper-kites-of-pune", "Ferris Hall, Koregaon Park", "Pune", 16, "sold_out", 899, [["TICKETS", "skillboxes", 2000]], { travel: "Pune · overnight bus" }],
  ["s13", "ruh-radio", "Monsoon Lab, Baner", "Pune", 63, "announced", 799, [["VENUES", "venue_site", 500]]],
  // --- Jaipur
  ["s14", "saanjh-collective", "Zee Studios, Jaipur", "Jaipur", 19, "early_bird", 1499, [["TICKETS", "district", 6], ["SOCIALS", "instagram", 8]], { travel: "Jaipur · worth the trip" }],
  ["s15", "mehfil-machine", "Amber Fort Grounds", "Jaipur", 96, "rumour", 0, [["SOCIALS", "instagram", 700]], { title: "Desert Frequencies", festival: true, travel: "Jaipur · worth the trip" }],
  // --- Goa
  ["s16", "neon-monsoon", "Hilltop Vagator", "Goa", 40, "live", 1799, [["TICKETS", "insider", 220]], { travel: "Goa · make a weekend of it", doors: "17:00", start: "18:30" }],
  ["s17", "baarish-bureau", "Cafe Mambo Room, Panjim", "Goa", 75, "announced", 999, [["VENUES", "venue_site", 1100]]],
  // --- Hyderabad
  ["s18", "laal-pari", "Aaromale, Jubilee Hills", "Hyderabad", 30, "announced", 1299, [["SOCIALS", "instagram", 95]]],
  ["s19", "static-sitar", "The Moonshine Project", "Hyderabad", 82, "live", 999, [["TICKETS", "bookmyshow", 180]]],
  // --- Chennai
  ["s20", "khasi-skies", "Backyard, Adyar", "Chennai", 24, "announced", 899, [["VENUES", "venue_site", 360]]],
  ["s21", "dhool", "Sabha Hall, Mylapore", "Chennai", 101, "announced", 799, [["SOCIALS", "instagram", 820]]],
  // --- Shillong
  ["s22", "khasi-skies", "Ward's Lake Amphitheatre", "Shillong", 50, "early_bird", 899, [["SOCIALS", "instagram", 15], ["TICKETS", "skillboxes", 22]], { travel: "Shillong · once-a-year trip" }],
  ["s23", "the-chai-dialectic", "Laitumkhrah Social", "Shillong", 110, "announced", 699, [["VENUES", "venue_site", 1500]]],
  // --- more across the board
  ["s24", "paper-kites-of-pune", "The Quarry Room", "Bengaluru", 77, "announced", 999, [["SOCIALS", "instagram", 260]]],
  ["s25", "saanjh-collective", "Royal Opera Steps", "Mumbai", 104, "announced", 1599, [["TICKETS", "insider", 1300]]],
  ["s26", "ruh-radio", "Kitty Su Annex", "Delhi", 92, "announced", 1099, [["VENUES", "venue_site", 1700]]],
  ["s27", "neon-monsoon", "Hard Copy Hall", "Hyderabad", 115, "announced", 1199, [["SOCIALS", "instagram", 1900]]],
  ["s28", "mehfil-machine", "Phoenix Rooftop", "Chennai", 67, "live", 1399, [["TICKETS", "district", 410]]],
  ["s29", "laal-pari", "Sunburn Lawns", "Goa", 120, "announced", 2999, [["VENUES", "venue_site", 2200]], { title: "Coastline Soul Fest", festival: true }],
];

// Past shows feed the "Past" tab in My Shows (stubs).
const PAST: Seed[] = [
  ["p01", "neon-monsoon", "Loft 21, Koramangala", "Bengaluru", -24, "sold_out", 899, [["TICKETS", "insider", 60000]]],
  ["p02", "saanjh-collective", "Echo Hall, Church Street", "Bengaluru", -61, "sold_out", 999, [["TICKETS", "district", 90000]]],
  ["p03", "kavya-tidelines", "Kiln Warehouse, Okhla", "Delhi", -98, "sold_out", 1199, [["TICKETS", "district", 140000]]],
];

const USER_DEFAULTS: Record<string, Partial<Show["user"]>> = {
  s01: { going: true, inCalendar: true },
  s14: { saved: true },
  s09: { saved: true },
  s16: { going: true },
  p01: { going: true },
  p02: { going: true },
  p03: { going: true },
};

export function seedToShow(seed: Seed, now: number, index: number): Show {
  const [id, artistSlug, venue, city, dayOffset, status, price, sources, extra] = seed;
  const [sh, sm] = (extra?.start ?? "20:30").split(":").map(Number);
  const date = startOfDay(now, dayOffset, sh, sm);
  const firstTicketing = sources.find(([c]) => c === "TICKETS");
  return {
    id,
    artistSlug,
    title: extra?.title ?? "",
    venue,
    city,
    ...CITIES[city],
    date: date.toISOString(),
    doors: extra?.doors ?? "19:00",
    start: extra?.start ?? "20:30",
    status,
    tiers: tiersFor(status, price, now, index + 1),
    ticketUrl: firstTicketing ? PLATFORM_URL[firstTicketing[1]] : undefined,
    foundBy: sources.map(([crawler, source, minsAgo]) => ({
      crawler,
      source,
      at: new Date(now - minsAgo * 60_000).toISOString(),
    })),
    travelNote: extra?.travel,
    isFestival: extra?.festival,
    user: { going: false, saved: false, inCalendar: false, dismissed: false, ...USER_DEFAULTS[id] },
  };
}

export function buildShows(now: number): Show[] {
  return [...SEEDS, ...PAST].map((s, i) => seedToShow(s, now, i));
}

// The "crawler found a new show" pool for demo key N / the 45s timer.
export const DISCOVERY_POOL: Seed[] = [
  ["n01", "baarish-bureau", "Fandom Hall, Indiranagar", "Bengaluru", 17, "early_bird", 899, [["SOCIALS", "instagram", 0]]],
  ["n02", "static-sitar", "Echo Hall, Church Street", "Bengaluru", 23, "live", 1099, [["TICKETS", "district", 0]]],
  ["n03", "dhool", "Bay Stage, Worli", "Mumbai", 38, "announced", 999, [["VENUES", "venue_site", 0]]],
  ["n04", "kavya-tidelines", "Loft 21, Koramangala", "Bengaluru", 29, "early_bird", 1199, [["TICKETS", "insider", 0]]],
  ["n05", "laal-pari", "Zee Studios, Jaipur", "Jaipur", 45, "rumour", 0, [["SOCIALS", "instagram", 0]]],
];
