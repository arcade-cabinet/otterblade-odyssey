/**
 * @fileoverview Game constants and configuration.
 * PORTED to use NEW DDL manifest system.
 * Runtime values and physics constants defined here.
 */

import { ALL_CHAPTER_IDS, getChapterManifestSync, preloadManifests } from '../ddl/loader';

/** Chunk size for procedural generation */
export const CHUNK_SIZE = 48;

/** Length of a level segment */
export const SEGMENT_LEN = 190;

/** Length of a room */
export const ROOM_LEN = 210;

/** Distance between boss encounters */
export const BOSS_PERIOD = 720;

/** Z-position for world objects */
export const WORLD_Z = 0;

/**
 * Chapter interface with visual properties for rendering
 */
export interface Chapter {
  id: number;
  name: string;
  location: string;
  quest: string;
  hasBoss: boolean;
  bossName: string | null;
  bg: string;
  fog: string;
  accent: string;
  sky1: string;
  sky2: string;
}

/** Fallback biome colors if data fails to load */
const FALLBACK_COLORS = {
  bg: '#2d4a3e',
  fog: '#4a6a5e',
  accent: '#c4a35a',
  sky1: '#87ceeb',
  sky2: '#4a6a5e',
};

/**
 * Load biome colors from biomes.json
 */
async function loadBiomeColors(): Promise<Record<string, any>[]> {
  try {
    // Load biomes.json directly (still exists in public/data/)
    if (typeof window === 'undefined') {
      const { readFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      const fullPath = resolve(process.cwd(), 'apps/web/public/data/biomes.json');
      const raw = await readFile(fullPath, 'utf8');
      return JSON.parse(raw);
    } else {
      const response = await fetch('/data/biomes.json');
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to load biomes.json, using fallback colors:', error);
    return [];
  }
}

/**
 * Safely load and merge chapters with biome colors.
 * Uses NEW DDL manifest system.
 */
async function loadChaptersWithColors(): Promise<Chapter[]> {
  try {
    // Ensure manifests are loaded
    await preloadManifests({ manifestTypes: ['chapters'], logProgress: false });
    
    // Load biome colors
    const biomes = await loadBiomeColors();
    
    // Map chapter manifests to Chapter format with colors
    return ALL_CHAPTER_IDS.map((id) => {
      const manifest = getChapterManifestSync(id);
      
      // Find matching biome by chapter ID
      const biome = biomes.find((b: any) => b.chapterIds?.includes(id));
      const colors = biome?.colors || FALLBACK_COLORS;
      
      return {
        id: manifest.id,
        name: manifest.name,
        location: manifest.location,
        quest: manifest.narrative.quest,
        hasBoss: manifest.boss !== null && manifest.boss !== undefined,
        bossName: manifest.boss?.name || null,
        bg: colors.bg || FALLBACK_COLORS.bg,
        fog: colors.fog || FALLBACK_COLORS.fog,
        accent: colors.accent || FALLBACK_COLORS.accent,
        sky1: colors.sky1 || FALLBACK_COLORS.sky1,
        sky2: colors.sky2 || FALLBACK_COLORS.sky2,
      };
    });
  } catch (error) {
    console.error('Error loading chapters:', error);
    return buildFallbackChapters();
  }
}

function buildFallbackChapters(): Chapter[] {
  return [
    {
      id: 0,
      name: 'Loading Willowmere...',
      location: 'Unknown',
      quest: 'Please wait',
      hasBoss: false,
      bossName: null,
      bg: FALLBACK_COLORS.bg,
      fog: FALLBACK_COLORS.fog,
      accent: FALLBACK_COLORS.accent,
      sky1: FALLBACK_COLORS.sky1,
      sky2: FALLBACK_COLORS.sky2,
    },
  ];
}

/** All chapters with visual properties (initialized via initializeChapterConstants). */
export let CHAPTERS: Chapter[] = buildFallbackChapters();

/** Legacy BIOMES array for backward compatibility (initialized via initializeChapterConstants). */
export let BIOMES = CHAPTERS.map((ch) => ({
  name: ch.name,
  bg: ch.bg,
  fog: ch.fog,
  accent: ch.accent,
  sky1: ch.sky1,
  sky2: ch.sky2,
  quest: ch.quest,
}));

/**
 * Initializes chapter constants from DDL manifests.
 * Must run before systems that rely on CHAPTERS/BIOMES.
 */
export async function initializeChapterConstants(): Promise<void> {
  CHAPTERS = await loadChaptersWithColors();
  BIOMES = CHAPTERS.map((ch) => ({
    name: ch.name,
    bg: ch.bg,
    fog: ch.fog,
    accent: ch.accent,
    sky1: ch.sky1,
    sky2: ch.sky2,
    quest: ch.quest,
  }));
}

/** Collision groups for physics filtering */
export const CG = {
  PLAYER: 1,
  WORLD: 2,
  ENEMY: 4,
  ITEM: 8,
  TRAP: 16,
  HITBOX: 32,
  PROJECTILE: 64,
  GATE: 128,
} as const;

/** Story event types for ECS */
export const STORY_EVENTS = {
  CHAPTER_START: 'chapter_start',
  CHAPTER_COMPLETE: 'chapter_complete',
  BOSS_ENCOUNTER: 'boss_encounter',
  BOSS_DEFEATED: 'boss_defeated',
  CUTSCENE_START: 'cutscene_start',
  CUTSCENE_END: 'cutscene_end',
} as const;

export type StoryEventType = (typeof STORY_EVENTS)[keyof typeof STORY_EVENTS];
