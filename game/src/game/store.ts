/**
 * @fileoverview Zustand game store with persistence
 *
 * State is divided into:
 * - Persisted: Best scores, settings, progress (survives page refresh)
 * - Runtime: Current game session data (reset on new game)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, webStorage } from '../lib/storage';
import { BIOMES } from './constants';

// ============================================================================
// Types
// ============================================================================

interface PlatformAABB {
  minX: number;
  maxX: number;
  topY: number;
}

interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  /** "Slink" - going low on all fours, otter-appropriate term for crouch */
  slink: boolean;
  attack: boolean;
  up: boolean;
  down: boolean;
  /** Interact with objects (lanterns, levers, etc.) */
  interact: boolean;
  /** Roll/dodge action */
  roll: boolean;
}

/**
 * Persisted state - survives page refresh and app restarts
 * Stored via localStorage
 */
interface PersistedState {
  // High scores
  bestScore: number;
  bestDistance: number;

  // Settings
  quality: number;
  musicVolume: number;
  sfxVolume: number;
  hapticEnabled: boolean;

  // Progress
  unlockedChapters: number[];
  completedChapters: number[];
  achievements: string[];
  totalEmberShards: number;
  totalHearthstones: number;

  // Blade upgrades (persistent across runs)
  bladeLevel: number;
}

/**
 * Runtime state - reset on new game, not persisted
 */
interface RuntimeState {
  runId: number;
  gameStarted: boolean;
  gameOver: boolean;

  // Current run stats
  health: number;
  maxHealth: number;
  warmth: number;
  maxWarmth: number;
  shards: number;
  bankedShards: number;
  hearthstones: number;
  score: number;
  distance: number;

  // Biome
  biomeIndex: number;
  accent: string;

  // Boss
  inBossFight: boolean;
  bossHp: number;
  bossMax: number;
  bossIndex: number;
  bossName: string;

  // Checkpoint
  checkpointX: number;
  checkpointY: number;
  checkpointSeen: number;

  // UI
  toast: string;
  toastUntil: number;

  // Controls
  controls: Controls;

  // Player state
  playerX: number;
  playerY: number;
  playerFacingRight: boolean;
  /**
   * Player animation/physics state
   * - 'idle': Standing still
   * - 'run': Bipedal running (upright)
   * - 'slink': Low on all fours (under obstacles)
   * - 'sprint': Fast quadrupedal gallop
   * - 'jump': In air, ascending
   * - 'fall': In air, descending
   * - 'land': Landing recovery frames
   * - 'attack': Sword swing
   * - 'roll': Dodge roll (invulnerable)
   * - 'swim': In water
   * - 'climb': On wall/ladder
   * - 'hurt': Taking damage
   * - 'dead': Game over
   */
  playerState: string;
  /** Whether player is invulnerable (post-damage, during roll) */
  invulnerable: boolean;
  /** Timestamp when invulnerability ends */
  invulnerableUntil: number;

  // Visual effects
  damageFlash: number;
  screenShake: number;

  // Platform registry for collision
  platformAABBs: Map<string, PlatformAABB>;

  // Performance
  avgMs: number;
  showQualityBadgeUntil: number;
}

/**
 * Actions available on the store
 */
interface GameActions {
  // Platform registry
  registerPlatform: (id: string, aabb: PlatformAABB) => void;
  unregisterPlatform: (id: string) => void;

  // Controls
  setControl: (key: keyof Controls, value: boolean) => void;
  clearControls: () => void;

  // Player state
  setBiomeMeta: (idx: number, accent: string) => void;
  setPlayerPos: (x: number, y: number) => void;
  setPlayerFacing: (facingRight: boolean) => void;
  setPlayerState: (state: string) => void;
  setInvulnerable: (until: number) => void;

  // UI
  toastMsg: (msg: string, ms?: number) => void;

