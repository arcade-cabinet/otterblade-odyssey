/**
 * @fileoverview Game constants and configuration.
 * Static data loaded from JSON via typed loaders with error handling.
 * Runtime values and physics constants defined here.
 */

import type { BiomeColors, Chapter as ChapterData } from './data';
import { getBiomeColorsArray, getBiomesSync, getChaptersSync, preloadLegacyData } from './data';

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
 * Chapter interface extended with visual properties for rendering
 */
export interface Chapter extends ChapterData {
  bg: string;
  fog: string;
  accent: string;
  sky1: string;
  sky2: string;
}

/** Fallback biome colors if data fails to load */
const FALLBACK_COLORS: BiomeColors = {
  bg: '#2d4a3e',
  fog: '#4a6a5e',
  accent: '#c4a35a',
  sky1: '#87ceeb',
  sky2: '#4a6a5e',
};

/**
 * Safely load and merge chapters with biome colors.
 * Validates data alignment and provides fallbacks on errors.
 */
function loadChaptersWithColors(): Chapter[] {
  try {
    const chapters = getChaptersSync();
    const _biomes = getBiomesSync();
    const biomeColors = getBiomeColorsArray();

    return chapters.map((ch, idx) => {
      const colors = biomeColors[idx];
      return {
        ...ch,
        bg: colors?.bg ?? FALLBACK_COLORS.bg,
        fog: colors?.fog ?? FALLBACK_COLORS.fog,
        accent: colors?.accent ?? FALLBACK_COLORS.accent,
        sky1: colors?.sky1 ?? FALLBACK_COLORS.sky1,
        sky2: colors?.sky2 ?? FALLBACK_COLORS.sky2,
      };
    });
  } catch (_error) {
    return [
      {
        id: 0,
        name: 'Error Loading Data',
        setting: 'Unknown',
        quest: 'Please refresh the page',
        hasBoss: false,
        bossName: null,
        assets: {
          chapterPlate: '',
          parallaxBg: '',
        },
        bg: FALLBACK_COLORS.bg,
        fog: FALLBACK_COLORS.fog,
        accent: FALLBACK_COLORS.accent,
        sky1: FALLBACK_COLORS.sky1,
        sky2: FALLBACK_COLORS.sky2,
      },
    ];
  }
}

function buildFallbackChapters(): Chapter[] {
  return [
    {
      id: 0,
      name: 'Loading Willowmere...',
      setting: 'Unknown',
      quest: 'Please wait',
      hasBoss: false,
      bossName: null,
      assets: {
        chapterPlate: '',
        parallaxBg: '',
      },
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
 * Initializes chapter constants from JSON data.
 * Must run before systems that rely on CHAPTERS/BIOMES.
 */
export async function initializeChapterConstants(): Promise<void> {
  await preloadLegacyData();
  CHAPTERS = loadChaptersWithColors();
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
