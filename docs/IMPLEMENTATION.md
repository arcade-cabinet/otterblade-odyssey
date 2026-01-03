# Otterblade Odyssey: Astro Implementation Guide

> Source of truth for how the rebuilt Astro + Solid + Matter.js stack is assembled and how it consumes the shared data manifests.

## What We Build With

- **Astro 5 + Solid islands** for the shell, menus, and HUD.
- **Matter.js** for 2D physics and collision handling.
- **Canvas 2D** for procedural rendering (Finn, enemies, parallax, effects).
- **Zustand (vanilla store API)** for runtime state with localStorage persistence.
- **YUKA** for steering behaviors and enemy AI.
- **pnpm + Biome** for tooling and linting.

The prior Vite/React/Miniplex ECS stack is retired. New work must target the Astro/Solid runtime in `game/`.

## Runtime Layout (Astro App)

```
game/
├── src/
│   ├── pages/index.astro        # Entry point that mounts the game shell
│   ├── components/              # Solid components (HUD, menus, overlays)
│   ├── game/
│   │   ├── engine/              # Matter.js setup, game loop
│   │   ├── entities/            # Player, enemies, items
│   │   ├── systems/             # AI, input, collision, audio
│   │   ├── rendering/           # Canvas renderers (Finn, environments, effects)
│   │   ├── ddl/loader.js        # Async JSON loaders (no direct imports)
│   │   └── store.js             # Zustand store and selectors
│   └── ui/                      # Shared styling
└── astro.config.mjs
```

### Data Flow (Single Source of Truth)

1. **Authored data lives in `client/src/data/`** — manifests, schemas, approvals. No authored JSON belongs under `game/`.
2. **Loaders pull JSON at runtime** from `game/src/ddl/loader.js` (or siblings), using `fetch` to read the manifests instead of bundling them.
3. **Factories/systems derive runtime state** (entities, quests, encounters) from loaded manifests, never from hardcoded constants.
4. **Renderers consume derived state** and draw via Canvas; Solid components only orchestrate layout, not game logic.
5. **Persistence** stays in Zustand + localStorage; manifests remain immutable.

### Physics + Rendering Contracts

- Matter.js engine lives in `game/src/game/engine/physics.js`; update cadence via requestAnimationFrame.
- Collision layers and body creation utilities stay under `game/src/game/entities/` and `.../systems/collision.js`.
- Canvas renderers accept plain objects (positions, animations, palette references) generated from manifests to keep rendering deterministic and testable.

### Input + Audio

- `game/src/game/systems/input.js` unifies keyboard, touch, and gamepad events, emitting normalized actions to the store.
- Audio is handled via Howler.js in `game/src/game/systems/audio.js`, with sound IDs coming from manifests rather than inline strings.

## Migration Path (client → game)

The legacy `client/` React/Vite/ECS code is frozen; only the JSON data remains canonical.

1. **Keep authored content in `client/src/data/`** while porting runtime code into `game/src/`.
2. **Replace React components** with Solid equivalents under `game/src/components/` and page routes under `game/src/pages/`.
3. **Port ECS behaviors to systems** in `game/src/game/systems/`, using simple arrays/maps instead of Miniplex.
4. **Swap Rapier/Three** usage for Matter.js + Canvas renderers housed in `game/src/game/rendering/`.
5. **Redirect loaders**: replicate necessary data loaders in `game/src/ddl/` that `fetch` manifests; do not import `client/src/game` TypeScript loaders.
6. **Decommission client runtime** once each feature exists in `game/`, leaving only the data manifests behind.

## Removing the Old Stack

- **Vite → Astro**: Astro handles routing and bundling; do not add Vite-specific config to new code.
- **React → Solid**: New UI islands must be Solid components; avoid JSX that assumes React runtime.
- **ECS (Miniplex) → Systems/Arrays**: Track entities with plain objects and per-system update loops.
- **Three.js → Canvas 2D**: Procedural drawing replaces 3D assets; all references to R3F/Three should be pruned as features migrate.

## Implementation Checklist

- [ ] Loader functions fetch data from `client/src/data/**/*.json`.
- [ ] Systems accept manifest-derived configs (no magic numbers).
- [ ] Canvas renderers are pure and side-effect free beyond drawing.
- [ ] Solid components stay <200 lines and focus on composition.
- [ ] Biome passes locally (`pnpm biome check .`).
- [ ] No React/Rapier/Miniplex imports in new code.
