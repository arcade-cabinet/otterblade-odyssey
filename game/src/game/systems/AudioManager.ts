/**
 * AudioManager.ts
 * Howler.js-based audio system with DDL integration
 * Implements proper audio management per CLAUDE.md line 63
 * Loads all audio from DDL manifests per CLAUDE.md lines 112-114
 */

import { Howl, Howler } from 'howler';
import type { AudioSystem } from '../types/systems';
import type { SoundManifest } from '../types/manifests';

/**
 * Volume configuration
 */
interface VolumeConfig {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
}

/**
 * AudioManager class - implements AudioSystem interface
 */
class AudioManager implements AudioSystem {
  name = 'AudioManager';
  
  music: Map<string, Howl> = new Map();
  sfx: Map<string, Howl> = new Map();
  ambience: Map<string, Howl> = new Map();

  // Volume controls
  volumes: VolumeConfig = {
    master: 0.7,
    music: 0.6,
    sfx: 0.8,
    ambient: 0.5,
  };

  // Current playing state
  currentMusic: string | null = null;
  currentAmbience: string[] = [];

  // Crossfade config
  crossfadeDuration: number = 1000; // ms

  constructor() {
    this.init();
  }

  init(): void {
    // Set master volume
    Howler.volume(this.volumes.master);
  }

  /**
   * Load sound manifest from DDL
   * Per CLAUDE.md lines 112-114: Load JSON through async helpers, never hardcode
   */
  async loadSoundManifest(manifestPath: string = '/data/manifests/sounds.json'): Promise<void> {
    try {
      const response = await fetch(manifestPath);
      if (!response.ok) {
        console.warn(`Failed to load sound manifest from ${manifestPath}, using defaults`);
        return;
      }
      
      const manifest: SoundManifest = await response.json();
      
      // Load SFX from manifest
      if (manifest.sfx) {
        for (const [id, sound] of Object.entries(manifest.sfx)) {
          const howl = new Howl({
            src: [sound.file],
            volume: this.volumes.sfx * sound.volume,
          });
          this.sfx.set(id, howl);
        }
      }
      
      // Load music from manifest
      if (manifest.music) {
        for (const [id, musicTrack] of Object.entries(manifest.music)) {
          const howl = new Howl({
            src: [musicTrack.file],
            volume: this.volumes.music * musicTrack.volume,
            loop: musicTrack.loop,
          });
          this.music.set(id, howl);
        }
      }
      
      // Load ambient sounds from manifest
      if (manifest.ambient) {
        for (const [id, ambientSound] of Object.entries(manifest.ambient)) {
          const howl = new Howl({
            src: [ambientSound.file],
            volume: this.volumes.ambient * ambientSound.volume,
            loop: ambientSound.loop,
          });
          this.ambience.set(id, howl);
        }
      }
      
      console.log(`Loaded ${this.sfx.size} SFX, ${this.music.size} music tracks, ${this.ambience.size} ambient sounds from manifest`);
    } catch (error) {
      console.error('Error loading sound manifest:', error);
    }
  }

  /**
   * Load chapter-specific audio from DDL manifest
   * Fully DDL-compliant: loads complete paths from manifest, no hardcoded paths
   */
  loadChapterAudio(manifest: { media?: { musicTracks?: Record<string, { file: string; alternates?: string[]; volume?: number; loop?: boolean }>; ambientSounds?: Array<{ file: string; alternates?: string[]; volume?: number; loop?: boolean }> } }): void {
    if (!manifest.media) {
      console.warn('No media section in chapter manifest');
      return;
    }

    // Load music tracks from DDL format - uses complete file paths from manifest
    if (manifest.media.musicTracks) {
      for (const [id, track] of Object.entries(manifest.media.musicTracks)) {
        if (!this.music.has(id)) {
          this.music.set(
            id,
            new Howl({
              src: [track.file, ...(track.alternates || [])],
              volume: this.volumes.music * (track.volume ?? 1.0),
              loop: track.loop ?? true,
            })
          );
        }
      }
    }

    // Load ambient sounds from DDL format - uses complete file paths from manifest
    if (manifest.media.ambientSounds) {
      for (const ambient of manifest.media.ambientSounds) {
        const id = ambient.file.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
        if (!this.ambience.has(id)) {
          this.ambience.set(
            id,
            new Howl({
              src: [ambient.file, ...(ambient.alternates || [])],
              volume: this.volumes.ambient * (ambient.volume ?? 1.0),
              loop: ambient.loop ?? true,
            })
          );
        }
      }
    }
  }

