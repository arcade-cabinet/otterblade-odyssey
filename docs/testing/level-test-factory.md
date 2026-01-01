# Level Test Factory

The Level Test Factory is an innovative testing system that converts JSON chapter manifests into executable Playwright test scenarios, enabling fully automated playthrough testing with deterministic results.

## Architecture

### Overview

```
JSON Chapter Manifest
         ↓
   Level Test Factory
         ↓
   Test Scenario (actions + assertions)
         ↓
   Playwright Level Executor
         ↓
   Browser Automation + Recording
         ↓
   Test Results + MP4 Video
```

### Components

1. **LevelTestFactory** - Converts chapter manifests into test scenarios
2. **PlaywrightLevelExecutor** - Executes scenarios in the browser
3. **Test Actions** - Atomic gameplay actions (move, jump, attack, etc.)
4. **Critical Points** - Validation checkpoints throughout the level
5. **Performance Monitoring** - Frame drop and hiccup detection

## Core Concepts

### Deterministic Gameplay

Since all levels are defined in JSON manifests, the game state is fully deterministic:

- **Platform positions** are fixed
- **Enemy spawns** are predefined
- **Trigger regions** are clearly defined
- **Item locations** are static

This allows us to:
1. Predict the optimal path through a level
2. Simulate player movement with physics
3. Validate that the path works in practice
4. Detect any deviations or issues

### Yuka AI Integration

The test factory uses Yuka's pathfinding and steering behaviors to:

- Calculate optimal movement paths
- Account for enemy AI variability
- Simulate realistic player decision-making
- Validate trigger sequences

### Physics Simulation

Uses Matter.js constants from IMPLEMENTATION.md:

```typescript
const PHYSICS = {
  GRAVITY: 1.5,
  PLAYER_MOVE_SPEED: 5,
  PLAYER_JUMP_FORCE: -15,
  PLAYER_MAX_SPEED: 10,
  FRICTION: 0.1,
  AIR_RESISTANCE: 0.02,
  TERMINAL_VELOCITY: 20,
  COYOTE_TIME: 6,
  JUMP_BUFFER: 10,
};
```

These constants allow accurate prediction of:
- Jump distances
- Fall times
- Movement speeds
- Platform reachability

## Usage

### Basic Usage

```typescript
import { LevelTestFactory, PlaywrightLevelExecutor } from './helpers/level-factory';

test('Chapter 0 playthrough', async ({ page }) => {
  // Load chapter manifest
  const chapter = await loadChapterManifest(0);

  // Create factory and generate scenario
  const factory = new LevelTestFactory(chapter, 0);
  const scenario = factory.generateScenario();

  // Execute scenario
  const executor = new PlaywrightLevelExecutor(page);
  const result = await executor.executeScenario(scenario);

  // Assertions
  expect(result.passed).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

### With Video Recording

```typescript
const executor = new PlaywrightLevelExecutor(page, {
  recording: true,
});

const result = await executor.executeScenario(scenario);

console.log(`Video saved to: ${result.videoPath}`);
```

### Custom Scenarios

```typescript
// Generate base scenario
const scenario = factory.generateScenario();

// Add custom actions
scenario.actions.push({
  type: 'interact',
  target: { x: 500, y: 300 },
  description: 'Talk to NPC',
});

// Add custom assertion
scenario.actions.push({
  type: 'assert',
  assertion: {
    property: 'dialogueActive',
    condition: 'equals',
    value: true,
  },
});

// Execute modified scenario
const result = await executor.executeScenario(scenario);
```

## Test Scenario Structure

### LevelTestScenario

```typescript
interface LevelTestScenario {
  chapterId: number;
  chapterName: string;
  startPosition: { x: number; y: number };
  objectives: Array<{
    type: 'reach' | 'defeat' | 'collect' | 'interact';
    target: string | { x: number; y: number };
    description: string;
  }>;
  actions: TestAction[];
  expectedDuration: number;
  criticalPoints: Array<{
    position: { x: number; y: number };
    description: string;
    validationFn: string;
  }>;
}
```

### TestAction Types

#### Move Action

```typescript
{
  type: 'move',
  direction: 'left' | 'right',
  duration: 1000, // milliseconds
}
```

#### Jump Action

```typescript
{
  type: 'jump',
  target: { x: 500, y: 200 }, // destination platform
}
```

#### Attack Action

```typescript
{
  type: 'attack',
  duration: 1000, // combat time
}
```

#### Wait Action

```typescript
{
  type: 'wait',
  duration: 500,
}
```

#### Interact Action

```typescript
{
  type: 'interact',
  target: 'npc_elder_badger',
}
```

#### Assert Action

```typescript
{
  type: 'assert',
  assertion: {
    property: 'health',
    condition: 'greaterThan',
    value: 50,
  },
}
```

## Scenario Generation

### How It Works

1. **Extract Objectives** - Parse chapter manifest for quests, enemies, collectibles
2. **Plan Optimal Path** - Calculate shortest path through level segments
3. **Generate Actions** - Convert path into test actions
4. **Identify Critical Points** - Find trigger regions and validation checkpoints
5. **Estimate Duration** - Calculate expected test time

### Path Planning Algorithm

```
For each segment in level:
  1. Calculate movement time to segment end
  2. Identify platforms requiring jumps
  3. Detect enemy encounters
  4. Add collectible pickups
  5. Check for trigger regions

