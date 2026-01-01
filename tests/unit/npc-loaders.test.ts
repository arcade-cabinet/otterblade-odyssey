/**
 * @fileoverview Unit tests for NPC manifest data
 * Tests NPC data structure and consistency
 *
 * NOTE: These tests verify the NPC JSON structure directly since
 * the manifest format is still evolving with the game design.
 */

import { describe, expect, it } from 'vitest';
// Import the raw JSON directly for testing
import npcData from '@/data/manifests/npcs.json';

describe('NPC Manifest Structure', () => {
  describe('manifest metadata', () => {
    it('should have valid version', () => {
      expect(npcData.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have correct category', () => {
      expect(npcData.category).toBe('npcs');
    });

    it('should have description', () => {
      expect(npcData.description).toBeDefined();
      expect(typeof npcData.description).toBe('string');
    });
  });

  describe('species definitions', () => {
    it('should have species object', () => {
      expect(npcData.species).toBeDefined();
      expect(typeof npcData.species).toBe('object');
    });

    it('should include core woodland species', () => {
      const speciesKeys = Object.keys(npcData.species);
      expect(speciesKeys).toContain('otter');
      expect(speciesKeys).toContain('mouse');
      expect(speciesKeys).toContain('badger');
      expect(speciesKeys).toContain('hare');
      expect(speciesKeys).toContain('mole');
      expect(speciesKeys).toContain('hedgehog');
      expect(speciesKeys).toContain('squirrel');
    });

    it('each species should have required fields', () => {
      for (const [name, species] of Object.entries(npcData.species)) {
        const spec = species as Record<string, unknown>;
        expect(spec.description, `${name} missing description`).toBeDefined();
        expect(spec.physique, `${name} missing physique`).toBeDefined();
        expect(spec.personality, `${name} missing personality`).toBeDefined();
        expect(spec.roles, `${name} missing roles`).toBeDefined();
        expect(spec.colors, `${name} missing colors`).toBeDefined();
      }
    });

    it('species colors should be valid hex codes', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      for (const [name, species] of Object.entries(npcData.species)) {
        const spec = species as { colors: Record<string, string[]> };
        for (const [colorGroup, colors] of Object.entries(spec.colors)) {
          for (const color of colors) {
            expect(color, `${name}.${colorGroup} has invalid color`).toMatch(hexRegex);
          }
        }
      }
    });
  });

  describe('character definitions', () => {
    it('should have characters array', () => {
      expect(npcData.characters).toBeDefined();
      expect(Array.isArray(npcData.characters)).toBe(true);
      expect(npcData.characters.length).toBeGreaterThan(0);
    });

    it('should include protagonist Finn', () => {
      const finn = npcData.characters.find(
        (c: Record<string, unknown>) => c.id === 'finn_otterblade'
      );
      expect(finn).toBeDefined();
      expect(finn?.species).toBe('otter');
      expect(finn?.role).toBe('protagonist');
    });

    it('each character should have required fields', () => {
      for (const char of npcData.characters) {
        const c = char as Record<string, unknown>;
        expect(c.id, 'character missing id').toBeDefined();
        expect(c.name, `${c.id} missing name`).toBeDefined();
        expect(c.species, `${c.id} missing species`).toBeDefined();
        expect(c.role, `${c.id} missing role`).toBeDefined();
      }
    });

    it('characters should reference valid species', () => {
      const validSpecies = Object.keys(npcData.species);
      for (const char of npcData.characters) {
        const c = char as { id: string; species: string };
        expect(validSpecies, `${c.id} has invalid species: ${c.species}`).toContain(c.species);
      }
    });

    it('characters should have procedural config with hitbox', () => {
      for (const char of npcData.characters) {
        const c = char as { id: string; procedural?: { hitbox?: Record<string, unknown> } };
        expect(c.procedural, `${c.id} missing procedural config`).toBeDefined();
        expect(c.procedural?.hitbox, `${c.id} missing hitbox`).toBeDefined();
        expect(c.procedural?.hitbox?.width, `${c.id} hitbox missing width`).toBeGreaterThan(0);
        expect(c.procedural?.hitbox?.height, `${c.id} hitbox missing height`).toBeGreaterThan(0);
      }
    });

    it('characters should have drawFunction in procedural', () => {
      for (const char of npcData.characters) {
        const c = char as { id: string; procedural?: { drawFunction?: string } };
        expect(c.procedural?.drawFunction, `${c.id} missing drawFunction`).toBeDefined();
        expect(typeof c.procedural?.drawFunction).toBe('string');
      }
    });
  });

  describe('NPC behaviors', () => {
    it('should have npcBehaviors object', () => {
      expect(npcData.npcBehaviors).toBeDefined();
      expect(typeof npcData.npcBehaviors).toBe('object');
    });

    it('should define core behavior types', () => {
      const behaviors = npcData.npcBehaviors as Record<string, unknown>;
      expect(behaviors.idle).toBeDefined();
      expect(behaviors.patrol).toBeDefined();
      expect(behaviors.follow).toBeDefined();
      expect(behaviors.flee).toBeDefined();
      expect(behaviors.escort).toBeDefined();
      expect(behaviors.scripted).toBeDefined();
    });

    it('each behavior should have description', () => {
      for (const [name, behavior] of Object.entries(npcData.npcBehaviors)) {
        const b = behavior as { description?: string };
        expect(b.description, `${name} missing description`).toBeDefined();
      }
    });
  });

  describe('gesture library', () => {
    it('should have gestureLibrary object', () => {
      expect(npcData.gestureLibrary).toBeDefined();
      expect(typeof npcData.gestureLibrary).toBe('object');
    });

    it('should have gesture categories', () => {
      const gestures = npcData.gestureLibrary as Record<string, string[]>;
      expect(gestures.greetings).toBeDefined();
      expect(gestures.directions).toBeDefined();
      expect(gestures.emotions).toBeDefined();
      expect(gestures.blessings).toBeDefined();
      expect(gestures.actions).toBeDefined();
      expect(gestures.combat).toBeDefined();
    });

    it('gesture categories should be arrays of strings', () => {
      for (const [category, gestures] of Object.entries(npcData.gestureLibrary)) {
        expect(Array.isArray(gestures), `${category} should be array`).toBe(true);
        for (const gesture of gestures as string[]) {
          expect(typeof gesture).toBe('string');
        }
      }
    });

    it('should include common gestures', () => {
      const gestures = npcData.gestureLibrary as Record<string, string[]>;
      expect(gestures.greetings).toContain('wave');
      expect(gestures.greetings).toContain('nod');
      expect(gestures.greetings).toContain('bow');
    });
  });
});

