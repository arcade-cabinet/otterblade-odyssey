/**
 * @fileoverview Unit tests for chapter manifest loaders
 * Tests comprehensive chapter manifest validation and loading
 */

import { describe, expect, it } from 'vitest';
import {
  clearChapterCache,
  getChapterBoss,
  getChapterCollectibles,
  getChapterEncounters,
  getChapterEnvironment,
  getChapterMedia,
  getChapterMotionChallenges,
  getChapterNPCs,
  getChapterOverview,
  getChapterSecrets,
  getChapterSpawnPoint,
  getChapterTriggers,
  getUnlockedChapters,
  loadAllChapterManifests,
  loadChapterManifest,
  TOTAL_CHAPTERS,
} from '@/game/data';

describe('Chapter Manifest Loaders', () => {
  // Clear cache before each test for clean state
  beforeEach(() => {
    clearChapterCache();
  });

  describe('loadChapterManifest', () => {
    it('should load chapter 0 successfully', () => {
      const chapter = loadChapterManifest(0);
      expect(chapter).toBeDefined();
      expect(chapter.id).toBe(0);
      expect(chapter.name).toBe('The Calling');
    });

    it('should throw for invalid chapter ID', () => {
      expect(() => loadChapterManifest(100)).toThrow('Chapter 100 not found');
    });

    it('should cache loaded chapters', () => {
      const chapter1 = loadChapterManifest(0);
      const chapter2 = loadChapterManifest(0);
      expect(chapter1).toBe(chapter2);
    });

    it('should load all 10 chapters', () => {
      for (let i = 0; i < TOTAL_CHAPTERS; i++) {
        const chapter = loadChapterManifest(i);
        expect(chapter.id).toBe(i);
      }
    });
  });

  describe('loadAllChapterManifests', () => {
    it('should return array of 10 chapters', () => {
      const chapters = loadAllChapterManifests();
      expect(chapters).toHaveLength(TOTAL_CHAPTERS);
    });

    it('should return chapters in order', () => {
      const chapters = loadAllChapterManifests();
      for (let i = 0; i < chapters.length; i++) {
        expect(chapters[i].id).toBe(i);
      }
    });
  });

  describe('getChapterOverview', () => {
    it('should return basic chapter info', () => {
      const overview = getChapterOverview(0);
      expect(overview).toHaveProperty('id');
      expect(overview).toHaveProperty('name');
      expect(overview).toHaveProperty('location');
      expect(overview).toHaveProperty('quest');
      expect(overview).toHaveProperty('hasBoss');
    });

    it('should correctly identify boss chapters', () => {
      // Chapter 8 has Zephyros as boss
      const overview8 = getChapterOverview(8);
      expect(overview8.hasBoss).toBe(true);

      // Chapter 0 has no boss
      const overview0 = getChapterOverview(0);
      expect(overview0.hasBoss).toBe(false);
    });
  });

  describe('Chapter Data Accessors', () => {
    it('getChapterNPCs should return NPCs array', () => {
      const npcs = getChapterNPCs(0);
      expect(Array.isArray(npcs)).toBe(true);
    });

    it('getChapterSpawnPoint should return valid position', () => {
      const spawn = getChapterSpawnPoint(0);
      expect(spawn).toHaveProperty('x');
      expect(spawn).toHaveProperty('y');
      expect(typeof spawn.x).toBe('number');
      expect(typeof spawn.y).toBe('number');
    });

    it('getChapterMedia should return media references', () => {
      const media = getChapterMedia(0);
      expect(media).toHaveProperty('chapterPlate');
      expect(media).toHaveProperty('parallaxBackground');
    });

    it('getChapterEnvironment should return environment config', () => {
      const env = getChapterEnvironment(0);
      expect(env).toHaveProperty('lighting');
      expect(env.lighting).toHaveProperty('ambientColor');
      expect(env.lighting).toHaveProperty('ambientIntensity');
    });

    it('getChapterTriggers should return triggers array', () => {
      const triggers = getChapterTriggers(0);
      expect(Array.isArray(triggers)).toBe(true);
    });

    it('getChapterEncounters should return encounters array', () => {
      const encounters = getChapterEncounters(0);
      expect(Array.isArray(encounters)).toBe(true);
    });

    it('getChapterCollectibles should return collectibles array', () => {
      const collectibles = getChapterCollectibles(0);
      expect(Array.isArray(collectibles)).toBe(true);
    });

    it('getChapterSecrets should return secrets array', () => {
      const secrets = getChapterSecrets(0);
      expect(Array.isArray(secrets)).toBe(true);
    });

    it('getChapterMotionChallenges should return array', () => {
      const challenges = getChapterMotionChallenges(0);
      expect(Array.isArray(challenges)).toBe(true);
    });
  });

  describe('getChapterBoss', () => {
    it('should return null for chapters without boss', () => {
      const boss = getChapterBoss(0);
      expect(boss).toBeNull();
    });

    it('should return boss data for boss chapters', () => {
      const boss = getChapterBoss(8);
      expect(boss).not.toBeNull();
      expect(boss?.id).toBe('zephyros');
      expect(boss?.name).toBe('Zephyros, the Storm-Bringer');
    });
  });

  describe('getUnlockedChapters', () => {
    it('should always include chapter 0', () => {
      const unlocked = getUnlockedChapters([]);
      expect(unlocked).toContain(0);
    });

    it('should unlock next chapter after completion', () => {
      const unlocked = getUnlockedChapters([0]);
      expect(unlocked).toContain(0);
      expect(unlocked).toContain(1);
    });

    it('should unlock multiple chapters progressively', () => {
      const unlocked = getUnlockedChapters([0, 1, 2, 3]);
      expect(unlocked).toContain(0);
      expect(unlocked).toContain(1);
      expect(unlocked).toContain(2);
      expect(unlocked).toContain(3);
      expect(unlocked).toContain(4);
    });
  });
});

