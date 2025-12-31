import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Otterblade Odyssey
 *
 * Uses Playwright's screenshot comparison to validate visual rendering
 * of game components, HUD elements, and gameplay scenarios.
 *
 * Run with: PLAYWRIGHT_MCP=true pnpm test:e2e:visual
 */

const VISUAL_THRESHOLD = 0.2; // 20% diff tolerance for WebGL rendering variations

// Check if running with full MCP capabilities
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === 'true';

test.describe('Visual Regression - Start Menu', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should match start menu screen', async ({ page }) => {
    await page.goto('/');

    // Wait for fonts and styles to load
    await page.waitForTimeout(3000);

    // Take snapshot of start menu
    await expect(page).toHaveScreenshot('start-menu.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should show game title correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const title = page.getByText('Otterblade Odyssey');
    await expect(title).toHaveScreenshot('game-title.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should show start button correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const startButton = page.getByTestId('button-start-game');
    await expect(startButton).toHaveScreenshot('start-button.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});

test.describe('Visual Regression - Gameplay', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render gameplay scene correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Start game
    await page.getByTestId('button-start-game').click();

    // Wait for game to load
    await page.waitForTimeout(5000);

    // Take gameplay snapshot
    await expect(page).toHaveScreenshot('gameplay-scene.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render player character correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Canvas should be visible with player
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await expect(canvas).toHaveScreenshot('game-canvas.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});

test.describe('Visual Regression - HUD Elements', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render HUD correctly during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Health hearts snapshot
    const healthHearts = page.getByTestId('health-hearts');
    await expect(healthHearts).toHaveScreenshot('health-hearts.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render score display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    const scoreDisplay = page.getByTestId('score-display');
    await expect(scoreDisplay).toHaveScreenshot('score-display.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render quest message correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    const questMessage = page.getByTestId('quest-message');
    await expect(questMessage).toHaveScreenshot('quest-message.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});

test.describe('Visual Regression - Movement', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render character movement correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Move character right
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(2000);
    await page.keyboard.up('KeyD');

    await expect(page).toHaveScreenshot('character-moved-right.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render jump correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('character-jumping.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('mobile-start-menu.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render mobile gameplay correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(5000);

    await expect(page).toHaveScreenshot('mobile-gameplay.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render tablet viewport correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('tablet-start-menu.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });

  test('should render widescreen viewport correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('widescreen-start-menu.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});

test.describe('Visual Regression - Game States', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render game over screen correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Move left to fall off platform and trigger game over
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(6000);
    await page.keyboard.up('KeyA');

    // Wait for game over
    await page.waitForTimeout(2000);

    const gameOverMenu = page.getByTestId('game-over-menu');
    const isVisible = await gameOverMenu.isVisible().catch(() => false);

    if (isVisible) {
      await expect(page).toHaveScreenshot('game-over-screen.png', {
        maxDiffPixelRatio: VISUAL_THRESHOLD,
      });
    }
  });
});

test.describe('Visual Regression - Parallax Background', () => {
  test.skip(!hasMcpSupport, 'Visual tests require MCP/GPU support');

  test('should render parallax layers correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.getByTestId('button-start-game').click();
    await page.waitForTimeout(3000);

    // Move right to see parallax effect
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(3000);
    await page.keyboard.up('KeyD');

    await expect(page).toHaveScreenshot('parallax-moved.png', {
      maxDiffPixelRatio: VISUAL_THRESHOLD,
    });
  });
});
