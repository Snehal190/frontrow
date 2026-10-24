import { NOISE } from "./noise";

// LED wall: artist image duotoned to the stage colour, with scanlines, a
// pixel-grid mask and a brightness pulse on the kick. Falls back to slow
// abstract gradient noise when no artist is selected.
export const ledVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ledFrag = /* glsl */ `
uniform sampler2D uTex;
uniform float uHasTex;
uniform float uArtist;
uniform vec3 uWash;
uniform vec3 uDark;
uniform float uTime;
uniform float uKick;
uniform float uBright;
uniform vec2 uGrid;
uniform float uAspect;
varying vec2 vUv;
${NOISE}
void main() {
  // Cover-fit a square image onto the wide wall.
  vec2 uv = vUv;
  vec2 tuv = vec2(0.5 + (uv.x - 0.5) * uAspect * 0.62, 0.5 + (uv.y - 0.5) * 0.9 + 0.04);
  vec3 tex = texture2D(uTex, clamp(tuv, 0.0, 1.0)).rgb;
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  vec3 duo = mix(uDark, uWash * 1.6 + 0.15, smoothstep(0.05, 0.85, lum));

  float n = fbm(vec3(uv * vec2(3.0, 1.6), uTime * 0.08));
  float n2 = fbm(vec3(uv * vec2(1.2, 3.0) + 7.0, uTime * 0.05));
  vec3 abstractCol = mix(uDark, uWash, smoothstep(0.35, 0.8, n)) + uWash * 0.25 * smoothstep(0.55, 0.9, n2);

  vec3 col = mix(abstractCol, duo, uArtist * uHasTex);
  // Scanlines + pixel grid (the gaps between LED tiles).
  float scan = 0.82 + 0.18 * sin(uv.y * uGrid.y * 6.2831);
  vec2 cell = fract(uv * uGrid);
  float grid = smoothstep(0.0, 0.12, cell.x) * smoothstep(0.0, 0.12, cell.y) * smoothstep(1.0, 0.88, cell.x) * smoothstep(1.0, 0.88, cell.y);
  float pulse = 1.0 + uKick * 0.35;
  col *= scan * mix(0.55, 1.0, grid) * pulse * uBright;
  gl_FragColor = vec4(col, 1.0);
}
`;
