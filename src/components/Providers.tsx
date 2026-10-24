"use client";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { soundPreferred, setSound } from "@/lib/audio";
import { scrollTo, startScroll, stopScroll } from "@/lib/scroll";
import { BagProvider } from "./merch/bag";
import { BagDrawer } from "./merch/BagDrawer";
import { Nav } from "./nav/Nav";
import { DemoPanel } from "./ui/DemoPanel";
import { SoundToggle } from "./ui/SoundToggle";
import { TelegramToastLayer } from "./ui/TelegramToast";
import { ToastLayer } from "./ui/Toast";
import { VenueHost } from "./VenueHost";

function ScrollBoot() {
  const pathname = usePathname();
  useEffect(() => {
    history.scrollRestoration = "manual";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startScroll({ reducedMotion: reduced });
    // Sound preference persists, but audio only ever starts from a gesture.
    const resume = () => {
      if (soundPreferred()) void setSound(true);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      stopScroll();
    };
  }, []);
  useEffect(() => {
    scrollTo(0, { immediate: true });
  }, [pathname]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BagProvider>
      {/* usePathname() consumers stream in, so routes can still prerender. */}
      <Suspense fallback={null}>
        <ScrollBoot />
      </Suspense>
      <VenueHost />
      <Suspense fallback={null}>
        <Nav />
      </Suspense>
      <main className="relative z-10">{children}</main>
      <SoundToggle />
      <BagDrawer />
      <ToastLayer />
      <TelegramToastLayer />
      <DemoPanel />
    </BagProvider>
  );
}
