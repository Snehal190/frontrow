"use client";
// The merch stall stage-left. The camera turns to it at p 0.70–0.88; the
// products are textured planes that slowly rotate above the counter.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace, TextureLoader, type Group, type MeshBasicMaterial, type PointLight } from "three";
import { range } from "@/lib/math";
import { subscribeVenue, venue } from "@/lib/venueMode";
import { BOOTH_POS } from "./CameraRig";
import { rig } from "./rig";

const KINDS = ["tee", "tote", "poster", "vinyl"] as const;
const DEFAULT_ARTIST = "saanjh-collective";

function signTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#07050b";
  g.fillRect(0, 0, 512, 128);
  g.font = "900 88px Impact, 'Arial Black', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#ffb547";
  g.shadowBlur = 24;
  g.fillStyle = "#ffe2b0";
  g.fillText("MERCH", 256, 68);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function MerchBooth() {
  const items = useRef<(Group | null)[]>([]);
  const mats = useRef<(MeshBasicMaterial | null)[]>([]);
  const lamp = useRef<PointLight>(null);
  const sign = useMemo(() => signTexture(), []);

  useEffect(() => {
    const loader = new TextureLoader();
    let current = "";
    const sync = () => {
      const slug = venue.artist?.slug ?? DEFAULT_ARTIST;
      if (slug === current) return;
      current = slug;
      KINDS.forEach((k, i) =>
        loader.load(`/mock/merch/${slug}-${k}.svg`, (tex) => {
          const m = mats.current[i];
          if (!m || current !== slug) return;
          tex.colorSpace = SRGBColorSpace;
          m.map = tex;
          m.needsUpdate = true;
        }),
      );
    };
    sync();
    return subscribeVenue(sync);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // The stall brightens as the camera turns toward it.
    const focus = venue.mode === "venue" ? range(rig.p, 0.66, 0.8) * (1 - range(rig.p, 0.9, 1)) : 0;
    items.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.y = (rig.reduced ? 0 : t * 0.35) + i * 1.3;
      g.position.y = 2.3 + Math.sin(t * 0.9 + i) * (rig.reduced ? 0 : 0.06);
    });
    mats.current.forEach((m) => {
      if (m) m.color.setScalar(0.25 + focus * 0.85);
    });
    if (lamp.current) lamp.current.intensity = 6 + focus * 40;
  });

  return (
    <group position={BOOTH_POS.toArray()} rotation={[0, Math.PI / 2, 0]}>
      {/* Back panel + counter */}
      <mesh position={[0, 2, -1.2]}>
        <boxGeometry args={[6, 4, 0.2]} />
        <meshStandardMaterial color="#1a1024" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]}>
        <boxGeometry args={[5.4, 1.1, 1]} />
        <meshStandardMaterial color="#2a1838" roughness={0.6} emissive="#ffb547" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0, 3.6, -1.05]}>
        <planeGeometry args={[3, 0.75]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <pointLight ref={lamp} position={[0, 3, 1.4]} color="#ffcf8a" distance={9} decay={1.5} intensity={6} />
      {KINDS.map((k, i) => (
        <group key={k} position={[-2 + i * 1.35, 2.3, 0.1]} ref={(el) => void (items.current[i] = el)}>
          <mesh>
            <planeGeometry args={[1.05, 1.05]} />
            <meshBasicMaterial ref={(el) => void (mats.current[i] = el)} side={DoubleSide} toneMapped={false} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}
