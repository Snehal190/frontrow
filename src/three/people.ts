// Low-poly human figures for the crowd, built from primitives (no GLB).
// Each vertex carries `aPart` so the shader can colour clothes, skin, hair and
// trousers per instance: 0 top, 1 skin, 2 hair, 3 bottom. Rider vertices on a
// piggyback pair add 10 so they can sway on their own.
// Figures face -Z (toward the stage); we mostly see backs, so hair and
// shoulders carry the read.
import {
  BufferAttribute,
  CapsuleGeometry,
  CylinderGeometry,
  LatheGeometry,
  Quaternion,
  SphereGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const PART = { top: 0, skin: 1, hair: 2, bottom: 3 } as const;

type V3 = [number, number, number];
const UP = new Vector3(0, 1, 0);

function tag(g: BufferGeometry, part: number) {
  g.deleteAttribute("uv"); // unused; keeps the vertex stream lean
  g.setAttribute("aPart", new BufferAttribute(new Float32Array(g.getAttribute("position").count).fill(part), 1));
  return g;
}

/** A capsule spanning a → b. */
function limb(a: V3, b: V3, r: number, part: number, radial = 6) {
  const A = new Vector3(...a);
  const B = new Vector3(...b);
  const dir = B.clone().sub(A);
  const len = Math.max(0.001, dir.length() - r * 2);
  const g = new CapsuleGeometry(r, len, 2, radial);
  g.applyQuaternion(new Quaternion().setFromUnitVectors(UP, dir.normalize()));
  const mid = A.add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return tag(g, part);
}

function ball(c: V3, r: number, part: number, scale: V3 = [1, 1, 1], w = 8, h = 6) {
  const g = new SphereGeometry(r, w, h);
  g.scale(...scale);
  g.translate(...c);
  return tag(g, part);
}

// Torso profiles (radius, height). The lathe is squashed in depth afterwards.
const MALE_TEE = [[0.001, 0.86], [0.15, 0.87], [0.165, 0.95], [0.158, 1.05], [0.165, 1.15], [0.19, 1.27], [0.205, 1.36], [0.19, 1.42], [0.12, 1.47], [0.055, 1.5], [0.001, 1.51]];
const FEMALE_TEE = [[0.001, 0.86], [0.17, 0.87], [0.178, 0.95], [0.138, 1.07], [0.148, 1.17], [0.162, 1.27], [0.168, 1.35], [0.158, 1.41], [0.1, 1.45], [0.05, 1.48], [0.001, 1.49]];
// Kurta: the top garment flares down to the knee.
const kurta = (p: number[][]) => [[0.001, 0.52], [0.215, 0.53], [0.2, 0.7], [0.18, 0.86], ...p.slice(2)];

function torso(profile: number[][], part = PART.top) {
  const g = new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 10);
  g.scale(1, 1, 0.62);
  return tag(g, part);
}

export type Hair = "short" | "long" | "bun" | "curly";
export type Build = "male" | "female";

interface FigureOpts {
  build: Build;
  hair: Hair;
  armsUp: boolean;
  kurta: boolean;
  /** Offset for a rider sitting on someone's shoulders. */
  offset?: V3;
  rider?: boolean;
}

