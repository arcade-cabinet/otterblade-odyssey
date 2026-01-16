/**
 * @fileoverview Unit tests for data loaders
 * Tests JSON validation and typed data loading
 */

import { beforeAll, describe, expect, it } from 'vitest';
import {
  getBiomeByChapterId,
  getBiomeColorsArray,
  getChapterById,
  getBiomesSync,
  getChaptersSync,
  loadBiomes,
  loadChapters,
} from '@/game/data';

describe('Data Loaders', () => {
  beforeAll(async () => {
    await Promise.all([loadChapters(), loadBiomes()]);
  });

  describe('loadChapters', () => {
    it('should load all 10 chapters', () => {
      const chapters = getChaptersSync();
      expect(chapters).toHaveLength(10);
    });

    it('should have valid chapter structure', () => {
      const chapters = getChaptersSync();

      for (const chapter of chapters) {
        expect(chapter).toHaveProperty('id');
        expect(chapter).toHaveProperty('name');
        expect(chapter).toHaveProperty('setting');
        expect(chapter).toHaveProperty('quest');
        expect(chapter).toHaveProperty('hasBoss');
        expect(chapter).toHaveProperty('bossName');
        expect(chapter).toHaveProperty('assets');
        expect(chapter.assets).toHaveProperty('chapterPlate');
        expect(chapter.assets).toHaveProperty('parallaxBg');
      }
    });

    it('should have chapters in correct order', () => {
      const chapters = getChaptersSync();

      for (let i = 0; i < chapters.length; i++) {
        expect(chapters[i].id).toBe(i);
      }
    });

    it('should have valid boss configuration', () => {
      const chapters = getChaptersSync();

      for (const chapter of chapters) {
        if (chapter.hasBoss) {
          expect(chapter.bossName).not.toBeNull();
          expect(typeof chapter.bossName).toBe('string');
        } else {
          expect(chapter.bossName).toBeNull();
        }
      }
    });

    it('should have 5 boss chapters', () => {
      const chapters = getChaptersSync();
      const bossChapters = chapters.filter((ch) => ch.hasBoss);
      expect(bossChapters).toHaveLength(5);
    });
  });

  describe('loadBiomes', () => {
    it('should load all biomes', () => {
      const biomes = getBiomesSync();
      expect(biomes.length).toBeGreaterThan(0);
    });

    it('should have valid biome structure', () => {
      const biomes = getBiomesSync();

      for (const biome of biomes) {
        expect(biome).toHaveProperty('id');
        expect(biome).toHaveProperty('name');
        expect(biome).toHaveProperty('chapterIds');
        expect(biome).toHaveProperty('colors');
        expect(biome).toHaveProperty('atmosphere');
        expect(biome).toHaveProperty('timeOfDay');

        expect(Array.isArray(biome.chapterIds)).toBe(true);
        expect(biome.chapterIds.length).toBeGreaterThan(0);
      }
    });

    it('should have valid color hex codes', () => {
      const biomes = getBiomesSync();
      const hexRegex = /^#[0-9a-fA-F]{6}$/;

      for (const biome of biomes) {
        expect(biome.colors.bg).toMatch(hexRegex);
        expect(biome.colors.fog).toMatch(hexRegex);
        expect(biome.colors.accent).toMatch(hexRegex);
        expect(biome.colors.sky1).toMatch(hexRegex);
        expect(biome.colors.sky2).toMatch(hexRegex);
      }
    });

    it('should have valid atmosphere values', () => {
      const biomes = getBiomesSync();
      const validAtmospheres = [
        'warm',
        'serene',
        'cozy',
        'tense',
        'hopeful',
        'dramatic',
        'triumphant',
      ];

      for (const biome of biomes) {
        expect(validAtmospheres).toContain(biome.atmosphere);
      }
    });

    it('should have valid timeOfDay values', () => {
      const biomes = getBiomesSync();
      const validTimes = ['morning', 'afternoon', 'evening', 'night', 'dawn', 'sunset', 'sunrise'];

      for (const biome of biomes) {
        expect(validTimes).toContain(biome.timeOfDay);
      }
    });
  });

  describe('getChapterById', () => {
    it('should return chapter by ID', () => {
      const chapter = getChapterById(0);
      expect(chapter).toBeDefined();
      expect(chapter?.id).toBe(0);
      expect(chapter?.name).toBe('THE CALLING');
    });

    it('should return undefined for invalid ID', () => {
      const chapter = getChapterById(999);
      expect(chapter).toBeUndefined();
    });

    it('should return correct chapter data', () => {
      const chapter = getChapterById(8);
      expect(chapter?.name).toBe("STORM'S EDGE");
      expect(chapter?.hasBoss).toBe(true);
      expect(chapter?.bossName).toBe('Zephyros');
    });
  });

  describe('getBiomeByChapterId', () => {
    it('should return biome for chapter', () => {
      const biome = getBiomeByChapterId(0);
      expect(biome).toBeDefined();
      expect(biome?.chapterIds).toContain(0);
    });

    it('should return correct biome for shared chapters', () => {
      // Chapters 1 and 2 share the same biome
      const biome1 = getBiomeByChapterId(1);
      const biome2 = getBiomeByChapterId(2);
      expect(biome1?.id).toBe(biome2?.id);
    });

    it('should return undefined for invalid chapter ID', () => {
      const biome = getBiomeByChapterId(999);
      expect(biome).toBeUndefined();
    });
  });

  describe('getBiomeColorsArray', () => {
    it('should return array with same length as chapters', () => {
      const chapters = getChaptersSync();
      const colors = getBiomeColorsArray();
      expect(colors).toHaveLength(chapters.length);
    });

    it('should include all required color properties', () => {
      const colors = getBiomeColorsArray();

      for (const color of colors) {
        expect(color).toHaveProperty('name');
        expect(color).toHaveProperty('bg');
        expect(color).toHaveProperty('fog');
        expect(color).toHaveProperty('accent');
        expect(color).toHaveProperty('sky1');
        expect(color).toHaveProperty('sky2');
        expect(color).toHaveProperty('quest');
      }
    });
  });
});

describe('Data Consistency', () => {
  it('should have all chapters mapped to biomes', () => {
    const chapters = getChaptersSync();
    const biomes = getBiomesSync();

    for (const chapter of chapters) {
      const hasBiome = biomes.some((b) => b.chapterIds.includes(chapter.id));
      expect(hasBiome).toBe(true);
    }
  });

  it('should have chapter IDs referenced only once in biomes', () => {
    const biomes = getBiomesSync();
    const allChapterIds = biomes.flatMap((b) => b.chapterIds);
    const uniqueChapterIds = [...new Set(allChapterIds)];

    // Each chapter should appear exactly once
    expect(allChapterIds.length).toBe(uniqueChapterIds.length);
  });
});
