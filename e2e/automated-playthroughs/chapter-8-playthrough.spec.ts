/**
 * Automated Playthrough: Chapter 8 - Storm's Edge (Final Ascent)
 *
 * Validates quest: "Reach Zephyros"
 * Final approach to the boss fight, intense platforming.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 8: Storms Edge - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 8: Storms Edge');

    const chapter8Manifest = await loadChapterManifest(page, 'chapter-8-storms-edge.json');
    const result = await executePlaythrough(page, {
      chapter: chapter8Manifest as any,
      maxDuration: 240000, // 4 minutes for challenging final approach
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 8 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
