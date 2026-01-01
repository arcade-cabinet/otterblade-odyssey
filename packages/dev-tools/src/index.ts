/**
 * @fileoverview Dev tools barrel export.
 * Exports shared configuration and utilities for use in scripts.
 */

// Audio generation (Freesound integration)
export {
  AUDIO_CATEGORIES,
  type AudioCategory,
  createFreesoundClient,
  downloadPreview,
  downloadSoundsByIds,
  type FreesoundResult,
  generateAllSFX,
  generateAttributionFile,
  getAttribution,
  searchGameSounds,
  searchSounds,
  soundToManifestEntry,
} from './audio/index.js';
// Shared configuration
export {
  CINEMATICS,
  createGoogleClient,
  createOpenAIClient,
  ENEMY_SPRITE_CONFIGS,
  type EnemyType,
  GOOGLE_MODELS,
  getEnv,
  log,
  logError,
  OUTPUT_DIR,
  PLAYER_SPRITE_CONFIG,
  VIDEO_OUTPUT_DIR,
} from './shared/config.js';
// Prompts
export {
  FINN_DESCRIPTION,
  getCinematicPrompt,
  getEnemySpritePrompt,
  getPlayerSpritePrompt,
  getScenePrompt,
  getSpriteAnalysisPrompt,
  getVideoAnalysisPrompt,
  STYLE_DIRECTIVE,
} from './shared/prompts.js';
