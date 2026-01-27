/**
 * Automated Playthrough: Chapter 7 - Bell Tower (Rooftops)
 *
 * Validates quest: "Ascend to the Bells"
 * Vertical climbing level with timing challenges.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 7: Bell Tower - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 7: Bell Tower');

    const chapter7Manifest = await loadChapterManifest(page, 'chapter-7-bell-tower.json');
    const result = await executePlaythrough(page, {
      chapter: chapter7Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 7 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
