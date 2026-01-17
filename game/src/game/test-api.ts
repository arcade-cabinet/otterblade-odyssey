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
    gameStarted: boolean;
    gameOver: boolean;
    biomeIndex: number;
    score: number;
    shards: number;
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

  /**
   * Check if test API is ready
   */
  isReady(): boolean;
}

interface GameRuntimeRef {
  player?: { position: { x: number; y: number }; velocity: { x: number; y: number }; facingDirection?: number; isGrounded?: boolean };
}

// Extend Window interface to include test API
declare global {
  interface Window {
    __GAME_TEST_API__?: GameTestAPI;
    __GAME_RUNTIME__?: GameRuntimeRef;
  }
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
      const runtimePlayer = window.__GAME_RUNTIME__?.player;
      const playerX = runtimePlayer?.position.x ?? store.playerX;
      const playerY = runtimePlayer?.position.y ?? store.playerY;
      const velocityX = runtimePlayer?.velocity.x ?? 0;
      const velocityY = runtimePlayer?.velocity.y ?? 0;
      const facing = runtimePlayer?.facingDirection ? (runtimePlayer.facingDirection >= 0 ? 1 : -1) : store.playerFacingRight ? 1 : -1;
      const grounded = runtimePlayer?.isGrounded ?? store.playerState !== 'jump';

      return {
        x: playerX,
        y: playerY,
        velocityX,
        velocityY,
        facing,
        grounded,
        action: store.playerState,
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
        gameStarted: store.gameStarted,
        gameOver: store.gameOver,
        biomeIndex: store.biomeIndex,
        score: store.score,
        shards: store.shards,
      };
    },

    simulateInput(keys) {
      const store = useStore.getState();
      const validKeys = [
        'left',
        'right',
        'jump',
        'attack',
        'slink',
        'up',
        'down',
        'interact',
        'roll',
      ] as const;
      Object.entries(keys).forEach(([key, value]) => {
        if (validKeys.includes(key as (typeof validKeys)[number]) && value !== undefined) {
          store.setControl(key as (typeof validKeys)[number], value);
        }
      });
    },

    isReady() {
      // Check if game systems are initialized
      return useStore.getState() !== undefined;
    },
  };

  // Expose on window
  window.__GAME_TEST_API__ = api;
}

/**
 * Clean up test API
 */
export function cleanupTestAPI(): void {
  if (import.meta.env.MODE === 'production') {
    return;
  }
  delete window.__GAME_TEST_API__;
}
