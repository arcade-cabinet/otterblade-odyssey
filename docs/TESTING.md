# Testing Guide - Otterblade Odyssey

> How we validate the Astro + Solid + Matter.js runtime using manifest-driven tests.

## Testing Philosophy
- **Deterministic**: Levels, physics values, and AI inputs come from JSON manifests.
- **Player-centric**: Tests prove a player can complete every chapter with stable performance.
- **Shared Data**: Runtime and tests consume the same navigation graphs and constants.
- **Evidence-first**: Capture videos/traces for complex flows when possible.

## Test Types

### Unit Tests (`tests/unit/`)
Fast checks for loaders, helpers, and systems.

```bash
pnpm test:unit
pnpm test:unit --watch
```

Focus areas:
- Manifest loaders/validators (`game/src/ddl/`)
- Physics helpers and collision filters
- Store actions/selectors
- AI utilities (vision cones, timers)

### E2E Tests (`e2e/`)
Playwright coverage for UI flows and core gameplay entry points.

```bash
pnpm test:e2e
pnpm test:e2e --ui                # Inspector
PLAYWRIGHT_MCP=true pnpm test:e2e  # Headed/video
```

Validate:
- Start menu, HUD, and overlays render in Astro/Solid
- Input paths (keyboard/touch/gamepad) reach the game loop
- Canvas renders after Matter.js init

### Automated Playthroughs (`e2e/automated-playthroughs/`)
AI-driven completions of each chapter plus the full journey.

```bash
pnpm test:playthroughs
pnpm test:journey
PLAYWRIGHT_MCP=true pnpm test:journey   # Headed + video
```

Validate:
- Chapter objectives, triggers, and boss flags fire in order
- Navigation graphs match manifest geometry
- No impossible jumps or collision dead-ends

## Writing Tests

### Unit Test Example (Vitest, ES modules)
```javascript
import { describe, it, expect } from 'vitest';
import { loadChapterManifest } from '../../game/src/ddl/loader.js';

describe('chapter loader', () => {
  it('loads chapter 0', async () => {
    const manifest = await loadChapterManifest(0);
    expect(manifest.levelDefinition.id).toBe(0);
  });
});
```

### E2E Example (Playwright)
```javascript
import { test, expect } from '@playwright/test';

test('game boots to HUD', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start-button')).toBeVisible();
  await page.getByTestId('start-button').click();
  await expect(page.locator('canvas')).toBeVisible();
});
```

### Playthrough Hook
Use the shared factories under `tests/factories/` for deterministic runs.

```javascript
import { executePlaythrough } from '../tests/factories/playthrough-factory';

test('chapter 1 path is completable', async ({ page }) => {
  const result = await executePlaythrough(page, { chapterId: 1 });
  expect(result.success).toBe(true);
});
```

## Debugging Failures
- Re-run with traces: `pnpm test:e2e --trace on`
- Use headed mode to watch input timing issues.
- Check manifest data first—most failures come from mismatched geometry or triggers.
- Verify physics constants are identical between runtime and tests.

## CI/CD
- Playwright and Vitest run in GitHub Actions; keep tests headless-safe.
- Videos are stored on failure; review `playwright-report/` artifacts.
- Always run `pnpm biome check .` before pushing to catch lint/style issues.
