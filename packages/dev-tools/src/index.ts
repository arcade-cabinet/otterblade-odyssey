/**
 * @fileoverview Dev tools barrel export.
 * Exports shared configuration and utilities for use in scripts.
 */

// Shared configuration
export {
  createOpenAIClient,
  createGoogleClient,
  getEnv,
  GOOGLE_MODELS,
  PLAYER_SPRITE_CONFIG,
  ENEMY_SPRITE_CONFIGS,
  CINEMATICS,
  OUTPUT_DIR,
  VIDEO_OUTPUT_DIR,
  log,
  logError,
  type EnemyType,
} from './shared/config.js';

// Prompts
export {
  STYLE_DIRECTIVE,
  FINN_DESCRIPTION,
  getPlayerSpritePrompt,
  getEnemySpritePrompt,
  getSpriteAnalysisPrompt,
  getCinematicPrompt,
  getScenePrompt,
  getVideoAnalysisPrompt,
} from './shared/prompts.js';
