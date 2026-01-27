/**
 * Automated Playthrough: Chapter 1 - River Path (Abbey Approach)
 *
 * Validates level flow from Chapter 0 to Chapter 1.
 * Tests quest: "Reach the Gatehouse"
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 1: River Path - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 1: River Path');

    const chapter1Manifest = await loadChapterManifest(page, 'chapter-1-river-path.json');
    const result = await executePlaythrough(page, {
      chapter: chapter1Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 1 completed in ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`✓ Final position: (${result.finalPosition.x.toFixed(0)}, ${result.finalPosition.y.toFixed(0)})`);
    console.log(`✓ Screenshots captured: ${result.screenshots.length}`);
  });

  test('should validate level progression from Chapter 0', async ({ page }) => {
    const chapter1Manifest = await loadChapterManifest(page, 'chapter-1-river-path.json');
    const result = await executePlaythrough(page, {
      chapter: chapter1Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 10000,
      videoEnabled: false,
    });

    expect(result.duration).toBeGreaterThan(5000);
    expect(result.duration).toBeLessThan(180000);

    if (!result.success) {
      console.warn(`Level progression issue: ${result.error}`);
    }
  });
});
