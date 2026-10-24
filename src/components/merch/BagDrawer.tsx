"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { placeOrder } from "@/data/api";
import { formatINR } from "@/lib/math";
import { pauseScroll } from "@/lib/scroll";
import { useBag } from "./bag";

type Stage = "bag" | "paying" | "done";

export function BagDrawer() {
  const bag = useBag();
  const [stage, setStage] = useState<Stage>("bag");
  const [order, setOrder] = useState("");

  useEffect(() => {
    pauseScroll(bag.open);
    if (!bag.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && bag.setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bag.open, bag]);

  const close = () => {
    bag.setOpen(false);
    if (stage === "done") setStage("bag");
  };

  const checkout = async () => {
    setStage("paying");
    const { orderId } = await placeOrder(bag.lines.map((l) => ({ id: l.item.id, qty: l.qty, size: l.size })));
    setOrder(orderId);
    bag.clear();
    setStage("done");
  };

  return (
    <AnimatePresence>
      {bag.open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your merch bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.55 }}
            className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-md flex-col bg-haze/95 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl"
            data-lenis-prevent
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="display text-3xl text-white">Your bag</h2>
              <button type="button" onClick={close} className="label rounded-full px-3 py-2 text-dim ring-1 ring-white/10 hover:text-white" aria-label="Close bag">
                Close ✕
              </button>
            </header>

            {stage === "done" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-early/15 text-4xl ring-1 ring-early/40">✓</div>
                <h3 className="display text-4xl text-white">Order placed</h3>
                <p className="text-smoke">Pick up at the merch stall or get it shipped. We&apos;ll ping you on Telegram when it&apos;s ready.</p>
                <p className="label text-dim">Order {order}</p>
                <button type="button" className="btn btn-primary mt-2" onClick={close}>
                  Back to the show
                </button>
              </div>
            ) : bag.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="display text-3xl text-white/80">Bag&apos;s empty</p>
                <p className="text-dim">Merch from any show page lands here.</p>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto p-5">
                  {bag.lines.map((l) => (
                    <li key={l.key} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.item.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{l.item.name}</p>
                        {l.size && <p className="label mt-0.5 text-dim">Size {l.size}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full ring-1 ring-white/10">
                            <button type="button" className="h-7 w-7 rounded-full hover:bg-white/10" onClick={() => bag.setQty(l.key, l.qty - 1)} aria-label={`One fewer ${l.item.name}`}>
                              −
                            </button>
                            <span className="w-5 text-center font-mono text-sm" aria-live="polite">
                              {l.qty}
                            </span>
                            <button
                              type="button"
                              className="h-7 w-7 rounded-full hover:bg-white/10 disabled:opacity-30"
                              onClick={() => bag.setQty(l.key, l.qty + 1)}
                              disabled={l.qty >= l.item.stock}
                              aria-label={`One more ${l.item.name}`}
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono text-sm text-white">{formatINR(l.qty * l.item.priceINR)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="border-t border-white/10 p-5">
                  <div className="mb-1 flex justify-between text-smoke">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">{formatINR(bag.subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-dim">Free pickup at the stall · shipping calculated at checkout</p>
                  <button type="button" className="btn btn-primary w-full" disabled={stage === "paying"} onClick={checkout}>
                    {stage === "paying" ? "Placing order…" : `Checkout · ${formatINR(bag.subtotal)}`}
                  </button>
                  <p className="mt-2 text-center text-[0.7rem] text-dim">Demo checkout — no payment is taken.</p>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
