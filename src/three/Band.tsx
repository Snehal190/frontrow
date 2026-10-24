"use client";
// The band on stage: a singer at the mic, two guitarists and a drummer on a
// riser with a full kit. Real (lit) meshes, articulated at the shoulders,
// elbows and neck, animated off the shared beat clock so they play in time
// with the crowd and the lights.
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, type Group, type MeshStandardMaterial } from "three";
import { rig } from "./rig";

const DECK = 1.2; // stage deck height
const RISER = { pos: [0, DECK, -4.3] as const, h: 0.4 };

interface Handles {
  root: Group | null;
  torso: Group | null;
  head: Group | null;
  armL: Group | null;
  foreL: Group | null;
  armR: Group | null;
  foreR: Group | null;
}
const emptyHandles = (): Handles => ({ root: null, torso: null, head: null, armL: null, foreL: null, armR: null, foreR: null });
interface Look {
  skin: string;
  top: string;
  bottom: string;
  hair?: "short" | "long" | "curly";
}

/** A performer facing the audience (+Z), pivoted at the hips, shoulders, elbows and neck. */
function Body({ onReady, look, seated = false, children }: { onReady: (h: Handles) => void; look: Look; seated?: boolean; children?: React.ReactNode }) {
  // Body owns the joint refs and hands the (stable, mutable) set to its performer.
  const hr = useRef(emptyHandles());
  useEffect(() => onReady(hr.current), [onReady]);
  const skin = <meshStandardMaterial color={look.skin} roughness={0.65} />;
  const top = <meshStandardMaterial color={look.top} roughness={0.8} />;
  const bottom = <meshStandardMaterial color={look.bottom} roughness={0.85} />;
  const hair = <meshStandardMaterial color="#0d0907" roughness={0.9} />;
  const arm = (side: 1 | -1) => (
    <group ref={(el) => void (hr.current[side < 0 ? "armL" : "armR"] = el)} position={[side * 0.22, 0.52, 0]}>
      <mesh position={[0, -0.14, 0]}>
        <capsuleGeometry args={[0.055, 0.2, 3, 8]} />
        {top}
      </mesh>
      <group ref={(el) => void (hr.current[side < 0 ? "foreL" : "foreR"] = el)} position={[0, -0.29, 0]}>
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.045, 0.19, 3, 8]} />
          {skin}
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          {skin}
        </mesh>
      </group>
    </group>
  );
  return (
    <group ref={(el) => void (hr.current.root = el)}>
      {seated ? (
        [-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.11, 0.45, 0.22]} rotation-x={Math.PI / 2}>
              <capsuleGeometry args={[0.075, 0.32, 3, 8]} />
              {bottom}
            </mesh>
            <mesh position={[s * 0.11, 0.22, 0.42]}>
              <capsuleGeometry args={[0.06, 0.34, 3, 8]} />
              {bottom}
            </mesh>
          </group>
        ))
      ) : (
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.44, 0]}>
            <capsuleGeometry args={[0.072, 0.74, 3, 8]} />
            {bottom}
          </mesh>
        ))
      )}
      <group ref={(el) => void (hr.current.torso = el)} position={[0, seated ? 0.45 : 0.86, 0]}>
        <mesh position={[0, 0.3, 0]} scale={[1.15, 1, 0.68]}>
          <capsuleGeometry args={[0.17, 0.36, 4, 10]} />
          {top}
        </mesh>
        <group ref={(el) => void (hr.current.head = el)} position={[0, 0.62, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.048, 0.05, 0.1, 8]} />
            {skin}
          </mesh>
          <mesh position={[0, 0.17, 0]} scale={[0.9, 1.12, 0.98]}>
            <sphereGeometry args={[0.1, 12, 10]} />
            {skin}
          </mesh>
          <mesh position={[0, 0.19, -0.012]} scale={look.hair === "curly" ? [1.1, 1.12, 1.08] : [0.95, 1.08, 1.02]}>
            <sphereGeometry args={[0.108, 12, 8, 0, Math.PI * 2, 0, look.hair === "curly" ? 2 : 1.65]} />
            {hair}
          </mesh>
          {look.hair === "long" && (
            <mesh position={[0, 0.05, -0.08]} scale={[1.5, 1, 0.7]}>
              <capsuleGeometry args={[0.07, 0.24, 3, 8]} />
              {hair}
            </mesh>
          )}
        </group>
        {arm(-1)}
        {arm(1)}
        {children}
      </group>
    </group>
  );
}

const metal = <meshStandardMaterial color="#9a9aa2" metalness={0.9} roughness={0.3} />;

