# UI Testing Guide (Solid/Astro)

> React/Vite runtime is retired. This guide explains how to test Solid islands and Astro UI surfaces that wrap the Matter.js game.

## Stack
- **Framework**: Astro pages with Solid islands
- **Renderer**: Canvas 2D + Matter.js for gameplay visuals
- **Testing Tools**: Vitest, `@testing-library/dom`, `happy-dom` (for DOM env), Playwright for end-to-end. Add `@solidjs/testing-library` when you need JSX helpers.

## Principles
1. Keep components under 200 lines; prefer composition over mocks.
2. Use test IDs for HUD/menu controls, not for gameplay rendering (Canvas is validated via Playwright).
3. Avoid React-specific helpers—use DOM-focused utilities that work with Solid.

## Running Tests
```bash
pnpm test:unit           # Component/helpers
pnpm test:e2e            # Browser flows
PLAYWRIGHT_MCP=true pnpm test:e2e   # Headed/video when debugging
```

## Unit Test Example (Solid island)
```javascript
import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import HUD from '../../game/src/components/HUD.jsx';
import { useGameStore } from '../../game/src/game/store.js';

vi.mock('../../game/src/game/store.js', () => ({
  useGameStore: (selector) => selector({ health: 3, maxHealth: 5, shards: 2 }),
}));

describe('HUD', () => {
  it('shows health and shards', () => {
    render(() => <HUD />);
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(screen.getByText('2 shards')).toBeInTheDocument();
  });
});
```

## E2E Example (Astro page)
```javascript
import { test, expect } from '@playwright/test';

test('start menu flows into gameplay', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start-button')).toBeVisible();
  await page.getByTestId('start-button').click();
  await expect(page.locator('canvas')).toBeVisible();
});
```

## What Not to Do
- Do not reintroduce React testing utilities; the runtime is Solid.
- Do not snapshot Canvas; validate rendering through behavior (Playwright) instead.
- Do not rely on global state mutations in tests—mock store selectors instead.

## Migration Note
If you find leftover React tests, mark them as legacy and replace them with Solid equivalents as features migrate into `game/`.
