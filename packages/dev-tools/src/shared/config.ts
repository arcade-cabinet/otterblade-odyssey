/**
 * @fileoverview Shared configuration for AI clients (OpenAI and Google).
 * Provides typed configuration for asset generation tools.
 */

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { z } from 'zod';

/**
 * Environment variable schema for validation.
 */
const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

/**
 * Validated environment variables.
 */
export function getEnv(): z.infer<typeof EnvSchema> {
  return EnvSchema.parse(process.env);
}

/**
 * Creates and configures the OpenAI client.
 * @throws Error if OPENAI_API_KEY is not set
 */
export function createOpenAIClient(): OpenAI {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    logError('OPENAI_API_KEY environment variable is required', true);
  }
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_ORG_ID,
  });
}

/**
 * Creates and configures the Google GenAI client.
 * Uses the new unified @google/genai SDK for Gemini, Veo, and Imagen.
 * @throws Error if GEMINI_API_KEY is not set
 */
export function createGoogleClient(): GoogleGenAI {
  const env = getEnv();
  if (!env.GEMINI_API_KEY) {
    logError('GEMINI_API_KEY environment variable is required', true);
    throw new Error('GEMINI_API_KEY is required');
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

/**
 * Model identifiers for Google GenAI.
 * Using latest versions as of 2025.
 */
export const GOOGLE_MODELS = {
  /** Veo 3.1 for high-fidelity video generation with native audio */
  VIDEO: 'veo-3.1',
  /** Imagen 3 for high-quality image generation */
  IMAGE: 'imagen-3.0-generate-002',
  /** Gemini 2.0 Flash for fast multimodal analysis */
  ANALYSIS: 'gemini-2.0-flash',
} as const;

/**
 * Sprite sheet configuration for player character.
 */
export const PLAYER_SPRITE_CONFIG = {
  columns: 6,
  rows: 4,
  frameWidth: 128,
  frameHeight: 128,
  animations: {
    idle: { row: 0, frames: 4, fps: 8 },
    run: { row: 0, startCol: 4, frames: 6, fps: 12 },
    jump: { row: 1, frames: 3, fps: 10 },
    fall: { row: 1, startCol: 3, frames: 2, fps: 8 },
    attack: { row: 2, frames: 4, fps: 16 },
    hurt: { row: 2, startCol: 4, frames: 2, fps: 10 },
    crouch: { row: 3, frames: 2, fps: 8 },
  },
} as const;

/**
 * Enemy sprite configurations by type.
 */
export const ENEMY_SPRITE_CONFIGS = {
  skirmisher: {
    description: 'Small fast predator (weasel or stoat)',
    columns: 4,
    rows: 4,
    frameWidth: 96,
    frameHeight: 96,
  },
  shielded: {
    description: 'Slow armored defender (badger or hedgehog with shield)',
    columns: 4,
    rows: 4,
    frameWidth: 128,
    frameHeight: 128,
  },
  ranged: {
    description: 'Projectile thrower (rat with sling)',
    columns: 4,
    rows: 4,
    frameWidth: 96,
    frameHeight: 96,
  },
  flyer: {
    description: 'Aerial enemy (crow or bat)',
    columns: 4,
    rows: 4,
    frameWidth: 112,
    frameHeight: 112,
  },
  elite: {
    description: 'Miniboss enemy (armored fox or wolverine)',
    columns: 6,
    rows: 4,
    frameWidth: 160,
    frameHeight: 160,
  },
} as const;

/** Valid enemy types */
export type EnemyType = keyof typeof ENEMY_SPRITE_CONFIGS;

/**
 * Cinematic definitions for video generation.
 * Based on existing assets that need regeneration.
 */
export const CINEMATICS = {
  intro: {
    name: "intro_cinematic_otter's_journey",
    description: 'Opening cinematic showing Finn leaving his village',
    duration: 8,
  },
  outro: {
    name: 'outro_victory_sunrise_scene',
    description: 'Victory celebration at dawn in the Great Hall',
    duration: 6,
  },
  chapter1: {
    name: 'chapter_1_opening_cinematic',
    description: 'Finn approaches Willowmere along the River Path',
    duration: 5,
  },
  chapter2: {
    name: 'chapter_2_gatehouse_opening',
    description: 'Arriving at the Northern Gatehouse',
    duration: 4,
  },
  chapter3: {
    name: 'chapter_3_great_hall_opening',
    description: 'Entering the Great Hall with the Everember',
    duration: 5,
  },
  chapter4: {
    name: 'chapter_4_library_opening',
    description: 'Discovering the ancient Archives',
    duration: 4,
  },
  chapter5: {
    name: 'chapter_5_dungeon_opening',
    description: 'Descending into the Deep Cellars',
    duration: 4,
  },
  chapter6: {
    name: 'chapter_6_courtyard_opening',
    description: 'Rallying allies in the Kitchen Gardens',
    duration: 4,
  },
  chapter7: {
    name: 'chapter_7_bell_tower_opening',
    description: 'Climbing to the Bell Tower',
    duration: 4,
  },
  chapter8: {
    name: 'chapter_8_final_confrontation_opening',
    description: 'Facing Zephyros on the outer ramparts',
    duration: 5,
  },
} as const;

/** Output directories */
export const OUTPUT_DIR = 'attached_assets/generated_images/sprites';
export const VIDEO_OUTPUT_DIR = 'attached_assets/generated_videos';

/**
 * Logs a styled message to console.
 */
export function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}

/**
 * Logs an error message and optionally exits.
 */
export function logError(message: string, exit = false): void {
  console.error(`❌ ${message}`);
  if (exit) {
    process.exit(1);
  }
}
