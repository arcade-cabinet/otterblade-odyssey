/**
 * Automated Playthrough: Chapter 5 - Deep Cellars (Dungeon)
 *
 * Validates quest: "Descend into the Depths"
 * Dark atmospheric level with vertical platforming.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 5: Deep Cellars - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 5: Deep Cellars');

    const chapter5Manifest = await loadChapterManifest(page, 'chapter-5-deep-cellars.json');
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
