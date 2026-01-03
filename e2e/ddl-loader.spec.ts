import { test, expect } from '@playwright/test';

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
    await page.waitForFunction(
      () => {
        const startButton = document.querySelector('button:has-text("Begin Journey")');
        return startButton !== null;
      },
      { timeout: 30000 }
    );

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
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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

    // Take screenshot of running game
    await page.waitForTimeout(2000); // Let game render
    await page.screenshot({ path: '/tmp/ddl-loader-game-running.png', fullPage: false });
    console.log('Screenshot saved: /tmp/ddl-loader-game-running.png');
  });

  test('should validate chapter manifest data integrity', async ({ page }) => {
    // Wait for preload
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Begin Journey")') !== null,
      { timeout: 30000 }
    );

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
