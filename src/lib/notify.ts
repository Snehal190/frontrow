// Fire-and-forget UI notifications (wristband toasts + fake Telegram pings).
// A plain event bus so anything — demo keys, cards, crawlers — can raise one.
export interface ToastMsg {
  id: number;
  text: string;
  tone?: "default" | "early" | "live";
}
export interface TelegramMsg {
  id: number;
  text: string;
}

type Ev = { kind: "toast"; msg: ToastMsg } | { kind: "telegram"; msg: TelegramMsg };
const subs = new Set<(e: Ev) => void>();
let n = 0;

export function onNotify(fn: (e: Ev) => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function toast(text: string, tone: ToastMsg["tone"] = "default") {
  const msg = { id: ++n, text, tone };
  subs.forEach((s) => s({ kind: "toast", msg }));
}

export function telegram(text: string) {
  const msg = { id: ++n, text };
  subs.forEach((s) => s({ kind: "telegram", msg }));
}
