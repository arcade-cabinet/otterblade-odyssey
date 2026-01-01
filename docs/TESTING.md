# Testing Guide - Otterblade Odyssey

Complete guide to the game's comprehensive testing infrastructure.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Automated Playthrough System](#automated-playthrough-system)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [Debugging Failed Tests](#debugging-failed-tests)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

Otterblade Odyssey uses a **deterministic, manifest-driven** testing approach:

- **All levels are defined in JSON** - No randomness in level generation
- **AI players use the same systems as enemies** - Consistent behavior
- **Full automated playthroughs** - Validate entire game flow end-to-end
- **Video recordings** - Visual proof of test results

### Key Principle: Test What Players Experience

Our tests don't just check code - they validate that a human player can:
- Complete every level
- Find all collectibles
- Experience smooth gameplay
- Encounter no game-breaking bugs

---

## Test Types

### 1. Unit Tests (`tests/unit/`)

Fast, isolated tests for individual functions and modules.

```bash
# Run all unit tests
pnpm test:unit

# Watch mode
pnpm test:unit --watch

# Coverage
pnpm test:unit --coverage
```

**What to unit test:**
- Data loaders and validators (manifest schemas)
- Utility functions (math, physics helpers)
- State management (Zustand store actions)
- Audio system (registration, playback)

**Example:**
```typescript
// tests/unit/chapter-loaders.test.ts
import { loadChapter, validateChapter } from '@/game/data/chapter-loaders';

test('should load and validate Chapter 0', async () => {
  const chapter = await loadChapter(0);
  expect(validateChapter(chapter)).toBe(true);
  expect(chapter.name).toBe('The Calling');
});
```

### 2. E2E Tests (`e2e/`)

Playwright-based tests that interact with the real game in a browser.

```bash
# Run all E2E tests
pnpm test:e2e

# Run with headed browser (see game visually)
PLAYWRIGHT_MCP=true pnpm test:e2e

# Run specific test file
pnpm test:e2e game.spec.ts

# Debug mode (opens Playwright inspector)
pnpm test:e2e --debug
```

**What to E2E test:**
- UI interactions (menus, buttons)
- Keyboard/mouse controls
- Game state transitions
- Visual rendering (snapshot tests)

### 3. Automated Playthroughs (`e2e/automated-playthroughs/`)

AI-driven full level completions that validate playability.

```bash
# Run all automated playthroughs
pnpm test:playthroughs

# Run specific chapter
pnpm test:e2e automated-playthroughs/chapter-0-playthrough.spec.ts

# With video recording
PLAYWRIGHT_MCP=true pnpm test:playthroughs
```

**What automated playthroughs validate:**
- Level is completable from start to finish
- No impossible jumps or unreachable areas
- Triggers fire correctly
- Performance is acceptable
- No game-breaking bugs

---

## Automated Playthrough System

### Architecture

The automated playthrough system consists of three main components:

#### 1. Level Parser (`tests/factories/level-parser.ts`)

Converts JSON chapter manifests into navigable geometry:

```typescript
import { parseLevel } from '@/tests/factories/level-parser';

const geometry = parseLevel(chapter0Manifest);

// Get platforms
console.log(`${geometry.platforms.length} platforms`);

// Get navigation graph
const path = findPath(
  geometry.navigationGraph,
  startPlatformId,
  endPlatformId
);
```

**What it extracts:**
- Platforms (solid, semi-solid, ice, crumbling)
- Walls and barriers
- Trigger regions
- Navigation graph (for A* pathfinding)

#### 2. AI Player (`tests/factories/ai-player.ts`)

Simulates intelligent player movement using YUKA-like steering:

```typescript
import { AIPlayer } from '@/tests/factories/ai-player';

const aiPlayer = new AIPlayer({
  geometry: parsedLevel,
  goalX: endPosition.x,
  goalY: endPosition.y,
  moveSpeed: 5,
  jumpForce: 15,
  decisionInterval: 500, // ms between decisions
});

// In game loop
const action = aiPlayer.update(currentTime, playerState);
// action = 'move_left' | 'move_right' | 'jump' | 'attack' | ...
```