describe('Chapter Manifest Structure', () => {
  it('should have valid narrative structure in all chapters', () => {
    const chapters = loadAllChapterManifests();
    for (const chapter of chapters) {
      expect(chapter.narrative).toHaveProperty('theme');
      expect(chapter.narrative).toHaveProperty('quest');
      expect(chapter.narrative).toHaveProperty('emotionalArc');
      expect(chapter.narrative).toHaveProperty('storyBeats');
    }
  });

  it('should have valid level structure in all chapters', () => {
    const chapters = loadAllChapterManifests();
    for (const chapter of chapters) {
      expect(chapter.level).toHaveProperty('bounds');
      expect(chapter.level).toHaveProperty('biome');
      expect(chapter.level).toHaveProperty('spawnPoint');
      expect(chapter.level).toHaveProperty('segments');
    }
  });

  it('should have valid connections structure in all chapters', () => {
    const chapters = loadAllChapterManifests();
    for (const chapter of chapters) {
      expect(chapter.connections).toHaveProperty('previousChapter');
      expect(chapter.connections).toHaveProperty('nextChapter');
    }
  });

  it('should have chapter connections form a valid chain', () => {
    const chapters = loadAllChapterManifests();

    // Chapter 0 should have no previous
    expect(chapters[0].connections.previousChapter).toBeNull();

    // Chapter 9 should have no next
    expect(chapters[9].connections.nextChapter).toBeNull();

    // Middle chapters should chain correctly
    for (let i = 1; i < chapters.length - 1; i++) {
      expect(chapters[i].connections.previousChapter).toBe(i - 1);
      expect(chapters[i].connections.nextChapter).toBe(i + 1);
    }
  });
});

describe('Chapter Content Validation', () => {
  it('should have first chapter as tutorial/prologue', () => {
    const chapter0 = loadChapterManifest(0);
    expect(chapter0.location).toContain('Cottage');
    expect(chapter0.npcs?.some((npc) => npc.name === 'Mother Riverstone')).toBe(true);
  });

  it('should have final chapter as victory/epilogue', () => {
    const chapter9 = loadChapterManifest(9);
    expect(chapter9.name).toContain('Dawn');
    expect(chapter9.narrative.theme).toContain('homecoming');
  });

  it('should have Zephyros as final boss in chapter 8', () => {
    const boss = getChapterBoss(8);
    expect(boss).not.toBeNull();
    expect(boss?.type).toBe('final_boss');
    expect(boss?.phases?.length).toBeGreaterThan(1);
  });
});
