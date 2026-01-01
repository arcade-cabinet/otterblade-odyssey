# Otterblade Odyssey: Testing Strategy

*Comprehensive testing guide for quality assurance*

---

## Overview

Otterblade Odyssey employs a multi-layered testing strategy:

| Layer | Framework | Purpose | Location |
|-------|-----------|---------|----------|
| Unit | Vitest | Component and function isolation | `tests/unit/` |
| Integration | Vitest | System interaction | `tests/unit/` |
| E2E | Playwright | Full user flows | `e2e/` |
| Visual | Playwright | Screenshot regression | `e2e/visual-regression.spec.ts` |

---

## Quick Commands

```bash
# Run all unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run unit tests with coverage
pnpm test:coverage

# Run E2E tests (headless, CI-safe)
pnpm playwright test

# Run E2E tests with full WebGL support
PLAYWRIGHT_MCP=true pnpm playwright test

# Update visual regression snapshots
PLAYWRIGHT_MCP=true pnpm playwright test --update-snapshots

# Run specific test file
pnpm test tests/unit/store.test.ts
```

---

## Test Structure

### Unit Tests (`tests/unit/`)

| File | Coverage | Description |
|------|----------|-------------|
| `store.test.ts` | Game state | Zustand store actions and state management |
| `ecs.test.ts` | ECS | Miniplex world, entities, systems, queries |
| `loaders.test.ts` | Data | JSON loading with Zod validation |
| `utils.test.ts` | Utilities | Math helpers (lerp, clamp, smoothstep) |

### E2E Tests (`e2e/`)

| File | Coverage | Description |
|------|----------|-------------|
| `game.spec.ts` | Game flow | Start menu, gameplay, controls, accessibility |
| `visual-regression.spec.ts` | Visuals | Screenshot comparison across screens |

---

## Test Setup

### Unit Test Environment

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';

// Mock WebGL context (not available in happy-dom)
class MockWebGLRenderingContext {
  getParameter = () => null;
  getExtension = () => null;
  createShader = () => ({});
  createProgram = () => ({});
  // ... other WebGL methods
}

Object.defineProperty(window, 'WebGLRenderingContext', {
  value: MockWebGLRenderingContext,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16) as unknown as number;
};
global.cancelAnimationFrame = (id) => clearTimeout(id);
```

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 25,
      functions: 25,
      branches: 25,
      statements: 25,
    },
  },
});
```

---

## Writing Unit Tests

### Store Tests

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/game/store';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.setState({
      health: 5,
      shards: 0,
      gameStarted: false,
      gameOver: false,
      // ... initial state
    });
  });

  describe('Health Management', () => {
    it('should reduce health when taking damage', () => {
      const { takeDamage } = useStore.getState();

      takeDamage(2);

      expect(useStore.getState().health).toBe(3);
    });

    it('should not reduce health below zero', () => {
      const { takeDamage } = useStore.getState();

      takeDamage(10);

      expect(useStore.getState().health).toBe(0);
    });

    it('should trigger game over when health reaches zero', () => {
      useStore.setState({ health: 1 });
      const { takeDamage } = useStore.getState();

      takeDamage(1);

      expect(useStore.getState().gameOver).toBe(true);
    });
  });
});
```

### ECS Tests

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { world, queries, createPlayer, createEnemy } from '@/game/ecs/world';
import { movementSystem, gravitySystem } from '@/game/ecs/systems';

describe('ECS World', () => {
  beforeEach(() => {
    // Clear all entities before each test
    for (const entity of world) {
      world.remove(entity);
    }
  });

  describe('Entity Creation', () => {
    it('should create player entity with required components', () => {
      const player = createPlayer({ x: 0, y: 10, z: 0 });

      expect(player.player).toBe(true);
      expect(player.position).toEqual({ x: 0, y: 10, z: 0 });
      expect(player.velocity).toBeDefined();
      expect(player.health).toBeDefined();
    });
  });

  describe('Query Filtering', () => {
    it('should filter moving entities correctly', () => {
      createPlayer({ x: 0, y: 0, z: 0 });
      world.add({ position: { x: 5, y: 5, z: 0 } }); // No velocity

      const moving = [...queries.moving];

      expect(moving.length).toBe(1);
      expect(moving[0].player).toBe(true);
    });
  });

  describe('Systems', () => {
    it('should update position based on velocity', () => {
      const entity = world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 10, y: 0, z: 0 },
      });

      movementSystem(0.016); // 16ms frame

      expect(entity.position.x).toBeCloseTo(0.16, 2);
    });
  });
});
```

