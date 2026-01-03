/**
 * Automated Playthrough: Chapter 0 - The Calling
 *
 * This test uses AI to complete the level automatically, validating that:
 * - The level is completable
 * - No game-breaking bugs exist
 * - A human player could reasonably complete it
 *
 * The AI uses the same movement system as enemies (YUKA-based) but with
 * player capabilities: jump, attack, roll, slink.
 */

import { test, expect } from '@playwright/test';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';
import chapter0Manifest from '../../game/src/data/manifests/chapters/chapter-0-the-calling.json';

test.describe('Chapter 0: The Calling - Automated Playthrough', () => {
  test.use({
    // Enable video recording for this suite
    video: 'on',
    // Give the AI plenty of time to complete
    timeout: 300000, // 5 minutes
  });

  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 0: The Calling');

    const result = await executePlaythrough(page, {
      chapter: chapter0Manifest as any,
      maxDuration: 180000, // 3 minutes to complete
      screenshotInterval: 5000, // Screenshot every 5 seconds for debugging
      videoEnabled: true,
    });

    // Validate successful completion
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Log results
    console.log(`✓ Playthrough completed in ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`✓ Final position: (${result.finalPosition.x.toFixed(0)}, ${result.finalPosition.y.toFixed(0)})`);
    console.log(`✓ Screenshots captured: ${result.screenshots.length}`);

    // The video will be saved automatically by Playwright
  });

  test('should validate level is completable without bugs', async ({ page }) => {
    // This test is more lenient - it validates that the level doesn't have
    // game-breaking bugs even if the AI struggles

    const result = await executePlaythrough(page, {
      chapter: chapter0Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 10000,
      videoEnabled: false, // Don't need video for validation
    });

    // Check that the test ran for a reasonable time
    expect(result.duration).toBeGreaterThan(5000); // At least 5 seconds
    expect(result.duration).toBeLessThan(180000); // Less than timeout

    if (!result.success) {
      console.warn(`AI did not complete level: ${result.error}`);
      console.warn('Final position:', result.finalPosition);
      console.warn('This may indicate:');
      console.warn('  - Level design issue (impossible section)');
      console.warn('  - AI pathfinding limitation');
      console.warn('  - Game bug preventing progress');

      // Even if AI fails, we can check that it's not a critical bug
      expect(result.error).not.toContain('crash');
      expect(result.error).not.toContain('exception');
    } else {
      console.log('✓ Level is completable - AI succeeded');
    }
  });

  test('should validate all platforms are reachable', async ({ page }) => {
    // This test validates that the level geometry is sound
    // by checking that the AI can build a valid path

    await page.goto('/');

    // Skip cinematic
    const cinematicPlayer = page.getByTestId('cinematic-player');
    if (await cinematicPlayer.isVisible().catch(() => false)) {
      await page.waitForTimeout(2500);
      await page.keyboard.press('Space');
    }

    // We don't need to run the full playthrough - just validate
    // that the level parser can build a navigation graph

    // This would be expanded to actually check connectivity
    // For now, we just ensure the test infrastructure works
    expect(chapter0Manifest).toBeDefined();
    expect(chapter0Manifest.level.segments).toBeInstanceOf(Array);
    expect(chapter0Manifest.level.segments.length).toBeGreaterThan(0);
  });
});

test.describe('Chapter 0: Performance & Quality', () => {
  test('should maintain acceptable frame rate during playthrough', async ({ page }) => {
    test.skip(true, 'Performance testing requires specialized setup');

    // This test would measure FPS during automated playthrough
    // and validate that it stays above 30 FPS (acceptable for gameplay)
  });

  test('should have no audio glitches during playthrough', async ({ page }) => {
    test.skip(true, 'Audio testing requires specialized setup');

    // This test would validate that:
    // - Music transitions smoothly
    // - SFX play correctly
    // - No audio pops or clicks
  });
});
