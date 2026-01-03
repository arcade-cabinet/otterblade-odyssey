# Otterblade Odyssey: Implementation Guide (Astro + Solid)

> This is a high-level companion to [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md). It summarizes the active architecture and where to add new work.

## Stack Snapshot

- **Astro 5 + Solid islands** power the UI shell, menus, and HUD.
- **Matter.js** drives physics; **Canvas 2D** handles rendering.
- **Zustand** maintains runtime state with localStorage persistence.
- **YUKA** underpins AI/steering behaviors (residing in `game/src/game/systems/ai.js`).
- **pnpm + Biome** ensure consistent tooling; CI uploads coverage to Coveralls and sends quality signals to SonarCloud.

## Directory Responsibilities

- `game/` — Astro application and all runtime code (Solid components, Matter.js systems, Canvas renderers, loaders).
- `client/` — Legacy React/Vite runtime is deprecated; only `client/src/data/` manifests and schemas remain the authored source of truth during migration.

## Data Flow

1. Author JSON in `client/src/data/**`.
2. Load via fetch-based helpers in `game/src/ddl/` (no direct JSON imports).
3. Build runtime entities/systems from manifest data in `game/src/game/`.
4. Render via Canvas helpers while Solid components orchestrate layout/state.

## Migration Rules

- Do not add new runtime code to `client/`.
- Avoid React/Rapier/Miniplex reintroductions; prefer Solid + Matter.js and simple system modules.
- Keep constants and authored content in JSON manifests, not in JS literals.

## Further Reading

See [docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md) for detailed guidance, loader contracts, and migration steps.