**How it works:**
1. Uses A* pathfinding on navigation graph
2. Makes decisions every 500ms (configurable)
3. Can perform all player actions (jump, attack, roll, slink)
4. Detects when stuck and tries alternative strategies
5. Tracks progress toward goal

#### 3. Playthrough Factory (`tests/factories/playthrough-factory.ts`)

Orchestrates the test, connecting AI to Playwright:

```typescript
import { executePlaythrough } from '@/tests/factories/playthrough-factory';

const result = await executePlaythrough(page, {
  chapter: chapter0Manifest,
  maxDuration: 180000, // 3 minutes
  screenshotInterval: 5000, // Screenshot every 5s
  videoEnabled: true,
});

if (result.success) {
  console.log(`Completed in ${result.duration}ms`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

### How Automated Playthroughs Work

**Step-by-step flow:**

1. **Parse Level Geometry**
   - Read chapter JSON manifest
   - Extract platforms, walls, triggers
   - Build navigation graph

2. **Create AI Player**
   - Calculate initial path to goal using A*
   - Initialize decision-making system

3. **Start Game**
   - Navigate to game URL
   - Skip intro cinematic
   - Click start button

4. **Main Loop** (runs every 100ms)
   - Get current player state from game
   - AI decides next action based on path
   - Convert action to keyboard commands
   - Press/release keys in browser
   - Take periodic screenshots
   - Check if goal reached or game over

5. **Complete & Report**
   - Release all keys
   - Return success/failure
   - Save video recording
   - Log performance metrics

### Video Recordings

Every automated playthrough can be recorded as MP4 video:

```typescript
// Enable video in test
test.use({ video: 'on' });

const result = await executePlaythrough(page, {
  chapter: myChapter,
  videoEnabled: true,
  // ...
});

// Video saved to: test-results/videos/
```

**Video captures:**
- Full gameplay from start to finish
- AI decision-making in action
- Any bugs or failure points
- Frame rate and performance issues

**Storage:**
- Videos saved in `test-results/videos/`
- Organized by test name and timestamp
- Automatically cleaned up after 7 days (configurable)

---

## Running Tests

### Local Development

```bash
# Quick test (unit tests only)
pnpm test

# Full test suite (unit + E2E)
pnpm test:all

# E2E with visual feedback
PLAYWRIGHT_MCP=true pnpm test:e2e

# Watch mode for TDD
pnpm test:unit --watch
```

### CI/CD

Tests run automatically on:
- Every pull request
- Merge to main branch
- Nightly builds (full playthrough suite)

**CI Configuration:**
- Headless browser mode
- Software rendering (no GPU)
- Parallel test execution
- Video only on failure

---

## Writing New Tests

### Adding a Unit Test

1. Create test file in `tests/unit/`:

```typescript
// tests/unit/my-feature.test.ts
import { describe, test, expect } from 'vitest';
import { myFunction } from '@/game/my-feature';

