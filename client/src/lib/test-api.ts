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
 * Initializes and exposes the in-browser Game Test API for automated tests.
 *
 * Call once during app startup. The API is attached to `window.__GAME_TEST_API__`
 * and is only enabled in development or test environments.
 */
export function initializeTestAPI(): void {
  // Only expose in development/test
  if (import.meta.env.PROD && import.meta.env.MODE !== 'test') {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  const api: GameTestAPI = {
    getPlayerState: () => {
      const store = useStore.getState();
      const isGrounded = ['idle', 'run', 'slide', 'slink', 'sprint', 'land', 'roll'].includes(
        store.playerState
      );

      return {
        x: store.playerX,
        y: store.playerY,
        velocityX: 0,
        velocityY: 0,
        facing: store.playerFacingRight ? 1 : -1,
        grounded: isGrounded,
        action: store.playerState,
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
      const state = useStore.getState();

      // Test readiness requires the game to be properly initialized:
      // - hasActiveGame: main game loop has been flagged as started
      // - hasPersistedRun: a previous run has been created/restored (non-zero runId)
      //
      // At least one of these core conditions must be true to prevent premature
      // readiness signals (e.g., if setPlayerState() is called externally before
      // the game actually starts).
      const hasActiveGame = state.gameStarted;
      const hasPersistedRun = state.runId > 0;

      return hasActiveGame || hasPersistedRun;
    },
  };

  // Expose on window for Playwright access
  window.__GAME_TEST_API__ = api;

  console.log('[Test API] Initialized - test automation enabled');
}

/**
 * Access the globally exposed test API when available.
 *
 * @returns The `GameTestAPI` instance from `window.__GAME_TEST_API__`, or `null` if the API is not present or `window` is undefined.
 */
export function getTestAPI(): GameTestAPI | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.__GAME_TEST_API__ ?? null;
}

/**
 * Determine whether the in-browser test API has been exposed.
 *
 * @returns `true` if the test API is available on `window`, `false` otherwise.
 */
export function isTestAPIEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.__GAME_TEST_API__);
}
