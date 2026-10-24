import type { Artist } from "../types";

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
].map((a) => ({ ...a, image: `/mock/artists/${a.slug}.svg` })) as Artist[];
