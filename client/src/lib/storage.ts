/**
 * @fileoverview Cross-platform storage adapter for Zustand persist middleware
 * Uses Capacitor Preferences on native, falls back to localStorage on web
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

/**
 * Check if we're running on a native platform
 */
const isNative = Capacitor.isNativePlatform();

/**
 * Custom storage adapter for Zustand's persist middleware
 *
 * On native (iOS/Android): Uses Capacitor Preferences (UserDefaults/SharedPreferences)
 * On web: Uses localStorage (Preferences falls back to this automatically on web PWAs)
 *
 * This is ASYNC storage, so Zustand will handle hydration properly
 */
export const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key: name });
      return value;
    } catch (error) {
      console.warn(`[Storage] Failed to get "${name}" from Preferences:`, error);
      // Fallback to localStorage for web or error cases
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key: name, value });
    } catch (error) {
      console.warn(`[Storage] Failed to set "${name}" in Preferences:`, error);
      // Fallback to localStorage
      try {
        localStorage.setItem(name, value);
      } catch (localError) {
        console.error('[Storage] localStorage fallback also failed:', localError);
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await Preferences.remove({ key: name });
    } catch (error) {
      console.warn(`[Storage] Failed to remove "${name}" from Preferences:`, error);
    }
    // Also clean localStorage fallback
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
};

/**
 * Synchronous localStorage adapter for development/testing
 * Use this when you don't need Capacitor integration
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
    } catch (error) {
      console.error('[Storage] localStorage.setItem failed:', error);
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
 * Get the appropriate storage adapter based on platform
 * - Native: Capacitor Preferences (async)
 * - Web: localStorage (sync, but wrapped as async for consistency)
 */
export function getStorageAdapter(): StateStorage {
  // Always use capacitorStorage - it handles fallbacks internally
  // and Capacitor Preferences uses localStorage on web PWAs anyway
  return capacitorStorage;
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
    await Preferences.set({ key: testKey, value: 'test' });
    await Preferences.remove({ key: testKey });
    return true;
  } catch {
    // Check localStorage fallback
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Clear all game data (for debugging or user request)
 */
export async function clearAllGameData(): Promise<void> {
  try {
    // Clear Capacitor Preferences
    await Preferences.clear();
  } catch (error) {
    console.warn('[Storage] Failed to clear Preferences:', error);
  }

  // Also clear any localStorage items with our prefix
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
    platform: Capacitor.getPlatform(),
    isNative,
  };
}
