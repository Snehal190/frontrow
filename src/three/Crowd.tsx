"use client";
// The crowd: two instanced silhouette variants (arms down / arms up) and a
// point cloud of phone lights. Everything moves in the vertex shader.
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  InstancedBufferAttribute,
  SphereGeometry,
  type ShaderMaterial,
  type BufferGeometry as BG,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "@/lib/math";
import { rig } from "./rig";
import { crowdFrag, crowdVert, phoneFrag, phoneVert } from "./shaders/crowd";

const ARMS_SHARE = 0.08; // ~8% with raised arms
const PHONE_SHARE = 0.12; // ~12% holding a phone up

function person(armsUp: boolean): BG {
  const body = new CapsuleGeometry(0.2, 0.82, 3, 8);
  body.scale(1.15, 1, 0.8);
  body.translate(0, 0.62, 0);
  const head = new SphereGeometry(0.12, 10, 8);
  head.translate(0, 1.5, 0);
  const parts: BG[] = [body, head];
  if (armsUp) {
    for (const side of [-1, 1]) {
      const arm = new CapsuleGeometry(0.045, 0.6, 2, 6);
      arm.translate(0, 0.3, 0);
      arm.rotateZ(-side * 0.38);
      arm.translate(side * 0.2, 1.3, 0);
      parts.push(arm);
    }
  }
  // Same attribute set for merging (capsule + sphere both have position/normal/uv).
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  parts.forEach((p) => p.dispose());
  return merged!;
}

function layout(count: number) {
  const rand = mulberry32(1337);
  const data = new Float32Array(count * 4);
  const extra = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    // Denser at the barricade, widening fan toward the back of the room.
    const z = 2.4 + Math.pow(rand(), 1.25) * 22;
    const half = 4.6 + (z - 2) * 0.42;
    data[i * 4] = (rand() * 2 - 1) * half;
    data[i * 4 + 1] = z;
    data[i * 4 + 2] = 0.9 + rand() * 0.22; // height scale
    data[i * 4 + 3] = rand(); // sway/bounce phase
    extra[i * 2] = 0.4 + rand() * 0.8; // bounce amount
    extra[i * 2 + 1] = 0.55 + rand() * 0.6; // shade variance
  }
  return { data, extra };
}

export const crowdUniforms = {
  uTime: { value: 0 },
  uKick: { value: 0 },
  uEnergy: { value: 0.2 },
  uPart: { value: 0 },
  uCam: { value: [0, 0, 0] as number[] },
  uWash: { value: new Color("#e0569f") },
  uLight: { value: 0.6 },
  uBack: { value: new Color("#8fd3ff") },
  uFogColor: { value: new Color("#0a0710") },
  uFogDensity: { value: 0.035 },
};
const phoneUniforms = {
  ...crowdUniforms,
  uReveal: { value: 0.2 },
  uPixelRatio: { value: 1 },
  uColor: { value: new Color("#cfeaff") },
};

export function Crowd({ count }: { count: number }) {
  const camera = useThree((s) => s.camera);
  const dpr = useThree((s) => s.viewport.dpr);
  const crowdMat = useRef<ShaderMaterial>(null);
  const phoneMat = useRef<ShaderMaterial>(null);

  const { plain, arms, phones, plainCount, armsCount } = useMemo(() => {
    const { data, extra } = layout(count);
    const rand = mulberry32(99);
    const plainIdx: number[] = [];
    const armsIdx: number[] = [];
    const phoneIdx: number[] = [];
    for (let i = 0; i < count; i++) {
      (rand() < ARMS_SHARE ? armsIdx : plainIdx).push(i);
      if (rand() < PHONE_SHARE) phoneIdx.push(i);
    }
    const pick = (idx: number[], n: number, src: Float32Array) => {
      const out = new Float32Array(idx.length * n);
      idx.forEach((k, j) => out.set(src.subarray(k * n, k * n + n), j * n));
      return out;
    };
    const withInstances = (g: BG, idx: number[]) => {
      g.setAttribute("aData", new InstancedBufferAttribute(pick(idx, 4, data), 4));
      g.setAttribute("aExtra", new InstancedBufferAttribute(pick(idx, 2, extra), 2));
      return g;
    };
    const phones = new BufferGeometry();
    phones.setAttribute("position", new BufferAttribute(new Float32Array(phoneIdx.length * 3), 3));
    phones.setAttribute("aData", new BufferAttribute(pick(phoneIdx, 4, data), 4));
    phones.setAttribute("aExtra", new BufferAttribute(pick(phoneIdx, 2, extra), 2));
    // Random reveal order: the "one by one" phone-flashlight wave.
    phones.setAttribute("aOn", new BufferAttribute(Float32Array.from(phoneIdx, () => rand()), 1));
    return {
      plain: withInstances(person(false), plainIdx),
      arms: withInstances(person(true), armsIdx),
      phones,
      plainCount: plainIdx.length,
      armsCount: armsIdx.length,
    };
  }, [count]);

  useFrame((state) => {
    const u = crowdMat.current?.uniforms;
    if (!u) return;
    u.uTime.value = state.clock.elapsedTime;
    u.uKick.value = rig.reduced ? 0 : rig.kick;
    u.uEnergy.value = rig.reduced ? 0 : rig.energy;
    u.uPart.value = rig.part;
    u.uCam.value = [camera.position.x, camera.position.y, camera.position.z];
    u.uWash.value.copy(rig.wash);
    u.uLight.value = rig.light + rig.spot * 0.3;
    u.uFogDensity.value = 0.026 + rig.haze * 0.018;
    const pu = phoneMat.current?.uniforms;
    if (pu) {
      pu.uReveal.value = rig.phones;
      pu.uPixelRatio.value = dpr;
    }
  });

  return (
    <group>
      <instancedMesh args={[plain, undefined, plainCount]} frustumCulled={false}>
        <shaderMaterial ref={crowdMat} vertexShader={crowdVert} fragmentShader={crowdFrag} uniforms={crowdUniforms} />
      </instancedMesh>
      <instancedMesh args={[arms, undefined, armsCount]} frustumCulled={false}>
        <shaderMaterial vertexShader={crowdVert} fragmentShader={crowdFrag} uniforms={crowdUniforms} />
      </instancedMesh>
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
