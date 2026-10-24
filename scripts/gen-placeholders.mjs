// Generates duotone SVG placeholders for artists and merch so the demo never
// hotlinks an image. Runs before dev/build; skips files that already exist so
// real JPG/SVG drops in public/mock/ are never overwritten.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/data/mock/artists.ts"), "utf8");
const artists = [...src.matchAll(/slug: "([^"]+)", name: "([^"]+)",.*?hue: \["(#[0-9a-f]+)", "(#[0-9a-f]+)"\]/g)].map(
  ([, slug, name, a, b]) => ({ slug, name, a, b }),
);

function rng(seed) {
  let t = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const initials = (n) =>
  n.replace(/&/g, "").split(/\s+/).filter((w) => w && !/^(the|of|and)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const esc = (s) => s.replace(/&/g, "&amp;");

function artistSvg({ slug, name, a, b }) {
  const r = rng(slug);
  const blobs = Array.from({ length: 5 }, () =>
    `<circle cx="${(r() * 800) | 0}" cy="${(r() * 800) | 0}" r="${(120 + r() * 260) | 0}" fill="${r() > 0.5 ? a : "#ffffff"}" opacity="${(0.08 + r() * 0.22).toFixed(2)}"/>`,
  ).join("");
  // A performer silhouette with a mic stand, lit from behind.
  const x = 330 + r() * 140;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs>
<radialGradient id="g" cx="${(40 + r() * 20) | 0}%" cy="38%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="#07050b"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="60"/></filter>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<rect width="800" height="800" fill="url(#g)"/>
<g filter="url(#blur)">${blobs}</g>
<polygon points="${x - 30},0 ${x + 30},0 ${x + 220},800 ${x - 220},800" fill="url(#beam)" opacity="0.35"/>
<g fill="#07050b" opacity="0.92">
<circle cx="${x}" cy="420" r="46"/>
<path d="M${x - 70} 800 C ${x - 80} 600, ${x - 60} 500, ${x} 482 C ${x + 60} 500, ${x + 80} 600, ${x + 70} 800 Z"/>
<rect x="${x + 96}" y="470" width="8" height="330"/><rect x="${x + 60}" y="452" width="56" height="10" rx="5" transform="rotate(-24 ${x + 88} 457)"/>
</g>
<text x="40" y="760" font-family="Impact, 'Arial Black', sans-serif" font-size="300" font-weight="900" fill="#fff" opacity="0.12" letter-spacing="-8">${initials(name)}</text>
<text x="44" y="78" font-family="Menlo, monospace" font-size="22" letter-spacing="5" fill="#fff" opacity="0.55">${esc(name.toUpperCase())}</text>
</svg>`;
}

function merchSvg({ name, a, b }, kind) {
  const ini = initials(name);
  const shapes = {
    tee: `<path d="M250 190 L330 150 Q400 190 470 150 L550 190 L620 290 L555 330 L540 300 L540 650 L260 650 L260 300 L245 330 L180 290 Z" fill="${b}" stroke="${a}" stroke-width="6"/>
<text x="400" y="420" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="110" fill="${a}">${ini}</text>
<text x="400" y="470" text-anchor="middle" font-family="Menlo, monospace" font-size="18" letter-spacing="4" fill="${a}" opacity="0.8">INDIA TOUR</text>`,
    tote: `<path d="M330 260 Q330 160 400 160 Q470 160 470 260" fill="none" stroke="${a}" stroke-width="14"/>
<rect x="250" y="250" width="300" height="380" rx="10" fill="#efe6d8"/>
<circle cx="400" cy="420" r="96" fill="${b}"/><text x="400" y="452" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="90" fill="${a}">${ini}</text>`,
    poster: `<rect x="230" y="120" width="340" height="560" fill="${b}" stroke="#ffffff22" stroke-width="2"/>
<polygon points="400,150 330,520 470,520" fill="${a}" opacity="0.45"/>
<circle cx="400" cy="480" r="40" fill="#07050b"/>
<text x="400" y="610" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="46" fill="#fff">${esc(name.toUpperCase()).slice(0, 18)}</text>
<text x="400" y="645" text-anchor="middle" font-family="Menlo, monospace" font-size="16" letter-spacing="4" fill="${a}">LIVE IN INDIA</text>`,
    vinyl: `<rect x="190" y="190" width="300" height="420" fill="${b}" transform="rotate(-6 340 400)"/>
<circle cx="460" cy="400" r="210" fill="#0b0b0f"/>${[180, 150, 120, 95].map((r) => `<circle cx="460" cy="400" r="${r}" fill="none" stroke="#ffffff10" stroke-width="2"/>`).join("")}
<circle cx="460" cy="400" r="70" fill="${a}"/><circle cx="460" cy="400" r="8" fill="#0b0b0f"/>
<text x="460" y="412" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="34" fill="${b}">${ini}</text>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2a1838"/><stop offset="1" stop-color="#0d0812"/></radialGradient></defs>
<rect width="800" height="800" fill="url(#g)"/>
<ellipse cx="400" cy="700" rx="260" ry="26" fill="#000" opacity="0.5"/>
${shapes[kind]}
</svg>`;
}

function write(path, content) {
  const jpg = path.replace(/\.svg$/, ".jpg");
  if (existsSync(path) || existsSync(jpg)) return 0;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return 1;
}

let n = 0;
for (const art of artists) {
  n += write(join(root, "public/mock/artists", `${art.slug}.svg`), artistSvg(art));
  for (const kind of ["tee", "tote", "poster", "vinyl"])
    n += write(join(root, "public/mock/merch", `${art.slug}-${kind}.svg`), merchSvg(art, kind));
}
console.log(`[placeholders] ${artists.length} artists, ${n} new files`);
