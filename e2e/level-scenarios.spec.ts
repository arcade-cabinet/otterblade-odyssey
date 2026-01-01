/**
 * Level Scenario Tests
 *
 * Automated playthrough tests for all game chapters using the Level Test Factory.
 * These tests simulate deterministic player paths through each level,
 * validate gameplay flow, and record MP4 videos for QA review.
 */

import { test, expect } from '@playwright/test';
import {
  LevelTestFactory,
  PlaywrightLevelExecutor,
  type LevelTestScenario,
} from './helpers/level-factory';

// Check if running with full MCP capabilities (required for video recording)
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === 'true';
const enableRecording = process.env.RECORD_PLAYTHROUGHS === 'true';

/**
 * Load chapter manifest from JSON
 */
async function loadChapterManifest(chapterId: number) {
  // Map chapter IDs to their manifest filenames
  const manifestFiles = [
    'chapter-0-the-calling.json',
    'chapter-1-river-path.json',
    'chapter-2-gatehouse.json',
    'chapter-3-great-hall.json',
    'chapter-4-archives.json',
    'chapter-5-deep-cellars.json',
    'chapter-6-kitchen-gardens.json',
    'chapter-7-bell-tower.json',
    'chapter-8-storms-edge.json',
    'chapter-9-new-dawn.json',
  ];

  const filename = manifestFiles[chapterId];
  if (!filename) {
    throw new Error(`No manifest found for chapter ${chapterId}`);
  }

  // In test environment, we need to load from the build output or repo
  const manifestPath = `../../client/src/data/manifests/chapters/${filename}`;
  const manifest = await import(manifestPath);
  return manifest.default || manifest;
}

test.describe('Level Scenario Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Run chapters in order

  // Skip if MCP not available (needs full game engine)
  test.skip(!hasMcpSupport, 'Level scenarios require WebGL/MCP support');

  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.dispatchEvent(new Event('storage'));
    });
    await page.reload();
  });

  // Generate tests for each chapter
  for (let chapterId = 0; chapterId <= 9; chapterId++) {
    test(`Chapter ${chapterId}: Automated playthrough`, async ({ page }) => {
      // Load chapter manifest
      const chapterData = await loadChapterManifest(chapterId);
      const factory = new LevelTestFactory(chapterData, chapterId);
      const scenario = factory.generateScenario();

      // Execute scenario
      const executor = new PlaywrightLevelExecutor(page, {
        recording: enableRecording,
      });

      const result = await executor.executeScenario(scenario);

      // Log results
      console.log(`Chapter ${chapterId} completed in ${result.duration}ms`);
      if (result.errors.length > 0) {
        console.error('Errors encountered:', result.errors);
      }
      if (result.videoPath) {
        console.log(`Recording saved to: ${result.videoPath}`);
      }

      // Assertions
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.duration).toBeLessThan(scenario.expectedDuration * 1.5); // Allow 50% buffer
    });
  }
});

