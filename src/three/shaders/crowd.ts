// Crowd silhouettes and their phone lights. Instances are placed entirely in
// the shader from per-instance attributes, so the CPU never touches 1800
// matrices per frame.

// Shared placement: sway, kick bounce, and parting around the camera path.
const PLACE = /* glsl */ `
uniform float uTime;
uniform float uKick;
uniform float uEnergy;
uniform float uPart;
uniform vec3 uCam;
attribute vec4 aData;   // x, z, height scale, phase
attribute vec2 aExtra;  // bounce amount, shade
vec3 basePos() {
  vec3 b = vec3(aData.x, 0.0, aData.y);
  // Part around the camera: nearest silhouettes step aside as you walk through.
  vec2 d = b.xz - uCam.xz;
  float dist = length(d);
  float push = uPart * (1.0 - smoothstep(0.0, 1.5, dist));
  b.xz += normalize(d + vec2(0.0001)) * push * 0.75;
  return b;
}
float bounce() {
  return uKick * uEnergy * aExtra.x * 0.16;
}
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
varying float vH;
varying vec3 vN;
varying float vDepth;
varying float vShade;
void main() {
  float s = aData.z;
  vec3 p = position * vec3(0.95 * s, s, 0.95 * s);
  // Sway around the feet: the head moves, the feet don't.
  float sway = sin(uTime * 0.8 + aData.w * 6.2831) * 0.05 * (0.4 + uEnergy);
  p.x += sway * p.y;
  p.y += bounce();
  vec3 w = basePos() + p;
  vH = clamp(position.y / 1.8, 0.0, 1.0);
  vN = normal;
  vShade = aExtra.y;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const crowdFrag = /* glsl */ `
uniform vec3 uWash;
uniform float uLight;
uniform vec3 uBack;
${FOG}
varying float vH;
varying vec3 vN;
varying float vDepth;
varying float vShade;
void main() {
  // Silhouettes: near-black bodies, rim-lit at the edges by the stage wash.
  // Only a thin edge catches light, mostly on heads and shoulders (vH).
  float rim = pow(abs(vN.x), 6.0) * smoothstep(0.45, 1.0, vH);
  float top = pow(max(vN.y, 0.0), 3.0) * 0.5;
  vec3 col = uWash * (rim * 0.5 + top * 0.25) * uLight * vShade + uBack * 0.004;
  // Close silhouettes stay darkest so the foreground reads as bodies passing you.
  col *= smoothstep(0.6, 4.0, vDepth) * 0.85 + 0.15;
  col = mix(col, uFogColor, fogF(vDepth));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const phoneVert = /* glsl */ `
${PLACE}
uniform float uReveal;
uniform float uPixelRatio;
attribute float aOn;     // reveal order 0..1 (random)
varying float vOn;
varying float vDepth;
void main() {
  vec3 w = basePos();
  w.y = aData.z * 1.78 + 0.22 + bounce();
  w.x += sin(uTime * 1.3 + aData.w * 9.0) * 0.05;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  vDepth = -mv.z;
  // Each phone switches on when the reveal passes its order; then flickers like a hand moving.
  float on = step(aOn, uReveal);
  float flick = 0.65 + 0.35 * sin(uTime * (2.0 + aData.w * 5.0) + aData.w * 40.0);
  vOn = on * flick;
  // ~6px at 10m: reads as a sea of phone torches, and bloom does the rest.
  gl_PointSize = clamp(uPixelRatio * 64.0 / max(vDepth, 0.5), 2.0, 26.0);
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
  gl_FragColor = vec4(uColor * a * 2.4, a);
}
`;
