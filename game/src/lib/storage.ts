/**
 * @fileoverview Web storage adapter for Zustand persist middleware.
 * Uses localStorage; wrapped in async shape for compatibility.
 */

import type { StateStorage } from 'zustand/middleware';

/**
 * Async wrapper around localStorage so Zustand's persist middleware
 * can hydrate consistently in SSR/client transitions.
 */
export const webStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore write errors (private mode, quotas, etc.)
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
};

/**
 * Synchronous helper used in tests where async storage is unnecessary.
 */
export const localStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore write errors
    }
  },

  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
};

/**
 * Get the storage adapter for the current environment.
 */
export function getStorageAdapter(): StateStorage {
  return webStorage;
}

/**
 * Storage keys used by the game
 * Centralized here to prevent typos and enable easy management
 */
export const STORAGE_KEYS = {
  /** Main game save data (scores, progress, achievements) */
  GAME_SAVE: 'otterblade-save',
  /** User settings (audio, quality, controls) */
  SETTINGS: 'otterblade-settings',
  /** Asset approvals for dev tools */
  ASSET_APPROVALS: 'otterblade-asset-approvals',
  /** Intro cinematic watched flag */
  INTRO_WATCHED: 'otterblade-intro-watched',
} as const;

/**
 * Helper to check if storage is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all game data (for debugging or user request)
 */
export async function clearAllGameData(): Promise<void> {
  // Clear any localStorage items with our prefix
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('otterblade-')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

/**
 * Export storage info for debugging
 */
export function getStorageInfo(): { platform: string; isNative: boolean } {
  return {
    platform: 'web',
    isNative: false,
  };
}
