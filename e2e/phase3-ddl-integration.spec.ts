/**
 * Phase 3: DDL Integration - Comprehensive Screenshot Capture
 * 
 * Uses Playwright MCP + Debug System to capture ALL game elements:
 * - Player character (Finn) in all states
 * - All enemy types (scout, warrior, boss)
 * - All NPCs with dialogue
 * - Backgrounds and environments
 * - UI elements (health, warmth, shards, menus)
 * - Particles and effects
 * - Platforms and level geometry
 * - Interactive elements (doors, levers, switches)
 * 
 * Evidence for Phase 3 completion.
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 3: DDL Integration - Visual Evidence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game
    await page.goto('http://localhost:4321');
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // Wait for DDL preload to complete
    await page.waitForFunction(() => {
      const logs = performance.getEntriesByType('mark');
      return logs.some(log => log.name.includes('DDL') && log.name.includes('complete'));
    }, { timeout: 30000 });
    
    // Start game
    await page.click('button:has-text("Begin Journey")');
    
    // Wait for game to initialize
    await page.waitForTimeout(3000);
    
    // Enable debug mode
    await page.keyboard.press('F1');
    await page.waitForTimeout(500);
  });

  test('Capture Start Screen with Manifests Loaded', async ({ page }) => {
    // Reload to capture start screen
    await page.goto('http://localhost:4321');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Capture start screen
    await page.screenshot({
      path: 'evidence/phase3-01-start-screen.png',
      fullPage: false
    });
    
    // Verify console shows DDL preload
    const logs = await page.evaluate(() => {
      return window.__gameLogs || [];
    });
    
    expect(logs.some(log => log.includes('[DDL]'))).toBeTruthy();
  });

  test('Capture Finn (Player) in Multiple States', async ({ page }) => {
    // Cycle to Finn entity
    for (let i = 0; i < 1; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(200);
    }
    
    // Spawn Finn in center
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    
    // Capture: Finn idle
    await page.screenshot({
      path: 'evidence/phase3-02-finn-idle.png',
      fullPage: false
    });
    
    // Move Finn right (simulate input)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    
    // Capture: Finn running
    await page.screenshot({
      path: 'evidence/phase3-03-finn-running.png',
      fullPage: false
    });
    
    // Jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    
    // Capture: Finn jumping
    await page.screenshot({
      path: 'evidence/phase3-04-finn-jumping.png',
      fullPage: false
    });
    
    // Attack
    await page.keyboard.press('x');
    await page.waitForTimeout(200);
    
    // Capture: Finn attacking
    await page.screenshot({
      path: 'evidence/phase3-05-finn-attacking.png',
      fullPage: false
    });
  });

  test('Capture All Enemy Types', async ({ page }) => {
    // Enable collider visualization
    await page.keyboard.press('F2');
    await page.keyboard.press('F6'); // AI visuals
    
    // Galeborn Scout
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-06-enemy-scout.png',
      fullPage: false
    });
    
    // Galeborn Warrior
    await page.keyboard.press('F3');
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-07-enemy-warrior.png',
      fullPage: false
    });
    
    // Galeborn Boss
    await page.keyboard.press('F3');
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-08-enemy-boss.png',
      fullPage: false
    });
  });

  test('Capture NPCs and Dialogue', async ({ page }) => {
    // Spawn NPC
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    
    // Capture NPC
    await page.screenshot({
      path: 'evidence/phase3-09-npc-elder.png',
      fullPage: false
    });
    
    // Interact with NPC (if interaction system works)
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    // Capture dialogue
    await page.screenshot({
      path: 'evidence/phase3-10-npc-dialogue.png',
      fullPage: false
    });
  });

  test('Capture Collectibles', async ({ page }) => {
    // Shard
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-11-collectible-shard.png',
      fullPage: false
    });
    
    // Health pickup
    await page.keyboard.press('F3');
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-12-collectible-health.png',
      fullPage: false
    });
  });

  test('Capture Platforms and Level Geometry', async ({ page }) => {
    // Enable colliders
    await page.keyboard.press('F2');
    
    // Stone platform
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-13-platform-stone.png',
      fullPage: false
    });
  });

  test('Capture Hazards', async ({ page }) => {
    // Enable colliders and triggers
    await page.keyboard.press('F2');
    await page.keyboard.press('F7');
    
    // Spikes
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-14-hazard-spikes.png',
      fullPage: false
    });
  });

  test('Capture Particle Effects', async ({ page }) => {
    // Particle spark
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('F3');
      await page.waitForTimeout(100);
    }
    
    // Spawn multiple particles
    for (let j = 0; j < 5; j++) {
      await page.keyboard.press('F4');
      await page.waitForTimeout(200);
    }
    
    await page.screenshot({
      path: 'evidence/phase3-15-particles.png',
      fullPage: false
    });
  });

  test('Capture UI Elements', async ({ page }) => {
    // Toggle performance stats
    await page.keyboard.press('F8');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'evidence/phase3-16-ui-hud.png',
      fullPage: false
    });
    
    // Toggle minimap
    await page.keyboard.press('F10');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'evidence/phase3-17-ui-minimap.png',
      fullPage: false
    });
  });

  test('Capture Weather Effects', async ({ page }) => {
    // Cycle through weather
    await page.keyboard.press('F9'); // Rain
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-18-weather-rain.png',
      fullPage: false
    });
    
    await page.keyboard.press('F9'); // Snow
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-19-weather-snow.png',
      fullPage: false
    });
    
    await page.keyboard.press('F9'); // Storm
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'evidence/phase3-20-weather-storm.png',
      fullPage: false
    });
  });

  test('Capture Background Layers', async ({ page }) => {
    // Capture full scene with parallax
    await page.screenshot({
      path: 'evidence/phase3-21-background-layers.png',
      fullPage: false
    });
  });

  test('Capture Debug Overlay', async ({ page }) => {
    // Show all debug features
    await page.keyboard.press('F1'); // Overlay
    await page.keyboard.press('F2'); // Colliders
    await page.keyboard.press('F6'); // AI visuals
    await page.keyboard.press('F7'); // Triggers
    await page.keyboard.press('F8'); // Performance
    
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'evidence/phase3-22-debug-overlay.png',
      fullPage: false
    });
  });

  test('Capture Complete Game Scene', async ({ page }) => {
    // Spawn a full scene with multiple elements
    
    // Finn
    await page.keyboard.press('F3'); // Cycle to Finn
    await page.keyboard.press('F4'); // Spawn
    await page.waitForTimeout(500);
    
    // Enemy
    await page.keyboard.press('F3');
    await page.keyboard.press('F3');
    await page.keyboard.press('F4');
    await page.waitForTimeout(500);
    
    // NPC
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('F3');
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(500);
    
    // Platforms
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('F3');
    }
    await page.keyboard.press('F4');
    await page.waitForTimeout(500);
    
    // Enable weather
    await page.keyboard.press('F9');
    await page.waitForTimeout(1000);
    
    // Capture complete scene
    await page.screenshot({
      path: 'evidence/phase3-23-complete-scene.png',
      fullPage: false
    });
  });
});

test.describe('Phase 3: DDL Integration - System Validation', () => {
  test('Validate DDL Loader Integration', async ({ page }) => {
    await page.goto('http://localhost:4321');
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // Check that DDL loader is accessible
    const ddlLoaded = await page.evaluate(() => {
      return typeof window.__ddlLoader !== 'undefined';
    });
    
    expect(ddlLoaded).toBeTruthy();
    
    // Verify all manifests loaded
    const manifestCount = await page.evaluate(() => {
      return window.__ddlLoader?.cacheSize || 0;
    });
    
    expect(manifestCount).toBeGreaterThanOrEqual(19);
  });

  test('Validate Factory Integration', async ({ page }) => {
    await page.goto('http://localhost:4321');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.click('button:has-text("Begin Journey")');
    await page.waitForTimeout(3000);
    
    // Check that factories used DDL
    const factoryLogs = await page.evaluate(() => {
      const logs = window.__gameLogs || [];
      return logs.filter(log => log.includes('[Factory]') || log.includes('[Level]'));
    });
    
    expect(factoryLogs.length).toBeGreaterThan(0);
  });

  test('Validate Debug System', async ({ page }) => {
    await page.goto('http://localhost:4321');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.click('button:has-text("Begin Journey")');
    await page.waitForTimeout(2000);
    
    // Enable debug
    await page.keyboard.press('F1');
    await page.waitForTimeout(500);
    
    // Check debug system is active
    const debugActive = await page.evaluate(() => {
      return window.__debugSystem?.enabled === true;
    });
    
    expect(debugActive).toBeTruthy();
  });
});
