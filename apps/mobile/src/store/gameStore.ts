/**
 * Zustand game store with AsyncStorage persistence
 * Ported from game/src/game/store.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// AsyncStorage adapter for Zustand
const asyncStorageAdapter = {
  getItem: async (name: string) => await AsyncStorage.getItem(name),
  setItem: async (name: string, value: string) => await AsyncStorage.setItem(name, value),
  removeItem: async (name: string) => await AsyncStorage.removeItem(name),
};

// Persisted state - survives app restart
interface PersistedState {
  bestScore: number;
  bestDistance: number;
  quality: number;
  musicVolume: number;
  sfxVolume: number;
  hapticEnabled: boolean;
  unlockedChapters: number[];
  completedChapters: number[];
  achievements: string[];
  totalEmberShards: number;
  totalHearthstones: number;
  bladeLevel: number;
}

// Runtime state - reset on new game
interface RuntimeState {
  gameStarted: boolean;
  gameOver: boolean;
  health: number;
  maxHealth: number;
  warmth: number;
  maxWarmth: number;
  shards: number;
  score: number;
  currentChapter: number;
  playerX: number;
  playerY: number;
  playerFacingRight: boolean;
}

// Actions
interface GameActions {
  startGame: () => void;
  takeDamage: (amount: number) => void;
  collectShard: () => void;
  restoreHealth: (amount: number) => void;
  drainWarmth: (amount: number) => void;
  restoreWarmth: (amount: number) => void;
  setPlayerPosition: (x: number, y: number) => void;
  setPlayerFacing: (facingRight: boolean) => void;
  completeChapter: (chapter: number) => void;
  resetGame: () => void;
}

type GameState = PersistedState & RuntimeState & GameActions;

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
  gameStarted: false,
  gameOver: false,
  health: 5,
  maxHealth: 5,
  warmth: 100,
  maxWarmth: 100,
  shards: 0,
  score: 0,
  currentChapter: 0,
  playerX: 0,
  playerY: 0,
  playerFacingRight: true,
};

export const useStore = create<GameState>()(
  persist(
    (set) => ({
      ...DEFAULT_PERSISTED,
      ...DEFAULT_RUNTIME,

      startGame: () =>
        set({
          gameStarted: true,
          gameOver: false,
          health: 5,
          warmth: 100,
          shards: 0,
          score: 0,
        }),

      takeDamage: (amount) =>
        set((s) => {
          const newHealth = Math.max(0, s.health - amount);
          return {
            health: newHealth,
            gameOver: newHealth <= 0,
            bestScore: Math.max(s.bestScore, s.score),
          };
        }),

      collectShard: () =>
        set((s) => ({
          shards: s.shards + 1,
          score: s.score + 180,
          totalEmberShards: s.totalEmberShards + 1,
        })),

      restoreHealth: (amount) =>
        set((s) => ({
          health: Math.min(s.maxHealth, s.health + amount),
        })),

      drainWarmth: (amount) =>
        set((s) => ({
          warmth: Math.max(0, s.warmth - amount),
        })),

      restoreWarmth: (amount) =>
        set((s) => ({
          warmth: Math.min(s.maxWarmth, s.warmth + amount),
        })),

      setPlayerPosition: (x, y) => set({ playerX: x, playerY: y }),

      setPlayerFacing: (facingRight) => set({ playerFacingRight: facingRight }),

      completeChapter: (chapter) =>
        set((s) => ({
          completedChapters: s.completedChapters.includes(chapter)
            ? s.completedChapters
            : [...s.completedChapters, chapter].sort((a, b) => a - b),
          unlockedChapters:
            chapter + 1 <= 9 && !s.unlockedChapters.includes(chapter + 1)
              ? [...s.unlockedChapters, chapter + 1].sort((a, b) => a - b)
              : s.unlockedChapters,
        })),

      resetGame: () =>
        set({
          ...DEFAULT_RUNTIME,
        }),
    }),
    {
      name: 'otterblade-save',
      storage: createJSONStorage(() => asyncStorageAdapter),
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
    }
  )
);
