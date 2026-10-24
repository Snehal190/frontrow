// Hand-off between a clicked card and the show page's enter transition
// (shared-element FLIP: we remember where the photo was on screen).
export interface PendingEnter {
  showId: string;
  src: string;
  rect: { x: number; y: number; w: number; h: number };
  at: number;
}

let pending: PendingEnter | null = null;

export function setPendingEnter(p: PendingEnter) {
  pending = p;
}

/** The pending hand-off if it is for this show and fresh (< 3s old). Non-destructive so StrictMode double renders agree. */
export function peekPendingEnter(showId: string): PendingEnter | null {
  if (!pending || pending.showId !== showId || performance.now() - pending.at > 3000) return null;
  return pending;
}
