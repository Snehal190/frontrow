"use client";
// The lighting desk. Runs first every frame and turns (mode, wash, scroll
// progress, enter sequence, demo events) into the shared `rig` values.
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color } from "three";
import { cheer, setAudioEnergy } from "@/lib/audio";
import { readBeat } from "@/lib/beat";
import { damp, lerp, range, smoothstep } from "@/lib/math";
import { reportFrame } from "@/lib/quality";
import { STATUS_COLORS, venue, type SceneMode } from "@/lib/venueMode";
import { requestStrobe, rig, updateStrobe } from "./rig";

const MODE_BASE: Record<SceneMode, { energy: number; light: number; phones: number; haze: number }> = {
  lobby: { energy: 0.15, light: 0.55, phones: 0.12, haze: 0.55 },
  radar: { energy: 0.25, light: 0.62, phones: 0.2, haze: 0.5 },
  calendar: { energy: 0.1, light: 0.32, phones: 0.04, haze: 0.75 },
  venue: { energy: 0.2, light: 0.5, phones: 1, haze: 0.5 },
};

/** Energy curve through the venue scroll (see the §5.4 choreography table). */
function venueEnergy(p: number) {
  if (p < 0.15) return 0.2;
  if (p < 0.45) return lerp(0.2, 0.6, range(p, 0.15, 0.45));
  if (p < 0.7) return lerp(0.6, 1, range(p, 0.45, 0.5));
  if (p < 0.88) return lerp(1, 0.45, range(p, 0.7, 0.88));
  return lerp(0.45, 0.1, range(p, 0.88, 1));
}

const tmp = new Color();

export function Director() {
  const s = useRef({ prevP: 0, lastDrop: -1, chromaUntil: 0, dropBoostAt: -1e9, cheered: -1, lastCss: "", lastAudio: 0 });

  useFrame((state, dt) => {
    reportFrame(dt);
    const now = performance.now();
    const st = s.current;
    const reduced = venue.reducedMotion;
    rig.reduced = reduced;
    rig.time = state.clock.elapsedTime;
    const b = readBeat();
    rig.kick = reduced ? 0 : b.kick;
    rig.beat = b.beat;
    rig.bar = b.bar;

    const mode = venue.mode;
    const base = MODE_BASE[mode];
    const k = Math.min(1, dt); // safety for giant dts
    // λ=2.6 settles in ≈1.2s: the spec's mode cross-fade.
    const L = 2.6;

    let energy = base.energy;
    let light = base.light;
    let phones = base.phones;
    let spot = 0;
    let laser = 0;
    let part = 0;
    let p = mode === "lobby" ? venue.progress : 0;

    if (mode === "venue") {
      p = reduced ? 0.5 : venue.progress;
      const e = venue.enterAt >= 0 ? (now - venue.enterAt) / 1000 : 99;
      energy = reduced ? 0.5 : venueEnergy(p);
      const showLight = 0.42 + 0.38 * range(p, 0.15, 0.55) - 0.36 * range(p, 0.88, 1);
      // House lights down (0–0.8s), hold dark, the spot hits (~1.6s), the rig comes up over 1s.
      const down = smoothstep(0, 0.8, e) * (1 - smoothstep(1.7, 2.8, e));
      light = lerp(showLight, 0.05, down);
      phones = smoothstep(0.8, 1.8, e) * (1 - 0.45 * range(p, 0.9, 1));
      spot = smoothstep(1.5, 1.62, e) * (1 - 0.7 * range(p, 0.12, 0.3)) * (1 - range(p, 0.88, 1));
      laser = reduced ? 0 : range(p, 0.45, 0.5) * (1 - range(p, 0.66, 0.7));
      part = range(p, 0.1, 0.2) * (1 - range(p, 0.75, 0.85));
      if (st.cheered !== venue.enterAt && e > 1.6 && e < 3) {
        st.cheered = venue.enterAt;
        cheer(0.8);
      }
      // The drop: crossing p = 0.5 going forward.
      if (!reduced && st.prevP < 0.5 && p >= 0.5 && now - st.lastDrop > 2500) drop(now);
    }
    if (venue.dropAt > st.lastDrop && venue.dropAt > 0 && now - venue.dropAt < 200) drop(now);
    st.prevP = p;

    function drop(t: number) {
      st.lastDrop = t;
      st.chromaUntil = t + 200;
      st.dropBoostAt = t;
      // Three flashes ≈330ms apart: inside the ≤3/second photosensitivity limit.
      requestStrobe([t, t + 330, t + 660]);
      cheer(1);
    }

    // Demo drop in non-venue modes: a 2.5s energy surge.
    const boost = Math.max(0, 1 - (now - st.dropBoostAt) / 2500);
    energy = Math.max(energy, boost);
    if (mode !== "venue") laser = Math.max(laser, reduced ? 0 : boost);

    rig.p = p;
    rig.energy = damp(rig.energy, energy, 3, k);
    rig.light = damp(rig.light, light, mode === "venue" ? 5 : L, k);
    rig.phones = damp(rig.phones, phones, 4, k);
    rig.spot = damp(rig.spot, spot, 12, k);
    rig.laser = damp(rig.laser, laser, 8, k);
    rig.part = damp(rig.part, part, 3, k);
    rig.haze = damp(rig.haze, base.haze + (venue.wash === "rumour" ? 0.35 : 0), L, k);
    rig.sweep = 0.25 + rig.energy * 1.1;
    rig.ledArtist = damp(rig.ledArtist, venue.artist && mode === "venue" ? 1 : 0, 2, k);
    rig.chroma = !reduced && now < st.chromaUntil ? 0.0015 : damp(rig.chroma, 0, 20, k);
    rig.beamFlash = venue.beamFlashAt > 0 ? Math.max(0, 1 - (now - venue.beamFlashAt) / 900) : 0;
    updateStrobe(now);

    // Wash: status colour if a page pushed one, else the stage magenta.
    rig.washTarget.set(STATUS_COLORS[venue.wash ?? "default"]);
    rig.wash.lerp(rig.washTarget, 1 - Math.exp(-L * k));

    // Mirror the wash into CSS so UI glows match the light rig.
    // getHex() converts the linear working colour back to sRGB for CSS.
    const hex = tmp.copy(rig.wash).getHex();
    const css = `${(hex >> 16) & 255} ${(hex >> 8) & 255} ${hex & 255}`;
    if (css !== st.lastCss) {
      st.lastCss = css;
      document.documentElement.style.setProperty("--stage-rgb", css);
    }

    if (now - st.lastAudio > 120) {
      st.lastAudio = now;
      setAudioEnergy(rig.energy, mode === "venue" ? range(p, 0.15, 0.45) * (1 - range(p, 0.88, 1)) : 0);
    }
  }, -2);

  return null;
}
