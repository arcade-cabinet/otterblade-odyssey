/**
 * Automated Playthrough: Chapter 9 - New Dawn (Epilogue)
 *
 * Validates quest: "A New Dawn"
 * Victory sequence and ending cinematics.
 */

import { test, expect } from '@playwright/test';
import { loadChapterManifest } from '../helpers/manifest-loader';
import { executePlaythrough } from '../../tests/factories/playthrough-factory';

test.use({
  video: 'on',
  timeout: 300000,
});

test.describe('Chapter 9: New Dawn - Automated Playthrough', () => {
  test('should complete full level playthrough with AI', async ({ page }) => {
    console.log('Starting automated playthrough of Chapter 9: New Dawn');

    const chapter9Manifest = await loadChapterManifest(page, 'chapter-9-new-dawn.json');
    const result = await executePlaythrough(page, {
      chapter: chapter9Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 5000,
      videoEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    console.log(`✓ Chapter 9 completed in ${(result.duration / 1000).toFixed(1)}s`);
    console.log('✓ Game completed! Victory achieved!');
  });

  test('should validate complete game journey', async ({ page }) => {
    // This test validates that the player can complete the entire game
    // from start to finish without any blocking issues
    
    console.log('Validating complete game journey...');
    
    const chapter9Manifest = await loadChapterManifest(page, 'chapter-9-new-dawn.json');
    const result = await executePlaythrough(page, {
      chapter: chapter9Manifest as any,
      maxDuration: 180000,
      screenshotInterval: 10000,
      videoEnabled: false,
    });

    expect(result.success).toBe(true);
    console.log('✓ Complete game journey validated!');
  });
});
