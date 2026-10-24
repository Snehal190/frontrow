// Crowd figures and their phone lights. Instances are placed entirely in the
// vertex shader from per-instance attributes, so the CPU never touches the
// matrices; all the "vibing" (sway, small hops, head nods, waving arms) is
// cheap per-vertex maths keyed off the shared beat clock.

const PLACE = /* glsl */ `
uniform float uTime;
uniform float uKick;
uniform float uBeat;
uniform float uEnergy;
uniform float uPart;
uniform vec3 uCam;
attribute vec4 aData;   // x, z, height scale, phase
attribute vec4 aExtra;  // bounce amount, hair tint, yaw, nod amount
vec3 basePos() {
  vec3 b = vec3(aData.x, 0.0, aData.y);
  // Part around the camera: nearest people step aside as you walk through.
  vec2 d = b.xz - uCam.xz;
  float dist = length(d);
  float push = uPart * (1.0 - smoothstep(0.0, 1.5, dist));
  b.xz += normalize(d + vec2(0.0001)) * push * 0.7;
  return b;
}
// A small hop on the kick: only the loud part of the envelope, and gentle.
float hop() {
  return max(uKick - 0.35, 0.0) * uEnergy * aExtra.x * 0.06;
}
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`;

const FOG = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
float fogF(float depth) {
  float f = uFogDensity * depth;
  return 1.0 - exp(-f * f);
}
`;

export const crowdVert = /* glsl */ `
${PLACE}
attribute float aPart;
attribute vec3 aCloth;
attribute vec3 aSkin;
attribute vec3 aPants;
varying vec3 vColor;
varying vec3 vN;
varying float vY;
varying float vZ;
varying float vDepth;
void main() {
  float part = mod(aPart, 10.0);
  bool rider = aPart >= 10.0;
  float phase = aData.w * 6.2831;
  vec3 p = position;
  vec3 n = normal;

  // Head nod on the beat (pivot at the neck), forward toward the stage.
  if (!rider && p.y > 1.47) {
    float nod = -(0.5 + 0.5 * sin(uBeat * 6.2831 + phase * 0.3)) * 0.1 * uEnergy * aExtra.w;
    vec2 yz = rot2(nod) * vec2(p.y - 1.5, p.z);
    p.y = yz.x + 1.5; p.z = yz.y;
  }
  // Raised hands sway side to side.
  // (A rider's arms start higher: their shoulders sit at ~2.06m.)
  if (p.y > (rider ? 2.12 : 1.52) && abs(p.x) > 0.13 && part < 1.5) {
    p.x += sin(uTime * 1.9 + phase) * 0.07 * (p.y - 1.5) * (0.4 + uEnergy);
  }
  // A rider on someone's shoulders sways the whole upper body.
  if (rider) p.x += sin(uTime * 1.3 + phase) * 0.05 * (p.y - 1.5);
  // Body sway from the feet up + a shoulder groove on the off-beat.
  float sway = sin(uTime * (0.6 + aData.w * 0.3) + phase) * 0.03 * (0.5 + uEnergy);
  p.x += sway * p.y + sin(uBeat * 6.2831 + phase) * 0.012 * uEnergy * smoothstep(1.0, 1.4, p.y);

  // Per-person turn (nobody stands perfectly square to the stage).
  p.xz = rot2(aExtra.z) * p.xz;
  n.xz = rot2(aExtra.z) * n.xz;

  p *= aData.z;
  p.y += hop();
  vec3 w = basePos() + p;

  // Colour by body part.
  vec3 hair = vec3(0.012, 0.008, 0.006) * (0.7 + aExtra.y * 0.8);
  vColor = part < 0.5 ? aCloth : part < 1.5 ? aSkin : part < 2.5 ? hair : aPants;

  vN = n;
  vY = position.y;
  vZ = w.z;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const crowdFrag = /* glsl */ `
uniform vec3 uWash;
uniform float uLight;
${FOG}
varying vec3 vColor;
varying vec3 vN;
varying float vY;
varying float vZ;
varying float vDepth;
void main() {
  vec3 N = normalize(vN);
  // Stage light comes from the front and above; we mostly see backs, so most
  // of what reads is shoulders, hair tops and rim light along silhouettes.
  vec3 lightCol = mix(vec3(1.0, 0.95, 0.9), uWash, 0.6);
  float top = max(N.y, 0.0);
  float front = max(-N.z, 0.0);
  float rim = pow(1.0 - abs(N.z), 2.5) * smoothstep(0.9, 1.6, vY);
  // Low fill so clothes and skin only *just* read; the stage does the lighting.
  float lit = 0.025 + uLight * (0.06 + 0.3 * top + 0.22 * front);
  vec3 col = vColor * lit * lightCol + uWash * rim * 0.18 * uLight;
  // Front rows catch the stage spill; the back of the room sits in the dark.
  col *= mix(1.25, 0.28, smoothstep(3.0, 20.0, vZ));
  // The nearest bodies (as you walk through) read as dark silhouettes.
  col *= smoothstep(0.8, 5.5, vDepth) * 0.92 + 0.08;
  col = mix(col, uFogColor, fogF(vDepth));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const phoneVert = /* glsl */ `
${PLACE}
uniform float uReveal;
uniform float uPixelRatio;
attribute float aOn;     // reveal order 0..1 (random)
attribute float aSide;   // which raised hand holds the phone (-1 / 1)
varying float vOn;
varying float vDepth;
void main() {
  float phase = aData.w * 6.2831;
  vec3 h = vec3(aSide * 0.24, 2.1, -0.07); // just above the raised hand
  h.x += sin(uTime * 1.9 + phase) * 0.07 * (h.y - 1.5) * (0.4 + uEnergy);
  h.x += sin(uTime * (0.6 + aData.w * 0.3) + phase) * 0.03 * (0.5 + uEnergy) * h.y;
  h.xz = rot2(aExtra.z) * h.xz;
  vec3 w = basePos() + h * aData.z;
  w.y += hop();
  vec4 mv = viewMatrix * vec4(w, 1.0);
  vDepth = -mv.z;
  // Each phone switches on when the reveal passes its order; brightness drifts like a hand moving.
  float on = step(aOn, uReveal);
  float flick = 0.7 + 0.3 * sin(uTime * (1.5 + aData.w * 3.0) + aData.w * 40.0);
  vOn = on * flick;
  // ~6px at 10m: reads as a sea of phone torches, and bloom does the rest.
  gl_PointSize = clamp(uPixelRatio * 60.0 / max(vDepth, 0.5), 2.0, 24.0);
  gl_Position = projectionMatrix * mv;
}
`;

export const phoneFrag = /* glsl */ `
uniform vec3 uColor;
${FOG}
varying float vOn;
varying float vDepth;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5, 0.0, d);
  float a = core * core * vOn * (1.0 - fogF(vDepth) * 0.7);
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a * 2.2, a);
}
`;
