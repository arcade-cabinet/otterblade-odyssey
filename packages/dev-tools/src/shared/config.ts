/**
 * @fileoverview OpenAI client configuration and shared utilities.
 * Provides typed configuration for asset generation tools.
 */

import OpenAI from 'openai';
import { z } from 'zod';

/**
 * Environment variable schema for validation.
 */
const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_ORG_ID: z.string().optional(),
});

/**
 * Validated environment variables.
 * @throws {ZodError} If required environment variables are missing
 */
export function getEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Missing required environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

/**
 * Creates and configures the OpenAI client.
 * Uses environment variables for API key and optional organization ID.
 */
export function createOpenAIClient(): OpenAI {
  const env = getEnv();
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_ORG_ID,
  });
}

/**
 * Sprite sheet configuration for player character.
 */
export const PLAYER_SPRITE_CONFIG = {
  /** Total columns in sprite sheet */
  columns: 6,
  /** Total rows in sprite sheet */
  rows: 4,
  /** Individual frame width in pixels */
  frameWidth: 128,
  /** Individual frame height in pixels */
  frameHeight: 128,
  /** Animation definitions */
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
 * Output directory for generated sprites.
 */
export const OUTPUT_DIR = 'attached_assets/generated_images/sprites';

/**
 * Logs a styled message to console.
 * @param emoji - Emoji prefix
 * @param message - Message to log
 */
export function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}

/**
 * Logs an error message and optionally exits.
 * @param message - Error message
 * @param exit - Whether to exit the process
 */
export function logError(message: string, exit = false): void {
  console.error(`❌ ${message}`);
  if (exit) {
    process.exit(1);
  }
}
