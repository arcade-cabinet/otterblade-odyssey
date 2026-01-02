/**
 * Global Window type augmentation for test API
 *
 * This file extends the global Window interface to include the test API
 * used for automated testing and E2E validation.
 */

import type { GameTestAPI } from '@/lib/test-api';

declare global {
  interface Window {
    __GAME_TEST_API__?: GameTestAPI;
  }
}