### Data Loader Tests

```typescript
import { describe, expect, it } from 'vitest';
import { loadChapters, loadBiomes, getChapter, getBiomeForChapter } from '@/game/data/loaders';

describe('Data Loaders', () => {
  describe('loadChapters', () => {
    it('should load all 10 chapters', () => {
      const chapters = loadChapters();

      expect(chapters).toHaveLength(10);
    });

    it('should have valid chapter structure', () => {
      const chapters = loadChapters();

      for (const chapter of chapters) {
        expect(chapter.id).toBeGreaterThanOrEqual(0);
        expect(chapter.id).toBeLessThanOrEqual(9);
        expect(chapter.name).toBeTruthy();
        expect(chapter.quest).toBeTruthy();
        expect(chapter.assets.chapterPlate).toBeTruthy();
      }
    });
  });

  describe('getChapter', () => {
    it('should return chapter by id', () => {
      const chapter = getChapter(0);

      expect(chapter?.name).toBe('THE CALLING');
      expect(chapter?.setting).toBe("Finn's Cottage");
    });

    it('should return undefined for invalid id', () => {
      const chapter = getChapter(99);

      expect(chapter).toBeUndefined();
    });
  });
});
```

### Utility Tests

```typescript
import { describe, expect, it } from 'vitest';
import { lerp, clamp, smoothstep, degToRad } from '@/game/utils';

describe('Math Utilities', () => {
  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should extrapolate beyond bounds', () => {
      expect(lerp(0, 10, 1.5)).toBe(15);
      expect(lerp(0, 10, -0.5)).toBe(-5);
    });
  });

  describe('clamp', () => {
    it('should clamp values within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('smoothstep', () => {
    it('should return 0 at edge0', () => {
      expect(smoothstep(0, 10, 0)).toBe(0);
    });

    it('should return 1 at edge1', () => {
      expect(smoothstep(0, 10, 10)).toBe(1);
    });

    it('should smoothly interpolate between edges', () => {
      const mid = smoothstep(0, 10, 5);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
    });
  });
});
```

---

## Writing E2E Tests

### Basic Page Tests

```typescript
import { test, expect } from '@playwright/test';

// Check if running with full MCP capabilities
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === 'true';

test.describe('Game Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Otterblade Odyssey/);
  });

  test('should display start menu', async ({ page }) => {
    await page.waitForTimeout(2000);

    const startMenu = page.getByTestId('start-menu');
    await expect(startMenu).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Otterblade Odyssey')).toBeVisible();
    await expect(page.getByTestId('button-start-game')).toBeVisible();
  });
});
```

### Gameplay Tests

```typescript
test.describe('Gameplay', () => {
  test('should start game when clicking begin', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const startButton = page.getByTestId('button-start-game');
    await startButton.click();

    // Start menu should hide
    await expect(page.getByTestId('start-menu')).not.toBeVisible({ timeout: 5000 });

    // HUD should appear
    await expect(page.getByTestId('hud')).toBeVisible();
  });

  test('should respond to keyboard input', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Start game
    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    // Press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space'); // Jump

    // Game should still be running (no crash)
    await expect(page.getByTestId('hud')).toBeVisible();
  });
});
```

### Conditional Tests (WebGL Required)

```typescript
test.describe('WebGL Features', () => {
  // Only run these tests with full GPU support
  test.skip(!hasMcpSupport, 'Requires MCP/GPU support');

  test('should render game canvas correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('game-start-menu.png');
  });
});
```