describe('NPC Data Consistency', () => {
  it('all characters with chapters should have valid chapter IDs (0-9)', () => {
    for (const char of npcData.characters) {
      const c = char as { id: string; chapters?: number[] };
      if (c.chapters) {
        for (const chapter of c.chapters) {
          expect(chapter, `${c.id} has invalid chapter: ${chapter}`).toBeGreaterThanOrEqual(0);
          expect(chapter, `${c.id} has invalid chapter: ${chapter}`).toBeLessThanOrEqual(9);
        }
      }
    }
  });

  it('should have at least one character per major role', () => {
    const roles = npcData.characters.map((c: Record<string, unknown>) => c.role);
    expect(roles).toContain('protagonist');
    expect(roles).toContain('mentor');
    expect(roles).toContain('ally');
    expect(roles).toContain('guide');
  });

  it('protagonist should be an otter (Finn)', () => {
    const protagonist = npcData.characters.find(
      (c: Record<string, unknown>) => c.role === 'protagonist'
    ) as { species: string; name: string } | undefined;
    expect(protagonist).toBeDefined();
    expect(protagonist?.species).toBe('otter');
    expect(protagonist?.name).toBe('Finn');
  });

  it('should have diverse species represented', () => {
    const speciesInUse = new Set(
      npcData.characters.map((c: Record<string, unknown>) => c.species)
    );
    expect(speciesInUse.size).toBeGreaterThan(3);
  });
});
