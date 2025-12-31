import { test, expect } from "@playwright/test";

test.describe("Otterblade Odyssey Game", () => {
  test("should display start menu and begin game", async ({ page }) => {
    await page.goto("/");
    
    // Check for start menu
    await expect(page.getByTestId("start-menu")).toBeVisible();
    await expect(page.getByText("Otterblade Odyssey")).toBeVisible();
    
    // Start the game
    await page.getByTestId("button-start-game").click();
    
    // Menu should disappear
    await expect(page.getByTestId("start-menu")).not.toBeVisible();
    
    // Game container should be visible
    await expect(page.getByTestId("game-container")).toBeVisible();
  });

  test("should display HUD during gameplay", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("button-start-game").click();
    
    // Wait for game to load
    await page.waitForTimeout(1000);
    
    // HUD elements should be visible
    await expect(page.getByText(/Score:/)).toBeVisible();
    await expect(page.getByText(/HP:/)).toBeVisible();
    await expect(page.getByText(/Shards:/)).toBeVisible();
    await expect(page.getByText(/Distance:/)).toBeVisible();
    await expect(page.getByText(/Biome:/)).toBeVisible();
  });

  test("should respond to keyboard controls", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("button-start-game").click();
    
    await page.waitForTimeout(1000);
    
    // Simulate jump
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    
    // Simulate movement
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyD");
    
    // Game should still be running
    await expect(page.getByTestId("game-container")).toBeVisible();
  });

  test("should show game over menu when player dies", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("button-start-game").click();
    
    await page.waitForTimeout(1000);
    
    // Move left to fall off platform
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(3000);
    await page.keyboard.up("KeyA");
    
    // Game over menu should appear
    await expect(page.getByTestId("game-over-menu")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("BLADE BROKEN")).toBeVisible();
  });

  test("should restart game from game over", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("button-start-game").click();
    await page.waitForTimeout(1000);
    
    // Force game over by falling
    await page.keyboard.down("KeyA");
    await page.waitForTimeout(3000);
    await page.keyboard.up("KeyA");
    
    await expect(page.getByTestId("game-over-menu")).toBeVisible({ timeout: 10000 });
    
    // Restart game
    await page.getByTestId("button-restart").click();
    
    // Should be back at start menu
    await expect(page.getByTestId("start-menu")).toBeVisible();
  });

  test("should display touch controls on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByTestId("button-start-game").click();
    
    await page.waitForTimeout(1000);
    
    // Touch controls should be visible
    await expect(page.getByTestId("button-left")).toBeVisible();
    await expect(page.getByTestId("button-right")).toBeVisible();
    await expect(page.getByTestId("button-jump")).toBeVisible();
    await expect(page.getByTestId("button-attack")).toBeVisible();
  });
});
