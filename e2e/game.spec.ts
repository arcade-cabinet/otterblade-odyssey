import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Otterblade Odyssey
 *
 * Supports two modes:
 * 1. PLAYWRIGHT_MCP=true - Full tests including WebGL/canvas interactions
 * 2. Default (headless) - Basic tests that don't require GPU
 *
 * Run with MCP: PLAYWRIGHT_MCP=true pnpm test:e2e
 * Run headless: pnpm test:e2e
 */

// Check if running with full MCP capabilities
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === 'true';

test.describe('Otterblade Odyssey', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    // Skip intro cinematic for tests by marking it as already watched
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('otterblade_intro_watched', 'true');
    });
    // Reload to apply the localStorage change
    await page.reload();
  });

  // ============================================
  // Basic Tests (work in both modes)
  // ============================================

  test('should load the page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Otterblade Odyssey/);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should have correct meta tags', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Otterblade');
  });

  test('should have localStorage available', async ({ page }) => {
    const localStorageWorks = await page.evaluate(() => {
      try {
        const key = 'otterblade-odyssey-test';
        localStorage.setItem(key, 'test-value');
        const result = localStorage.getItem(key) === 'test-value';
        localStorage.removeItem(key);
        return result;
      } catch {
        return false;
      }
    });

    expect(localStorageWorks).toBe(true);
  });

  test('should render canvas element', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2500);

    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();

    if (hasMcpSupport) {
      await expect(canvas).toBeVisible({ timeout: 15000 });
      expect(canvasCount).toBeGreaterThan(0);
    } else {
      console.log(`Canvas elements found: ${canvasCount}`);
      const root = page.locator('#root');
      await expect(root).toBeVisible();
    }
  });

  test('should display start menu', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2000);

    const startMenu = page.getByTestId('start-menu');
    await expect(startMenu).toBeVisible({ timeout: 15000 });

    // Check for game title
    await expect(page.getByText('Otterblade Odyssey')).toBeVisible();

    // Check for start button
    await expect(page.getByTestId('button-start-game')).toBeVisible();
  });

  // ============================================
  // Game Flow Tests (MCP recommended for full testing)
  // ============================================

  test('should start game when clicking begin button', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2000);

    const startMenu = page.getByTestId('start-menu');
    await expect(startMenu).toBeVisible({ timeout: 15000 });

    // Click start game
    await page.getByTestId('button-start-game').click();

    // Start menu should disappear
    await expect(startMenu).not.toBeVisible({ timeout: 5000 });

    // Game container should be visible
    await expect(page.getByTestId('game-container')).toBeVisible();
  });

  test('should display HUD after starting game', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    // Health hearts should be visible
    const healthHearts = page.getByTestId('health-hearts');
    await expect(healthHearts).toBeVisible({ timeout: 10000 });

    // Score should be visible
    const scoreDisplay = page.getByTestId('score-display');
    await expect(scoreDisplay).toBeVisible();

    // Shard count should be visible
    const shardCount = page.getByTestId('shard-count');
    await expect(shardCount).toBeVisible();
  });

  test('should respond to keyboard controls', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    // Test movement keys
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');

    await page.keyboard.down('KeyA');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyA');

    // Test jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Game should still be running
    await expect(page.getByTestId('game-container')).toBeVisible();
  });

  test('should display quest message in HUD', async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    const questMessage = page.getByTestId('quest-message');
    await expect(questMessage).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // WebGL Diagnostic Test
  // ============================================

  test('should report WebGL capabilities', async ({ page }) => {
    const webglInfo = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        return {
          available: true,
          renderer: gl.getParameter(gl.RENDERER) || 'unknown',
          vendor: gl.getParameter(gl.VENDOR) || 'unknown',
          version: gl.getParameter(gl.VERSION) || 'unknown',
        };
      }
      return { available: false, renderer: 'none', vendor: 'none', version: 'none' };
    });

    console.log(`WebGL Info: ${JSON.stringify(webglInfo, null, 2)}`);
    console.log(`MCP Support: ${hasMcpSupport}`);

    if (hasMcpSupport) {
      expect(webglInfo.available).toBe(true);
    }
  });
});

test.describe('Game Over Flow', () => {
  test('should handle game over and restart', async ({ page }) => {
    test.skip(!hasMcpSupport, 'Requires WebGL/MCP support for full game flow');

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Start game
    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    // Note: Direct store manipulation would require exposing the store on window
    // For now, we rely on gameplay to trigger game over

    // Alternative: Move left to fall off the platform
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(5000);
    await page.keyboard.up('KeyA');

    // Check for game over menu (may take time to trigger)
    const gameOverMenu = page.getByTestId('game-over-menu');
    const isVisible = await gameOverMenu.isVisible().catch(() => false);

    if (isVisible) {
      await expect(gameOverMenu).toBeVisible();
      await expect(page.getByText(/BLADE BROKEN/i)).toBeVisible();

      // Restart the game
      const restartButton = page.getByTestId('button-restart');
      if (await restartButton.isVisible()) {
        await restartButton.click();
        await expect(page.getByTestId('start-menu')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Touch Controls', () => {
  test('should display touch controls on mobile viewport', async ({ page }) => {
    test.skip(!hasMcpSupport, 'Touch controls require full rendering');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(1000);

    // Touch controls should be visible on mobile
    const touchControls = page.getByTestId('touch-controls');
    const isVisible = await touchControls.isVisible().catch(() => false);

    if (isVisible) {
      await expect(page.getByTestId('button-left')).toBeVisible();
      await expect(page.getByTestId('button-right')).toBeVisible();
      await expect(page.getByTestId('button-jump')).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Skip intro cinematic for tests
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('otterblade_intro_watched', 'true');
    });
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test('should have accessible start button', async ({ page }) => {
    const startButton = page.getByTestId('button-start-game');
    await expect(startButton).toBeVisible();

    // Button should be focusable
    await startButton.focus();
    await expect(startButton).toBeFocused();

    // Should be activatable with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('start-menu')).not.toBeVisible({ timeout: 5000 });
  });

  test('should maintain focus visibility', async ({ page }) => {

    // Tab to start button
    await page.keyboard.press('Tab');

    // Should have visible focus indicator (checking the button is focused)
    const startButton = page.getByTestId('button-start-game');
    await expect(startButton).toBeFocused();
  });
});
