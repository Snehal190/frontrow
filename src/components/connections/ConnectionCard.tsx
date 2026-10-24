"use client";
import { useState } from "react";
import { getConnections, sendTestAlert, toggleConnection, type Connection } from "@/data/api";
import { TELEGRAM_TEST } from "@/lib/demo";
import { telegram, toast } from "@/lib/notify";
import { useData } from "../useData";

const META: Record<Connection["id"], { name: string; blurb: string; color: string; icon: React.ReactNode }> = {
  telegram: {
    name: "Telegram",
    blurb: "Where alerts land: new shows, early bird, tickets live.",
    color: "#2aa3df",
    icon: <path fill="currentColor" d="M21.9 4.3 18.7 19.5c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.1l-4.8-1.5c-1-.3-1-1 .2-1.5L20.5 2.9c.9-.3 1.6.2 1.4 1.4z" />,
  },
  spotify: {
    name: "Spotify",
    blurb: "Who you follow and play on repeat decides your radar.",
    color: "#1ed760",
    icon: <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.4a.6.6 0 0 1-.9.2c-2.3-1.4-5.3-1.8-8.8-1a.6.6 0 1 1-.3-1.2c3.8-.9 7.1-.5 9.8 1.1.3.2.4.6.2.9zm1.2-2.7a.8.8 0 0 1-1 .2c-2.7-1.6-6.8-2.1-10-1.2a.8.8 0 0 1-.4-1.5c3.6-1.1 8.1-.6 11.2 1.4.3.2.4.7.2 1.1zm.1-2.8C14.7 9 9.4 8.8 6.3 9.7a.9.9 0 1 1-.5-1.8c3.5-1.1 9.4-.8 13 1.3a.9.9 0 0 1-.9 1.7z" />,
  },
  gcal: {
    name: "Google Calendar",
    blurb: "Shows you mark as Going drop straight into your calendar.",
    color: "#4f8df5",
    icon: <path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 5v10h14V9H5zm2-7h2v4H7V2zm8 0h2v4h-2V2zm-7 9h3v3H8v-3z" />,
  },
};

export function ConnIcon({ id, size = 40, dim = false }: { id: Connection["id"]; size?: number; dim?: boolean }) {
  const m = META[id];
  return (
    <span className="grid shrink-0 place-items-center rounded-xl ring-1 ring-white/10" style={{ width: size, height: size, background: dim ? "rgb(255 255 255 / 0.05)" : `${m.color}22`, color: dim ? "var(--color-dim)" : m.color }}>
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} aria-hidden>
        {m.icon}
      </svg>
    </span>
  );
}

function ConnectionCard({ c }: { c: Connection }) {
  const m = META[c.id];
  const [busy, setBusy] = useState(false);
  const run = async (patch: Partial<Connection>, msg: string) => {
    setBusy(true);
    await toggleConnection(c.id, patch);
    setBusy(false);
    toast(msg);
  };
  const testAlert = async () => {
    setBusy(true);
    await sendTestAlert();
    setBusy(false);
    telegram(TELEGRAM_TEST);
  };

  return (
    <article className="panel grain flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <ConnIcon id={c.id} size={52} dim={!c.connected} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="display text-3xl text-white">{m.name}</h3>
          <span className={`label rounded-full px-2 py-0.5 ${c.connected ? (c.paused ? "bg-early/15 text-early" : "bg-[#1ed760]/15 text-[#5ef08f]") : "bg-white/5 text-dim"}`}>
            {c.connected ? (c.paused ? "Paused" : "Connected") : "Not connected"}
          </span>
        </div>
        <p className="text-sm text-smoke">{m.blurb}</p>
        {c.detail && <p className="label mt-1 text-dim">{c.detail}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {c.id === "telegram" && c.connected && (
          <>
            <button type="button" className="btn btn-primary !py-2" disabled={busy} onClick={testAlert}>
              Send test alert
            </button>
            <button type="button" className="btn btn-ghost !py-2" disabled={busy} onClick={() => run({ paused: !c.paused }, c.paused ? "Alerts resumed" : "Alerts paused")}>
              {c.paused ? "Resume alerts" : "Pause alerts"}
            </button>
            <button type="button" className="btn btn-ghost !py-2" disabled={busy} onClick={() => run({ connected: false, paused: false }, "Telegram unlinked")}>
              Unlink
            </button>
          </>
        )}
        {c.id === "telegram" && !c.connected && (
          <button type="button" className="btn btn-primary !py-2" disabled={busy} onClick={() => run({ connected: true, detail: "@ira_listens · alerts on" }, "Telegram linked ✓")}>
            Link @FrontRowShowBot
          </button>
        )}
        {c.id === "spotify" &&
          (c.connected ? (
            <>
              <button type="button" className="btn btn-ghost !py-2" disabled={busy} onClick={() => run({ connected: true }, "Spotify re-synced · 34 artists")}>
                Reconnect
              </button>
              <button type="button" className="btn btn-ghost !py-2" disabled={busy} onClick={() => run({ connected: false }, "Spotify disconnected")}>
                Disconnect
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary !py-2" disabled={busy} onClick={() => run({ connected: true, detail: "34 followed · 61 on repeat" }, "Spotify connected ✓")}>
              Connect Spotify
            </button>
          ))}
        {c.id === "gcal" && (
          <button type="button" className={`btn ${c.connected ? "btn-ghost" : "btn-primary"} !py-2`} disabled={busy} onClick={() => run({ connected: !c.connected }, c.connected ? "Calendar disconnected" : "Google Calendar connected ✓")}>
            {c.connected ? "Disconnect" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
}

export function ConnectionsPanel() {
  const { data } = useData(getConnections, "connections");
  const n = data?.filter((c) => c.connected).length ?? 0;
  return (
    <section aria-labelledby="conn-h">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h2 id="conn-h" className="label text-lilac">
          {data ? `${n} of 3 connected` : "Connections"}
        </h2>
        <div className="flex gap-2">{data?.map((c) => <ConnIcon key={c.id} id={c.id} size={32} dim={!c.connected} />)}</div>
      </div>
      <div className="space-y-3">{data ? data.map((c) => <ConnectionCard key={c.id} c={c} />) : [0, 1, 2].map((i) => <div key={i} className="panel h-28 animate-pulse" />)}</div>
    </section>
  );
}
