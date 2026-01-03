/**
 * @fileoverview DDL (Data Definition Language) Manifest Loader
 *
 * Provides fetch-based loading of JSON manifests with caching and validation.
 * All game content is defined in JSON manifests and loaded at runtime via fetch.
 *
 * Architecture:
 * - Manifests live in /data/manifests/ (served from game/public/)
 * - Async loading with caching for performance
 * - Zod validation for type safety
 * - Preload support for game initialization
 * - Sync accessors for post-preload access
 *
 * @module ddl/loader
 */

import { fromError } from 'zod-validation-error';
import type {
  ChapterManifest,
  EnemiesManifest,
  NPCsManifest,
  SpritesManifest,
  CinematicsManifest,
  SoundsManifest,
  EffectsManifest,
  ItemsManifest,
  ScenesManifest,
  ChapterPlatesManifest,
} from '../game/data/manifest-schemas';
import {
  ChapterManifestSchema,
  EnemiesManifestSchema,
  NPCsManifestSchema,
  SpritesManifestSchema,
  CinematicsManifestSchema,
  SoundsManifestSchema,
  EffectsManifestSchema,
  ItemsManifestSchema,
  ScenesManifestSchema,
  ChapterPlatesManifestSchema,
} from '../game/data/manifest-schemas';

// ============================================================================
// TYPES
// ============================================================================

/** Preload configuration */
export interface PreloadOptions {
  /** Which manifest types to preload (default: all) */
  manifestTypes?: Array<
    | 'chapters'
    | 'enemies'
    | 'npcs'
    | 'sprites'
    | 'cinematics'
    | 'sounds'
    | 'effects'
    | 'items'
    | 'scenes'
    | 'chapter-plates'
  >;
  /** Whether to log progress (default: true) */
  logProgress?: boolean;
  /** Whether to throw on validation errors (default: false, logs warnings) */
  throwOnError?: boolean;
}

// ============================================================================
// CACHE
// ============================================================================

/** Cache for loaded and validated manifests */
const manifestCache = new Map<string, unknown>();

/**
 * Clears the manifest cache.
 * Useful for hot reloading during development or testing.
 */
export function clearManifestCache(): void {
  manifestCache.clear();
}

/**
 * Gets cache statistics for monitoring.
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: manifestCache.size,
    keys: Array.from(manifestCache.keys()),
  };
}

// ============================================================================
// BASE LOADER
// ============================================================================

/**
 * Base manifest loader that fetches JSON from /data/manifests/ paths.
 * Handles caching and provides descriptive errors.
 *
 * @param path - Relative path from /data/manifests/ (e.g., "enemies.json")
 * @returns Parsed JSON data
 * @throws Error if fetch fails or JSON is invalid
 */