Result: Sequence of test actions
```

### Critical Point Detection

Critical points are automatically identified:

- **Trigger regions** - Where scripted events occur
- **Enemy encounters** - Combat validation points
- **Platform transitions** - Jump accuracy checks
- **Checkpoints** - Save state validation
- **Quest objectives** - Goal completion checks

## Execution

### PlaywrightLevelExecutor

The executor translates test actions into browser automation:

```typescript
class PlaywrightLevelExecutor {
  // Load chapter and initialize game
  async loadChapter(chapterId: number): Promise<void>

  // Execute single action
  async executeAction(action: TestAction): Promise<void>

  // Validate critical point
  async validateCriticalPoint(point: CriticalPoint): Promise<void>

  // Complete scenario
  async executeScenario(scenario: LevelTestScenario): Promise<Result>
}
```

### Key Methods

#### executeMove

```typescript
private async executeMove(action: TestAction): Promise<void> {
  const key = action.direction === 'left' ? 'KeyA' : 'KeyD';
  const duration = action.duration || 1000;

  await this.page.keyboard.down(key);
  await this.page.waitForTimeout(duration);
  await this.page.keyboard.up(key);
}
```

#### executeJump

```typescript
private async executeJump(action: TestAction): Promise<void> {
  await this.page.keyboard.press('Space');
  await this.page.waitForTimeout(500); // Wait for jump arc
}
```

#### validateCriticalPoint

```typescript
private async validateCriticalPoint(point: CriticalPoint): Promise<void> {
  const playerPos = await this.page.evaluate(() => {
    const store = window.__zustand_store__;
    return store.getState().playerPosition;
  });

  // Check player is at expected position
  const distance = Math.hypot(
    playerPos.x - point.position.x,
    playerPos.y - point.position.y
  );

  if (distance > 50) {
    throw new Error(`Player not at expected position: ${point.description}`);
  }
}
```

## Performance Monitoring

### Frame Drop Detection

```typescript
// Inject monitoring script
await page.addInitScript(() => {
  let lastFrameTime = performance.now();
  const FRAME_TARGET = 16.67; // 60 FPS

  function checkFrame() {
    const now = performance.now();
    const frameDuration = now - lastFrameTime;

    if (frameDuration > FRAME_TARGET + 5) {
      window.__performance_issues__.push({
        timestamp: now,
        type: 'frame_drop',
        severity: frameDuration > 50 ? 'high' : 'medium',
        details: `Frame took ${frameDuration.toFixed(2)}ms`,
      });
    }

    lastFrameTime = now;
    requestAnimationFrame(checkFrame);
  }

  requestAnimationFrame(checkFrame);
});
```

### Hiccup Detection

Hiccups are detected when:
- Frame time > 21ms (5ms over target)
- Multiple consecutive slow frames
- Long tasks blocking the main thread

Severity levels:
- **Low**: 21-30ms frame time
- **Medium**: 30-50ms frame time
- **High**: >50ms frame time

### Performance Benchmarks

Target metrics per level:
- **Average FPS**: 60 (16.67ms per frame)
- **Frame drops**: <5 medium severity
- **High severity drops**: 0
- **Total duration**: <scenario.expectedDuration * 1.5

## Video Recording

### Automatic Recording

```typescript
const executor = new PlaywrightLevelExecutor(page, {
  recording: true,
});
```

### Recording Output

Videos are saved to `recordings/` directory:
- Format: MP4
- Resolution: Matches viewport size
- Filename: `{chapter_name}.mp4`

### Use Cases

1. **QA Review** - Manual verification of gameplay flow
2. **Bug Reports** - Visual evidence of issues
3. **Regression Testing** - Compare videos across versions
4. **Documentation** - Walkthrough videos for players

## Full Playthrough Testing

### Complete Game Test

```typescript
test('Complete game from start to finish', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes

  const results = [];

  for (let chapterId = 0; chapterId <= 9; chapterId++) {
    const chapter = await loadChapterManifest(chapterId);
    const factory = new LevelTestFactory(chapter, chapterId);
    const scenario = factory.generateScenario();

    const executor = new PlaywrightLevelExecutor(page, { recording: true });
    const result = await executor.executeScenario(scenario);

    results.push({ chapter: chapterId, ...result });

    if (!result.passed) {
      break; // Stop on first failure
    }
  }

  // Validate complete playthrough
  expect(results).toHaveLength(10);
  expect(results.every(r => r.passed)).toBe(true);
});
```

### Playthrough Validation

Full playthrough tests validate:
1. **Continuous flow** - All chapters load without issues
2. **State persistence** - Progress carries between chapters
3. **Performance** - No degradation over time
4. **Memory leaks** - No accumulation of resources
5. **Narrative consistency** - Story flows correctly

## Deterministic Path Validation

### Position Tracking

```typescript
// Track player positions
await page.addInitScript(() => {
  setInterval(() => {
    const store = window.__zustand_store__;
    const state = store.getState();
    window.__player_positions__.push({
      x: state.playerPosition.x,
      y: state.playerPosition.y,
      timestamp: Date.now(),
    });
  }, 100);
});
```

### Path Analysis

After playthrough, analyze the path:

```typescript
const positions = await page.evaluate(() => window.__player_positions__);

