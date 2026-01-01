/**
 * @fileoverview Unit tests for NPC manifest loaders
 * Tests NPC data validation and loading functions
 */

import { describe, expect, it } from 'vitest';
import {
  clearNPCCache,
  getActiveSpecies,
  getAllCharacters,
  getAllSpecies,
  getCharacterById,
  getCharacterDrawFunction,
  getCharacterHitbox,
  getCharactersByChapter,
  getCharactersBySpecies,
  getGesture,
  getGestureLibrary,
  getNPCBehaviors,
  getSpecies,
  loadNPCManifest,
} from '@/game/data';

describe('NPC Manifest Loader', () => {
  // Clear cache before each test for clean state
  beforeEach(() => {
    clearNPCCache();
  });

  describe('loadNPCManifest', () => {
    it('should load the NPC manifest successfully', () => {
      const manifest = loadNPCManifest();
      expect(manifest).toBeDefined();
      expect(manifest.category).toBe('npcs');
    });

    it('should have valid version', () => {
      const manifest = loadNPCManifest();
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should cache the manifest', () => {
      const manifest1 = loadNPCManifest();
      const manifest2 = loadNPCManifest();
      expect(manifest1).toBe(manifest2);
    });
  });

  describe('Species Functions', () => {
    it('getAllSpecies should return species map', () => {
      const species = getAllSpecies();
      expect(typeof species).toBe('object');
      expect(Object.keys(species).length).toBeGreaterThan(0);
    });

    it('should include core woodland species', () => {
      const species = getAllSpecies();
      expect(species).toHaveProperty('otter');
      expect(species).toHaveProperty('mouse');
      expect(species).toHaveProperty('badger');
      expect(species).toHaveProperty('hare');
      expect(species).toHaveProperty('mole');
    });

    it('getSpecies should return specific species', () => {
      const otter = getSpecies('otter');
      expect(otter).toBeDefined();
      expect(otter?.description).toBeDefined();
      expect(otter?.physique).toBeDefined();
      expect(otter?.personality).toBeDefined();
      expect(otter?.roles).toBeDefined();
      expect(otter?.colors).toBeDefined();
    });

    it('getSpecies should return undefined for unknown species', () => {
      const unknown = getSpecies('dragon');
      expect(unknown).toBeUndefined();
    });

    it('species should have valid color definitions', () => {
      const species = getAllSpecies();
      for (const [name, spec] of Object.entries(species)) {
        expect(spec.colors).toBeDefined();
        expect(typeof spec.colors).toBe('object');
        // Each color group should be an array of hex colors
        for (const colorGroup of Object.values(spec.colors)) {
          expect(Array.isArray(colorGroup)).toBe(true);
          for (const color of colorGroup) {
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      }
    });
  });

  describe('Character Functions', () => {
    it('getAllCharacters should return characters array', () => {
      const characters = getAllCharacters();
      expect(Array.isArray(characters)).toBe(true);
      expect(characters.length).toBeGreaterThan(0);
    });

    it('should include protagonist Finn', () => {
      const characters = getAllCharacters();
      const finn = characters.find((c) => c.id === 'finn');
      expect(finn).toBeDefined();
      expect(finn?.species).toBe('otter');
      expect(finn?.role).toBe('protagonist');
    });

    it('getCharacterById should return correct character', () => {
      const finn = getCharacterById('finn');
      expect(finn).toBeDefined();
      expect(finn?.name).toBe('Finn');
    });

    it('getCharacterById should return undefined for unknown ID', () => {
      const unknown = getCharacterById('unknown-character-xyz');
      expect(unknown).toBeUndefined();
    });

    it('getCharactersByChapter should filter by chapter', () => {
      const chapter0Chars = getCharactersByChapter(0);
      expect(Array.isArray(chapter0Chars)).toBe(true);
      for (const char of chapter0Chars) {
        expect(char.chapters).toContain(0);
      }
    });

    it('getCharactersBySpecies should filter by species', () => {
      const otters = getCharactersBySpecies('otter');
      expect(Array.isArray(otters)).toBe(true);
      for (const char of otters) {
        expect(char.species).toBe('otter');
      }
    });

    it('characters should have valid hitboxes', () => {
      const characters = getAllCharacters();
      for (const char of characters) {
        expect(char.hitbox).toBeDefined();
        expect(typeof char.hitbox.width).toBe('number');
        expect(typeof char.hitbox.height).toBe('number');
        expect(char.hitbox.width).toBeGreaterThan(0);
        expect(char.hitbox.height).toBeGreaterThan(0);
      }
    });

    it('characters should have drawFunction defined', () => {
      const characters = getAllCharacters();
      for (const char of characters) {
        expect(char.drawFunction).toBeDefined();
        expect(typeof char.drawFunction).toBe('string');
        expect(char.drawFunction.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Character Utility Functions', () => {
    it('getCharacterDrawFunction should return draw function name', () => {
      const drawFn = getCharacterDrawFunction('finn');
      expect(drawFn).toBeDefined();
      expect(typeof drawFn).toBe('string');
    });

    it('getCharacterHitbox should return hitbox dimensions', () => {
      const hitbox = getCharacterHitbox('finn');
      expect(hitbox).toBeDefined();
      expect(hitbox?.width).toBeGreaterThan(0);
      expect(hitbox?.height).toBeGreaterThan(0);
    });

    it('getActiveSpecies should return unique species list', () => {
      const species = getActiveSpecies();
      expect(Array.isArray(species)).toBe(true);
      const unique = [...new Set(species)];
      expect(species.length).toBe(unique.length);
    });
  });

  describe('Behavior Functions', () => {
    it('getNPCBehaviors should return behavior definitions', () => {
      const behaviors = getNPCBehaviors();
      expect(behaviors).toBeDefined();
      expect(behaviors).toHaveProperty('idle');
      expect(behaviors).toHaveProperty('patrol');
      expect(behaviors).toHaveProperty('follow');
      expect(behaviors).toHaveProperty('flee');
    });

    it('idle behavior should have valid config', () => {
      const behaviors = getNPCBehaviors();
      expect(behaviors.idle.animations).toBeDefined();
      expect(Array.isArray(behaviors.idle.animations)).toBe(true);
    });

    it('patrol behavior should require waypoints', () => {
      const behaviors = getNPCBehaviors();
      expect(typeof behaviors.patrol.requiresWaypoints).toBe('boolean');
    });
  });

  describe('Gesture Library', () => {
    it('getGestureLibrary should return gestures', () => {
      const gestures = getGestureLibrary();
      expect(typeof gestures).toBe('object');
      expect(Object.keys(gestures).length).toBeGreaterThan(0);
    });

    it('should include common gestures', () => {
      const gestures = getGestureLibrary();
      expect(gestures).toHaveProperty('nod');
      expect(gestures).toHaveProperty('wave');
      expect(gestures).toHaveProperty('bow');
    });

    it('getGesture should return specific gesture', () => {
      const nod = getGesture('nod');
      expect(nod).toBeDefined();
      expect(typeof nod?.duration).toBe('number');
      expect(typeof nod?.frames).toBe('number');
      expect(typeof nod?.loop).toBe('boolean');
      expect(Array.isArray(nod?.meaning)).toBe(true);
    });

    it('gestures should have valid structure', () => {
      const gestures = getGestureLibrary();
      for (const [name, gesture] of Object.entries(gestures)) {
        expect(gesture.duration).toBeGreaterThan(0);
        expect(gesture.frames).toBeGreaterThan(0);
        expect(gesture.meaning.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('NPC Data Consistency', () => {
  it('all characters should reference valid species', () => {
    const characters = getAllCharacters();
    const species = getAllSpecies();
    const validSpecies = Object.keys(species);

    for (const char of characters) {
      expect(validSpecies).toContain(char.species);
    }
  });

  it('all character chapters should be valid (0-9)', () => {
    const characters = getAllCharacters();
    for (const char of characters) {
      for (const chapter of char.chapters) {
        expect(chapter).toBeGreaterThanOrEqual(0);
        expect(chapter).toBeLessThanOrEqual(9);
      }
    }
  });

  it('protagonist Finn should appear in all chapters', () => {
    const finn = getCharacterById('finn');
    expect(finn?.chapters).toHaveLength(10);
  });
});