async function loadManifest(path: string): Promise<unknown> {
  // Check cache first
  if (manifestCache.has(path)) {
    return manifestCache.get(path);
  }

  // Construct full fetch path
  const fetchPath = `/data/manifests/${path}`;

  try {
    const response = await fetch(fetchPath);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch manifest at ${fetchPath}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Cache the result
    manifestCache.set(path, data);

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in manifest ${fetchPath}: ${error.message}`);
    }
    throw new Error(`Failed to load manifest ${fetchPath}: ${(error as Error).message}`);
  }
}

// ============================================================================
// CHAPTER LOADERS
// ============================================================================

/**
 * Mapping of chapter IDs to manifest filenames.
 * Centralized to avoid duplication and ensure consistency.
 */
const CHAPTER_FILENAMES: Record<number, string> = {
  0: 'chapters/chapter-0-the-calling.json',
  1: 'chapters/chapter-1-river-path.json',
  2: 'chapters/chapter-2-gatehouse.json',
  3: 'chapters/chapter-3-great-hall.json',
  4: 'chapters/chapter-4-archives.json',
  5: 'chapters/chapter-5-deep-cellars.json',
  6: 'chapters/chapter-6-kitchen-gardens.json',
  7: 'chapters/chapter-7-bell-tower.json',
  8: 'chapters/chapter-8-storms-edge.json',
  9: 'chapters/chapter-9-new-dawn.json',
};

/**
 * Loads and validates a chapter manifest by ID.
 * Results are cached after first load.
 *
 * @param chapterId - Chapter ID (0-9)
 * @returns Validated chapter manifest
 * @throws Error if chapter doesn't exist or fails validation
 *
 * @example
 * ```typescript
 * const chapter = await loadChapterManifest(0);
 * console.log(chapter.name); // "The Calling"
 * ```
 */
export async function loadChapterManifest(chapterId: number): Promise<ChapterManifest> {
  if (typeof chapterId !== 'number' || chapterId < 0 || chapterId > 9) {
    throw new Error(`Invalid chapter ID: ${chapterId}. Must be 0-9.`);
  }

  const path = CHAPTER_FILENAMES[chapterId];
  if (!path) {
    throw new Error(`No manifest file found for chapter ${chapterId}`);
  }

  // Load raw data
  const rawData = await loadManifest(path);

  // Validate with Zod schema
  const result = ChapterManifestSchema.safeParse(rawData);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid chapter-${chapterId} manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets a chapter manifest from cache synchronously.
 * IMPORTANT: Only call this after preloadManifests() completes.
 *
 * @param chapterId - Chapter ID (0-9)
 * @returns Cached chapter manifest
 * @throws Error if chapter not in cache
 */
export function getChapterManifestSync(chapterId: number): ChapterManifest {
  const path = CHAPTER_FILENAMES[chapterId];
  if (!path) {
    throw new Error(`Invalid chapter ID: ${chapterId}. Must be 0-9.`);
  }

  if (!manifestCache.has(path)) {
    throw new Error(
      `Chapter ${chapterId} not loaded. Call preloadManifests() or loadChapterManifest(${chapterId}) first.`
    );
  }

  return manifestCache.get(path) as ChapterManifest;
}

// ============================================================================
// ENTITY MANIFEST LOADERS
// ============================================================================

/**
 * Loads the enemies manifest.
 *
 * @returns Enemies manifest with AI behaviors and stats
 */
export async function loadEnemiesManifest(): Promise<EnemiesManifest> {
  const data = await loadManifest('enemies.json');

  const result = EnemiesManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid enemies manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets enemies manifest from cache synchronously.
 */
export function getEnemiesManifestSync(): EnemiesManifest {
  if (!manifestCache.has('enemies.json')) {
    throw new Error('Enemies manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('enemies.json') as EnemiesManifest;
}

/**
 * Loads the NPCs manifest.
 *
 * @returns NPCs manifest with character data and story states
 */
export async function loadNPCsManifest(): Promise<NPCsManifest> {
  const data = await loadManifest('npcs.json');

  const result = NPCsManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid NPCs manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets NPCs manifest from cache synchronously.
 */
export function getNPCsManifestSync(): NPCsManifest {
  if (!manifestCache.has('npcs.json')) {
    throw new Error('NPCs manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('npcs.json') as NPCsManifest;
}

// ============================================================================
// ASSET MANIFEST LOADERS
// ============================================================================

/**
 * Loads the sprites manifest.
 *
 * @returns Sprites manifest with character sprite definitions
 */
export async function loadSpritesManifest(): Promise<SpritesManifest> {
  const data = await loadManifest('sprites.json');

  const result = SpritesManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid sprites manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets sprites manifest from cache synchronously.
 */
export function getSpritesManifestSync(): SpritesManifest {
  if (!manifestCache.has('sprites.json')) {
    throw new Error('Sprites manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('sprites.json') as SpritesManifest;
}

/**
 * Loads the cinematics manifest.
 *
 * @returns Cinematics manifest with cutscene definitions
 */
export async function loadCinematicsManifest(): Promise<CinematicsManifest> {
  const data = await loadManifest('cinematics.json');

  const result = CinematicsManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid cinematics manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets cinematics manifest from cache synchronously.
 */
export function getCinematicsManifestSync(): CinematicsManifest {
  if (!manifestCache.has('cinematics.json')) {
    throw new Error('Cinematics manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('cinematics.json') as CinematicsManifest;
}

/**
 * Loads the sounds manifest.
 *
 * @returns Sounds manifest with audio asset references
 */
export async function loadSoundsManifest(): Promise<SoundsManifest> {
  const data = await loadManifest('sounds.json');

  const result = SoundsManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid sounds manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets sounds manifest from cache synchronously.
 */
export function getSoundsManifestSync(): SoundsManifest {
  if (!manifestCache.has('sounds.json')) {
    throw new Error('Sounds manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('sounds.json') as SoundsManifest;
}

/**
 * Loads the effects manifest.
 *
 * @returns Effects manifest with particle and visual effect definitions
 */
export async function loadEffectsManifest(): Promise<EffectsManifest> {
  const data = await loadManifest('effects.json');

  const result = EffectsManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid effects manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets effects manifest from cache synchronously.
 */
export function getEffectsManifestSync(): EffectsManifest {
  if (!manifestCache.has('effects.json')) {
    throw new Error('Effects manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('effects.json') as EffectsManifest;
}

/**
 * Loads the items manifest.
 *
 * @returns Items manifest with collectible definitions
 */
export async function loadItemsManifest(): Promise<ItemsManifest> {
  const data = await loadManifest('items.json');

  const result = ItemsManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid items manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets items manifest from cache synchronously.
 */
export function getItemsManifestSync(): ItemsManifest {
  if (!manifestCache.has('items.json')) {
    throw new Error('Items manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('items.json') as ItemsManifest;
}

/**
 * Loads the scenes manifest.
 *
 * @returns Scenes manifest with background and parallax definitions
 */
export async function loadScenesManifest(): Promise<ScenesManifest> {
  const data = await loadManifest('scenes.json');

  const result = ScenesManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid scenes manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets scenes manifest from cache synchronously.
 */
export function getScenesManifestSync(): ScenesManifest {
  if (!manifestCache.has('scenes.json')) {
    throw new Error('Scenes manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('scenes.json') as ScenesManifest;
}

/**
 * Loads the chapter plates manifest.
 *
 * @returns Chapter plates manifest with chapter transition assets
 */
export async function loadChapterPlatesManifest(): Promise<ChapterPlatesManifest> {
  const data = await loadManifest('chapter-plates.json');

  const result = ChapterPlatesManifestSchema.safeParse(data);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid chapter plates manifest: ${error.message}`);
  }

  return result.data;
}

