import { test, expect } from "@playwright/test";

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

const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

test.describe("Otterblade Odyssey", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    await page.goto("/");
  });

  test("should load the page with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Otterblade Odyssey/);

    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("should have correct meta tags", async ({ page }) => {
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toContain("Otterblade");
  });

  test("should have localStorage available", async ({ page }) => {
    const localStorageWorks = await page.evaluate(() => {
      try {
        const key = "otterblade-odyssey-test";
        localStorage.setItem(key, "test-value");
        const result = localStorage.getItem(key) === "test-value";
        localStorage.removeItem(key);
        return result;
      } catch {
        return false;
      }
    });

    expect(localStorageWorks).toBe(true);
  });

  test("should render canvas element", async ({ page }) => {
    await page.waitForTimeout(hasMcpSupport ? 3000 : 2500);

    const canvas = page.locator("canvas");
    const canvasCount = await canvas.count();

    if (hasMcpSupport) {
      await expect(canvas).toBeVisible({ timeout: 15000 });
      expect(canvasCount).toBeGreaterThan(0);
    } else {
      console.log(`Canvas elements found: ${canvasCount}`);
      const root = page.locator("#root");
      await expect(root).toBeVisible();
    }
  });

  test("should display HUD elements", async ({ page }) => {
    test.skip(!hasMcpSupport, "Requires WebGL/MCP support");

    await page.waitForTimeout(3000);

    const hud = page.locator('[data-testid="hud-container"]');
    await expect(hud).toBeVisible({ timeout: 15000 });
  });

  test("should display touch controls on mobile", async ({ page }) => {
    test.skip(!hasMcpSupport, "Requires WebGL/MCP support");

    await page.waitForTimeout(3000);

    const touchControls = page.locator('[data-testid="touch-controls"]');
    await expect(touchControls).toBeVisible({ timeout: 10000 });
  });

  test("should report WebGL capabilities", async ({ page }) => {
    const webglInfo = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl) {
        return {
          available: true,
          renderer: gl.getParameter(gl.RENDERER) || "unknown",
          vendor: gl.getParameter(gl.VENDOR) || "unknown",
          version: gl.getParameter(gl.VERSION) || "unknown",
        };
      }
      return {
        available: false,
        renderer: "none",
        vendor: "none",
        version: "none",
      };
    });

    console.log(`WebGL Info: ${JSON.stringify(webglInfo, null, 2)}`);
    console.log(`MCP Support: ${hasMcpSupport}`);

    if (hasMcpSupport) {
      expect(webglInfo.available).toBe(true);
    }
  });
});

test.describe("Visual Regression", () => {
  test.skip(!hasMcpSupport, "Visual tests require MCP/GPU support");

  test("should render game scene correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveScreenshot("game-scene.png", {
      maxDiffPixelRatio: 0.2,
    });
  });

  test("should render HUD correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(5000);

    const hud = page.locator('[data-testid="hud-container"]');
    await expect(hud).toBeVisible({ timeout: 15000 });

    await expect(hud).toHaveScreenshot("hud.png", {
      maxDiffPixelRatio: 0.1,
    });
  });
});
