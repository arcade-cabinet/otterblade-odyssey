# Automated Playthroughs - Complete Game Validation

This directory contains automated E2E tests that validate the complete Otterblade Odyssey journey from Chapter 0 (The Calling) to Chapter 9 (New Dawn).

## Purpose

These tests prove that:
- All 10 chapters are completable
- Level geometry is sound (no impossible sections)
- Story progression works correctly
- JSON DDL architecture is validated
- Procedural generation maintains consistency
- YUKA pathfinding works across all biomes
- The warm, homey vision is realized

## Test Files

### Individual Chapter Tests
- `chapter-0-playthrough.spec.ts` - The Calling (Prologue)
- `chapter-1-playthrough.spec.ts` - River Path (Abbey Approach)
- `chapter-2-playthrough.spec.ts` - The Gatehouse
- `chapter-3-playthrough.spec.ts` - Great Hall (BOSS)
- `chapter-4-playthrough.spec.ts` - Archives (Library)
- `chapter-5-playthrough.spec.ts` - Deep Cellars (BOSS)
- `chapter-6-playthrough.spec.ts` - Kitchen Gardens (Courtyard)
- `chapter-7-playthrough.spec.ts` - Bell Tower (Rooftops)
- `chapter-8-playthrough.spec.ts` - Storm's Edge (FINAL BOSS)
- `chapter-9-playthrough.spec.ts` - New Dawn (Epilogue)

### Complete Journey Test
- `complete-game-journey.spec.ts` - Validates ALL chapters in sequence

## Running Tests

### Prerequisites
```bash
# Install Playwright browsers (REQUIRED first time)
pnpm exec playwright install chromium
```

### Run All Chapters
```bash
# Headless mode (CI)
pnpm test:playthroughs

# With video capture and browser visible (MCP)
pnpm test:playthroughs:mcp
```

### Run Specific Chapter
```bash
# Chapter 0
pnpm test:e2e -- e2e/automated-playthroughs/chapter-0-playthrough.spec.ts

# Chapter 3 (Boss)
pnpm test:e2e -- e2e/automated-playthroughs/chapter-3-playthrough.spec.ts

# Final Boss (Chapter 8)
pnpm test:e2e -- e2e/automated-playthroughs/chapter-8-playthrough.spec.ts
```

### Run Complete Game Journey
```bash
# Validates all 10 chapters in sequence
pnpm test:journey

# With video and headed mode
pnpm test:journey:mcp
```

## Video Capture

All tests are configured with `video: 'on'`. Videos are saved to:
- `test-results/<test-name>/video.webm` - Individual test videos
- `playwright-report/` - Consolidated test report with videos

Videos capture:
- Complete gameplay from start to finish
- Player movement and combat
- Enemy AI behavior
- Quest completion
- Victory cinematics
- Visual fidelity of the warm, homey aesthetic

## How It Works

### 1. Factory System
The `playthrough-factory.ts` generates tests from chapter manifests:
```typescript
executePlaythrough(page, {
  chapter: chapterManifest,  // JSON DDL definition
  maxDuration: 180000,       // 3 minutes
  screenshotInterval: 5000,  // Screenshot every 5s
  videoEnabled: true,        // Capture MP4
});
```

### 2. AI Player
The AI player (`ai-player.ts`):
- Uses YUKA pathfinding (same as enemies)
- Has player capabilities: jump, attack, roll, slink
- Makes decisions based on level geometry
- Navigates to quest objectives automatically

### 3. Level Parser
The level parser (`level-parser.ts`):
- Reads chapter manifest JSON
- Extracts platform positions
- Builds navigation graph
- Identifies start/end positions

## Success Criteria

A chapter test passes when:
- ✅ Game loads successfully
- ✅ AI player navigates the level
- ✅ Quest objective is reached
- ✅ No crashes or exceptions
- ✅ Completes within time limit
- ✅ Video recording captured

The complete journey test passes when:
- ✅ ALL 10 chapters complete in sequence
- ✅ Story progression is correct
- ✅ No blocking bugs in any chapter
- ✅ Victory is achieved

## Troubleshooting

### Test Fails with "Browser not found"
```bash
# Install Playwright browsers
pnpm exec playwright install chromium
```

### Test Times Out
- Increase `maxDuration` in the test config
- Check if level has impossible sections
- Verify AI pathfinding is working correctly

### Video Not Captured
- Ensure `video: 'on'` is set in test.use()
- Check `playwright.config.ts` video settings
- Review `test-results/` directory for video files

### AI Player Gets Stuck
- Check level geometry for dead ends
- Verify navigation graph is connected
- Review `level-parser.ts` output in test logs

## Validation Workflow

1. **Run individual chapter tests** to validate each level
2. **Review test results** in `playwright-report/index.html`
3. **Watch video recordings** to verify gameplay
4. **Fix any failures** by adjusting level geometry or AI
5. **Run complete journey test** to validate full game
6. **Celebrate success** when all tests pass! 🎉

## Documentation

For detailed architecture and validation approach, see:
- `docs/COMPLETE_JOURNEY_VALIDATION.md` - Full architecture guide
- `docs/PHYSICS.md` - Matter.js physics system
- `docs/WORLD.md` - Story and world-building
- `IMPLEMENTATION.md` - Technical implementation

## Critical Juncture

These tests represent a **CRITICAL juncture** for the game. They prove that:
- The JSON DDL architecture works
- Procedural generation is sound
- Story progression is coherent
- The warm, homey vision is realized
- Victory can be achieved

**This is real AI partnership** - using automation to validate the complete game journey with love and respect for the vision.
