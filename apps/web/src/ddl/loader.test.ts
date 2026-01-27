/**
 * Integration tests for DDL manifest loader using REAL data files
 * These tests validate that our actual manifest files are correct and loadable
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ALL_CHAPTER_IDS,
  clearManifestCache,
  getCacheStats,
  getChapterManifestSync,
  getEnemiesManifestSync,
  getNPCsManifestSync,
  isValidChapterId,
  loadChapterManifest,
  loadChapterPlatesManifest,
  loadCinematicsManifest,
  loadEffectsManifest,
  loadEnemiesManifest,
  loadItemsManifest,
  loadNPCsManifest,
  loadScenesManifest,
  loadSoundsManifest,
  loadSpritesManifest,
  preloadManifests,
  TOTAL_CHAPTERS,
} from './loader';

describe('DDL Loader - Real Data Tests', () => {
  beforeAll(async () => {
    // Preload all manifests once for all tests
    await preloadManifests({ logProgress: false });
  });

  beforeEach(() => {
    // Don't clear cache - we want to use preloaded data
  });

  describe('Cache Management', () => {
    it('should have manifests cached after preload', () => {
      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.keys.length).toBeGreaterThan(0);
    });

    it('should allow cache clearing', () => {
      const sizeBefore = getCacheStats().size;
      expect(sizeBefore).toBeGreaterThan(0);
      
      clearManifestCache();
      expect(getCacheStats().size).toBe(0);
      
      // Restore for other tests
      preloadManifests({ logProgress: false });
    });
  });

  describe('Chapter Loading', () => {
    it('should reject invalid chapter IDs', async () => {
      await expect(loadChapterManifest(-1)).rejects.toThrow('Invalid chapter ID');
      await expect(loadChapterManifest(10)).rejects.toThrow('Invalid chapter ID');
      await expect(loadChapterManifest(NaN)).rejects.toThrow('Invalid chapter ID');
    });

    it('should validate chapter ID helper', () => {
      expect(isValidChapterId(0)).toBe(true);
      expect(isValidChapterId(9)).toBe(true);
      expect(isValidChapterId(-1)).toBe(false);
      expect(isValidChapterId(10)).toBe(false);
      expect(isValidChapterId(5.5)).toBe(false);
      expect(isValidChapterId(NaN)).toBe(false);
    });

    it('should export chapter constants', () => {
      expect(ALL_CHAPTER_IDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(TOTAL_CHAPTERS).toBe(10);
    });

    it('should load all chapters successfully', async () => {
      for (const id of ALL_CHAPTER_IDS) {
        const chapter = await loadChapterManifest(id);
        expect(chapter).toBeDefined();
        expect(chapter.id).toBe(id);
        expect(chapter.name).toBeTruthy();
        expect(chapter.location).toBeTruthy();
      }
    });

    it('should throw if sync accessor called before preload', () => {
      clearManifestCache();
      expect(() => getChapterManifestSync(0)).toThrow();
      // Restore
      preloadManifests({ logProgress: false });
    });

    it('should allow sync access after preload', () => {
      const chapter = getChapterManifestSync(0);
      expect(chapter).toBeDefined();
      expect(chapter.id).toBe(0);
      expect(chapter.name).toBe('The Calling');
    });
  });

  describe('Entity Manifests', () => {
    it('should load enemies manifest with real data', async () => {
      const enemies = await loadEnemiesManifest();
      expect(enemies.category).toBe('enemies');
      expect(enemies.assets).toBeDefined();
      expect(Array.isArray(enemies.assets)).toBe(true);
      expect(enemies.assets.length).toBeGreaterThan(0);
    });

    it('should load NPCs manifest with real data', async () => {
      const npcs = await loadNPCsManifest();
      expect(npcs).toBeDefined();
      expect(npcs.species).toBeDefined();
      expect(npcs.characters).toBeDefined();
      expect(Array.isArray(npcs.characters)).toBe(true);
    });

    it('should provide sync access to loaded manifests', () => {
      const enemies = getEnemiesManifestSync();
      expect(enemies.category).toBe('enemies');
      
      const npcs = getNPCsManifestSync();
      expect(npcs.species).toBeDefined();
    });
  });

  describe('Asset Manifests', () => {
    it('should load sprites manifest', async () => {
      const sprites = await loadSpritesManifest();
      expect(sprites.category).toBe('sprites');
      expect(sprites.assets).toBeDefined();
      expect(sprites.assets.length).toBeGreaterThan(0);
    });

    it('should load cinematics manifest', async () => {
      const cinematics = await loadCinematicsManifest();
      expect(cinematics.category).toBe('cinematics');
      expect(cinematics.assets).toBeDefined();
      expect(cinematics.assets.length).toBeGreaterThan(0);
    });

    it('should load sounds manifest', async () => {
      const sounds = await loadSoundsManifest();
      expect(sounds.category).toBe('sounds');
      expect(sounds.assets).toBeDefined();
      expect(sounds.assets.length).toBeGreaterThan(0);
    });

    it('should load effects manifest', async () => {
      const effects = await loadEffectsManifest();
      expect(effects.category).toBe('effects');
      expect(effects.assets).toBeDefined();
      expect(effects.assets.length).toBeGreaterThan(0);
    });

    it('should load items manifest', async () => {
      const items = await loadItemsManifest();
      expect(items.category).toBe('items');
      expect(items.assets).toBeDefined();
      expect(items.assets.length).toBeGreaterThan(0);
    });

    it('should load scenes manifest', async () => {
      const scenes = await loadScenesManifest();
      expect(scenes.category).toBe('scenes');
      expect(scenes.assets).toBeDefined();
      expect(scenes.assets.length).toBeGreaterThan(0);
    });

    it('should load chapter-plates manifest', async () => {
      const plates = await loadChapterPlatesManifest();
      expect(plates.category).toBe('chapter-plates');
      expect(plates.assets).toBeDefined();
      expect(plates.assets.length).toBe(10); // One for each chapter
    });
  });

  describe('Preload System', () => {
    it('should preload all manifests successfully', async () => {
      clearManifestCache();
      
      const result = await preloadManifests({ logProgress: false });
      expect(result.success).toBe(true);
      expect(result.loaded.length).toBeGreaterThan(0);
      
      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThan(15); // All chapters + entity + asset manifests
    });

    it('should support selective preloading', async () => {
      clearManifestCache();
      
      await preloadManifests({
        manifestTypes: ['chapters', 'enemies'],
        logProgress: false,
      });
      
      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(11); // 10 chapters + enemies
    });

    it('should not throw on individual failures when throwOnError=false', async () => {
      // This tests graceful error handling
      // All our files are valid, so this just confirms the option works
      const result = await preloadManifests({
        throwOnError: false,
        logProgress: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should have valid connections between chapters', () => {
      const chapters = ALL_CHAPTER_IDS.map((id) => getChapterManifestSync(id));
      
      // Chapter 0 should have no previous
      expect(chapters[0].connections.previousChapter).toBeNull();
      
      // Chapter 9 should have no next
      expect(chapters[9].connections.nextChapter).toBeNull();
      
      // Middle chapters should have both
      for (let i = 1; i < 9; i++) {
        expect(chapters[i].connections.previousChapter).toBe(i - 1);
        expect(chapters[i].connections.nextChapter).toBe(i + 1);
      }
    });

    it('should have required fields in all chapters', () => {
      for (const id of ALL_CHAPTER_IDS) {
        const chapter = getChapterManifestSync(id);
        expect(chapter.id).toBe(id);
        expect(chapter.name).toBeTruthy();
        expect(chapter.location).toBeTruthy();
        expect(chapter.narrative).toBeDefined();
        expect(chapter.level).toBeDefined();
        expect(chapter.media).toBeDefined();
      }
    });

    it('should have valid enemy data', () => {
      const enemies = getEnemiesManifestSync();
      for (const enemy of enemies.assets) {
        expect(enemy.id).toBeTruthy();
        expect(enemy.status).toBeTruthy();
      }
    });

    it('should have valid NPC data', () => {
      const npcs = getNPCsManifestSync();
      expect(Object.keys(npcs.species).length).toBeGreaterThan(0);
      expect(npcs.characters.length).toBeGreaterThan(0);
      
      for (const character of npcs.characters) {
        expect(character.id).toBeTruthy();
        expect(character.name).toBeTruthy();
        expect(character.species).toBeTruthy();
        expect(npcs.species[character.species]).toBeDefined();
      }
    });
  });
});
