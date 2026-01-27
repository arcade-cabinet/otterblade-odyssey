/**
 * @otterblade/config - Game Constants
 * Runtime configuration and constants
 */

export const GAME_CONFIG = {
  /** Total number of chapters in the game */
  TOTAL_CHAPTERS: 10,
  
  /** Default spawn position */
  DEFAULT_SPAWN: { x: 200, y: 300 },
  
  /** Player starting stats */
  PLAYER_DEFAULTS: {
    health: 5,
    maxHealth: 5,
    warmth: 100,
    maxWarmth: 100,
    shards: 0,
  },
  
  /** Frame rate */
  TARGET_FPS: 60,
  
  /** Physics update rate (ms) */
  PHYSICS_TIMESTEP: 1000 / 60,
} as const;

export * from './physics';
