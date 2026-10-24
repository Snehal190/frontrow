"use client";
// The crowd: instanced human figures (five outfits/poses + piggyback pairs)
// with Indian skin tones and clothing, plus a point cloud of phone torches
// held up by the people with raised arms. Everything moves in the shader.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedBufferAttribute,
  type ShaderMaterial,
  type BufferGeometry as BG,
} from "three";
import { mulberry32 } from "@/lib/math";
import { crowdVariants } from "./people";
import { rig } from "./rig";
import { crowdFrag, crowdVert, phoneFrag, phoneVert } from "./shaders/crowd";

// Share of the crowd per figure variant (piggybacks are rare on purpose).
const SHARES = { teeMan: 0.3, kurtaWoman: 0.26, kurtaMan: 0.15, armsUpMan: 0.14, armsUpWoman: 0.135, piggyback: 0.015 } as const;
type Variant = keyof typeof SHARES;

// Warm brown skin range, light to deep.
const SKIN = ["#e0ac69", "#c68642", "#b5784a", "#a0663c", "#8d5524", "#7a4a26", "#5f3a1f"];
// What a Bengaluru gig crowd actually wears: black tees, white/cream kurtas,
// mustard, maroon, indigo, teal, saffron, olive, heather grey, denim.
const TOPS = ["#16151a", "#16151a", "#1d1c22", "#e8e2d6", "#d9cfbd", "#c99a2e", "#7a1f2b", "#2b3a67", "#1f6f6b", "#d9822b", "#556b2f", "#6b6b70", "#3a4f6e", "#a32a2a", "#c45a86", "#efe9df"];
const BOTTOMS = ["#2b3550", "#1f2738", "#141318", "#141318", "#8a7a5a", "#3b3b40", "#ddd6c8"];

const lin = (hex: string) => new Color(hex).toArray(); // linear working space

interface Person {
  x: number;
  z: number;
}

function layout(count: number) {
  const rand = mulberry32(1337);
  // Jittered grid in a fan widening from the barricade: people stand ~0.48m
  // apart, all the way to the back wall, so wherever the camera stands it is
  // *in* the crowd (no empty floor, no rows of visible legs).
  const spots: (Person & { k: number })[] = [];
  for (let z = 2.95; z < 26; z += 0.48) {
    const half = 4.6 + (z - 2) * 0.42;
    for (let x = -half; x <= half; x += 0.48) {
      const jx = (rand() - 0.5) * 0.28;
      const jz = (rand() - 0.5) * 0.24;
      // Ranking key: mildly favour the front so it's packed at the barricade,
      // thinning (not emptying) toward the back.
      spots.push({ x: x + jx, z: z + jz, k: rand() * (1 + z / 10) });
    }
  }
  spots.sort((a, b) => a.k - b.k);
  return spots.slice(0, count);
}

function buildInstances(count: number) {
  const people = layout(count);
  const rand = mulberry32(99);
  const byVariant: Record<Variant, Person[]> = { teeMan: [], kurtaWoman: [], kurtaMan: [], armsUpMan: [], armsUpWoman: [], piggyback: [] };
  const order = Object.keys(SHARES) as Variant[];
  for (const p of people) {
    // Piggybacks only mid-crowd, where they read against the stage.
    let r = rand();
    let v: Variant = "teeMan";
    for (const name of order) {
      if (r < SHARES[name]) {
        v = name;
        break;
      }
      r -= SHARES[name];
    }
    if (v === "piggyback" && (p.z < 6 || p.z > 16)) v = "teeMan";
    byVariant[v].push(p);
  }

  const attrs = (list: Person[], female: boolean) => {
    const n = list.length;
    const data = new Float32Array(n * 4);
    const extra = new Float32Array(n * 4);
    const cloth = new Float32Array(n * 3);
    const skin = new Float32Array(n * 3);
    const pants = new Float32Array(n * 3);
    list.forEach((p, i) => {
      data.set([p.x, p.z, (female ? 0.9 : 0.96) + rand() * 0.12, rand()], i * 4);
      // bounce, hair tint, yaw (±0.35 rad), nod amount
      extra.set([0.4 + rand() * 0.8, rand(), (rand() - 0.5) * 0.7, 0.3 + rand() * 0.9], i * 4);
      cloth.set(lin(TOPS[Math.floor(rand() * TOPS.length)]), i * 3);
      skin.set(lin(SKIN[Math.floor(rand() * SKIN.length)]), i * 3);
      pants.set(lin(BOTTOMS[Math.floor(rand() * BOTTOMS.length)]), i * 3);
    });
    return { data, extra, cloth, skin, pants };
  };

  return { byVariant, attrs, rand };
}