function figure({ build, hair, armsUp, kurta: isKurta, offset = [0, 0, 0], rider = false }: FigureOpts): BufferGeometry[] {
  const f = build === "female";
  const sh = f ? 0.17 : 0.2; // shoulder half-width
  const shY = f ? 1.4 : 1.42;
  const parts: BufferGeometry[] = [];
  const sleeve = isKurta ? PART.top : PART.skin;

  if (!rider) {
    for (const s of [-1, 1]) {
      parts.push(limb([s * 0.09, 0.9, 0], [s * 0.1, 0.48, 0.01], f ? 0.066 : 0.072, PART.bottom));
      parts.push(limb([s * 0.1, 0.48, 0.01], [s * 0.1, 0.05, 0], f ? 0.052 : 0.058, PART.bottom));
    }
  } else {
    // Thighs over the carrier's shoulders, shins hanging down in front of their chest.
    for (const s of [-1, 1]) {
      parts.push(limb([s * 0.09, 0.9, 0], [s * 0.19, 0.84, -0.3], 0.068, PART.bottom));
      parts.push(limb([s * 0.19, 0.84, -0.3], [s * 0.19, 0.46, -0.32], 0.055, PART.bottom));
    }
  }

  const base = f ? FEMALE_TEE : MALE_TEE;
  parts.push(torso(isKurta && !rider ? kurta(base) : base));

  for (const s of [-1, 1]) {
    if (armsUp) {
      // Arms in the air, slightly bent, hands above the head.
      const elbow: V3 = [s * (sh + 0.13), shY + 0.27, -0.03];
      const wrist: V3 = [s * (sh + 0.05), shY + 0.55, -0.06];
      parts.push(limb([s * sh, shY, 0], elbow, 0.052, PART.top));
      parts.push(limb(elbow, wrist, 0.043, sleeve));
      parts.push(ball([wrist[0], wrist[1] + 0.05, wrist[2]], 0.045, PART.skin, [1, 1.2, 0.7], 6, 4));
    } else if (rider) {
      continue;
    } else {
      const elbow: V3 = [s * (sh + 0.05), shY - 0.28, 0.02];
      const wrist: V3 = [s * (sh + 0.03), shY - 0.54, -0.05];
      parts.push(limb([s * sh, shY, 0], elbow, 0.054, PART.top));
      parts.push(limb(elbow, wrist, 0.044, sleeve));
      parts.push(ball([wrist[0], wrist[1] - 0.06, wrist[2]], 0.045, PART.skin, [0.8, 1.2, 1], 6, 4));
    }
  }

  // Neck + head (slightly long oval), then hair.
  parts.push(limb([0, 1.47, 0], [0, 1.57, 0.005], 0.048, PART.skin));
  parts.push(ball([0, 1.665, 0], 0.1, PART.skin, [0.9, 1.12, 0.98]));
  // Hair cap: top and back of the skull, open at the face.
  const cap = new SphereGeometry(f ? 0.112 : 0.108, 8, 5, 0, Math.PI * 2, 0, hair === "curly" ? 1.95 : 1.7);
  cap.scale(hair === "curly" ? 1.08 : 0.94, hair === "curly" ? 1.12 : 1.06, 1.02);
  cap.translate(0, 1.68, 0.012);
  parts.push(tag(cap, PART.hair));
  if (hair === "long") {
    // Long hair / braid falling down the back.
    const drape = limb([0, 1.66, 0.075], [0, 1.3, 0.1], 0.07, PART.hair);
    parts.push(drape);
  }
  if (hair === "bun") parts.push(ball([0, 1.74, 0.085], 0.055, PART.hair, [1, 1, 1], 6, 4));

  const [ox, oy, oz] = offset;
  if (ox || oy || oz) parts.forEach((p) => p.translate(ox, oy, oz));
  if (rider) parts.forEach((p) => (p.getAttribute("aPart") as BufferAttribute).array.forEach((v, i, arr) => ((arr as Float32Array)[i] = v + 10)));
  return parts;
}

function merge(parts: BufferGeometry[]) {
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  g.computeBoundingSphere();
  return g;
}

/** The crowd's figure variants. Order matters: Crowd.tsx assigns shares by index. */
export function crowdVariants() {
  return {
    teeMan: merge(figure({ build: "male", hair: "short", armsUp: false, kurta: false })),
    kurtaWoman: merge(figure({ build: "female", hair: "long", armsUp: false, kurta: true })),
    kurtaMan: merge(figure({ build: "male", hair: "curly", armsUp: false, kurta: true })),
    armsUpMan: merge(figure({ build: "male", hair: "short", armsUp: true, kurta: false })),
    armsUpWoman: merge(figure({ build: "female", hair: "bun", armsUp: true, kurta: false })),
    // Someone on a friend's shoulders, arms up.
    piggyback: merge([
      ...figure({ build: "male", hair: "short", armsUp: false, kurta: false }),
      ...figure({ build: "female", hair: "long", armsUp: true, kurta: false, offset: [0, 0.66, 0.12], rider: true }),
    ]),
  };
}

/** Thin cylinder helper for stage props. */
export function rod(r: number, h: number, radial = 8) {
  return new CylinderGeometry(r, r, h, radial);
}
