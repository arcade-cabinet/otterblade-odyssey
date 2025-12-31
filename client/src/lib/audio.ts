/**
 * Audio System for Otterblade Odyssey
 *
 * Manages ambient soundscapes, music, and sound effects
 * to create the warm, immersive world of Willowmere Hearthhold.
 *
 * Design Philosophy (from WORLD.md):
 * - The Hearth Leitmotif: warmth, home, safety
 * - Silence used powerfully - moments of quiet before warmth returns
 * - Environmental sounds tell the story: crackling fires = safety, wind = danger
 */

import { Howl, Howler } from 'howler';

// ============================================================================
// Types
// ============================================================================

export type SoundCategory = 'ambient' | 'music' | 'sfx' | 'voice';

export type BiomeAudioProfile = {
  ambient: string[];
  music: string;
  ambientVolume: number;
  musicVolume: number;
};

export interface SoundConfig {
  src: string | string[];
  volume?: number;
  loop?: boolean;
  category: SoundCategory;
  preload?: boolean;
}

// ============================================================================
// Audio State
// ============================================================================

const sounds: Map<string, Howl> = new Map();
const activeSounds: Map<string, number> = new Map(); // sound id -> howl play id
let masterVolume = 1.0;
let musicVolume = 0.5;
let sfxVolume = 0.7;
let ambientVolume = 0.5;
let currentMusic: string | null = null;
let isMuted = false;

// ============================================================================
// Biome Audio Profiles
// ============================================================================

/**
 * Each biome/chapter has a distinct audio atmosphere
 * Transitions between these create the emotional journey
 */
