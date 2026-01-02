/**
 * @fileoverview Loaders for NPC (Non-Player Character) data.
 * These functions load and validate NPC data with full type safety.
 */

import { fromError } from 'zod-validation-error';
import npcData from '../../data/manifests/npcs.json';
import {
  type CharacterDefinition,
  type GestureLibrary,
  type NPCBehaviors,
  type NPCManifest,
  NPCManifestSchema,
  type Species,
} from './npc-schemas';

// Note: The actual npcs.json structure is flexible, so we use a lenient parse
// that allows the schema to evolve without breaking the game.

/** Cached NPC manifest */
let cachedManifest: NPCManifest | null = null;

/**
 * Loads and validates the NPC manifest.
 * Results are cached after first load.
 *
 * @throws Error if validation fails
 */
export function loadNPCManifest(): NPCManifest {
  if (cachedManifest) return cachedManifest;

  const result = NPCManifestSchema.safeParse(npcData);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid npcs.json manifest: ${error.message}`);
  }

  cachedManifest = result.data;
  return cachedManifest;
}

/**
 * Gets all species definitions.
 */
export function getAllSpecies(): Record<string, Species> {
  const manifest = loadNPCManifest();
  return manifest.species;
}

/**
 * Gets a specific species by ID.
 */
export function getSpecies(speciesId: string): Species | undefined {
  const species = getAllSpecies();
  return species[speciesId];
}

/**
 * Gets all character definitions.
 */
export function getAllCharacters(): CharacterDefinition[] {
  const manifest = loadNPCManifest();
  return manifest.characters;
}

/**
 * Gets a specific character by ID.
 */
export function getCharacterById(characterId: string): CharacterDefinition | undefined {
  const characters = getAllCharacters();
  return characters.find((c) => c.id === characterId);
}

/**
 * Gets characters that appear in a specific chapter.
 */
export function getCharactersByChapter(chapterId: number): CharacterDefinition[] {
  const characters = getAllCharacters();
  return characters.filter((c) => c.chapters?.includes(chapterId) ?? false);
}

/**
 * Gets characters by species.
 */
export function getCharactersBySpecies(species: string): CharacterDefinition[] {
  const characters = getAllCharacters();
  return characters.filter((c) => c.species === species);
}

/**
 * Gets the NPC behavior definitions.
 */
export function getNPCBehaviors(): NPCBehaviors {
  const manifest = loadNPCManifest();
  return manifest.npcBehaviors;
}

/**
 * Gets the gesture library.
 */
export function getGestureLibrary(): GestureLibrary {
  const manifest = loadNPCManifest();
  return manifest.gestureLibrary;
}

/**
 * Gets a specific gesture by name.
 * Note: Gestures are organized by category in the library.
 */
export function getGesture(gestureName: string): string[] | undefined {
  const library = getGestureLibrary();
  // The library is organized by category (greetings, directions, etc.)
  // Each category is an array of gesture names
  return library[gestureName as keyof GestureLibrary];
}

/**
 * Gets the draw function name for a character.
 * Used to look up the procedural drawing function.
 */
export function getCharacterDrawFunction(characterId: string): string | undefined {
  const character = getCharacterById(characterId);
  return character?.procedural?.drawFunction;
}

/**
 * Gets character hitbox dimensions.
 */
export function getCharacterHitbox(
  characterId: string
): { width: number; height: number; offsetY?: number } | undefined {
  const character = getCharacterById(characterId);
  const hitbox = character?.procedural?.hitbox;
  if (!hitbox) return undefined;
  return {
    width: hitbox.width ?? 35,
    height: hitbox.height ?? 55,
    offsetY: hitbox.offsetY,
  };
}

/**
 * Gets all unique species that have characters.
 */
export function getActiveSpecies(): string[] {
  const characters = getAllCharacters();
  const species = new Set(characters.map((c) => c.species));
  return Array.from(species);
}

/**
 * Clears the NPC manifest cache.
 * Useful for hot reloading during development.
 */
export function clearNPCCache(): void {
  cachedManifest = null;
}