  // Game lifecycle
  startGame: () => void;
  advanceScore: (newDistance: number) => void;
  addShard: () => void;
  addHearthstone: () => void;
  checkpoint: (roomIndex: number, x: number, y: number) => void;
  setBossState: (
    inBossFight: boolean,
    bossHp: number,
    bossMax: number,
    bossIndex: number,
    bossName?: string
  ) => void;
  hitPlayer: (dmg?: number) => void;
  drainWarmth: (amount: number) => void;
  restoreWarmth: (amount: number) => void;
  respawnFromCheckpoint: () => void;

  // Settings
  setQuality: (quality: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setHapticEnabled: (enabled: boolean) => void;

  // Progress
  unlockChapter: (chapter: number) => void;
  completeChapter: (chapter: number) => void;
  addAchievement: (achievement: string) => void;
  upgradeBlade: () => void;

  // Reset
  resetProgress: () => void;
}

type GameState = PersistedState & RuntimeState & GameActions;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_CONTROLS: Controls = {
  left: false,
  right: false,
  jump: false,
  slink: false,
  attack: false,
  up: false,
  down: false,
  interact: false,
  roll: false,
};

const DEFAULT_PERSISTED: PersistedState = {
  bestScore: 0,
  bestDistance: 0,
  quality: 2,
  musicVolume: 0.7,
  sfxVolume: 1.0,
  hapticEnabled: true,
  unlockedChapters: [0],
  completedChapters: [],
  achievements: [],
  totalEmberShards: 0,
  totalHearthstones: 0,
  bladeLevel: 1,
};

const DEFAULT_RUNTIME: RuntimeState = {
  runId: 0,
  gameStarted: false,
  gameOver: false,
  health: 5,
  maxHealth: 5,
  warmth: 100,
  maxWarmth: 100,
  shards: 0,
  bankedShards: 0,
  hearthstones: 0,
  score: 0,
  distance: 0,
  biomeIndex: 0,
  accent: BIOMES[0]?.accent ?? '#E67E22',
  inBossFight: false,
  bossHp: 0,
  bossMax: 0,
  bossIndex: 0,
  bossName: '',
  checkpointX: 0,
  checkpointY: 8,
  checkpointSeen: -1,
  toast: '',
  toastUntil: 0,
  controls: { ...DEFAULT_CONTROLS },
  playerX: 0,
  playerY: 0,
  playerFacingRight: true,
  playerState: 'idle',
  invulnerable: false,
  invulnerableUntil: 0,
  damageFlash: 0,
  screenShake: 0,
  platformAABBs: new Map(),
  avgMs: 16.7,
  showQualityBadgeUntil: 0,
};

// ============================================================================
// Store
// ============================================================================

export const useStore = create<GameState>()(
  persist(
    (set, _get) => ({
      // Persisted state
      ...DEFAULT_PERSISTED,

      // Runtime state
      ...DEFAULT_RUNTIME,

      // ========================================
      // Platform Registry
      // ========================================

      registerPlatform: (id, aabb) =>
        set((s) => {
          const m = new Map(s.platformAABBs);
          m.set(id, aabb);
          return { platformAABBs: m };
        }),

      unregisterPlatform: (id) =>
        set((s) => {
          const m = new Map(s.platformAABBs);
          m.delete(id);
          return { platformAABBs: m };
        }),

      // ========================================
      // Controls
      // ========================================

      setControl: (k, v) => set((s) => ({ controls: { ...s.controls, [k]: v } })),

      clearControls: () => set({ controls: { ...DEFAULT_CONTROLS } }),

      // ========================================
      // Player State
      // ========================================

      setBiomeMeta: (idx, accent) => set({ biomeIndex: idx, accent }),

      setPlayerPos: (x, y) => set({ playerX: x, playerY: y }),

      setPlayerFacing: (fr) => set({ playerFacingRight: fr }),

      setPlayerState: (st) => set({ playerState: st }),

      setInvulnerable: (until) => set({ invulnerable: true, invulnerableUntil: until }),

      // ========================================
      // UI
      // ========================================

      toastMsg: (msg, ms = 1200) => set({ toast: msg, toastUntil: performance.now() + ms }),

      // ========================================
      // Game Lifecycle
      // ========================================

      startGame: () =>
        set((s) => ({
          runId: s.runId + 1,
          gameStarted: true,
          gameOver: false,
          health: 5,
          maxHealth: 5,
          warmth: 100,
          maxWarmth: 100,
          shards: 0,
          bankedShards: 0,
          hearthstones: 0,
          score: 0,
          distance: 0,
          inBossFight: false,
          bossHp: 0,
          bossMax: 0,
          bossIndex: 0,
          bossName: '',
          checkpointX: 0,
          checkpointY: 8,
          checkpointSeen: -1,
          toast: '',
          toastUntil: 0,
          playerState: 'idle',
          invulnerable: false,
          invulnerableUntil: 0,
          damageFlash: 0,
          screenShake: 0,
          avgMs: 16.7,
          showQualityBadgeUntil: 0,
        })),

      advanceScore: (newDistance) =>
        set((s) => {
          const d = Math.max(s.distance, newDistance);
          const base = Math.floor(d * 10);
          const score = Math.max(s.score, base);
          return { distance: d, score };
        }),

      addShard: () =>
        set((s) => ({
          shards: s.shards + 1,
          score: s.score + 180,
          totalEmberShards: s.totalEmberShards + 1,
        })),

      addHearthstone: () =>
        set((s) => {
          const newHearthstones = s.hearthstones + 1;
          return {
            hearthstones: newHearthstones,
            totalHearthstones: s.totalHearthstones + 1,
            score: s.score + 500,
          };
        }),

      checkpoint: (roomIndex, x, y) =>
        set((s) => {
          const banked = s.bankedShards + s.shards;
          const health = Math.min(s.maxHealth, s.health + 1);
          const warmth = Math.min(s.maxWarmth, s.warmth + 25);
          return {
            checkpointSeen: roomIndex,
            checkpointX: x,
            checkpointY: y,
            bankedShards: banked,
            shards: 0,
            health,
            warmth,
            score: s.score + 400,
            toast: 'Hearth kindled',
            toastUntil: performance.now() + 1300,
          };
        }),

      setBossState: (inBossFight, bossHp, bossMax, bossIndex, bossName = '') =>
        set({ inBossFight, bossHp, bossMax, bossIndex, bossName }),

      hitPlayer: (dmg = 1) =>
        set((s) => {
          if (s.gameOver || s.invulnerable) return s;
          const now = performance.now();
          const nh = s.health - dmg;
          const gameOver = nh <= 0;
          return {
            health: Math.max(0, nh),
            gameOver,
            bestScore: Math.max(s.bestScore, s.score),
            bestDistance: Math.max(s.bestDistance, s.distance),
            damageFlash: now + 140,
            screenShake: now + 200,
            invulnerable: true,
            invulnerableUntil: now + 800,
            playerState: gameOver ? 'dead' : 'hurt',
          };
        }),

      drainWarmth: (amount) =>
        set((s) => {
          const newWarmth = Math.max(0, s.warmth - amount);
          // If warmth hits zero, start taking damage
          if (newWarmth <= 0 && s.warmth > 0) {
            return {
              warmth: 0,
              health: s.health - 1,
              gameOver: s.health <= 1,
              toast: 'The cold takes hold...',
              toastUntil: performance.now() + 1500,
            };
          }
          return { warmth: newWarmth };
        }),

      restoreWarmth: (amount) => set((s) => ({ warmth: Math.min(s.maxWarmth, s.warmth + amount) })),

      respawnFromCheckpoint: () =>
        set((s) => ({
          gameOver: false,
          health: s.maxHealth,
          warmth: s.maxWarmth,
          shards: 0,
          score: Math.max(0, s.score - 900),
          distance: Math.max(0, s.distance - 80),
          inBossFight: false,
          bossHp: 0,
          bossMax: 0,
          bossIndex: 0,
          bossName: '',
          toast: 'Restored from hearth',
          toastUntil: performance.now() + 1200,
          playerState: 'idle',
          invulnerable: true,
          invulnerableUntil: performance.now() + 1500,
        })),

      // ========================================
      // Settings
      // ========================================

      setQuality: (quality) => set({ quality }),

      setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),

      setSfxVolume: (volume) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),

      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),

      // ========================================
      // Progress
      // ========================================

      unlockChapter: (chapter) =>
        set((s) => {
          if (s.unlockedChapters.includes(chapter)) return s;
          return {
            unlockedChapters: [...s.unlockedChapters, chapter].sort((a, b) => a - b),
          };
        }),

      completeChapter: (chapter) =>
        set((s) => {
          const updates: Partial<PersistedState> = {};
          if (!s.completedChapters.includes(chapter)) {
            updates.completedChapters = [...s.completedChapters, chapter].sort((a, b) => a - b);
          }
          // Unlock next chapter
          const nextChapter = chapter + 1;
          if (nextChapter <= 9 && !s.unlockedChapters.includes(nextChapter)) {
            updates.unlockedChapters = [...s.unlockedChapters, nextChapter].sort((a, b) => a - b);
          }
          return updates;
        }),

      addAchievement: (achievement) =>
        set((s) => {
          if (s.achievements.includes(achievement)) return s;
          return {
            achievements: [...s.achievements, achievement],
            toast: `Achievement: ${achievement}`,
            toastUntil: performance.now() + 2000,
          };
        }),

      upgradeBlade: () =>
        set((s) => ({
          bladeLevel: Math.min(5, s.bladeLevel + 1),
          toast: `Otterblade Level ${s.bladeLevel + 1}!`,
          toastUntil: performance.now() + 1500,
        })),

      // ========================================
      // Reset
      // ========================================

      resetProgress: () =>
        set({
          ...DEFAULT_PERSISTED,
          ...DEFAULT_RUNTIME,
        }),
    }),
    {
      name: STORAGE_KEYS.GAME_SAVE,
      storage: createJSONStorage(() => webStorage),

      // Only persist certain fields (not runtime state)
      partialize: (state): PersistedState => ({
        bestScore: state.bestScore,
        bestDistance: state.bestDistance,
        quality: state.quality,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        hapticEnabled: state.hapticEnabled,
        unlockedChapters: state.unlockedChapters,
        completedChapters: state.completedChapters,
        achievements: state.achievements,
        totalEmberShards: state.totalEmberShards,
        totalHearthstones: state.totalHearthstones,
        bladeLevel: state.bladeLevel,
      }),

      // Version for migrations
      version: 1,

      // Migration function for future schema changes
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration from v0 to v1: add new fields
          return {
            ...DEFAULT_PERSISTED,
            ...(persistedState as Partial<PersistedState>),
          };
        }
        return persistedState as PersistedState;
      },

      // Merge persisted state with runtime defaults
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<PersistedState>),
      }),

      // Hydration callback
      onRehydrateStorage: () => (_state, _error) => {},
    }
  )
);

// ============================================================================
// Selectors (for performance - avoid re-renders)
// ============================================================================

/** Select only controls for input handling */
export const selectControls = (state: GameState) => state.controls;

/** Select player position */
export const selectPlayerPos = (state: GameState) => ({
  x: state.playerX,
  y: state.playerY,
  facing: state.playerFacingRight,
  state: state.playerState,
});

/** Select HUD data */
export const selectHUD = (state: GameState) => ({
  health: state.health,
  maxHealth: state.maxHealth,
  warmth: state.warmth,
  maxWarmth: state.maxWarmth,
  shards: state.shards,
  hearthstones: state.hearthstones,
  score: state.score,
  bladeLevel: state.bladeLevel,
});

/** Select boss bar data */
export const selectBoss = (state: GameState) => ({
  active: state.inBossFight,
  hp: state.bossHp,
  max: state.bossMax,
  name: state.bossName,
});

/** Select settings */
export const selectSettings = (state: GameState) => ({
  quality: state.quality,
  musicVolume: state.musicVolume,
  sfxVolume: state.sfxVolume,
  hapticEnabled: state.hapticEnabled,
});
