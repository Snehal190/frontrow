import type { MerchItem } from "../types";
import { ARTISTS } from "./artists";

const KINDS: { kind: MerchItem["kind"]; label: string; price: number; sizes?: string[] }[] = [
  { kind: "tee", label: "Tour Tee", price: 1299, sizes: ["S", "M", "L", "XL"] },
  { kind: "tote", label: "Canvas Tote", price: 699 },
  { kind: "poster", label: "Gig Poster (A2)", price: 499 },
  { kind: "vinyl", label: "Limited Vinyl", price: 2899 },
];

export const MERCH: MerchItem[] = ARTISTS.flatMap((a, ai) =>
  KINDS.map((k, ki) => ({
    id: `${a.slug}-${k.kind}`,
    artistSlug: a.slug,
    name: `${a.name} ${k.label}`,
    priceINR: k.price,
    image: `/mock/merch/${a.slug}-${k.kind}.svg`,
    sizes: k.sizes,
    // Deterministic low stock on a few items so "only 3 left" shows up.
    stock: (ai * 7 + ki * 3) % 11 === 0 ? 0 : 3 + ((ai * 5 + ki) % 40),
    kind: k.kind,
  })),
);
