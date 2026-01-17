/**
 * Automated Playthrough: Chapter 2 - The Gatehouse
 *
 * Validates quest: "Cross the Threshold"
 * First major checkpoint in the game.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 2: The Gatehouse - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 2: The Gatehouse');

    const chapter2Manifest = await loadChapterManifest(page, 'chapter-2-gatehouse.json');
    const result = await executePlaythrough(page, {
      chapter: chapter2Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 2 completed in ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`✓ Final position: (${result.finalPosition.x.toFixed(0)}, ${result.finalPosition.y.toFixed(0)})`);
  });
});
