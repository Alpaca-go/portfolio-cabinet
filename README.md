# Wang Qi — Design Archive

First deliverable: Phase 1 static visual baseline from the supplied development brief.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Production build: `npm run build`.

## Scope

- Original GLB at `public/archive-cabinet-v7.glb`, copied without modification.
- React + React Three Fiber + Three.js; orthographic camera fitted to projected model bounds.
- Unlit original material colors; screen-space inverted hull contours and a bounds-derived structural line proxy.
- CanvasTexture drawer labels and work-card face attached to original anchors.
- Mobile-first layout, demand rendering, device pixel ratio capped at 1.5.
- No motion or interactive navigation in this review milestone.

The footer lists categories as text, not inactive buttons. All original GLB nodes, folder hinges, slot anchors, and the paper-exit anchor remain available. Phase 2 (drawer focus) is intentionally deferred until visual approval per the brief.

## Source files

- `src/components/archive/ArchiveScene.tsx`: GLB loading, flat materials, responsive framing.
- `src/components/archive/OutlineSystem.ts`: silhouette and internal linework.
- `src/components/archive/GraphicSurfaces.ts`: runtime labels and ID placeholder.
- `src/styles/global.css`: mobile-first editorial layout.

The ID portrait is a graphic placeholder. No project descriptions or personal contact details have been invented.

## Visual check

`npm run check:visual` uses Playwright with installed Microsoft Edge and expects the local Vite server on port 5174. Captures 375×812, 390×844, 430×932, and desktop screenshots in `artifacts/`, checks GLB readiness, JavaScript errors, overflow, and framing.

