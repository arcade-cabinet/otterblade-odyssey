/**
 * Automated Playthrough: Chapter 4 - Archives (Library)
 *
 * Validates quest: "Find the Ancient Map"
 * Exploration-focused level with puzzles.
 */

import { test, expect } from '@playwright/test';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';
import chapter4Manifest from '../../game/src/data/manifests/chapters/chapter-4-archives.json';

test.describe('Chapter 4: Archives - Automated Playthrough', () => {
  test.use({
    video: 'on',
    timeout: 300000,
  });

  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 4: Archives');

    const result = await executePlaythrough(page, {
      chapter: chapter4Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 4 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