### Visual Regression Tests

```typescript
test.describe('Visual Regression', () => {
  test.skip(!hasMcpSupport, 'Requires MCP/GPU support');

  test('start menu should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('start-menu.png', {
      maxDiffPixels: 100,
    });
  });

  test('HUD should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(2000);

    const hud = page.getByTestId('hud');
    await expect(hud).toHaveScreenshot('hud.png');
  });
});
```

---

## Test Data Patterns

### Test Fixtures

```typescript
// tests/fixtures/entities.ts
export const mockPlayer = () => ({
  position: { x: 0, y: 10, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  player: true as const,
  health: { current: 5, max: 5 },
});

export const mockEnemy = (type: EnemyType = 'skirmisher') => ({
  position: { x: 20, y: 10, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  enemy: { type, state: { type: 'idle' as const } },
  health: { current: 3, max: 3 },
});
```

### Factory Functions

```typescript
// tests/factories/chapterFactory.ts
export function createTestChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 0,
    name: 'Test Chapter',
    setting: 'Test Setting',
    quest: 'Test Quest',
    hasBoss: false,
    bossName: null,
    assets: {
      chapterPlate: 'test_plate.png',
      parallaxBg: 'test_bg.png',
    },
    ...overrides,
  };
}
```

---

## Coverage Requirements

### Current Thresholds

```typescript
// vitest.config.ts
coverage: {
  lines: 25,
  functions: 25,
  branches: 25,
  statements: 25,
}
```

### Target Thresholds (Future)

| Metric | Current | Target |
|--------|---------|--------|
| Lines | 25% | 80% |
| Functions | 25% | 80% |
| Branches | 25% | 70% |
| Statements | 25% | 80% |

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# Output locations:
# - Terminal: text summary
# - coverage/lcov-report/index.html: Interactive HTML
# - coverage/lcov.info: CI integration
```

---

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml (excerpt)
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc'

    - name: Install pnpm
      uses: pnpm/action-setup@v4

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run unit tests
      run: pnpm test:coverage

    - name: Upload coverage
      uses: coverallsapp/github-action@v2
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

### E2E in CI

```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Install Playwright browsers
      run: pnpm playwright install --with-deps

    - name: Build application
      run: pnpm build

    - name: Run E2E tests
      run: pnpm playwright test
```

---

## Debugging Tests

### Vitest Debug Mode

```bash
# Run with verbose output
pnpm test -- --reporter=verbose

# Run single test file
pnpm test tests/unit/store.test.ts

# Run tests matching pattern
pnpm test -- --grep "should start game"
```

### Playwright Debug Mode

```bash
# Run with headed browser
pnpm playwright test --headed

# Run with Playwright Inspector
pnpm playwright test --debug

# Run specific test
pnpm playwright test game.spec.ts:94

# Generate trace on failure
pnpm playwright test --trace on
```

### Common Issues

#### 1. WebGL Mock Errors

If tests fail with WebGL-related errors, ensure mocks are set up in `tests/setup.ts`.

#### 2. Timing Issues

Use `waitForTimeout` judiciously. Prefer `waitForSelector` or `expect().toBeVisible()` with timeouts.

#### 3. State Leakage

Always reset state in `beforeEach`:

```typescript
beforeEach(() => {
  useStore.setState(initialState);
  for (const entity of world) {
    world.remove(entity);
  }
});
```

---

## Test Checklist

Before submitting code, verify:

- [ ] All existing tests pass (`pnpm test`)
- [ ] New functionality has tests
- [ ] Coverage thresholds met (`pnpm test:coverage`)
- [ ] E2E tests pass (`pnpm playwright test`)
- [ ] No skipped tests without reason
- [ ] Test names are descriptive
- [ ] No hardcoded timeouts where avoidable

---

## Reference

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Code patterns
- [AGENTS.md](./AGENTS.md) - Quality standards
