/**
 * Automated Playthrough: Chapter 5 - Deep Cellars (Dungeon)
 *
 * Validates quest: "Descend into the Depths"
 * Dark atmospheric level with vertical platforming.
 */

import { test, expect } from '@playwright/test';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';
import chapter5Manifest from '../../client/src/data/manifests/chapters/chapter-5-deep-cellars.json';

test.describe('Chapter 5: Deep Cellars - Automated Playthrough', () => {
  test.use({
    video: 'on',
    timeout: 300000,
  });

  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 5: Deep Cellars');

    const result = await executePlaythrough(page, {
      chapter: chapter5Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 5 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
