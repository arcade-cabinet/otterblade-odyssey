/**
 * @fileoverview Barrel export for game data module.
 * Import all game data through this file.
 * 
 * LEGACY LOADERS REMOVED - Use DDL loader (../../ddl/loader.ts) instead
 */

// Manifest schemas and types
export * from './manifest-schemas';
export * from './npc-schemas';
export * from './schemas';

// Re-export NEW DDL loader functions for convenience
export {
  ALL_CHAPTER_IDS,
  TOTAL_CHAPTERS,
  clearManifestCache,
  getCacheStats,
  getChapterManifestSync,
  getChapterOverview,
  getCinematicsManifestSync,
  getEffectsManifestSync,
  getEnemiesManifestSync,
  getItemsManifestSync,
  getNPCsManifestSync,
  getScenesManifestSync,
  getSoundsManifestSync,
  getSpritesManifestSync,
  isValidChapterId,
  loadChapterManifest,
  loadCinematicsManifest,
  loadEffectsManifest,
  loadEnemiesManifest,
  loadItemsManifest,
  loadNPCsManifest,
  loadScenesManifest,
  loadSoundsManifest,
  loadSpritesManifest,
  preloadManifests,
  type PreloadOptions,
  type PreloadResult,
} from '../../ddl/loader';

// Helper functions that were in chapter-loaders.ts - reimplement using DDL
export function getChapterBoss(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.boss;
}

export function getChapterCollectibles(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.collectibles || [];
}

export function getChapterEncounters(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.encounters || [];
}

export function getChapterEnvironment(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.environment;
}

export function getChapterMedia(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.media;
}

export function getChapterMotionChallenges(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.motionChallenges || [];
}

export function getChapterNPCs(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.npcs || [];
}

export function getChapterSecrets(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.secrets || [];
}

export function getChapterSpawnPoint(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.level.spawnPoint;
}

export function getChapterTriggers(chapterId: number) {
  const { getChapterManifestSync } = require('../../ddl/loader');
  const manifest = getChapterManifestSync(chapterId);
  return manifest.triggers || [];
}

export function getUnlockedChapters() {
  // This was probably tracking user progress - return all for now
  const { ALL_CHAPTER_IDS } = require('../../ddl/loader');
  return ALL_CHAPTER_IDS;
}
