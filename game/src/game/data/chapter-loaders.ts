/**
 * @fileoverview Loaders for chapter manifest files.
 * These functions load and validate chapter data with full type safety.
 *
 * MIGRATION NOTE: This module provides compatibility bridge between:
 * 1. Legacy static imports (bundled JSON) - used during build/SSR
 * 2. New DDL loader (fetch-based) - used at runtime after preload
 *
 * The loader will automatically use DDL cache if available, falling back
 * to static imports. This enables gradual migration to fetch-based loading.
 */

import { fromError } from 'zod-validation-error';
// Static imports for all chapter manifests (fallback for build/SSR)
import chapter0Data from '../../data/manifests/chapters/chapter-0-the-calling.json';
import chapter1Data from '../../data/manifests/chapters/chapter-1-river-path.json';
import chapter2Data from '../../data/manifests/chapters/chapter-2-gatehouse.json';
import chapter3Data from '../../data/manifests/chapters/chapter-3-great-hall.json';
import chapter4Data from '../../data/manifests/chapters/chapter-4-archives.json';
import chapter5Data from '../../data/manifests/chapters/chapter-5-deep-cellars.json';
import chapter6Data from '../../data/manifests/chapters/chapter-6-kitchen-gardens.json';
import chapter7Data from '../../data/manifests/chapters/chapter-7-bell-tower.json';
import chapter8Data from '../../data/manifests/chapters/chapter-8-storms-edge.json';
import chapter9Data from '../../data/manifests/chapters/chapter-9-new-dawn.json';
import { type ChapterManifest, ChapterManifestSchema, type ChapterNPC } from './manifest-schemas';

// Import DDL loader for runtime fetch-based loading
// This is optional - if DDL loader hasn't preloaded, we fall back to static imports
let ddlLoader: typeof import('../../ddl/loader') | null = null;

// Kick off dynamic import without using top-level await to maintain SSR/build compatibility.
// Only attempt the import in browser context to avoid unnecessary failed imports during SSR/build.
// NOTE: This import runs asynchronously at module initialization. Calls to
// `loadChapterManifest(chapterId)` that occur before this import resolves will
// intentionally fall back to static imports for that invocation. Once the import
// completes, subsequent `loadChapterManifest` calls may use the DDL loader cache
// via `ddlLoader.getChapterManifestSync`. This timing-dependent behavior is
// expected and is part of the compatibility bridge between static and DDL loading.
if (typeof window !== 'undefined') {
  import('../../ddl/loader')
    .then((module) => {
      ddlLoader = module;
    })
    .catch(() => {
      // DDL loader not available - will use static imports
      console.log('[chapter-loaders] Using static imports (DDL loader unavailable)');
    });
}
/** All chapter data indexed by ID */
const CHAPTER_DATA_MAP: Record<number, unknown> = {
  0: chapter0Data,
  1: chapter1Data,
  2: chapter2Data,
  3: chapter3Data,
  4: chapter4Data,
  5: chapter5Data,
  6: chapter6Data,
  7: chapter7Data,
  8: chapter8Data,
  9: chapter9Data,
};

/** Cache for validated chapters */
const chapterCache = new Map<number, ChapterManifest>();

/**
 * Loads and validates a chapter manifest by ID.
 * Results are cached after first load.
 *
 * COMPATIBILITY BRIDGE: This function will use the DDL loader cache if available,
 * otherwise falls back to static imports. This enables seamless migration to
 * fetch-based loading without breaking existing code.
 *
 * @throws Error if chapter doesn't exist or fails validation
 */
