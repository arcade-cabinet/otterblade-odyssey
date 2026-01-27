# Product Context

Why this project exists:

- Provide a polished web-based adventure that reimagines the emotional core of anthropomorphic tales in a new Willowmere Hearthhold setting.
- Ship a stable demo (chapter 0) playable on the web with consistent narrative, responsive controls, and atmospheric presentation.

Problems it solves:

- Eliminates previous monolithic JavaScript headaches by reorganizing engines, factories, and UI into modular TypeScript components.
- Centralizes all chapter data through manifest-driven loaders so content teams can iterate on JSON without touching runtime logic.
- Aligns QA, docs, and testing with the new stack (Astro + Solid + Matter.js + TypeScript + Biome + pnpm) and ensures E2E coverage via Playwright.

How it should work:

- Manifest loaders asynchronously fetch data from `/data/manifests/` and expose typed sync helpers once preloaded.
- Game loops and systems are orchestrated by a Solid component (`OtterbladeGame.tsx`) that instantiates `createGameLoop`, `PlayerController`, audio, and scene renderer while providing HUD/touch UI.
- Runtime state lives in Zustand and is persisted to `localStorage`.

User experience goals:

1. Chapter 0 loads quickly, provides responsive controls, and visually represents the Willowmere lore consistently.
2. Touch controls, keyboard, and gamepads are unified; indicators like health, warmth, and quest progress stay in sync with the engine.
3. No “TODO” or console sprawl remains in production paths — every system is modular, fully implemented, and documented with JSDoc.
