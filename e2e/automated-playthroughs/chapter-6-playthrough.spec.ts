/**
 * Automated Playthrough: Chapter 6 - Kitchen Gardens (Courtyard)
 *
 * Validates quest: "Rally the Defenders"
 * Outdoor level with NPC interactions.
 */

import { test, expect } from '@playwright/test';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';
import chapter6Manifest from '../../game/src/data/manifests/chapters/chapter-6-kitchen-gardens.json';

test.describe('Chapter 6: Kitchen Gardens - Automated Playthrough', () => {
  test.use({
    video: 'on',
    timeout: 300000,
  });

  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 6: Kitchen Gardens');

    const result = await executePlaythrough(page, {
      chapter: chapter6Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 6 completed in ${(result.duration / 1000).toFixed(1)}s`);
  });
});