// Check forward progress
for (let i = 1; i < positions.length; i++) {
  if (positions[i].x < positions[i - 1].x - 100) {
    console.warn('Unexpected backwards movement');
  }
}

// Check level completion
const finalX = positions[positions.length - 1].x;
const levelWidth = chapter.level.segments.reduce((sum, seg) => sum + seg.width, 0);
expect(finalX).toBeGreaterThan(levelWidth * 0.9);
```

## Best Practices

### 1. Test Isolation

Each test should:
- Clear game state before starting
- Not depend on other tests
- Use fresh browser context

### 2. Timing

Use appropriate waits:
```typescript
// Good: Wait for specific condition
await expect(element).toBeVisible();

// Bad: Arbitrary timeout
await page.waitForTimeout(5000);
```

### 3. Assertions

Be specific:
```typescript
// Good
expect(result.errors).toHaveLength(0);
expect(playerX).toBeGreaterThan(startX + 500);

// Bad
expect(result).toBeTruthy();
```

### 4. Error Handling

Collect all errors, don't fail on first:
```typescript
const errors = [];

for (const action of actions) {
  try {
    await executeAction(action);
  } catch (error) {
    errors.push({ action, error });
  }
}

// Report all errors at end
expect(errors).toHaveLength(0);
```

### 5. Recording Strategy

Record only when needed:
- CI: Only on failure
- Local: For debugging specific issues
- Full playthrough: Always record

## Troubleshooting

### Test Failures

**Symptom**: Test fails at specific action
**Solution**:
1. Check player position matches expected
2. Verify timing is sufficient
3. Validate game state at failure point

**Symptom**: Inconsistent failures
**Solution**:
1. Check for race conditions
2. Add explicit waits
3. Verify physics constants match game

**Symptom**: Performance test fails
**Solution**:
1. Check system resources
2. Disable other applications
3. Use dedicated test environment

### Video Issues

**Symptom**: Video not recording
**Solution**:
1. Verify recording flag is set
2. Check Playwright configuration
3. Ensure sufficient disk space

**Symptom**: Video shows different behavior than test result
**Solution**:
1. Check timing of assertions vs. video
2. Verify viewport size
3. Check for race conditions in assertions

## Future Enhancements

### Planned Features

1. **AI-Driven Testing** - Use Yuka to explore unexpected paths
2. **Fuzzing** - Random input generation to find edge cases
3. **Multi-player** - Test scenarios with multiple players
4. **Performance Profiling** - Detailed frame-by-frame analysis
5. **Visual Regression** - Automated visual diff testing
6. **Procedural Test Generation** - Auto-generate tests from gameplay

### Integration Ideas

1. **CI/CD** - Automated playthrough on every commit
2. **QA Dashboard** - Visual display of test results
3. **Bug Reporting** - Automatic issue creation with video
4. **Analytics** - Track performance trends over time
5. **Documentation** - Auto-generate walkthrough guides

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [IMPLEMENTATION.md](../../IMPLEMENTATION.md) - Game architecture
- [Chapter Manifest Schema](../../client/src/data/manifests/schema/chapter-schema.json)
- [Matter.js Documentation](https://brm.io/matter-js/)
- [Yuka Documentation](https://mugen87.github.io/yuka/)
