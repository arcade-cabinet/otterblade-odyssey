/**
 * AudioManager.ts
 * Howler.js-based audio system with DDL integration
 * Implements proper audio management per CLAUDE.md line 63
 */

import { Howl, Howler } from 'howler';
import type { AudioSystem } from '../types/systems';

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
  
  music: Howl | null = null;
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

    // Preload common sounds
    this.preloadCommonSounds();
  }

  preloadCommonSounds(): void {
    // Footstep sounds
    this.sfx.set(
      'footstep',
      new Howl({
        src: ['/audio/sfx/footstep.mp3', '/audio/sfx/footstep.webm'],
        volume: this.volumes.sfx * 0.3,
        sprite: {
          step1: [0, 200],
          step2: [200, 200],
          step3: [400, 200],
        },
      })
    );

    // Blade sounds
    this.sfx.set(
      'blade_swing',
      new Howl({
        src: ['/audio/sfx/blade_swing.mp3'],
        volume: this.volumes.sfx * 0.6,
        rate: 1.2,
      })
    );

    this.sfx.set(
      'blade_hit',
      new Howl({
        src: ['/audio/sfx/blade_hit.mp3'],
        volume: this.volumes.sfx * 0.7,
      })
    );

    // UI sounds
    this.sfx.set(
      'menu_select',
      new Howl({
        src: ['/audio/sfx/menu_select.mp3'],
        volume: this.volumes.sfx * 0.5,
      })
    );

    this.sfx.set(
      'door_open',
      new Howl({
        src: ['/audio/sfx/door_open.mp3'],
        volume: this.volumes.sfx * 0.6,
      })
    );

    // Enemy sounds
    this.sfx.set(
      'enemy_alert',
      new Howl({
        src: ['/audio/sfx/enemy_alert.mp3'],
        volume: this.volumes.sfx * 0.7,
      })
    );

    this.sfx.set(
      'enemy_hit',
      new Howl({
        src: ['/audio/sfx/enemy_hit.mp3'],
        volume: this.volumes.sfx * 0.6,
      })
    );

    // Collectible sounds
    this.sfx.set(
      'shard_pickup',
      new Howl({
        src: ['/audio/sfx/shard_pickup.mp3'],
        volume: this.volumes.sfx * 0.8,
        rate: 1.1,
      })
    );

    // Bell sounds
    this.sfx.set(
      'bell_ring',
      new Howl({
        src: ['/audio/sfx/bell_ring.mp3'],
        volume: this.volumes.sfx * 0.9,
      })
    );

    // Hearth sounds
    this.ambience.set(
      'hearth_crackle',
      new Howl({
        src: ['/audio/ambient/hearth_crackle.mp3'],
        volume: this.volumes.ambient * 0.5,
        loop: true,
      })
    );
  }

  /**
   * Load chapter-specific audio from DDL manifest
   * Supports new DDL format with media.musicTracks and media.ambientSounds
   */
  loadChapterAudio(manifest) {
    if (!manifest.media) {
      console.warn('No media section in chapter manifest');
      return;
    }

    // Initialize music map if needed
    if (!this.music) {
      this.music = new Map();
    }

    // Load music tracks from DDL format
    if (manifest.media.musicTracks) {
      const { exploration, tension, combat, boss, victory } = manifest.media.musicTracks;

      // Load exploration music
      if (exploration && !this.music.has(exploration)) {
        this.music.set(
          exploration,
          new Howl({
            src: [`/audio/music/${exploration}.mp3`, `/audio/music/${exploration}.ogg`],
            volume: this.volumes.music,
            loop: true,
          })
        );
      }

      // Load tension music
      if (tension && !this.music.has(tension)) {
        this.music.set(
          tension,
          new Howl({
            src: [`/audio/music/${tension}.mp3`, `/audio/music/${tension}.ogg`],
            volume: this.volumes.music,
            loop: true,
          })
        );
      }

      // Load combat music
      if (combat && !this.music.has(combat)) {
        this.music.set(
          combat,
          new Howl({
            src: [`/audio/music/${combat}.mp3`, `/audio/music/${combat}.ogg`],
            volume: this.volumes.music,
            loop: true,
          })
        );
      }

      // Load boss music
      if (boss && !this.music.has(boss)) {
        this.music.set(
          boss,
          new Howl({
            src: [`/audio/music/${boss}.mp3`, `/audio/music/${boss}.ogg`],
            volume: this.volumes.music,
            loop: true,
          })
        );
      }

      // Load victory music
      if (victory && !this.music.has(victory)) {
        this.music.set(
          victory,
          new Howl({
            src: [`/audio/music/${victory}.mp3`, `/audio/music/${victory}.ogg`],
            volume: this.volumes.music,
            loop: false,
          })
        );
      }
    }

    // Load ambient sounds from DDL format
    if (manifest.media.ambientSounds) {
      for (const ambientId of manifest.media.ambientSounds) {
        if (!this.ambience.has(ambientId)) {
          this.ambience.set(
            ambientId,
            new Howl({
              src: [`/audio/ambient/${ambientId}.mp3`, `/audio/ambient/${ambientId}.ogg`],
              volume: this.volumes.ambient,
              loop: true,
            })
          );
        }
      }
    }

    // Support legacy format (old audio.music, audio.ambience structure)
    if (manifest.media.audio) {
      const { music, ambience } = manifest.media.audio;

      // Load music tracks (legacy)
      if (music) {
        for (const track of music) {
          if (!this.music.has(track.id)) {
            this.music.set(
              track.id,
              new Howl({
                src: [track.url],
                volume: this.volumes.music,
                loop: track.loop !== false,
                onend: () => {
                  if (track.nextTrack) {
                    this.playMusic(track.nextTrack);
                  }
                },
              })
            );
          }
        }
      }

      // Load ambient sounds (legacy)
      if (ambience) {
        for (const ambient of ambience) {
          if (!this.ambience.has(ambient.id)) {
            this.ambience.set(
              ambient.id,
              new Howl({
                src: [ambient.url],
                volume: this.volumes.ambient * (ambient.volume || 1),
                loop: ambient.loop !== false,
              })
            );
          }
        }
      }
    }
  }

  /**
   * Play music with optional crossfade
   */
  playMusic(trackId, crossfade = true) {
    const newTrack = this.music?.get(trackId);
    if (!newTrack) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    if (this.currentMusic && crossfade) {
      // Crossfade from current to new
      this.crossfadeMusic(this.currentMusic, newTrack);
    } else {
      // Stop current and play new
      if (this.currentMusic) {
        this.currentMusic.stop();
      }
      newTrack.play();
      this.currentMusic = newTrack;
    }
  }

  crossfadeMusic(oldTrack, newTrack) {
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
        this.currentMusic = newTrack;
      }
    }, stepTime);
  }

  /**
   * Play sound effect
   */
  playSFX(soundId, options = {}) {
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
  playAmbient(ambientId) {
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
  stopAmbient(ambientId) {
    const ambient = this.ambience.get(ambientId);
    if (ambient) {
      ambient.stop();
      this.currentAmbience = this.currentAmbience.filter((id) => id !== ambientId);
    }
  }

  /**
   * Stop all audio
   */
  stopAll() {
    if (this.currentMusic) {
      this.currentMusic.stop();
    }

    for (const ambient of this.ambience.values()) {
      ambient.stop();
    }

    this.currentAmbience = [];
  }

  /**
   * Set volume for category
   */
  setVolume(category, value) {
    if (category in this.volumes) {
      this.volumes[category] = Math.max(0, Math.min(1, value));

      // Update Howler master volume
      if (category === 'master') {
        Howler.volume(this.volumes.master);
      }

      // Update music volume
      if (category === 'music' && this.currentMusic) {
        this.currentMusic.volume(this.volumes.music);
      }
    }
  }

  /**
   * Get current volume for category
   */
  getVolume(category) {
    return this.volumes[category] || 0;
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted) {
    Howler.mute(muted);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAll();

    // Unload all sounds
    for (const sound of this.sfx.values()) {
      sound.unload();
    }

    for (const ambient of this.ambience.values()) {
      ambient.unload();
    }

    if (this.music) {
      for (const track of this.music.values()) {
        track.unload();
      }
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
