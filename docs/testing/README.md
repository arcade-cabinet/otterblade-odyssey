# Testing Guide for Otterblade Odyssey

This directory explains the manifest-driven testing stack for the Astro + Solid + Matter.js runtime.

## Contents
1. [Level Test Factory](./level-test-factory.md) — Automated chapter playthrough generation
2. Unit & E2E summaries (see main [TESTING.md](../TESTING.md))

## Quick Start

```bash
pnpm test:unit            # Vitest unit suite
pnpm test:e2e             # Playwright E2E
pnpm test:playthroughs    # All automated chapter runs
pnpm test:journey         # Complete journey
PLAYWRIGHT_MCP=true pnpm test:journey   # Headed + video capture
```

## Test Layout
```
tests/
├─ unit/                  # Unit tests for loaders, systems, helpers
├─ factories/             # Level parser, AI player, playthrough factory
└─ setup.ts               # Shared Vitest setup (happy-dom)

e2e/
└─ automated-playthroughs # Chapter and full-journey specs driven by manifests
```

## Architecture Alignment
- Data: Pull manifests from `client/src/data/` via `game/src/ddl/` loaders (no direct JSON imports).
- Physics: Matter.js values (gravity 1.5, player body sizes) come from the same constants used by the runtime.
- AI: YUKA steering and navigation graphs are shared between the game and the Level Test Factory.

## Writing New Tests
- Favor small, focused tests; keep helpers under 150 lines.
- Mock store selectors for Solid components instead of mutating globals.
- Use test IDs for menus/HUD; validate Canvas output via behavior (Playwright), not snapshots.
- Update this README and `docs/TESTING.md` when adding new test types or commands.
