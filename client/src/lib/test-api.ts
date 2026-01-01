/**
 * Test API - Exposes game state for automated testing
 *
 * This module provides a testing interface that allows E2E tests
 * to inspect game state without modifying game logic.
 *
 * IMPORTANT: Only enabled in development/test environments
 */

import { useStore } from '@/game/store';

declare global {
  interface Window {
    __GAME_TEST_API__?: GameTestAPI;
  }
}

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
  if (typeof window === 'undefined') {
    return;
  }

  const api: GameTestAPI = {
    getPlayerState: () => {
      const store = useStore.getState();
      const isGrounded = !['jump', 'fall'].includes(store.playerState);

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

      // Test readiness is intentionally a composite condition:
      // - hasActiveGame: main game loop has been flagged as started
      // - hasPersistedRun: a previous run has been created/restored (non-zero runId)
      // - playerHasLeftIdle: the player has transitioned out of the initial idle state
      //
      // Any of these indicates that the game has progressed far enough for E2E tests
      // to safely interact with the scene without racing initialization.
      const hasActiveGame = state.gameStarted;
      const hasPersistedRun = state.runId > 0;
      const playerHasLeftIdle = state.playerState !== 'idle';

      return hasActiveGame || hasPersistedRun || playerHasLeftIdle;
    },
  };

  // Expose on window for Playwright access
  window.__GAME_TEST_API__ = api;

  console.log('[Test API] Initialized - test automation enabled');
}

/**
 * Get the test API (for use within the game code)
 */
export function getTestAPI(): GameTestAPI | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.__GAME_TEST_API__ ?? null;
}

/**
 * Check if test API is available
 */
export function isTestAPIEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.__GAME_TEST_API__);
}
