/**
 * @fileoverview Audio generation and acquisition module.
 * Provides tools for searching, downloading, and managing game audio.
 */

export {
  AUDIO_CATEGORIES,
  type AudioCategory,
  createFreesoundClient,
  downloadFullSound,
  downloadPreview,
  type FreesoundResult,
  generateAttributionFile,
  getAttribution,
  searchSounds,
  soundToManifestEntry,
} from './freesound-client';

export {
  downloadSoundsByIds,
  generateAllSFX,
  searchGameSounds,
} from './generate-sfx';
