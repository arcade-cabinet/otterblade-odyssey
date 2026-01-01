# Testing Guide for Otterblade Odyssey

This directory contains comprehensive testing documentation for the Otterblade Odyssey game project.

## Table of Contents

1. [Level Test Factory](./level-test-factory.md) - Automated playthrough testing system
2. [Unit Testing](./unit-testing.md) - Testing game systems and components
3. [E2E Testing](./e2e-testing.md) - End-to-end browser testing with Playwright
4. [Performance Testing](./performance-testing.md) - Frame rate and hiccup detection
5. [CI/CD Testing](./ci-cd-testing.md) - Automated testing in GitHub Actions

## Quick Start

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests (headless)
pnpm test:e2e

# E2E tests with WebGL/Canvas support
PLAYWRIGHT_MCP=true pnpm test:e2e

# Level scenario tests (requires MCP)
PLAYWRIGHT_MCP=true pnpm test:e2e level-scenarios.spec.ts

# Full playthrough with recording
PLAYWRIGHT_MCP=true RECORD_PLAYTHROUGHS=true pnpm test:e2e level-scenarios.spec.ts
```

### Test Organization

```
tests/
├── unit/                      # Unit tests for game systems
│   ├── store.test.ts         # Zustand state management
│   ├── ecs.test.ts           # Entity Component System
│   ├── loaders.test.ts       # Data loaders
│   ├── chapter-manifests.test.ts
│   └── npc-loaders.test.ts
e2e/
├── helpers/
│   └── level-factory.ts      # Level Test Factory system
├── game.spec.ts              # Basic game flow tests
├── level-scenarios.spec.ts   # Automated playthrough tests
└── visual-regression.spec.ts # Visual regression tests
```

## Key Testing Concepts

### Deterministic Level Testing

The Level Test Factory converts JSON chapter manifests into executable Playwright test scenarios. This allows us to:

1. **Predict player paths** using physics simulation
2. **Validate game flow** at critical points
3. **Detect hiccups** via performance monitoring
4. **Record playthroughs** as MP4 videos for QA review

### Architecture Alignment

All tests align with the architecture defined in [IMPLEMENTATION.md](../../IMPLEMENTATION.md):

- **Rendering**: Canvas 2D API (not WebGL/Three.js)
- **Physics**: Matter.js 2D rigid body physics
- **AI**: Yuka for steering behaviors and FSMs
- **State**: Zustand with Capacitor-aware persistence

### Test Philosophy

1. **Comprehensive Coverage**: Test every game system
2. **Deterministic Scenarios**: Reproducible test runs
3. **Performance Aware**: Monitor for frame drops and stuttering
4. **Brand Compliant**: Verify visual consistency with BRAND.md
5. **Accessibility**: Validate keyboard, gamepad, and touch controls

## Writing New Tests

### Unit Tests

Follow the Jest/Vitest pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { someFunction } from '@/game/some-module';

describe('SomeModule', () => {
  it('should do something', () => {
    const result = someFunction();
    expect(result).toBe(expected);
  });
});
```

### E2E Tests

Use Playwright with proper test IDs:

```typescript
import { test, expect } from '@playwright/test';

test('should complete level', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-game').click();
  // ... test actions
  await expect(page.getByTestId('level-complete')).toBeVisible();
});
```

### Level Scenario Tests

Use the Level Test Factory:

```typescript
import { LevelTestFactory, PlaywrightLevelExecutor } from './helpers/level-factory';

test('Chapter 0 playthrough', async ({ page }) => {
  const chapter = await loadChapterManifest(0);
  const factory = new LevelTestFactory(chapter, 0);
  const scenario = factory.generateScenario();

  const executor = new PlaywrightLevelExecutor(page, { recording: true });
  const result = await executor.executeScenario(scenario);

  expect(result.passed).toBe(true);
});
```

## Test Data

Tests use JSON manifests from `client/src/data/manifests/`:

- `chapters/chapter-*.json` - Level definitions
- `enemies.json` - Enemy types and behaviors
- `npcs.json` - NPC characters and dialogues
- `items.json` - Collectibles and interactables
- `sounds.json` - Audio assets

## CI/CD Integration

Tests run automatically in GitHub Actions:

1. **Pull Request** - Unit and basic E2E tests
2. **Main Branch** - Full test suite including visual regression
3. **Release** - Full playthrough tests with video recording

See [.github/workflows/cd.yml](../../.github/workflows/cd.yml) for configuration.

## Debugging Tests

### Local Debugging

```bash
# Run with headed browser
pnpm test:e2e --headed

# Debug specific test
pnpm test:e2e --headed --debug level-scenarios.spec.ts

# View Playwright trace
pnpm playwright show-trace trace.zip
```

### CI Debugging

1. Check test artifacts in GitHub Actions
2. Download trace files for failed tests
3. Review video recordings (if enabled)

## Performance Benchmarks

Target performance metrics:

- **Frame Rate**: 60 FPS (16.67ms per frame)
- **Frame Drops**: <5 medium severity per level
- **Load Time**: <2 seconds to game start
- **Level Transition**: <500ms

## Contributing

When adding new game features:

1. Write unit tests for new systems
2. Add E2E tests for new user flows
3. Update Level Test Factory if level structure changes
4. Add performance tests for intensive features
5. Document new test patterns in this guide

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [IMPLEMENTATION.md](../../IMPLEMENTATION.md) - Game architecture
- [BRAND.md](../../BRAND.md) - Visual brand guidelines