export const crowdUniforms = {
  uTime: { value: 0 },
  uKick: { value: 0 },
  uBeat: { value: 0 },
  uEnergy: { value: 0.2 },
  uPart: { value: 0 },
  uCam: { value: [0, 0, 0] as number[] },
  uWash: { value: new Color("#e0569f") },
  uLight: { value: 0.6 },
  uFogColor: { value: new Color("#0a0710") },
  uFogDensity: { value: 0.035 },
};
const phoneUniforms = {
  ...crowdUniforms,
  uReveal: { value: 0.2 },
  uPixelRatio: { value: 1 },
  uColor: { value: new Color("#d6ecff") },
};

const FEMALE: Record<Variant, boolean> = { teeMan: false, kurtaWoman: true, kurtaMan: false, armsUpMan: false, armsUpWoman: true, piggyback: false };

export function Crowd({ count }: { count: number }) {
  const crowdMat = useRef<ShaderMaterial>(null);
  const phoneMat = useRef<ShaderMaterial>(null);

  const { meshes, phones } = useMemo(() => {
    const geos = crowdVariants();
    const { byVariant, attrs, rand } = buildInstances(count);
    const meshes = (Object.keys(geos) as Variant[])
      .map((v) => {
        const list = byVariant[v];
        if (!list.length) return null;
        const g = geos[v] as BG;
        const a = attrs(list, FEMALE[v]);
        g.setAttribute("aData", new InstancedBufferAttribute(a.data, 4));
        g.setAttribute("aExtra", new InstancedBufferAttribute(a.extra, 4));
        g.setAttribute("aCloth", new InstancedBufferAttribute(a.cloth, 3));
        g.setAttribute("aSkin", new InstancedBufferAttribute(a.skin, 3));
        g.setAttribute("aPants", new InstancedBufferAttribute(a.pants, 3));
        return { key: v, geometry: g, count: list.length, data: a.data, extra: a.extra };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Phones: held up by the people with raised arms (≈ a quarter of the room).
    const holders = meshes.filter((m) => m.key === "armsUpMan" || m.key === "armsUpWoman");
    const n = holders.reduce((s, m) => s + m.count, 0);
    const pData = new Float32Array(n * 4);
    const pExtra = new Float32Array(n * 4);
    let k = 0;
    for (const m of holders)
      for (let i = 0; i < m.count; i++, k++) {
        pData.set(m.data.subarray(i * 4, i * 4 + 4), k * 4);
        pExtra.set(m.extra.subarray(i * 4, i * 4 + 4), k * 4);
      }
    const phones = new BufferGeometry();
    phones.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    phones.setAttribute("aData", new BufferAttribute(pData, 4));
    phones.setAttribute("aExtra", new BufferAttribute(pExtra, 4));
    // Random reveal order: the "one by one" phone-torch wave.
    phones.setAttribute("aOn", new BufferAttribute(Float32Array.from({ length: n }, () => rand()), 1));
    phones.setAttribute("aSide", new BufferAttribute(Float32Array.from({ length: n }, () => (rand() < 0.5 ? -1 : 1)), 1));
    return { meshes, phones };
  }, [count]);

  useFrame((state) => {
    const u = crowdMat.current?.uniforms;
    if (!u) return;
    const camera = state.camera;
    u.uTime.value = rig.reduced ? 0 : state.clock.elapsedTime;
    u.uKick.value = rig.reduced ? 0 : rig.kick;
    u.uBeat.value = rig.reduced ? 0 : rig.beat;
    u.uEnergy.value = rig.reduced ? 0 : rig.energy;
    u.uPart.value = rig.part;
    u.uCam.value = [camera.position.x, camera.position.y, camera.position.z];
    u.uWash.value.copy(rig.wash);
    u.uLight.value = rig.light + rig.spot * 0.25;
    u.uFogDensity.value = 0.026 + rig.haze * 0.018;
    const pu = phoneMat.current?.uniforms;
    if (pu) {
      pu.uReveal.value = rig.phones;
      pu.uPixelRatio.value = state.viewport.dpr;
    }
  });

  return (
    <group>
      {meshes.map((m, i) => (
        <instancedMesh key={m.key} args={[m.geometry, undefined, m.count]} frustumCulled={false}>
          <shaderMaterial ref={i === 0 ? crowdMat : undefined} vertexShader={crowdVert} fragmentShader={crowdFrag} uniforms={crowdUniforms} />
        </instancedMesh>
      ))}
      <points geometry={phones} frustumCulled={false} renderOrder={3}>
        <shaderMaterial
          ref={phoneMat}
          vertexShader={phoneVert}
          fragmentShader={phoneFrag}
          uniforms={phoneUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