test.describe('Full Game Playthrough', () => {
  test.skip(!hasMcpSupport || !enableRecording, 'Requires MCP and recording enabled');

  test('Complete game from start to finish', async ({ page }) => {
    test.setTimeout(600000); // 10 minute timeout for full playthrough

    const results = [];

    for (let chapterId = 0; chapterId <= 9; chapterId++) {
      console.log(`\n=== Starting Chapter ${chapterId} ===`);

      const chapterData = await loadChapterManifest(chapterId);
      const factory = new LevelTestFactory(chapterData, chapterId);
      const scenario = factory.generateScenario();

      const executor = new PlaywrightLevelExecutor(page, {
        recording: true,
      });

      const result = await executor.executeScenario(scenario);
      results.push({
        chapter: chapterId,
        ...result,
      });

      console.log(`Chapter ${chapterId} result:`, {
        passed: result.passed,
        duration: `${result.duration}ms`,
        errors: result.errors.length,
      });

      // Continue to next chapter if passed
      if (!result.passed) {
        console.error(`Chapter ${chapterId} failed. Stopping playthrough.`);
        break;
      }
    }

    // Final assertions
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const completedChapters = results.filter(r => r.passed).length;

    console.log('\n=== Full Playthrough Summary ===');
    console.log(`Completed chapters: ${completedChapters}/10`);
    console.log(`Total duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`Total errors: ${totalErrors}`);

    expect(completedChapters).toBe(10);
    expect(totalErrors).toBe(0);
  });
});

test.describe('Hiccup Detection', () => {
  test.skip(!hasMcpSupport, 'Requires WebGL/MCP support');

  test('Detect frame drops and stuttering', async ({ page }) => {
    // Monitor for performance issues during gameplay
    const performanceIssues: Array<{
      timestamp: number;
      type: 'frame_drop' | 'stutter' | 'long_task';
      severity: 'low' | 'medium' | 'high';
      details: string;
    }> = [];

    // Inject performance monitoring
    await page.addInitScript(() => {
      let lastFrameTime = performance.now();
      const FRAME_TARGET = 16.67; // 60 FPS
      const ACCEPTABLE_VARIANCE = 5; // ms

      function checkFrame() {
        const now = performance.now();
        const frameDuration = now - lastFrameTime;

        if (frameDuration > FRAME_TARGET + ACCEPTABLE_VARIANCE) {
          (window as any).__performance_issues__ = (window as any).__performance_issues__ || [];
          (window as any).__performance_issues__.push({
            timestamp: now,
            type: 'frame_drop',
            severity: frameDuration > 50 ? 'high' : frameDuration > 30 ? 'medium' : 'low',
            details: `Frame took ${frameDuration.toFixed(2)}ms`,
          });
        }

        lastFrameTime = now;
        requestAnimationFrame(checkFrame);
      }

      requestAnimationFrame(checkFrame);
    });

    // Load and play Chapter 0
    const chapterData = await loadChapterManifest(0);
    const factory = new LevelTestFactory(chapterData, 0);
    const scenario = factory.generateScenario();
    const executor = new PlaywrightLevelExecutor(page);

    await executor.executeScenario(scenario);

    // Collect performance issues
    const issues = await page.evaluate(() => (window as any).__performance_issues__ || []);

    console.log(`\nPerformance Analysis:`);
    console.log(`Total frame drops: ${issues.length}`);
    const highSeverity = issues.filter((i: any) => i.severity === 'high').length;
    const mediumSeverity = issues.filter((i: any) => i.severity === 'medium').length;
    const lowSeverity = issues.filter((i: any) => i.severity === 'low').length;

    console.log(`High severity: ${highSeverity}`);
    console.log(`Medium severity: ${mediumSeverity}`);
    console.log(`Low severity: ${lowSeverity}`);

    // Fail test if too many issues
    expect(highSeverity).toBe(0); // No high severity issues allowed
    expect(mediumSeverity).toBeLessThan(5); // Max 5 medium issues
  });
});

test.describe('Deterministic Path Validation', () => {
  test.skip(!hasMcpSupport, 'Requires WebGL/MCP support');

  test('Player follows expected path through level', async ({ page }) => {
    // Track player positions throughout playthrough
    const playerPositions: Array<{ x: number; y: number; timestamp: number }> = [];

    // Inject position tracker
    await page.addInitScript(() => {
      setInterval(() => {
        const store = (window as any).__zustand_store__;
        if (store) {
          const state = store.getState();
          (window as any).__player_positions__ = (window as any).__player_positions__ || [];
          (window as any).__player_positions__.push({
            x: state.playerPosition?.x || 0,
            y: state.playerPosition?.y || 0,
            timestamp: Date.now(),
          });
        }
      }, 100); // Track every 100ms
    });

    // Run Chapter 0
    const chapterData = await loadChapterManifest(0);
    const factory = new LevelTestFactory(chapterData, 0);
    const scenario = factory.generateScenario();
    const executor = new PlaywrightLevelExecutor(page);

    await executor.executeScenario(scenario);

    // Collect positions
    const positions = await page.evaluate(() => (window as any).__player_positions__ || []);

    // Validate path follows expected trajectory
    console.log(`\nPath Validation:`);
    console.log(`Total positions recorded: ${positions.length}`);

    // Check player progressed through level (X increases over time)
    let progressingForward = true;
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].x < positions[i - 1].x - 100) {
        // Allow some backwards movement
        progressingForward = false;
        console.warn(`Player moved backwards at timestamp ${positions[i].timestamp}`);
      }
    }

    expect(progressingForward).toBe(true);

    // Check player reached end of level
    const finalX = positions[positions.length - 1]?.x || 0;
    const levelWidth = chapterData.level.segments.reduce((sum: number, seg: any) => sum + seg.width, 0);
    expect(finalX).toBeGreaterThan(levelWidth * 0.9); // Reached 90% of level
  });
});
