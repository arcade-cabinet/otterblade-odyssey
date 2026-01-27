# System Patterns

## Architecture

- **Framework:** Astro 5.x hosts the Solid frontend, delivering static entry points.
- **UI:** Solid components (`OtterbladeGame.tsx`, HUD, TouchControls, menus) orchestrate game state and error handling.
- **Physics:** Matter.js (wrapped via `matter-wrapper` + `PhysicsManager`) handles collider bodies, sensors, hazards, and moving platforms.
- **AI:** YUKA manages enemies, bosses, and NPCs, wired through `ai/PerceptionSystem` and `AIManager`.
- **State:** Zustand store persists player progress, quality settings, and runtime stats with `localStorage`.
- **Assets:** Manifest data lives in `game/public/data/manifests/`; loaders in `game/src/game/data/*.ts` fetch and validate via Zod schemas.

## Key Patterns

1. **Manifest-First Data Flow:** All JSON is loaded through async loaders (`ddl/loader.ts`), cached, and optionally exposed via sync helpers after preload.
2. **Modular Systems:** Each system (`InputManager`, `AudioManager`, `HazardSystem`, `LanternSystem`, `BellSystem`) implements a typed interface; they update each frame through `createGameLoop`.
3. **Scene Renderer:** Canvas rendering is centralized in `createSceneRenderer`, which draws platforms, environmental interactions, collectibles, NPCs, enemies, bosses, particles, and debug overlay.
4. **Factories:** `level-factory`, `enemy-factory`, and `interaction-factory` take manifests + engine to build Matter bodies and register hazards/collections with the loop.
5. **Trigger & Debug:** `TriggerSystem` runs manifest trigger actions, while a dev-only `DebugSystem` renders an overlay and debug toggles.
6. **Error Handling:** `OtterbladeGame.tsx` tracks manifest load status, runtime errors, and shows Solid `LoadingScreen` fallback UI when necessary.

## Component Relationships

- `game/index.ts` exports the public API (initialization hookups) so `OtterbladeGame.tsx` can bootstrap the engine.
- The game loop depends on `PlayerController`, `inputManager`, systems, and the renderer. Environmental interactions are triggered based on `controls.interact`.
- Playwright E2E specs use the loader helper to fetch manifests that the renderer and systems rely upon, ensuring parity between tests and runtime.
