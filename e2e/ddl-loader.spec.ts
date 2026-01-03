import { test, expect, Page } from '@playwright/test';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Helper function to wait for start button to appear
 * Uses Playwright's locator API which supports :has-text()
 */
async function waitForStartButton(page: Page, timeout = 30000) {
  await page.locator('button:has-text("Begin Journey")').waitFor({ timeout });
}

/**
 * E2E Tests for DDL Manifest Loader
 *
 * These tests validate that:
 * 1. Manifests are fetched from /data/manifests/ at runtime
 * 2. Preloading works correctly
 * 3. Cache is populated and accessible
 * 4. Sync accessors work after preload
 * 5. Game initializes with fetched data
 */

test.describe('DDL Manifest Loader', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages to track preload progress
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('[DDL]')) {
        console.log(`DDL: ${text}`);
      }
      if (msg.type() === 'error') {
        console.error(`Console error: ${text}`);
      }
    });

    // Track network requests to manifests
    const manifestRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/data/manifests/')) {
        const manifestPath = url.split('/data/manifests/')[1];
        manifestRequests.push(manifestPath);
        console.log(`Fetching manifest: ${manifestPath}`);
      }
    });

    // Store for later assertions
    await page.evaluate(() => {
      (window as any).__TEST_CONSOLE_MESSAGES__ = [];
      (window as any).__TEST_MANIFEST_REQUESTS__ = [];
    });

    await page.goto('/');
  });

  test('should fetch manifest files from /data/manifests/', async ({ page }) => {
    // Wait for loading screen to appear
    const loadingScreen = page.locator('text=Loading manifests');
    await expect(loadingScreen).toBeVisible({ timeout: 5000 });

    // Wait for manifests to load (should see start menu after)
    await waitForStartButton(page);

    // Verify that manifest requests were made
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .map((r: any) => r.name)
        .filter((name: string) => name.includes('/data/manifests/'));
    });

    console.log('Manifest requests:', networkRequests);
    
    // Should have fetched multiple manifests
    expect(networkRequests.length).toBeGreaterThan(0);

    // Should include at least one chapter manifest
    const hasChapterManifest = networkRequests.some((url: string) => 
      url.includes('/chapters/chapter-')
    );
    expect(hasChapterManifest).toBe(true);
  });

  test('should preload all 10 chapters', async ({ page }) => {
    // Wait for game to be ready
    await waitForStartButton(page);

    // Check that DDL loader is available and cache is populated
    const cacheStats = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const stats = loaderModule.getCacheStats();
      return stats;
    });

    console.log('Cache stats:', cacheStats);

    // Should have cached items (chapters + asset manifests)
    expect(cacheStats.size).toBeGreaterThan(0);

    // Verify we can access chapters
    const chaptersAccessible = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const results: boolean[] = [];
      
      // Try to access each chapter
      for (let i = 0; i <= 9; i++) {
        try {
          const chapter = loaderModule.getChapterManifestSync(i);
          results.push(chapter !== null && chapter.id === i);
        } catch (e) {
          results.push(false);
        }
      }
      
      return results;
    });

    console.log('Chapters accessible:', chaptersAccessible);

    // All 10 chapters should be accessible
    expect(chaptersAccessible.every(result => result === true)).toBe(true);
  });

  test('should load chapter manifests with correct structure', async ({ page }) => {
    // Wait for preload
    await waitForStartButton(page);

    // Test chapter 0 structure
    const chapter0 = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const chapter = loaderModule.getChapterManifestSync(0);
      return {
        id: chapter.id,
        name: chapter.name,
        location: chapter.location,
        hasNarrative: !!chapter.narrative,
        hasLevel: !!chapter.level,
        questName: chapter.narrative?.quest,
      };
    });

    console.log('Chapter 0:', chapter0);

    expect(chapter0.id).toBe(0);
    expect(chapter0.name).toBe('The Calling');
    expect(chapter0.location).toBe("Finn's Cottage");
    expect(chapter0.hasNarrative).toBe(true);
    expect(chapter0.hasLevel).toBe(true);
    expect(chapter0.questName).toBe('Answer the Call');
  });

  test('should load entity manifests (enemies, NPCs)', async ({ page }) => {
    // Wait for preload
    await waitForStartButton(page);

    // Check enemies manifest
    const enemiesData = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const enemies = loaderModule.getEnemiesManifestSync();
      return {
        category: enemies.category,
        hasAssets: Array.isArray(enemies.assets) && enemies.assets.length > 0,
        assetCount: enemies.assets?.length || 0,
      };
    });

    console.log('Enemies manifest:', enemiesData);

    expect(enemiesData.category).toBe('enemies');
    expect(enemiesData.hasAssets).toBe(true);
    expect(enemiesData.assetCount).toBeGreaterThan(0);

    // Check NPCs manifest
    const npcsData = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const npcs = loaderModule.getNPCsManifestSync();
      return {
        category: npcs.category,
        hasNpcs: Array.isArray(npcs.npcs),
        hasSpecies: !!npcs.species,
      };
    });

    console.log('NPCs manifest:', npcsData);

    expect(npcsData.category).toBe('npcs');
    expect(npcsData.hasNpcs).toBe(true);
    expect(npcsData.hasSpecies).toBe(true);
  });

  test('should load asset manifests (sprites, sounds, cinematics)', async ({ page }) => {
    // Wait for preload
    await waitForStartButton(page);

    // Check all asset manifests
    const assetManifests = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      
      return {
        sprites: {
          category: loaderModule.getSpritesManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getSpritesManifestSync().assets),
        },
        sounds: {
          category: loaderModule.getSoundsManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getSoundsManifestSync().assets),
        },
        cinematics: {
          category: loaderModule.getCinematicsManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getCinematicsManifestSync().assets),
        },
        effects: {
          category: loaderModule.getEffectsManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getEffectsManifestSync().assets),
        },
        items: {
          category: loaderModule.getItemsManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getItemsManifestSync().assets),
        },
        scenes: {
          category: loaderModule.getScenesManifestSync().category,
          hasAssets: Array.isArray(loaderModule.getScenesManifestSync().assets),
        },
      };
    });

    console.log('Asset manifests:', assetManifests);

    // Verify each asset type
    expect(assetManifests.sprites.category).toBe('sprites');
    expect(assetManifests.sprites.hasAssets).toBe(true);

    expect(assetManifests.sounds.category).toBe('sounds');
    expect(assetManifests.sounds.hasAssets).toBe(true);

    expect(assetManifests.cinematics.category).toBe('cinematics');
    expect(assetManifests.cinematics.hasAssets).toBe(true);

    expect(assetManifests.effects.category).toBe('effects');
    expect(assetManifests.effects.hasAssets).toBe(true);

    expect(assetManifests.items.category).toBe('items');
    expect(assetManifests.items.hasAssets).toBe(true);

    expect(assetManifests.scenes.category).toBe('scenes');
    expect(assetManifests.scenes.hasAssets).toBe(true);
  });

  test('should show loading screen during preload', async ({ page }) => {
    // Check that loading screen appears immediately
    const loadingScreen = page.locator('text=Loading manifests');
    await expect(loadingScreen).toBeVisible({ timeout: 2000 });

    // Should show "Preparing your journey" subtitle
    const subtitle = page.locator('text=Preparing your journey');
    await expect(subtitle).toBeVisible({ timeout: 2000 });

    // Loading screen should disappear when done
    await expect(loadingScreen).not.toBeVisible({ timeout: 30000 });

    // Start menu should appear
    const startButton = page.locator('button:has-text("Begin Journey")');
    await expect(startButton).toBeVisible({ timeout: 5000 });
  });

  test('should handle game initialization with fetched manifests', async ({ page }) => {
    // Wait for preload to complete
    await waitForStartButton(page);

    // Click start button
    await page.click('button:has-text("Begin Journey")');

    // Wait for canvas to appear
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify game state is initialized
    const gameInitialized = await page.evaluate(() => {
      // Check if game canvas is rendered
      const canvas = document.querySelector('canvas');
      return canvas !== null && canvas.width > 0 && canvas.height > 0;
    });

    expect(gameInitialized).toBe(true);

    // Wait for game to render frames
    await page.waitForTimeout(2000);

    // VISUAL VALIDATION: Verify actual game rendering (not just pixel noise)
    const renderingValidation = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { error: 'Canvas not found' };

      const ctx = canvas.getContext('2d');
      if (!ctx) return { error: 'Canvas context not available' };

      // Sample pixels from the canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Enhanced validation: Check for game-specific visual signatures
      let nonBlackPixels = 0;
      let nonWhitePixels = 0;
      let coloredPixels = 0;
      let brownPixels = 0; // Finn the otter is brown
      let warmColors = 0; // Warm Redwall palette (orange, brown, tan)
      const sampleSize = Math.min(10000, pixels.length / 4);

      for (let i = 0; i < sampleSize; i++) {
        const idx = i * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];

        // Skip transparent pixels
        if (a < 10) continue;

        // Check if pixel is not black
        if (r > 10 || g > 10 || b > 10) {
          nonBlackPixels++;
        }

        // Check if pixel is not white
        if (!(r > 240 && g > 240 && b > 240)) {
          nonWhitePixels++;
        }

        // Check for actual color variation
        if (r !== g || g !== b || r !== b) {
          coloredPixels++;
        }

        // Check for brown tones (Finn's fur: #8B6F47 range)
        // Brown: R > G, G > B, moderate saturation
        if (r > 100 && r < 180 && g > 80 && g < 150 && b > 40 && b < 100) {
          brownPixels++;
        }

        // Check for warm palette colors (Redwall aesthetic)
        // Orange/tan/amber tones
        if ((r > 150 && g > 100 && b < 150) || // Orange-ish
            (r > 180 && g > 140 && b < 100)) {  // Warm tan
          warmColors++;
        }
      }

      const hasContent = nonBlackPixels > sampleSize * 0.1; // At least 10% non-black
      const hasVariation = nonWhitePixels > sampleSize * 0.1; // At least 10% non-white
      const hasColors = coloredPixels > sampleSize * 0.05; // At least 5% with color variation
      const hasBrownTones = brownPixels > sampleSize * 0.01; // At least 1% brown (Finn present)
      const hasWarmPalette = warmColors > sampleSize * 0.02; // At least 2% warm colors

      // Check for platform/geometry patterns (horizontal lines)
      const hasHorizontalStructures = checkForHorizontalPatterns(imageData, canvas.width, canvas.height);

      return {
        canvasSize: { width: canvas.width, height: canvas.height },
        sampleSize,
        pixelCounts: {
          nonBlackPixels,
          nonWhitePixels,
          coloredPixels,
          brownPixels,
          warmColors,
        },
        percentages: {
          nonBlack: (nonBlackPixels / sampleSize * 100).toFixed(1),
          colored: (coloredPixels / sampleSize * 100).toFixed(1),
          brown: (brownPixels / sampleSize * 100).toFixed(1),
          warm: (warmColors / sampleSize * 100).toFixed(1),
        },
        validations: {
          hasContent,
          hasVariation,
          hasColors,
          hasBrownTones,
          hasWarmPalette,
          hasHorizontalStructures,
        },
        renderingDetected: hasContent && hasVariation && hasColors,
        gameGraphicsDetected: hasContent && hasColors && (hasBrownTones || hasWarmPalette),
      };

      // Helper: Detect horizontal platform-like patterns
      function checkForHorizontalPatterns(imgData: ImageData, width: number, height: number): boolean {
        const data = imgData.data;
        let horizontalEdges = 0;

        // Sample 20 horizontal lines across canvas
        for (let y = 0; y < height; y += Math.floor(height / 20)) {
          let prevGray = 0;
          let edgesInRow = 0;

          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            // Detect edge (sharp brightness change)
            if (Math.abs(gray - prevGray) > 50) {
              edgesInRow++;
            }
            prevGray = gray;
          }

          // Platforms should create multiple edges per row
          if (edgesInRow > 5) horizontalEdges++;
        }

        // At least 5 rows with platform-like structures
        return horizontalEdges > 5;
      }
    });

    console.log('Visual validation results:', JSON.stringify(renderingValidation, null, 2));

    // Assertions for enhanced visual validation
    if ('error' in renderingValidation) {
      throw new Error(`Visual validation failed: ${renderingValidation.error}`);
    }

    // Basic rendering checks
    expect(renderingValidation.validations.hasContent).toBe(true); // Canvas has non-black pixels
    expect(renderingValidation.validations.hasVariation).toBe(true); // Canvas has non-white pixels
    expect(renderingValidation.validations.hasColors).toBe(true); // Canvas has color variation
    expect(renderingValidation.renderingDetected).toBe(true); // Overall rendering detected

    // Game-specific checks (verify Finn and level geometry render)
    console.log(`Brown pixels: ${renderingValidation.percentages.brown}% (Finn's fur)`);
    console.log(`Warm colors: ${renderingValidation.percentages.warm}% (Redwall palette)`);
    console.log(`Horizontal structures: ${renderingValidation.validations.hasHorizontalStructures} (platforms)`);

    // At least one game-specific validation should pass
    // (Either Finn is visible OR level geometry is visible OR warm palette is rendered)
    const hasGameVisuals =
      renderingValidation.validations.hasBrownTones ||
      renderingValidation.validations.hasWarmPalette ||
      renderingValidation.validations.hasHorizontalStructures;

    expect(hasGameVisuals).toBe(true); // Game-specific graphics detected
    expect(renderingValidation.gameGraphicsDetected).toBe(true); // Overall game rendering detected

    console.log('✓ Visual validation passed: Game graphics detected');

    // Verify Matter.js physics is initialized
    const physicsInitialized = await page.evaluate(() => {
      return (
        typeof window.Matter !== 'undefined' &&
        window.gameEngine !== null &&
        window.gameEngine !== undefined
      );
    });

    expect(physicsInitialized).toBe(true);
    console.log('✓ Matter.js physics engine initialized');

    // Take screenshot of running game for manual inspection
    const screenshotPath = join(tmpdir(), 'ddl-loader-game-running.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${screenshotPath}`);
  });

  test('should validate chapter manifest data integrity', async ({ page }) => {
    // Wait for preload
    await waitForStartButton(page);

    // Validate multiple chapters have proper structure
    const validationResults = await page.evaluate(async () => {
      const loaderModule = await import('/src/ddl/loader.ts');
      const results = [];

      // Test chapters 0, 5, 9 (as mentioned in requirements)
      for (const chapterId of [0, 5, 9]) {
        const chapter = loaderModule.getChapterManifestSync(chapterId);
        
        results.push({
          id: chapterId,
          name: chapter.name,
          hasNarrative: !!chapter.narrative,
          hasStoryBeats: Array.isArray(chapter.narrative?.storyBeats),
          storyBeatCount: chapter.narrative?.storyBeats?.length || 0,
          hasEmotionalArc: !!chapter.narrative?.emotionalArc,
          hasLevel: !!chapter.level,
          hasSegments: Array.isArray(chapter.level?.segments),
          segmentCount: chapter.level?.segments?.length || 0,
          hasNPCs: Array.isArray(chapter.npcs),
          npcCount: chapter.npcs?.length || 0,
          hasEncounters: Array.isArray(chapter.encounters),
          encounterCount: chapter.encounters?.length || 0,
        });
      }

      return results;
    });

    console.log('Chapter validation results:', JSON.stringify(validationResults, null, 2));

    // Verify each tested chapter has proper structure
    for (const result of validationResults) {
      expect(result.hasNarrative).toBe(true);
      expect(result.hasStoryBeats).toBe(true);
      expect(result.storyBeatCount).toBeGreaterThan(0);
      expect(result.hasEmotionalArc).toBe(true);
      expect(result.hasLevel).toBe(true);
      console.log(`Chapter ${result.id} (${result.name}): ✓ Valid structure`);
    }
  });
});
