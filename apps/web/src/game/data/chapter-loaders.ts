/**
 * @fileoverview Loaders for chapter manifest files.
 * These functions load and validate chapter data with full type safety.
 *
 * MIGRATION NOTE: This module now relies exclusively on the DDL loader
 * for fetch-based loading and cache access. Call preloadManifests()
 * before using the sync helpers to ensure data is cached.
 */

import {
  loadChapterManifest as fetchChapterManifest,
  getChapterManifestSync,
  TOTAL_CHAPTERS,
} from '../../ddl/loader';
import type { ChapterManifest, ChapterNPC } from './manifest-schemas';

/**
 * Loads and validates a chapter manifest by ID.
 * Results are cached after first load.
 *
 * Requires DDL manifests to be preloaded. Use preloadManifests() before
 * invoking this sync helper, or call loadChapterManifestAsync instead.
 *
 * @throws Error if chapter doesn't exist or fails validation
 */
export function loadChapterManifest(chapterId: number): ChapterManifest {
  try {
    return getChapterManifestSync(chapterId);
  } catch (error) {
    throw new Error(
      `Chapter ${chapterId} not loaded. Call preloadManifests() or use loadChapterManifestAsync(). (${(error as Error).message})`
    );
  }
}

/**
 * Loads and validates a chapter manifest by ID asynchronously.
 * Use this when the DDL cache is not yet warmed.
 */
export async function loadChapterManifestAsync(chapterId: number): Promise<ChapterManifest> {
  return fetchChapterManifest(chapterId);
}

/**
 * Loads all chapter manifests.
 * Useful for preloading or generating world maps.
 */
export async function loadAllChapterManifests(): Promise<ChapterManifest[]> {
  const chapters: ChapterManifest[] = [];
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    chapters.push(await loadChapterManifestAsync(i));
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
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    try {
      loadChapterManifest(i);
    } catch {
      console.warn(`Failed to preload chapter ${i}`);
    }
  }
}

/**
 * Gets chapter IDs that are available (not locked by progression).
 */
export function getUnlockedChapters(completedChapters: number[]): number[] {
  const unlocked: number[] = [0]; // Chapter 0 is always unlocked

  for (let i = 1; i < TOTAL_CHAPTERS; i++) {
    const chapter = loadChapterManifest(i);
    const prevChapter = chapter.connections.previousChapter;

    if (prevChapter !== null && completedChapters.includes(prevChapter)) {
      unlocked.push(i);
    }
  }

  return unlocked;
}
