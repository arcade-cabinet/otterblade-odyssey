# Otterblade Odyssey — Architecture Status (Astro Rebuild)

**Date:** 2026-01-02  
**Stack:** Astro + Solid + Matter.js + Canvas 2D + Zustand

## Current Reality

- **Frontend runtime:** Astro with Solid islands in `game/src/`.
- **Physics/rendering:** Matter.js world + Canvas 2D renderers (no Rapier, no Three.js).
- **State:** Vanilla Zustand store in `game/src/game/store.js` with persistence.
- **Data source:** JSON manifests in `client/src/data/` are the only authored source; runtime loaders in `game/src/ddl/` fetch them.
- **AI/behaviors:** YUKA targeted for steering + FSMs in `game/src/game/systems/ai.js` (migration in progress).
- **Tooling:** pnpm 10, Biome linting, Playwright for E2E, Coveralls for coverage uploads, SonarCloud for code quality signals.

The former Vite/React/Miniplex ECS stack is deprecated and should not receive new work.

## What Works

- Astro dev/build pipeline with Solid islands renders the shell and HUD.
- Matter.js setup and Canvas renderers follow the POC gravity and loop cadence.
- JSON manifests for chapters, enemies, cinematics, and sounds live in `client/src/data/manifests/` with schemas.
- Coveralls uploads and SonarCloud analysis wire into CI for visibility on test and quality signals.
- Claude auto-fix runs on failed CI via the autoheal workflow to propose patches.

## Gaps To Close

1. **Manifest-driven level + quest wiring**
   - Instantiate platforms, encounters, triggers, and NPCs directly from chapter manifests.
   - Use loader helpers in `game/src/ddl/` rather than legacy TypeScript loaders.

2. **AI + interactions**
   - Port YUKA behaviors for enemies and interaction regions.
   - Replace Miniplex ECS references with plain-object systems in `game/src/game/systems/`.

3. **Asset handling**
   - Prefer procedural Canvas renderers; fall back to generated assets referenced in manifests.
   - Remove remaining imports of deleted PNG/MP4 artifacts.

4. **Documentation + guardrails**
   - Keep docs aligned with Astro/Solid/Matter terminology.
   - Ensure new contributors target `game/` instead of the frozen `client/` runtime.

## Migration Path (client → game)

- Treat `client/` as **data-only**. Do not add runtime code there.
- Rebuild UI islands and game loop inside `game/src/`:
  - Solid components for menus/HUD (`game/src/components/`).
  - Matter.js + Canvas systems for gameplay (`game/src/game/`).
- Recreate loaders in `game/src/ddl/` that `fetch` manifests; avoid bundling JSON or importing `client/src/game` TypeScript.
- Delete or quarantine React/Rapier/Miniplex code once equivalent Astro/Solid/Matter features exist.

## Immediate Next Steps

1. Wire chapter manifest loading into the level builder and collision systems.
2. Stand up YUKA-driven enemy behaviors with Matter.js bodies.
3. Finish Solid HUD/menu replacements and remove residual React code paths.
4. Keep CI green: Biome + unit tests + coverage to Coveralls + SonarCloud gates; rely on Claude auto-fix when runs fail.
