"use client";
import { useState } from "react";
import { getMerch, type MerchItem } from "@/data/api";
import { formatINR } from "@/lib/math";
import { toast } from "@/lib/notify";
import { useData } from "../useData";
import { useBag } from "./bag";

function MerchCard({ item }: { item: MerchItem }) {
  const bag = useBag();
  const [size, setSize] = useState(item.sizes?.[1] ?? item.sizes?.[0]);
  const out = item.stock === 0;
  return (
    <article className="panel grain group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        {item.stock > 0 && item.stock <= 5 && <span className="label absolute top-3 left-3 rounded-full bg-early px-2.5 py-1 text-house">Only {item.stock} left</span>}
        {out && <span className="label absolute top-3 left-3 rounded-full bg-sold px-2.5 py-1 text-white">Sold out</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-white">{item.name}</h3>
          <span className="font-mono text-white">{formatINR(item.priceINR)}</span>
        </div>
        {item.sizes && (
          <div role="radiogroup" aria-label="Size" className="flex gap-1.5">
            {item.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                className={`label h-8 min-w-8 rounded-md px-2 ring-1 transition ${size === s ? "bg-smoke text-house ring-smoke" : "text-smoke ring-white/15 hover:ring-white/40"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={out}
          onClick={() => {
            bag.add(item, size);
            toast(`Added to bag · ${item.name}${size ? ` (${size})` : ""}`);
          }}
          className="btn btn-primary mt-auto w-full"
        >
          {out ? "Sold out" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}

export function MerchGrid({ artistSlug }: { artistSlug: string }) {
  const { data } = useData(() => getMerch(artistSlug), `merch:${artistSlug}`);
  const bag = useBag();
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {data
          ? data.map((m) => <MerchCard key={m.id} item={m} />)
          : Array.from({ length: 4 }, (_, i) => <div key={i} className="panel aspect-[3/4] animate-pulse" />)}
      </div>
      {bag.count > 0 && (
        <button type="button" onClick={() => bag.setOpen(true)} className="btn btn-ghost mt-5">
          View bag · {bag.count} {bag.count === 1 ? "item" : "items"}
        </button>
      )}
    </div>
  );
}