/**
 * Gets chapter plates manifest from cache synchronously.
 */
export function getChapterPlatesManifestSync(): ChapterPlatesManifest {
  if (!manifestCache.has('chapter-plates.json')) {
    throw new Error('Chapter plates manifest not loaded. Call preloadManifests() first.');
  }
  return manifestCache.get('chapter-plates.json') as ChapterPlatesManifest;
}

// ============================================================================
// PRELOAD SYSTEM
// ============================================================================

/**
 * Preloads manifests in parallel for fast game initialization.
 * By default, loads all 10 chapters plus all entity/asset manifests.
 *
 * @param options - Configuration for preloading
 * @returns Promise that resolves when all preloads complete
 *
 * @example
 * ```typescript
 * // Preload everything (recommended for game start)
 * await preloadManifests();
 *
 * // Preload only chapters
 * await preloadManifests({ manifestTypes: ['chapters'] });
 *
 * // Preload chapters and enemies
 * await preloadManifests({ manifestTypes: ['chapters', 'enemies'] });
 * ```
 */
export async function preloadManifests(options: PreloadOptions = {}): Promise<void> {
  const {
    manifestTypes = [
      'chapters',
      'enemies',
      'npcs',
      'sprites',
      'cinematics',
      'sounds',
      'effects',
      'items',
      'scenes',
      'chapter-plates',
    ],
    logProgress = true,
    throwOnError = false,
  } = options;

  if (logProgress) {
    console.log('[DDL] Starting manifest preload...');
  }

  const loaders: Array<Promise<void>> = [];

  // Preload chapters
  if (manifestTypes.includes('chapters')) {
    for (let i = 0; i <= 9; i++) {
      loaders.push(
        loadChapterManifest(i)
          .then(() => {
            if (logProgress) {
              console.log(`[DDL] ✓ Chapter ${i} loaded`);
            }
          })
          .catch((error) => {
            const msg = `[DDL] ✗ Failed to load chapter ${i}: ${error.message}`;
            if (throwOnError) {
              throw new Error(msg);
            }
            console.warn(msg);
          })
      );
    }
  }

  // Preload entity manifests
  if (manifestTypes.includes('enemies')) {
    loaders.push(
      loadEnemiesManifest()
        .then(() => logProgress && console.log('[DDL] ✓ Enemies loaded'))
        .catch((error) => {
          const msg = `[DDL] ✗ Failed to load enemies: ${error.message}`;
          if (throwOnError) throw new Error(msg);
          console.warn(msg);
        })
    );
  }

  if (manifestTypes.includes('npcs')) {
    loaders.push(
      loadNPCsManifest()
        .then(() => logProgress && console.log('[DDL] ✓ NPCs loaded'))
        .catch((error) => {
          const msg = `[DDL] ✗ Failed to load NPCs: ${error.message}`;
          if (throwOnError) throw new Error(msg);
          console.warn(msg);
        })
    );
  }

  // Preload asset manifests
  const assetLoaders: Record<string, () => Promise<unknown>> = {
    sprites: loadSpritesManifest,
    cinematics: loadCinematicsManifest,
    sounds: loadSoundsManifest,
    effects: loadEffectsManifest,
    items: loadItemsManifest,
    scenes: loadScenesManifest,
    'chapter-plates': loadChapterPlatesManifest,
  };

  for (const [type, loader] of Object.entries(assetLoaders)) {
    if (manifestTypes.includes(type as PreloadOptions['manifestTypes'][number])) {
      loaders.push(
        loader()
          .then(() => logProgress && console.log(`[DDL] ✓ ${type} loaded`))
          .catch((error) => {
            const msg = `[DDL] ✗ Failed to load ${type}: ${error.message}`;
            if (throwOnError) throw new Error(msg);
            console.warn(msg);
          })
      );
    }
  }

  // Wait for all loads to complete
  await Promise.all(loaders);

  if (logProgress) {
    console.log('[DDL] Preload complete. Cache size:', manifestCache.size);
  }
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Gets all chapter IDs (0-9).
 */
export const ALL_CHAPTER_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Total number of chapters in the game.
 */
export const TOTAL_CHAPTERS = 10;

/**
 * Checks if a chapter ID is valid.
 */
export function isValidChapterId(chapterId: number): boolean {
  return Number.isInteger(chapterId) && chapterId >= 0 && chapterId <= 9;
}

/**
 * Gets chapter overview without full manifest loading (uses cached data).
 * Returns basic chapter info for menus and maps.
 */
export function getChapterOverview(chapterId: number): {
  id: number;
  name: string;
  location: string;
  quest: string;
  hasBoss: boolean;
} | null {
  try {
    const chapter = getChapterManifestSync(chapterId);
    return {
      id: chapter.id,
      name: chapter.name,
      location: chapter.location,
      quest: chapter.narrative.quest,
      hasBoss: chapter.boss !== null && chapter.boss !== undefined,
    };
  } catch {
    return null;
  }
}
