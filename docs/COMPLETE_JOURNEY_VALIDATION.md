# Complete Game Journey Validation

> How we prove every chapter of Otterblade Odyssey works end-to-end using manifest-driven data, the Astro runtime, and automated Playwright playthroughs.

## Architecture Overview

1. **Authored Data (Single Source of Truth)**
   - `client/src/data/biomes.json` – Atmosphere and palette cues
   - `client/src/data/chapters.json` – High-level progression order
   - `client/src/data/manifests/chapters/*.json` – CRITICAL: 10 chapter definitions
   - `client/src/data/manifests/enemies.json`, `npcs.json`, `sprites.json`, `cinematics.json` – Behavior and asset metadata
   - `client/src/data/manifests/schema/` – JSON Schemas for validation

2. **Runtime (Astro + Solid + Matter.js)**
   - Lives in `game/` with Solid UI islands, Matter.js physics, and Canvas rendering.
   - Loads manifests via `game/src/ddl/loader.js` using `fetch` (never direct JSON imports).
   - Systems (input, AI, collision, audio) pull constants from manifests to avoid magic numbers.
   - Legacy Vite/React/ECS runtime is frozen; migration moves features into `game/` before deletion.

3. **Automation & Evidence**
   - Playwright suites execute automated playthroughs for each chapter and the full journey.
   - Tests share navigation graphs and physics constants with the runtime to stay deterministic.
   - Videos and traces are captured for review when running with `PLAYWRIGHT_MCP=true`.

## Automated Playthroughs

### What They Validate
- Chapters are completable from spawn to goal without impossible jumps.
- Quest triggers, cinematics, and boss transitions fire in order.
- AI behaviors (YUKA) and Matter.js collisions stay within expected bounds.
- Performance remains stable (no major frame drops) through critical sections.

### Where Tests Live
```
tests/factories/         # Level parser, AI player, playthrough orchestrator
 e2e/automated-playthroughs/
   ├─ chapter-*.spec.ts  # Per-chapter runs
   └─ complete-game-journey.spec.ts
```

### Commands
```bash
pnpm exec playwright install chromium   # First run only
pnpm test:playthroughs                  # All chapters
pnpm test:journey                       # Full journey
PLAYWRIGHT_MCP=true pnpm test:journey   # Headed + video capture
```

### Flow
1. **Parse** – Convert chapter manifest into platforms, triggers, and navigation graph.
2. **Plan** – AI player (YUKA) picks a deterministic path using the shared graph and physics constants.
3. **Execute** – Playwright drives input (keyboard/gamepad/touch equivalents) in the Astro app.
4. **Verify** – Assertions confirm objectives, checkpoints, shards, and boss flags.
5. **Record** – Optional videos and traces stored under `playwright-report/` for review.

## Determinism Rules
- Do not randomize spawn positions or physics values; keep everything manifest-driven.
- Use the same constants module for runtime and tests.
- Gate new mechanics behind manifest flags so tests can assert behavior explicitly.

## When Things Change
- Update manifests first, then loaders/systems, then regenerate navigation graphs for tests.
- Keep docs (`docs/TESTING.md`, this file) and agent guides in sync when workflows or commands change.
- Record at least one headed playthrough after major physics or input changes to catch regressions.
