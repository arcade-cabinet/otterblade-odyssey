# Tech Context

- **Languages:** TypeScript (ES2022) across all runtime, systems, and UI modules; `.tsx` for Solid components. No runtime JS modules remain under `game/src/game`.
- **Package management:** pnpm 10.x (never npm/yarn). Use `pnpm` commands for installs, linting, and tests.
- **Build & Tooling:** Astro dev server (port 4321), esbuild bundler; Biome is the linter with strict mode (run `pnpm biome check .` before merging).
- **Testing:** Playwright for E2E; Vitest for unit tests. Playwright specs rely on manifest helper to load chapter data.
- **Runtime stack:** Solid UI in Astro pages, Zustand store + Matter.js physics, Yuka AI, Howler/Tone for audio, nipplejs for touch joystick.
- **Docs:** AGENTS/CLAUDE/Copilot instructions must reflect TypeScript-first rules. Additional docs under `docs/` track architecture decisions, TypeScript strategy, testing, etc.
- **Data:** All JSON kept under `/game/public/data/`. No direct JSON imports; use loaders like `ddl/loader.ts`, `game/data/*-loader.ts`.
- **Assets:** Asset approval tracked in `game/src/data/approvals.json` and `game/public/data/manifests/`. Approved assets are idempotent.
