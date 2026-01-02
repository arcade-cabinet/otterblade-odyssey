/**
 * Test API - Expose game state for E2E testing
 *
 * This is only included in development/test builds and provides
 * a window.__GAME_TEST_API__ interface that Playwright tests can use
 * to observe and control the game for automated playthroughs.
 *
 * SECURITY: Never include in production builds
 */

import { useStore } from './store';

export interface GameTestAPI {
  /**
   * Get current player state for AI navigation
   */
  getPlayerState(): {
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

  /**
   * Get current quest state
   */
  getQuestState(): {
    currentChapter: number;
    questName: string;
    isComplete: boolean;
  };

  /**
   * Check if game over or victory
   */
  getGameState(): {
    started: boolean;
    over: boolean;
    victory: boolean;
    score: number;
    distance: number;
  };

  /**
   * Simulate keyboard input programmatically
   */
  simulateInput(keys: {
    left?: boolean;
    right?: boolean;
    jump?: boolean;
    attack?: boolean;
    slink?: boolean;
  }): void;
}

/**
 * Initialize test API on window object
 * Only call in development/test environments
 */
export function initializeTestAPI(): void {
  // Only in development
  if (import.meta.env.MODE === 'production') {
    return;
  }

  const api: GameTestAPI = {
    getPlayerState() {
      const store = useStore.getState();
      return {
        x: store.playerX,
        y: store.playerY,
        velocityX: 0, // Would need to track this in store
        velocityY: 0,
        facing: store.playerFacing,
        grounded: true, // Would need to track this
        action: 'idle', // Would need to track this
        health: store.health,
        currentPlatformId: null,
      };
    },

    getQuestState() {
      const store = useStore.getState();
      return {
        currentChapter: store.biomeIndex,
        questName: store.biomeIndex < 10 ? `Chapter ${store.biomeIndex}` : 'Complete',
        isComplete: store.gameOver && store.health > 0,
      };
    },

    getGameState() {
      const store = useStore.getState();
      return {
        started: store.gameStarted,
        over: store.gameOver,
        victory: store.gameOver && store.health > 0,
        score: store.score,
        distance: store.distance,
      };
    },

    simulateInput(keys) {
      const store = useStore.getState();
      Object.entries(keys).forEach(([key, value]) => {
        store.setControl(key as any, value);
      });
    },
  };

  // Expose on window
  (window as any).__GAME_TEST_API__ = api;
  console.log('[Test API] Initialized - available as window.__GAME_TEST_API__');
}

/**
 * Clean up test API
 */
export function cleanupTestAPI(): void {
  if (import.meta.env.MODE === 'production') {
    return;
  }
  delete (window as any).__GAME_TEST_API__;
}
