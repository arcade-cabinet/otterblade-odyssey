# Game Rebuild Plan: Astro + Solid + Matter.js

**Date:** 2026-01-02  
**Status:** Migrating runtime from legacy Vite/React/ECS into the Astro app in `game/`.

## Goals

- Center the game runtime in **Astro + Solid** with **Matter.js** physics and **Canvas 2D** rendering.
- Keep **all authored content** in `client/src/data/` (manifests, schemas, approvals) as the single source of truth.
- Remove dependencies on **React, Rapier, Three.js, and Miniplex ECS** as features migrate.
- Ship fast builds with pnpm + Biome and keep coverage/quality visible via Coveralls and SonarCloud.

## What Stays vs. What Goes

| Area | Keep | Replace |
|------|------|---------|
| Data | `client/src/data/**/*.json` manifests and schemas | Any runtime code inside `client/` |
| UI | Solid components under `game/src/components/` | React components and Vite routes |
| Physics | Matter.js helpers under `game/src/game/engine/` | Rapier bindings |
| Rendering | Canvas 2D renderers in `game/src/game/rendering/` | Three.js / R3F scenes |
| Entity Model | Plain-object systems + arrays | Miniplex ECS |
| Bundler | Astro build | Vite project configuration |

## Phase 1: Foundations (Astro Runtime)

1. **Astro shell:** Confirm `game/src/pages/index.astro` mounts Solid islands for menus, HUD, and canvas host.
2. **Physics loop:** Keep Matter.js setup in `game/src/game/engine/` with POC gravity and requestAnimationFrame timing.
3. **State + input:** Use Zustand store in `game/src/game/store.js`; route keyboard/touch/gamepad through `game/src/game/systems/input.js`.
4. **Rendering:** Maintain Canvas renderers (`game/src/game/rendering/`) fed by plain state objects.

## Phase 2: Manifest-Driven Gameplay

1. **Loaders:** Add/finalize `game/src/ddl/` fetch-based loaders for chapters, enemies, cinematics, sounds (no direct JSON imports).
2. **Level builder:** Create factories that instantiate platforms, walls, triggers, encounters, and NPCs from chapter manifests.
3. **Quests/triggers:** Implement quest + trigger managers under `game/src/game/systems/`, consuming manifest definitions.
4. **Assets:** Prefer procedural renderers; allow manifest-referenced generated assets as optional fallbacks.

## Phase 3: AI + Interaction

1. **YUKA behaviors:** Build steering + FSM logic for enemies in `game/src/game/systems/ai.js`, using Matter bodies for movement.
2. **Interaction zones:** Map manifest triggers to regions/sensors; notify quests and HUD via the store.
3. **Audio + feedback:** Play Howler cues using manifest sound IDs; Surface toasts/prompts through Solid HUD components.

## Phase 4: Cleanup and Decommission

1. Remove remaining React/Rapier/Miniplex references after Solid/Matter parity exists.
2. Delete Vite-specific configs once Astro deployment is the only path.
3. Keep `client/` strictly as data until all runtime code has moved; migrate data loaders to `game/src/ddl/` and adjust imports accordingly.

## Migration Checklist

- [ ] No new runtime code added to `client/`.
- [ ] All loaders in `game/src/ddl/` fetch from `client/src/data/`.
- [ ] Solid components replace React equivalents for HUD/menus.
- [ ] Matter.js systems replace Rapier collisions.
- [ ] Coverage reported to Coveralls; quality reported to SonarCloud; CI auto-fix via Claude is active.
- [ ] Documentation kept in sync with the Astro/Solid/Matter architecture (see [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)).
