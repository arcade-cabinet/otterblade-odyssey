# GitHub Copilot Instructions for Otterblade Odyssey

## 🚨 Session Handoff Protocol

You are continuing work across sessions. Before ANY change:
1. Read recent commits and the current PR description to understand scope.
2. Skim `AGENTS.md`, `CLAUDE.md`, and `docs/` to keep guidance consistent.
3. Confirm the active stack is **Astro + Solid.js + Matter.js** with manifest-driven data in `client/src/data/`.
4. List the next concrete steps and execute—do not wait passively.

## Key References (read first)
- `docs/IMPLEMENTATION.md` – Astro/Solid/Matter runtime guide
- `docs/TESTING.md` – Test matrix and automation
- `docs/PHYSICS.md` – Matter.js patterns and collision rules
- `docs/AI.md` – YUKA steering/AI expectations
- `BRAND.md` & `WORLD.md` – Visual and lore alignment

## Architecture Snapshot (authoritative)
- Framework: **Astro 5** with **Solid islands**
- Physics: **Matter.js 0.20**
- Rendering: **Canvas 2D**, procedural (no imported sprites)
- AI: **YUKA** steering + FSM
- State: **Zustand** with localStorage persistence
- Package manager: **pnpm 10** only (never npm/yarn)
- Language: **JavaScript (ES2022)** for new code

### Directory Responsibilities
```
game/                     # Astro application (all new runtime work)
├─ src/
│  ├─ pages/index.astro    # Entry point
│  ├─ components/          # Solid islands (HUD, menus, overlays)
│  ├─ game/
│  │  ├─ engine/           # Matter.js setup, render loop
│  │  ├─ entities/         # Player, enemies, items
│  │  ├─ systems/          # Input, collision, AI, audio
│  │  ├─ rendering/        # Canvas renderers (Finn, enemies, environment)
│  │  ├─ ddl/loader.js     # Async manifest loaders (fetch, no direct imports)
│  │  └─ store.js          # Zustand store/selectors
│  └─ ui/                  # Shared styling
└─ astro.config.mjs

client/src/data/          # Single source of authored content (legacy runtime frozen)
└─ manifests/chapters     # 10 chapter definitions + schemas/approvals
```

### Data Flow Rules
- Authored JSON stays in `client/src/data/`; **never duplicate data in JS**.
- Load manifests via async helpers in `game/src/ddl/` using `fetch`—no direct JSON imports.
- Systems/renderers derive values from manifest data (no magic numbers).
- Legacy `client/` runtime code is frozen; migrations move logic into `game/` before deletion.

## Workflow Expectations
- Prefer MCP tools when available, but do not block—use bash for local ops when faster.
- Capture evidence (tests, screenshots) for user-visible changes; note limitations honestly.
- Keep `AGENTS.md`, `CLAUDE.md`, and this file in sync when architecture or workflows shift.

## Testing Commands
```bash
pnpm test                 # Vitest unit suite
pnpm test:unit            # Verbose unit tests
pnpm test:e2e             # Playwright E2E
pnpm test:playthroughs    # Automated chapter playthroughs
pnpm test:journey         # Full journey validation
pnpm biome check .        # Lint/style (required before merge)
```
Use `PLAYWRIGHT_MCP=true` for headed/video capture runs when needed.

## Coding Patterns
- Matter.js physics loop runs at 60fps via `requestAnimationFrame`; engine gravity `1.5`.
- Track entities with arrays/maps; compose small systems rather than monoliths.
- Solid components stay lean (<200 lines) and orchestrate UI, not game logic.
- Procedural rendering only—no static sprite/video imports.

### Avoid These
- React/Vite/Rapier/Miniplex/Three.js dependencies in new work.
- TypeScript-only patterns for new runtime code; prefer JSDoc + ES modules.
- Magic numbers or inline strings for gameplay data—pull from manifests/constants.
- npm/yarn commands; always `pnpm`.

## Documentation Hygiene
- Any stack or workflow change must be mirrored in `docs/` and agent guides.
- Cross-link new docs from `docs/README.md` and relevant guides.
- Leave clear status notes in commits/PR body for the next session.

## Brand & Narrative
- Warm Willowmere Hearthhold tone; anthropomorphic woodland cast only.
- No neon, sci-fi, horror, or human knights/soldiers.
- Wordless storytelling: prefer visual cues over dialogue.

Stay decisive: plan, execute, validate, and record the outcome each session.
