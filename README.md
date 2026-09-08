# Wang Qi — Design Archive

Current presentation: the restored sharp-folder GLB displayed alone on a full-viewport canvas.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Production build: `npm run build`.

## Scope

- Restored sharp-folder GLB at `public/archive-cabinet-v7.glb`, copied without modification from `archive-cabinet-v7-sharp-restored-folders.glb`.
- React + React Three Fiber + Three.js; orthographic camera fitted to projected model bounds.
- Unlit original material colors; screen-space inverted hull contours plus selective hierarchy-bound structural edges.
- CanvasTexture drawer labels and work-card face attached to original anchors.
- Mobile-first layout, demand rendering, device pixel ratio capped at 2.
- GSAP drawer focus and vertical swipe switching remain on the cabinet itself; clicking empty canvas space returns to overview.

The rendered page contains only the cabinet canvas. Header, introduction, captions, category indicator, return control, and footer have been removed.

All original GLB nodes, folder hinges, slot anchors, and the paper-exit anchor remain available. Folder surfaces are identified as complete hit targets, but P3 folder extraction is intentionally absent.

## Milestone status

- P1.1 Visual Crispness — COMPLETE
- P2 Drawer Focus — COMPLETE
- P2R Outline System Refinement — COMPLETE
- P3 Folder Transition — NOT STARTED

## Source files

- `src/components/archive/ArchiveScene.tsx`: Canvas shell, swipe handling, and HTML navigation.
- `src/components/archive/CabinetModel.tsx`: GLB loading, flat materials, and node access.
- `src/components/archive/ArchiveCameraController.ts`: overview framing and focus camera states.
- `src/components/archive/DrawerController.ts`: drawer roots, local-axis pull, and hit lookup.
- `src/hooks/useArchiveInteraction.ts`: explicit archive interaction state.
- `src/components/archive/OutlineSystem.ts`: 1.25px inverted-hull silhouettes, 50° cabinet structural edges, and selective 45° edges for drawers, folders, rails, the personnel module, slots, paper output, and work card.
- `src/components/archive/GraphicSurfaces.ts`: runtime labels and ID placeholder.
- `src/styles/global.css`: mobile-first editorial layout.

The ID portrait is a graphic placeholder. No project descriptions or personal contact details have been invented.

## Visual check

`npm run check:visual` starts an isolated Vite test server and uses Playwright with installed Microsoft Edge (an existing server can be supplied with `VISUAL_URL`). It captures all required overview and drawer-focus screenshots in `artifacts/`, and verifies GLB readiness, state transitions, drawer transforms, camera zoom, overview restoration, JavaScript errors, overflow, and framing.