export function loadChapterManifest(chapterId: number): ChapterManifest {
  // Try to use DDL loader cache first (if manifests were preloaded)
  if (ddlLoader) {
    try {
      return ddlLoader.getChapterManifestSync(chapterId);
    } catch {
      // DDL cache miss - fall through to static imports
    }
  }

  // Check local cache
  const cached = chapterCache.get(chapterId);
  if (cached) return cached;

  // Get raw data from static imports (fallback)
  const rawData = CHAPTER_DATA_MAP[chapterId];
  if (!rawData) {
    throw new Error(`Chapter ${chapterId} not found. Valid chapters: 0-9`);
  }

  // Validate
  const result = ChapterManifestSchema.safeParse(rawData);
  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid chapter-${chapterId} manifest: ${error.message}`);
  }

  // Cache and return
  chapterCache.set(chapterId, result.data);
  return result.data;
}

/**
 * Loads all chapter manifests.
 * Useful for preloading or generating world maps.
 */
export function loadAllChapterManifests(): ChapterManifest[] {
  const chapters: ChapterManifest[] = [];
  for (let i = 0; i <= 9; i++) {
    chapters.push(loadChapterManifest(i));
  }
  return chapters;
}

/**
 * Gets basic chapter info without full manifest loading.
 * Lighter weight for menus and maps.
 */
export function getChapterOverview(chapterId: number): {
  id: number;
  name: string;
  location: string;
  quest: string;
  hasBoss: boolean;
} {
  const chapter = loadChapterManifest(chapterId);
  return {
    id: chapter.id,
    name: chapter.name,
    location: chapter.location,
    quest: chapter.narrative.quest,
    hasBoss: chapter.boss !== null && chapter.boss !== undefined,
  };
}

/**
 * Gets all NPCs for a chapter.
 */
export function getChapterNPCs(chapterId: number): ChapterNPC[] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.npcs ?? [];
}

/**
 * Gets the spawn point for a chapter.
 */
export function getChapterSpawnPoint(chapterId: number): { x: number; y: number } {
  const chapter = loadChapterManifest(chapterId);
  const spawnPoint = chapter.level.spawnPoint;
  return {
    x: spawnPoint?.x ?? 100,
    y: spawnPoint?.y ?? 450,
  };
}

/**
 * Gets media references for a chapter.
 */
export function getChapterMedia(chapterId: number): ChapterManifest['media'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.media;
}

/**
 * Gets the environment configuration for a chapter.
 */
export function getChapterEnvironment(chapterId: number): ChapterManifest['environment'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.environment;
}

/**
 * Gets all triggers for a chapter.
 */
export function getChapterTriggers(chapterId: number): ChapterManifest['triggers'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.triggers ?? [];
}

/**
 * Gets all encounters for a chapter.
 */
export function getChapterEncounters(chapterId: number): ChapterManifest['encounters'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.encounters ?? [];
}

/**
 * Gets boss data for a chapter.
 * Returns null if chapter has no boss.
 */
export function getChapterBoss(chapterId: number): ChapterManifest['boss'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.boss ?? null;
}

/**
 * Gets all collectibles for a chapter.
 */
export function getChapterCollectibles(chapterId: number): ChapterManifest['collectibles'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.collectibles ?? [];
}

/**
 * Gets all secrets for a chapter.
 */
export function getChapterSecrets(chapterId: number): ChapterManifest['secrets'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.secrets ?? [];
}

/**
 * Gets motion challenges for a chapter.
 */
export function getChapterMotionChallenges(chapterId: number): ChapterManifest['motionChallenges'] {
  const chapter = loadChapterManifest(chapterId);
  return chapter.motionChallenges ?? [];
}

/**
 * Clears the chapter cache.
 * Useful for hot reloading during development.
 */
export function clearChapterCache(): void {
  chapterCache.clear();
}

/**
 * Preloads all chapters into cache.
 * Call this during game initialization for faster subsequent loads.
 */
export function preloadAllChapters(): void {
  for (let i = 0; i <= 9; i++) {
    try {
      loadChapterManifest(i);
    } catch {
      console.warn(`Failed to preload chapter ${i}`);
    }
  }
}

/**
 * Gets the total number of chapters.
 */
export const TOTAL_CHAPTERS = 10;

/**
 * Gets chapter IDs that are available (not locked by progression).
 */
export function getUnlockedChapters(completedChapters: number[]): number[] {
  const unlocked: number[] = [0]; // Chapter 0 is always unlocked

  for (let i = 1; i <= 9; i++) {
    const chapter = loadChapterManifest(i);
    const prevChapter = chapter.connections.previousChapter;

    if (prevChapter !== null && completedChapters.includes(prevChapter)) {
      unlocked.push(i);
    }
  }

  return unlocked;
}