describe('MyFeature', () => {
  test('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

2. Run to verify:
```bash
pnpm test:unit my-feature.test.ts
```

### Adding an E2E Test

1. Create test file in `e2e/`:

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should interact with feature', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('my-button').click();
  await expect(page.getByText('Result')).toBeVisible();
});
```

2. Run to verify:
```bash
pnpm test:e2e my-feature.spec.ts
```

### Adding an Automated Playthrough

1. Create test file in `e2e/automated-playthroughs/`:

```typescript
// e2e/automated-playthroughs/chapter-X-playthrough.spec.ts
import { test, expect } from '@playwright/test';
import { executePlaythrough } from '@/tests/factories/playthrough-factory';
import chapterXManifest from '@/data/manifests/chapters/chapter-X.json';

test('Chapter X automated playthrough', async ({ page }) => {
  const result = await executePlaythrough(page, {
    chapter: chapterXManifest,
    maxDuration: 180000,
    screenshotInterval: 5000,
    videoEnabled: true,
  });

  expect(result.success).toBe(true);
});
```

2. Run to verify:
```bash
PLAYWRIGHT_MCP=true pnpm test:e2e automated-playthroughs/chapter-X-playthrough.spec.ts
```

---

## Debugging Failed Tests

### 1. Check Test Output

```bash
# Run with verbose output
pnpm test:e2e --reporter=list

# See detailed errors
pnpm test:e2e --trace on
```

### 2. Visual Debugging

```bash
# Open Playwright UI
pnpm test:e2e --ui

# Debug specific test
pnpm test:e2e --debug my-test.spec.ts
```

### 3. Video Analysis

Failed automated playthroughs save video:

```bash
# Videos stored in:
test-results/
  └── chapter-0-playthrough/
      └── video.webm
```

Watch the video to see:
- Where AI got stuck
- What triggered the failure
- Performance issues
- Unexpected game behavior

### 4. Screenshot Analysis

Screenshots taken at regular intervals:

```bash
test-results/
  └── playthrough-0-5000.png   # At 5 seconds
  └── playthrough-0-10000.png  # At 10 seconds
  └── playthrough-0-15000.png  # At 15 seconds
```

### 5. AI Player Logs

Check console output for AI decisions:

```
AI Player: Found path with 12 waypoints
Progress: 25.0% (5000ms elapsed)
Progress: 50.0% (10000ms elapsed)
AI Player: Stuck detected, attempting jump
Progress: 75.0% (15000ms elapsed)
AI Player reached goal!
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e

  automated-playthroughs:
    runs-on: ubuntu-latest
    # Only on main branch or nightly
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:playthroughs
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playthrough-videos
          path: test-results/videos/
```

### Test Artifacts

On failure, CI uploads:
- Videos of failed tests
- Screenshots at failure point
- Playwright traces
- Console logs

---

## Best Practices

### Do's

✅ **Write deterministic tests** - Use fixed seeds, avoid random numbers
✅ **Test user journeys** - Test full flows, not just isolated units
✅ **Use data-testid** - Tag UI elements for reliable selection
✅ **Record videos** - Visual proof is invaluable for debugging
✅ **Test on real levels** - Use actual chapter manifests, not mocks

### Don'ts

❌ **Don't use timeouts** - Wait for conditions instead
❌ **Don't mock the game engine** - Test the real thing
❌ **Don't skip flaky tests** - Fix the root cause
❌ **Don't test implementation details** - Test behavior
❌ **Don't hardcode coordinates** - Use level geometry

---

## Troubleshooting

### "AI Player got stuck"

**Symptoms:** Automated playthrough fails with "stuck" error

**Causes:**
- Impossible jump (too high/far)
- Missing platform in navigation graph
- Collision bug preventing movement

**Fix:**
1. Watch video recording
2. Check level geometry at stuck point
3. Adjust platform placement or add intermediate platforms
4. Update navigation graph building logic if needed

### "Video recording failed"

**Symptoms:** No video file generated

**Causes:**
- Playwright not installed with deps
- Insufficient disk space
- Video codec issues

**Fix:**
```bash
# Reinstall Playwright with system dependencies
pnpm playwright install --with-deps chromium

# Check disk space
df -h

# Try different video format
test.use({ video: { mode: 'on', size: { width: 1280, height: 720 } } });
```

### "Player state not available"

**Symptoms:** `getPlayerState()` returns default values

**Causes:**
- Test API not initialized
- Running in production mode
- Game not fully loaded

**Fix:**
1. Ensure `initializeTestAPI()` called in App.tsx
2. Check `import.meta.env.MODE` is 'development' or 'test'
3. Wait for game to be ready:
```typescript
await page.waitForFunction(() => window.__GAME_TEST_API__?.isReady());
```

---

## Future Enhancements

- [ ] Performance profiling during playthroughs (FPS tracking)
- [ ] Audio glitch detection (monitor for pops/clicks)
- [ ] Visual regression testing (compare screenshots)
- [ ] Multi-player testing (co-op mode validation)
- [ ] Mobile device testing (iOS/Android emulators)
- [ ] Accessibility testing (screen reader, keyboard-only)

---

*"The tests serve the players. Every test exists to ensure a smooth, bug-free experience."*
