# Level Test Factory

The Level Test Factory converts chapter manifests into deterministic Playwright scenarios that prove each chapter is completable.

## Flow
```
client/src/data/manifests/chapters/*.json
        ↓ (game/src/ddl/loader.js)
Level parser (tests/factories/level-parser.ts)
        ↓
Navigation graph + objectives
        ↓
AI player (tests/factories/ai-player.ts)
        ↓
Playwright executor (tests/factories/playthrough-factory.ts)
        ↓
Recorded run + assertions
```

## Key Components
- **Level Parser** – Reads chapter manifests and builds platform lists, triggers, and navigation graphs.
- **AI Player (YUKA)** – Plans a deterministic route using shared physics constants (gravity 1.5, jump force from constants module).
- **Playthrough Executor** – Drives keyboard/gamepad/touch inputs in the Astro app and records optional video.

## Usage
```javascript
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

// In a Playwright spec
test('chapter 2 completes', async ({ page }) => {
  const result = await executePlaythrough(page, { chapterId: 2, video: false });
  expect(result.success).toBe(true);
});
```

### Recording
```bash
PLAYWRIGHT_MCP=true pnpm test:journey   # headed + video
```
Videos/traces land in `playwright-report/`.

## Determinism Rules
- Physics and movement numbers come from the same constants used in the runtime.
- No random seeds in tests; navigation graph + AI inputs must be reproducible.
- If a manifest changes geometry, regenerate the navigation graph in the factories before running.

## Extending the Factory
- Add new action types (e.g., interact, glide) in the executor; keep them small and data-driven.
- Keep files under 200 lines; split helpers if needed.
- Update docs (`docs/TESTING.md`, this file) whenever commands or behaviors change.