export const BIOME_AUDIO_PROFILES: Record<number, BiomeAudioProfile> = {
  // Chapter 0: The Calling - Finn's Cottage
  0: {
    ambient: ['ambient_hearth', 'ambient_birds_dawn'],
    music: 'music_menu',
    ambientVolume: 0.5,
    musicVolume: 0.35,
  },
  // Chapter 1: River Path - Willow Banks
  1: {
    ambient: ['ambient_river', 'ambient_wind_gentle', 'ambient_birds_dawn'],
    music: 'music_exploration',
    ambientVolume: 0.4,
    musicVolume: 0.3,
  },
  // Chapter 2: The Gatehouse
  2: {
    ambient: ['ambient_wind_gentle'],
    music: 'music_exploration',
    ambientVolume: 0.35,
    musicVolume: 0.35,
  },
  // Chapter 3: Great Hall - The Everember
  3: {
    ambient: ['ambient_hearth'],
    music: 'music_menu', // Hearth leitmotif strongest here
    ambientVolume: 0.6,
    musicVolume: 0.4,
  },
  // Chapter 4: The Archives
  4: {
    ambient: ['ambient_hearth'],
    music: 'music_exploration',
    ambientVolume: 0.25,
    musicVolume: 0.3,
  },
  // Chapter 5: Deep Cellars
  5: {
    ambient: ['ambient_cellar'],
    music: 'music_danger',
    ambientVolume: 0.5,
    musicVolume: 0.35,
  },
  // Chapter 6: Kitchen Gardens
  6: {
    ambient: ['ambient_birds_dawn', 'ambient_wind_gentle'],
    music: 'music_exploration',
    ambientVolume: 0.45,
    musicVolume: 0.35,
  },
  // Chapter 7: Bell Tower
  7: {
    ambient: ['ambient_wind_storm'],
    music: 'music_danger',
    ambientVolume: 0.55,
    musicVolume: 0.4,
  },
  // Chapter 8: Storm's Edge - Zephyros
  8: {
    ambient: ['ambient_wind_storm'],
    music: 'music_boss',
    ambientVolume: 0.5,
    musicVolume: 0.5,
  },
  // Chapter 9: New Dawn - Victory
  9: {
    ambient: ['ambient_hearth', 'ambient_birds_dawn'],
    music: 'music_victory',
    ambientVolume: 0.5,
    musicVolume: 0.5,
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Register a sound for later playback
 */
export function registerSound(id: string, config: SoundConfig): void {
  if (sounds.has(id)) {
    console.warn(`Sound "${id}" already registered`);
    return;
  }

  const howl = new Howl({
    src: Array.isArray(config.src) ? config.src : [config.src],
    volume: config.volume ?? getCategoryVolume(config.category),
    loop: config.loop ?? false,
    preload: config.preload ?? true,
    html5: config.category === 'music', // Stream music to save memory
  });

  sounds.set(id, howl);
}

/**
 * Play a registered sound
 */
export function playSound(id: string, options?: { volume?: number; fade?: number }): number | null {
  const sound = sounds.get(id);
  if (!sound) {
    console.warn(`Sound "${id}" not found`);
    return null;
  }

  if (isMuted) return null;

  const playId = sound.play();

  if (options?.volume !== undefined) {
    sound.volume(options.volume * masterVolume, playId);
  }

  if (options?.fade) {
    sound.fade(0, sound.volume(), options.fade, playId);
  }

  activeSounds.set(id, playId);
  return playId;
}

/**
 * Stop a playing sound
 */
export function stopSound(id: string, fadeOut?: number): void {
  const sound = sounds.get(id);
  const playId = activeSounds.get(id);

  if (!sound) return;

  if (fadeOut && playId !== undefined) {
    sound.fade(sound.volume(), 0, fadeOut, playId);
    setTimeout(() => {
      sound.stop(playId);
      activeSounds.delete(id);
    }, fadeOut);
  } else {
    sound.stop();
    activeSounds.delete(id);
  }
}

/**
 * Stop all sounds in a category
 */
export function stopCategory(category: SoundCategory, fadeOut?: number): void {
  for (const [id] of activeSounds) {
    // Check if this sound belongs to the category
    // For now, stop by naming convention
    if (id.startsWith(category) || id.includes(category)) {
      stopSound(id, fadeOut);
    }
  }
}

// ============================================================================
// Music Control
// ============================================================================

/**
 * Play background music with crossfade
 */
export function playMusic(id: string, crossfadeDuration = 2000): void {
  if (currentMusic === id) return;

  // Fade out current music
  if (currentMusic) {
    stopSound(currentMusic, crossfadeDuration);
  }

  // Start new music
  currentMusic = id;
  playSound(id, { fade: crossfadeDuration });
}

/**
 * Stop all music
 */
export function stopMusic(fadeOut = 2000): void {
  if (currentMusic) {
    stopSound(currentMusic, fadeOut);
    currentMusic = null;
  }
}

/**
 * Pause music (for cinematics, dramatic moments)
 */
export function pauseMusic(): void {
  if (currentMusic) {
    const sound = sounds.get(currentMusic);
    sound?.pause();
  }
}

/**
 * Resume paused music
 */
export function resumeMusic(): void {
  if (currentMusic) {
    const sound = sounds.get(currentMusic);
    sound?.play();
  }
}

// ============================================================================
// Ambient Soundscape Control
// ============================================================================

const activeAmbient: Set<string> = new Set();

/**
 * Set the ambient soundscape for a biome
 */
export function setAmbientForBiome(biomeIndex: number, crossfadeDuration = 3000): void {
  const profile = BIOME_AUDIO_PROFILES[biomeIndex];
  if (!profile) return;

  // Fade out ambient sounds not in new profile
  for (const id of activeAmbient) {
    if (!profile.ambient.includes(id)) {
      stopSound(id, crossfadeDuration);
      activeAmbient.delete(id);
    }
  }

  // Start new ambient sounds
  for (const id of profile.ambient) {
    if (!activeAmbient.has(id)) {
      playSound(id, { volume: profile.ambientVolume, fade: crossfadeDuration });
      activeAmbient.add(id);
    }
  }

  // Update music
  playMusic(profile.music, crossfadeDuration);
}

/**
 * Silence moment - stop all ambient, fade music low
 * Used for dramatic effect after boss defeat, before victory music
 */
export function createSilence(duration: number): Promise<void> {
  return new Promise((resolve) => {
    // Fade everything out
    for (const id of activeAmbient) {
      stopSound(id, 500);
    }
    activeAmbient.clear();

    if (currentMusic) {
      const sound = sounds.get(currentMusic);
      if (sound) {
        sound.fade(sound.volume(), 0.05, 500);
      }
    }

    // Hold silence
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

// ============================================================================
// Volume Control
// ============================================================================

function getCategoryVolume(category: SoundCategory): number {
  switch (category) {
    case 'music':
      return musicVolume * masterVolume;
    case 'sfx':
      return sfxVolume * masterVolume;
    case 'ambient':
      return ambientVolume * masterVolume;
    default:
      return masterVolume;
  }
}

export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  Howler.volume(masterVolume);
}

export function setMusicVolume(volume: number): void {
  musicVolume = Math.max(0, Math.min(1, volume));
  // Update currently playing music
  if (currentMusic) {
    const sound = sounds.get(currentMusic);
    sound?.volume(musicVolume * masterVolume);
  }
}

export function setSfxVolume(volume: number): void {
  sfxVolume = Math.max(0, Math.min(1, volume));
}

export function setAmbientVolume(volume: number): void {
  ambientVolume = Math.max(0, Math.min(1, volume));
  // Update active ambient sounds
  for (const id of activeAmbient) {
    const sound = sounds.get(id);
    sound?.volume(ambientVolume * masterVolume);
  }
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  Howler.mute(isMuted);
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the audio system
 * Call this early in app lifecycle
 */
export function initializeAudio(): void {
  // Set up Howler global settings
  Howler.autoUnlock = true;
  Howler.html5PoolSize = 10;

  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    Howler.ctx?.resume();
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
  };

  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('click', unlockAudio, { once: true });

  console.log('[Audio] System initialized');
}

/**
 * Clean up all audio resources
 */
export function destroyAudio(): void {
  Howler.stop();
  sounds.clear();
  activeSounds.clear();
  activeAmbient.clear();
  currentMusic = null;
}

// ============================================================================
// Game Event Sounds
// ============================================================================

/**
 * Play sound effect for game event
 */
export function playSfx(
  event: 'jump' | 'land' | 'attack' | 'hit' | 'collect' | 'checkpoint' | 'death'
): void {
  const sfxMap: Record<string, string> = {
    jump: 'sfx_footsteps_stone',
    land: 'sfx_footsteps_stone',
    attack: 'sfx_sword_clash',
    hit: 'sfx_sword_clash',
    collect: 'sfx_shard_collect',
    checkpoint: 'sfx_checkpoint',
    death: 'sfx_sword_draw',
  };

  const soundId = sfxMap[event];
  if (soundId && sounds.has(soundId)) {
    playSound(soundId);
  }
}

// ============================================================================
// Export current state for debugging/UI
// ============================================================================

export function getAudioState() {
  return {
    masterVolume,
    musicVolume,
    sfxVolume,
    ambientVolume,
    isMuted,
    currentMusic,
    activeAmbient: [...activeAmbient],
    registeredSounds: [...sounds.keys()],
  };
}
