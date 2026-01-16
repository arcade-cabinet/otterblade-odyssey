# Active Context

## Focus

- Migrate every runtime subsystem to TypeScript and ensure chapter 0 is playable end-to-end.
- Replace legacy JS no-op or placeholder systems with modular implementations (lanterns, bells, hazards, renderer, player controller, data loaders).
- Align docs (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/*.md`) with the TypeScript-first story.
- Support manifest-driven data from `game/public/data` with async loaders for chapters, NPCs, biomes, and assets.

## Recent changes

- Wired collision handling into `OtterbladeGame.tsx` with interaction/collectible/NPC support and added toast/particle burst helpers.
- Added slow-motion time scaling in the game loop and exposed control via `gameStateObj.setSlowMotion`.
- Updated `createSceneRenderer` to render particle bursts and NPC facing fallback via `facingDirection`.
- Fixed level-factory hazard handling and moving platform config to align with `MovingPlatform` expectations.
- Added a TypeScript `TriggerSystem` to drive chapter trigger actions (camera pan, music, quest completion, cinematics).
- Converted quest system and its tests to TypeScript and removed legacy JS trigger/quest system files.
- Ported Zephyros Boss AI to TypeScript and wired boss spawning when a chapter manifest defines a boss.
- Removed superseded legacy JS modules (core loop, old renderers, old physics, old collision system) and replaced DebugSystem with a minimal TS overlay.
- Aligned `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` with `.clinerules`, TypeScript-only guidance, and current data paths (`game/public/data` + `game/src/data/approvals.json`).

## Next steps

1. Validate chapter 0 trigger actions (blade, door, threshold) and confirm camera pans/cinematics behave as expected.
2. Ensure cinematic assets and sound IDs referenced by chapter 0 exist/resolve in `game/src/assets` and the manifests.
3. Run broader Playwright coverage once triggers/cinematics are verified; update memory bank with results.

## Helpful notes for next agent

- TriggerSystem now handles `change_music`, `show_toast`, `slow_motion`, `camera_pan`, and `play_cinematic`. Camera pans resolve to interaction/NPC positions via IDs.
- Cinematics are resolved by filename from `game/src/assets/videos` using `import.meta.glob` and manifest mapping from `cinematics.json`.
- Boss AI is live for chapters that define `boss` in the manifest (e.g., chapter 8), and frost particles render in the scene renderer.
- Debug overlay is minimal and dev-only (`DebugSystem.ts: F1–F5`), with no collider/AI visuals wired yet.

## Decisions & Considerations

- No code stubs — every exported system must implement production behavior before merging.
- All manifest access occurs through async loaders; JSON imports are banned.
- TypeScript is the language of record; Solid UI, game loop, and data layers operate in `.ts`/`.tsx`.
- Module paths and caching must work in both browser (fetch) and Node (fs) contexts for tests and builds.

## Learnings

- Creating a dedicated `createSceneRenderer` and `HazardSystem` reduced duplicated canvas logic and allowed the renderer to depend on typed manifests instead of ad-hoc global state.
- TypeScript conversions reveal gaps in environment detection (e.g., `inputManager!` asserts on the Solid component until the loader is ready; guard for undefined cases in SSR builds).