  /**
   * Play music with optional crossfade
   */
  playMusic(trackId: string, crossfade: boolean = true): void {
    const newTrack = this.music.get(trackId);
    if (!newTrack) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    if (this.currentMusic && crossfade) {
      // Get the currently playing track
      const currentTrackId = this.currentMusic;
      const oldTrack = this.music.get(currentTrackId);
      if (oldTrack) {
        this.crossfadeMusic(oldTrack, newTrack);
        this.currentMusic = trackId; // Update to new track ID
      }
    } else {
      // Stop current and play new
      if (this.currentMusic) {
        const oldTrack = this.music.get(this.currentMusic);
        if (oldTrack) {
          oldTrack.stop();
        }
      }
      newTrack.play();
      this.currentMusic = trackId;
    }
  }

  crossfadeMusic(oldTrack: Howl, newTrack: Howl): void {
    const duration = this.crossfadeDuration;
    const steps = 50;
    const stepTime = duration / steps;

    // Start new track at zero volume
    newTrack.volume(0);
    newTrack.play();

    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;

      // Fade out old
      if (oldTrack) {
        oldTrack.volume(this.volumes.music * (1 - progress));
      }

      // Fade in new
      newTrack.volume(this.volumes.music * progress);

      if (step >= steps) {
        clearInterval(fadeInterval);
        if (oldTrack) {
          oldTrack.stop();
        }
        // currentMusic is updated in playMusic
      }
    }, stepTime);
  }

  /**
   * Play sound effect
   */
  playSFX(soundId: string, options: { rate?: number; volume?: number; sprite?: string } = {}): number | null {
    const sound = this.sfx.get(soundId);
    if (!sound) {
      console.warn(`SFX not found: ${soundId}`);
      return null;
    }

    // Clone options with defaults
    const playOptions = {
      rate: options.rate || 1,
      volume: options.volume !== undefined ? options.volume : 1,
    };

    // Apply rate and volume
    sound.rate(playOptions.rate);
    sound.volume(this.volumes.sfx * playOptions.volume);

    // Play sprite or full sound
    if (options.sprite) {
      return sound.play(options.sprite);
    }
    return sound.play();
  }

  /**
   * Play ambient sound
   */
  playAmbient(ambientId: string): void {
    const ambient = this.ambience.get(ambientId);
    if (!ambient) {
      console.warn(`Ambient sound not found: ${ambientId}`);
      return;
    }

    // Add to currently playing
    if (!this.currentAmbience.includes(ambientId)) {
      this.currentAmbience.push(ambientId);
      ambient.play();
    }
  }

  /**
   * Stop ambient sound
   */
  stopAmbient(ambientId: string): void {
    const ambient = this.ambience.get(ambientId);
    if (ambient) {
      ambient.stop();
      this.currentAmbience = this.currentAmbience.filter((id) => id !== ambientId);
    }
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    if (this.currentMusic) {
      const track = this.music.get(this.currentMusic);
      if (track) {
        track.stop();
      }
    }

    for (const ambient of this.ambience.values()) {
      ambient.stop();
    }

    this.currentAmbience = [];
  }

  /**
   * Set volume for category
   */
  setVolume(category: keyof VolumeConfig, value: number): void {
    if (category in this.volumes) {
      this.volumes[category] = Math.max(0, Math.min(1, value));

      // Update Howler master volume
      if (category === 'master') {
        Howler.volume(this.volumes.master);
      }

      // Update music volume
      if (category === 'music' && this.currentMusic) {
        const track = this.music.get(this.currentMusic);
        if (track) {
          track.volume(this.volumes.music);
        }
      }
    }
  }

  /**
   * Get current volume for category
   */
  getVolume(category: keyof VolumeConfig): number {
    return this.volumes[category] || 0;
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    Howler.mute(muted);
  }

  /**
   * Update method required by AudioSystem interface
   */
  update(deltaTime: number): void {
    // Audio system doesn't need frame updates
    // All audio is event-driven through Howler.js
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAll();

    // Unload all sounds
    for (const sound of this.sfx.values()) {
      sound.unload();
    }

    for (const ambient of this.ambience.values()) {
      ambient.unload();
    }

    for (const track of this.music.values()) {
      track.unload();
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
