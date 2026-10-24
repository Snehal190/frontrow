"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const LINKS = [
  { href: "/radar", label: "Radar", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 12l6-6" },
  { href: "/my-shows", label: "My shows", icon: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z M10 7v12" },
  { href: "/calendar", label: "Calendar", icon: "M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5" },
  { href: "/profile", label: "Profile", icon: "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display leading-none tracking-tight ${className}`}>
      <span className="text-white">FRONT</span>
      <span className="text-lilac">ROW</span>
    </span>
  );
}

export function Nav() {
  const path = usePathname();
  if (path === "/") return null;
  const minimal = path.startsWith("/onboarding");
  const active = (href: string) => path === href || (href === "/profile" && path === "/connections");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-house/55 backdrop-blur-xl">
        {/* Hairline that glows in the current stage colour. */}
        <div
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgb(var(--stage-rgb) / 0.8), transparent)" }}
        />
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
          <Link href={minimal ? "/" : "/radar"} className="text-[1.75rem]" aria-label="FrontRow home">
            <Wordmark />
          </Link>
          {!minimal && (
            <>
              <ul className="hidden items-center gap-1 md:flex">
                {LINKS.map((l) => (
                  <li key={l.href} className="relative">
                    <Link
                      href={l.href}
                      aria-current={active(l.href) ? "page" : undefined}
                      className={`label relative block rounded-full px-4 py-2 transition-colors ${active(l.href) ? "text-stage" : "text-dim hover:text-smoke"}`}
                    >
                      {active(l.href) && (
                        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-stage/10 ring-1 ring-stage/30" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                      )}
                      <span className="relative">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  aria-label="Your profile"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-stage to-haze-2 text-sm font-bold text-white ring-1 ring-white/20"
                >
                  IM
                </Link>
              </div>
            </>
          )}
        </nav>
      </header>

      {!minimal && (
        <nav
          aria-label="Main mobile"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-house/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        >
          <ul className="grid grid-cols-4">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-mono uppercase tracking-[0.14em] ${active(l.href) ? "text-stage" : "text-dim"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d={l.icon} />
                  </svg>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
