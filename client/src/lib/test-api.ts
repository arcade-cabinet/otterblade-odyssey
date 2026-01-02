/**
 * Test API - Exposes game state for automated testing
 *
 * This module provides a testing interface that allows E2E tests
 * to inspect game state without modifying game logic.
 *
 * IMPORTANT: Only enabled in development/test environments
 */

import { useStore } from '@/game/store';

export interface GameTestAPI {
  getPlayerState: () => {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    facing: 1 | -1;
    grounded: boolean;
    action: string;
    health: number;
    currentPlatformId: string | null;
  };
  getGameState: () => {
    gameStarted: boolean;
    gameOver: boolean;
    biomeIndex: number;
    score: number;
    shards: number;
  };
  isReady: () => boolean;
}

/**
 * Initialize test API (call once during app startup)
 */
export function initializeTestAPI(): void {
  // Only expose in development/test
  if (import.meta.env.PROD && import.meta.env.MODE !== 'test') {
    return;
  }

  const api: GameTestAPI = {
    getPlayerState: () => {
      const store = useStore.getState();

      // In current React Three Fiber implementation, we get state from store
      // In future Canvas 2D implementation, we'd get it from the game engine
      return {
        x: 100, // TODO: Get from actual player entity
        y: 450,
        velocityX: 0,
        velocityY: 0,
        facing: 1,
        grounded: true,
        action: 'idle',
        health: store.health,
        currentPlatformId: null,
      };
    },

    getGameState: () => {
      const store = useStore.getState();
      return {
        gameStarted: store.gameStarted,
        gameOver: store.gameOver,
        biomeIndex: store.biomeIndex,
        score: store.score,
        shards: store.shards,
      };
    },

    isReady: () => {
      // Check if game systems are initialized
      return useStore.getState() !== undefined;
    },
  };

interface GameTestWindow extends Window {
  __GAME_TEST_API__?: GameTestAPI;
}

  // Expose on window for Playwright access
(window as GameTestWindow).__GAME_TEST_API__ = api;

  console.log('[Test API] Initialized - test automation enabled');
}

/**
 * Get the test API (for use within the game code)
 */
export function getTestAPI(): GameTestAPI | null {
return (window as GameTestWindow).__GAME_TEST_API__ || null;
}

/**
 * Check if test API is available
 */
export function isTestAPIEnabled(): boolean {
return !!(window as GameTestWindow).__GAME_TEST_API__;
}
