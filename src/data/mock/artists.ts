import type { Artist } from "../types";

// Stand-in photos of real Indian live acts from Wikimedia Commons (credited,
// mostly CC BY-SA) until Spotify artist images arrive from the backend.
// BACKEND: replace with Spotify `images[0].url` per artist.
const PHOTOS: Record<string, [url: string, author: string, license: string, source: string]> = {
  "saanjh-collective": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/A_snapshot_from_the_Shilpa_Rao_live_concert_at_NIT_Calicut_during_Tathva%2724.jpg/960px-A_snapshot_from_the_Shilpa_Rao_live_concert_at_NIT_Calicut_during_Tathva%2724.jpg", "Aman03062006", "CC0", "https://commons.wikimedia.org/wiki/File%3AA_snapshot_from_the_Shilpa_Rao_live_concert_at_NIT_Calicut_during_Tathva%2724.jpg"],
  "neon-monsoon": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Prateek_Kuhad_4_%28shot_by_Gorkey_Patwal%29.jpg/960px-Prateek_Kuhad_4_%28shot_by_Gorkey_Patwal%29.jpg", "NabihaT", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3APrateek_Kuhad_4_%28shot_by_Gorkey_Patwal%29.jpg"],
  "kavya-tidelines": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Shefali_Alvares_Live.jpg/960px-Shefali_Alvares_Live.jpg", "Rebecca Pinto", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3AShefali_Alvares_Live.jpg"],
  "dhool": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Indian_Ocean_performing_at_Inquivesta_8.jpg/960px-Indian_Ocean_performing_at_Inquivesta_8.jpg", "Avinash dash1997", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3AIndian_Ocean_performing_at_Inquivesta_8.jpg"],
  "paper-kites-of-pune": ["https://upload.wikimedia.org/wikipedia/commons/e/ea/Digvijay_Bhonsale_performing_Live_at_Kuzart_Lane%2C_in_New_Delhi%2C_2014.jpg", "Blejam7", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3ADigvijay_Bhonsale_performing_Live_at_Kuzart_Lane%2C_in_New_Delhi%2C_2014.jpg"],
  "ruh-radio": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/The_Local_Train.jpg/960px-The_Local_Train.jpg", "Lillottama", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3AThe_Local_Train.jpg"],
  "mehfil-machine": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Thaikkudam_Bridge_Goa.jpg/960px-Thaikkudam_Bridge_Goa.jpg", "Rydex64", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3AThaikkudam_Bridge_Goa.jpg"],
  "the-chai-dialectic": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/When_Chai_Met_Toast.jpg/960px-When_Chai_Met_Toast.jpg", "Saileshpai", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3AWhen_Chai_Met_Toast.jpg"],
  "laal-pari": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Singer_Kiran_Kaur.jpg/960px-Singer_Kiran_Kaur.jpg", "Singerkirankaur", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3ASinger_Kiran_Kaur.jpg"],
  "khasi-skies": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Rock_show_Hornbill_Festival_2019.jpg/960px-Rock_show_Hornbill_Festival_2019.jpg", "Aravind Manickam", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File%3ARock_show_Hornbill_Festival_2019.jpg"],
  "baarish-bureau": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Raghu_Dixit_%2815359662925%29.jpg/960px-Raghu_Dixit_%2815359662925%29.jpg", "Omshivaprakash H L", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File%3ARaghu_Dixit_%2815359662925%29.jpg"],
  "static-sitar": ["https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Avial_band_at_Kochi_2011.jpg/960px-Avial_band_at_Kochi_2011.jpg", "Sudheesh S", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File%3AAvial_band_at_Kochi_2011.jpg"],
};

// Fictional indie acts so the demo carries no rights issues. Real names come
// from Spotify via the backend. `hue` drives every duotone in the app.
export const ARTISTS: Artist[] = [
  { slug: "saanjh-collective", name: "Saanjh Collective", genres: ["indie folk", "hindustani fusion"], hue: ["#e0569f", "#2a0f3a"], spotifyPlays30d: 41, followed: true },
  { slug: "neon-monsoon", name: "Neon Monsoon", genres: ["synth pop", "dream pop"], hue: ["#8fd3ff", "#14123d"], spotifyPlays30d: 63, followed: true },
  { slug: "kavya-tidelines", name: "Kavya & the Tidelines", genres: ["indie rock", "bedroom pop"], hue: ["#ffb547", "#3a1408"], spotifyPlays30d: 28, followed: true },
  { slug: "dhool", name: "Dhool", genres: ["post-rock", "instrumental"], hue: ["#cdb0dc", "#1a1024"], spotifyPlays30d: 19, followed: true },
  { slug: "paper-kites-of-pune", name: "Paper Kites of Pune", genres: ["acoustic", "singer-songwriter"], hue: ["#f2a54a", "#2b1a0a"], spotifyPlays30d: 34, followed: true },
  { slug: "ruh-radio", name: "Ruh Radio", genres: ["lo-fi", "electronica"], hue: ["#7c8cff", "#0d0f2e"], spotifyPlays30d: 52, followed: true },
  { slug: "mehfil-machine", name: "Mehfil Machine", genres: ["electronic", "qawwali"], hue: ["#ff4d5e", "#2d0710"], spotifyPlays30d: 17, followed: true },
  { slug: "the-chai-dialectic", name: "The Chai Dialectic", genres: ["math rock", "indie"], hue: ["#ffd27a", "#24130a"], spotifyPlays30d: 12, followed: false },
  { slug: "laal-pari", name: "Laal Pari", genres: ["alt R&B", "neo soul"], hue: ["#ff7aa8", "#320a22"], spotifyPlays30d: 46, followed: true },
  { slug: "khasi-skies", name: "Khasi Skies", genres: ["indie folk", "shoegaze"], hue: ["#9be7c4", "#0a2420"], spotifyPlays30d: 23, followed: true },
  { slug: "baarish-bureau", name: "Baarish Bureau", genres: ["jazz", "neo soul"], hue: ["#b6a4ff", "#150f33"], spotifyPlays30d: 9, followed: false },
  { slug: "static-sitar", name: "Static Sitar", genres: ["psych rock", "raga rock"], hue: ["#ff9f6b", "#2e1006"], spotifyPlays30d: 31, followed: true },
].map((a) => {
  const [url, author, license, source] = PHOTOS[a.slug];
  return { ...a, image: url, fallbackImage: `/mock/artists/${a.slug}.svg`, imageCredit: { author, license, url: source } };
}) as Artist[];
