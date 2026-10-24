# FrontRow — "You're already at the show"

Frontend-only rebuild of the FrontRow indie-gig alert app. Everything runs on typed mock data behind `src/data/api.ts` (each function carries a `// BACKEND:` note for the endpoint it will call).

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Demo controls (pitch mode)

Always on in dev; in production add `?demo=1` to the URL once per session.

| Key | Does |
|---|---|
| `` ` `` | Toggle the demo desk (tier + FPS readout, tier override) |
| `N` | A crawler finds a new show (card drop, Telegram ping, beam flash) |
| `E` | Featured show flips to EARLY BIRD LIVE |
| `T` | Fake Telegram test alert |
| `L` | Lights down — jump the venue page to the drop |
| `S` | Toggle generated venue sound (off by default) |
| `R` | Reset all mock state |

`?quality=low|medium|high` pins the render tier.

## Where things live

- `src/three/` — the persistent venue canvas. `Director.tsx` is the lighting desk (mode → energy, wash, phones, strobe), `CameraRig.tsx` the mode cameras and the venue walk-in path, `rig.ts` the shared per-frame state and the strobe limiter (≤3 flashes/s, ≤2 frames, ≤0.35 opacity).
- `src/lib/` — `scroll.ts` (single Lenis + rAF loop), `beat.ts` (118 BPM clock), `quality.ts` (tiers + auto step-down), `venueMode.ts` (page → canvas store), `audio.ts` (Web Audio murmur/cheer/kick), `demo.ts`.
- `src/data/` — `types.ts`, `api.ts` (the only import components use), `mock/`.
- `scripts/gen-placeholders.mjs` — generates duotone SVG artist/merch placeholders into `public/mock/` before dev/build; drop real images with the same names to replace them.

## Third-party assets

- **Band on stage:** Female_Adult_03, Male_Adult_04, Male_Adult_09 and Male_Adult_20 from [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) (MIT, see `public/models/band/LICENSE.txt`). Textures downscaled to 1024px. Poses are procedural (`src/three/rigPose.ts`).
- **Crowd:** drawn at runtime (`src/three/crowdAtlas.ts`), no assets.
- **Artist photos (mock):** Wikimedia Commons, credited on each show page. Replace with Spotify images.
