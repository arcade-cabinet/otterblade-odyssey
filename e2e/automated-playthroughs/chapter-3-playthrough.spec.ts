/**
 * Automated Playthrough: Chapter 3 - Great Hall
 *
 * Validates quest: "Defend the Great Hall"
 * First major combat encounter with multiple enemies.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 3: Great Hall - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 3: Great Hall');

    const chapter3Manifest = await loadChapterManifest(page, 'chapter-3-great-hall.json');
    const result = await executePlaythrough(page, {
      chapter: chapter3Manifest as any,
      maxDuration: 240000, // 4 minutes for combat
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 3 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