function Singer() {
  const h = useRef<Handles>(emptyHandles());
  useFrame((state) => {
    const { root, torso, head, armL, foreL, armR, foreR } = h.current;
    if (!root || !torso || !head || !armL || !foreL || !armR || !foreR) return;
    const t = rig.reduced ? 0 : state.clock.elapsedTime;
    const e = rig.reduced ? 0.3 : rig.energy;
    const k = rig.reduced ? 0 : rig.kick;
    root.rotation.z = Math.sin(t * 1.1) * 0.04 * (0.5 + e);
    root.position.x = Math.sin(t * 0.35) * 0.25;
    torso.rotation.x = 0.05 + k * 0.05 * e;
    head.rotation.x = -0.12 + k * 0.1 * e; // chin up to the mic, a nod on the kick
    // Right hand holds the mic at the mouth.
    armR.rotation.set(-1.15, 0, 0.12);
    foreR.rotation.set(-1.25, 0, 0);
    // Left arm: loose at the side, rising toward the sky as the show peaks.
    const lift = Math.max(0, (e - 0.55) / 0.45);
    armL.rotation.set(-0.2 - lift * 0.6, 0, -0.25 - lift * 2.1 + Math.sin(t * 1.7) * 0.08);
    foreL.rotation.set(-0.3 + lift * 0.2, 0, 0);
  });
  return (
    <group position={[0, DECK, -1.6]}>
      <Body onReady={(x) => void (h.current = x)} look={{ skin: "#a0663c", top: "#e8e2d6", bottom: "#141318", hair: "long" }} />
      {/* Mic stand */}
      <mesh position={[0, 0.75, 0.34]}>
        <cylinderGeometry args={[0.012, 0.012, 1.5, 6]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.02, 0.34]}>
        <cylinderGeometry args={[0.14, 0.16, 0.03, 12]} />
        {metal}
      </mesh>
      <mesh position={[0, 1.56, 0.26]} rotation-x={-0.9}>
        <capsuleGeometry args={[0.022, 0.1, 3, 8]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Guitarist({ x, look, flip = false, bass = false }: { x: number; look: Look; flip?: boolean; bass?: boolean }) {
  const h = useRef<Handles>(emptyHandles());
  const s = flip ? -1 : 1;
  useFrame((state) => {
    const { root, torso, head, armL, foreL, armR, foreR } = h.current;
    if (!root || !torso || !head || !armL || !foreL || !armR || !foreR) return;
    const t = rig.reduced ? 0 : state.clock.elapsedTime;
    const e = rig.reduced ? 0.3 : rig.energy;
    const k = rig.reduced ? 0 : rig.kick;
    const beat = rig.reduced ? 0 : rig.beat;
    root.rotation.z = Math.sin(t * 0.9 + x) * 0.03;
    torso.rotation.x = 0.08 + k * 0.08 * e;
    head.rotation.x = 0.05 + k * 0.28 * e; // head-bang grows with the energy
    // Strumming hand: down-up on eighth notes.
    armR.rotation.set(-0.55, 0, 0.2);
    foreR.rotation.set(-1.05 + Math.sin(beat * Math.PI * 4) * 0.22 * (0.3 + e), 0, s * 0.5);
    // Fretting hand reaches along the neck.
    armL.rotation.set(-1.0, 0, -0.35);
    foreL.rotation.set(-0.9, 0, -0.5 + Math.sin(t * 0.7) * 0.06);
  });
  return (
    <group position={[x, DECK, -2.5]} rotation-y={-x * 0.08}>
      <Body onReady={(x) => void (h.current = x)} look={look}>
        {/* Guitar slung across the body, neck toward the left hand. */}
        <group position={[0.02, 0.12, 0.17]} rotation-z={-0.45}>
          <mesh scale={[1, 1.25, 0.35]}>
            <cylinderGeometry args={[0.17, 0.2, 0.1, 14]} />
            <meshStandardMaterial color={bass ? "#0f0f12" : "#7a1f2b"} roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[-0.42, 0.04, 0]} rotation-z={Math.PI / 2}>
            <boxGeometry args={[0.05, bass ? 0.75 : 0.6, 0.03]} />
            <meshStandardMaterial color="#3b2416" roughness={0.6} />
          </mesh>
        </group>
      </Body>
    </group>
  );
}

function Drummer() {
  const h = useRef<Handles>(emptyHandles());
  const crash = useRef<Group>(null);
  const hat = useRef<Group>(null);
  const logo = useRef<MeshStandardMaterial>(null);
  const tmp = useRef(new Color());
  useFrame(() => {
    const { torso, head, armL, foreL, armR, foreR } = h.current;
    if (!torso || !head || !armL || !foreL || !armR || !foreR) return;
    const e = rig.reduced ? 0.3 : rig.energy;
    const k = rig.reduced ? 0 : rig.kick;
    const beat = rig.reduced ? 0.5 : rig.beat;
    // Snare hand lands on the off-beat; stick height ∝ time since the last hit.
    const off = Math.exp(-((beat + 0.5) % 1) * 9);
    torso.rotation.x = 0.12 + k * 0.05;
    head.rotation.x = 0.1 + k * 0.18 * (0.4 + e);
    armR.rotation.set(-0.85, 0, 0.35);
    foreR.rotation.set(-0.55 - (1 - k) * 0.55 * (0.35 + e), 0, 0.15);
    armL.rotation.set(-0.85, 0, -0.35);
    foreL.rotation.set(-0.55 - (1 - off) * 0.5 * (0.35 + e), 0, -0.15);
    if (crash.current) crash.current.rotation.x = 0.35 + k * 0.1 * e;
    if (hat.current) hat.current.position.y = 1.0 + (1 - off) * 0.015;
    if (logo.current) logo.current.emissive.copy(tmp.current.copy(rig.wash)).multiplyScalar(0.25 + k * 0.3 * e);
  });
  const shell = <meshStandardMaterial color="#3a0d16" metalness={0.35} roughness={0.45} />;
  const skin = <meshStandardMaterial color="#e9e3d8" roughness={0.85} />;
  const brass = <meshStandardMaterial color="#c9a64a" metalness={0.9} roughness={0.3} />;
  return (
    <group position={[RISER.pos[0], RISER.pos[1], RISER.pos[2]]}>
      <mesh position={[0, RISER.h / 2, 0]}>
        <boxGeometry args={[3.4, RISER.h, 2.4]} />
        <meshStandardMaterial color="#141018" roughness={0.7} />
      </mesh>
      <group position={[0, RISER.h, -0.25]}>
        {/* Stool */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.5, 10]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <group position={[0, 0.05, 0]}>
          <Body onReady={(x) => void (h.current = x)} look={{ skin: "#8d5524", top: "#16151a", bottom: "#2b3550", hair: "curly" }} seated />
        </group>
      </group>
      <group position={[0, RISER.h, 0.65]}>
        {/* Bass drum facing the crowd, logo head lit in the stage colour */}
        <mesh position={[0, 0.32, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.32, 0.32, 0.38, 20]} />
          {shell}
        </mesh>
        <mesh position={[0, 0.32, 0.195]}>
          <circleGeometry args={[0.3, 20]} />
          <meshStandardMaterial ref={logo} color="#e9e3d8" emissive="#e0569f" emissiveIntensity={1} roughness={0.8} />
        </mesh>
        {/* Rack tom, snare, floor tom */}
        <mesh position={[0.1, 0.78, -0.05]} rotation-x={0.35}>
          <cylinderGeometry args={[0.13, 0.13, 0.16, 16]} />
          {shell}
        </mesh>
        <mesh position={[-0.38, 0.62, -0.3]} rotation-x={0.2}>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 18]} />
          {skin}
        </mesh>
        <mesh position={[0.55, 0.38, -0.35]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 18]} />
          {shell}
        </mesh>
        {/* Hi-hat */}
        <mesh position={[-0.7, 0.5, -0.35]}>
          <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
          {metal}
        </mesh>
        <group ref={hat} position={[-0.7, 1.0, -0.35]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.18, 0.012, 20]} />
            {brass}
          </mesh>
        </group>
        {/* Crash + ride */}
        <mesh position={[-0.5, 0.65, 0.05]}>
          <cylinderGeometry args={[0.012, 0.012, 1.3, 6]} />
          {metal}
        </mesh>
        <group ref={crash} position={[-0.5, 1.3, 0.05]} rotation-x={0.35}>
          <mesh>
            <cylinderGeometry args={[0.24, 0.24, 0.01, 22]} />
            {brass}
          </mesh>
        </group>
        <mesh position={[0.75, 1.1, -0.05]} rotation={[0.3, 0, -0.25]}>
          <cylinderGeometry args={[0.27, 0.27, 0.01, 22]} />
          {brass}
        </mesh>
      </group>
    </group>
  );
}

export function Band() {
  return (
    <group>
      <Drummer />
      <Singer />
      <Guitarist x={-3.1} look={{ skin: "#b5784a", top: "#1f6f6b", bottom: "#141318", hair: "short" }} />
      <Guitarist x={3.1} flip bass look={{ skin: "#c68642", top: "#16151a", bottom: "#3b3b40", hair: "curly" }} />
    </group>
  );
}
