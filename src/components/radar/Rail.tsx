"use client";
// Horizontal rail with drag, snap, and "focus by distance": the card nearest
// the centre is full size, others dim to 0.55 / scale 0.94, and their images
// drift against the frame. All per-frame work writes styles directly.
import { useEffect, useRef, type ReactNode } from "react";
import { onFrame } from "@/lib/scroll";
import { clamp } from "@/lib/math";

export function Rail({ children, label }: { children: ReactNode[]; label: string }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const off = onFrame(() => {
      if (!visible || reduced) return;
      const r = el.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      for (const item of Array.from(el.children) as HTMLElement[]) {
        const ir = item.getBoundingClientRect();
        const d = (ir.left + ir.width / 2 - mid) / (r.width / 2); // -1..1 across the rail
        const f = clamp(1 - Math.abs(d) * 1.4);
        item.style.opacity = String(0.55 + 0.45 * f);
        item.style.transform = `scale(${0.94 + 0.06 * f})`;
        const img = item.querySelector("img") as HTMLElement | null;
        if (img) img.style.transform = `translateX(${clamp(d, -1, 1) * -20}px) scale(1.25)`; // ±20px = 40px of parallax travel
      }
    });

    // Mouse drag-to-scroll (touch already scrolls natively).
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.scrollSnapType = "none";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.style.scrollSnapType = "";
    };
    // Swallow the click that ends a drag so it doesn't open a show.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      off();
      io.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  const nudge = (dir: number) => scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div className="relative">
      <div
        ref={scroller}
        role="list"
        aria-label={label}
        data-lenis-prevent-wheel=""
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 py-3 select-none sm:-mx-8 sm:px-8"
      >
        {children.map((c, i) => (
          <div role="listitem" key={i} className="w-[min(320px,82vw)] shrink-0 snap-center transition-[opacity] will-change-transform [&_img]:will-change-transform">
            {c}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => nudge(-1)} className="label grid h-9 w-9 place-items-center rounded-full ring-1 ring-white/15 hover:bg-white/5" aria-label="Scroll rail left">
          ←
        </button>
        <button type="button" onClick={() => nudge(1)} className="label grid h-9 w-9 place-items-center rounded-full ring-1 ring-white/15 hover:bg-white/5" aria-label="Scroll rail right">
          →
        </button>
      </div>
    </div>
  );
}
