/**
 * Debug/Diagnostics System
 * 
 * Provides comprehensive debugging tools for isolated system testing.
 * Allows testing ANY game system independently without playing through the game.
 * 
 * Features:
 * - Entity spawner for all game elements
 * - Visual debugging (colliders, paths, states)
 * - Performance monitoring
 * - System isolation modes
 * - Screenshot-friendly test scenarios
 * 
 * @module debug/DebugSystem
 */

export class DebugSystem {
  constructor(game) {
    this.game = game;
    this.enabled = this.isDevMode();
    this.overlayVisible = false;
    this.collidersVisible = false;
    this.aiVisualsVisible = false;
    this.triggersVisible = false;
    this.performanceVisible = false;
    this.currentTestEntity = 0;
    this.testEntities = [
      'finn',
      'galeborn-scout',
      'galeborn-warrior',
      'galeborn-boss',
      'npc-elder',
      'shard',
      'health-pickup',
      'platform-stone',
      'hazard-spikes',
      'particle-spark'
    ];
    
    if (this.enabled) {
      this.setupKeyboardShortcuts();
      console.log('[Debug] Debug system enabled. Press F1 for help.');
    }
  }

  /**
   * Check if running in development mode
   */
  isDevMode() {
    return import.meta.env?.DEV || 
           import.meta.env?.MODE === 'development' ||
           window.location.hostname === 'localhost';
  }

  /**
   * Setup keyboard shortcuts for debug commands
   */
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          this.toggleOverlay();
          break;
        case 'F2':
          e.preventDefault();
          this.toggleColliders();
          break;
        case 'F3':
          e.preventDefault();
          this.cycleTestEntity();
          break;
        case 'F4':
          e.preventDefault();
          this.spawnTestEntity();
          break;
        case 'F5':
          e.preventDefault();
          this.teleportPlayerToCursor();
          break;
        case 'F6':
          e.preventDefault();
          this.toggleAIVisuals();
          break;
        case 'F7':
          e.preventDefault();
          this.toggleTriggers();
          break;
        case 'F8':
          e.preventDefault();
          this.togglePerformanceStats();
          break;
        case 'F9':
          e.preventDefault();
          this.cycleWeather();
          break;
        case 'F10':
          e.preventDefault();
          this.toggleMinimap();
          break;
      }
    });
  }

  /**
   * Toggle debug overlay
   */
  toggleOverlay() {
    this.overlayVisible = !this.overlayVisible;
    console.log(`[Debug] Overlay ${this.overlayVisible ? 'ON' : 'OFF'}`);
    
    if (this.overlayVisible) {
      this.showHelp();
    }
  }

  /**
   * Show help text
   */
  showHelp() {
    const help = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    OTTERBLADE ODYSSEY - DEBUG SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEYBOARD SHORTCUTS:
  F1  - Toggle debug overlay
  F2  - Show/hide colliders
  F3  - Cycle through test entities
  F4  - Spawn current test entity
  F5  - Teleport player to cursor
  F6  - Toggle AI visualization
  F7  - Toggle trigger zones
  F8  - Toggle performance stats
  F9  - Cycle weather effects
  F10 - Toggle minimap

TEST ENTITIES:
${this.testEntities.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}

CURRENT: ${this.testEntities[this.currentTestEntity]}

SYSTEM TEST MODES:
  debugSystem.testRendering() - Test rendering only
  debugSystem.testAI() - Test AI only
  debugSystem.testPhysics() - Test physics only
  debugSystem.testCombat() - Test combat only
  debugSystem.testUI() - Test UI only

ENTITY SPAWNERS:
  debugSystem.spawnFinn(x, y) - Spawn Finn
  debugSystem.spawnEnemy(type, x, y) - Spawn enemy
  debugSystem.spawnNPC(id, x, y) - Spawn NPC
  debugSystem.spawnCollectible(type, x, y) - Spawn item
  debugSystem.spawnPlatform(x, y, w, h) - Spawn platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    console.log(help);
  }

  /**
   * Toggle collider visualization
   */
  toggleColliders() {
    this.collidersVisible = !this.collidersVisible;
    console.log(`[Debug] Colliders ${this.collidersVisible ? 'ON' : 'OFF'}`);
  }

  /**
   * Toggle AI visualization
   */
  toggleAIVisuals() {
    this.aiVisualsVisible = !this.aiVisualsVisible;
    console.log(`[Debug] AI Visuals ${this.aiVisualsVisible ? 'ON' : 'OFF'}`);
  }

  /**
   * Toggle trigger zones
   */
  toggleTriggers() {
    this.triggersVisible = !this.triggersVisible;
    console.log(`[Debug] Triggers ${this.triggersVisible ? 'ON' : 'OFF'}`);
  }

  /**
   * Toggle performance stats
   */
  togglePerformanceStats() {
    this.performanceVisible = !this.performanceVisible;
    console.log(`[Debug] Performance ${this.performanceVisible ? 'ON' : 'OFF'}`);
  }

  /**
   * Cycle through test entities
   */
  cycleTestEntity() {
    this.currentTestEntity = (this.currentTestEntity + 1) % this.testEntities.length;
    const entity = this.testEntities[this.currentTestEntity];
    console.log(`[Debug] Test Entity: ${entity}`);
  }

  /**
   * Spawn current test entity at cursor or center
   */
  spawnTestEntity() {
    const entity = this.testEntities[this.currentTestEntity];
    const x = this.game.mouseX || 400;
    const y = this.game.mouseY || 300;
    
    console.log(`[Debug] Spawning ${entity} at (${x}, ${y})`);
    
    // Route to appropriate spawner
    if (entity === 'finn') {
      this.spawnFinn(x, y);
    } else if (entity.startsWith('galeborn')) {
      const type = entity.replace('galeborn-', '');
      this.spawnEnemy(type, x, y);
    } else if (entity.startsWith('npc')) {
      this.spawnNPC(entity, x, y);
    } else if (entity === 'shard' || entity === 'health-pickup') {
      this.spawnCollectible(entity, x, y);
    } else if (entity.startsWith('platform')) {
      this.spawnPlatform(x, y, 100, 20);
    } else if (entity.startsWith('hazard')) {
      this.spawnHazard(entity, x, y);
    } else if (entity.startsWith('particle')) {
      this.spawnParticles(entity, x, y);
    }
  }

  /**
   * Teleport player to cursor position
   */
  teleportPlayerToCursor() {
    if (!this.game.player) {
      console.log('[Debug] No player to teleport');
      return;
    }
    
    const x = this.game.mouseX || 400;
    const y = this.game.mouseY || 300;
    
    // Use Matter.js Body.setPosition
    if (this.game.Matter && this.game.player.body) {
      this.game.Matter.Body.setPosition(this.game.player.body, { x, y });
      console.log(`[Debug] Teleported player to (${x}, ${y})`);
    }
  }

  /**
   * Cycle weather effects
   */
  cycleWeather() {
    const weathers = ['none', 'rain', 'snow', 'storm'];
    const current = this.game.weather || 'none';
    const index = weathers.indexOf(current);
    const next = weathers[(index + 1) % weathers.length];
    
    this.game.weather = next;
    console.log(`[Debug] Weather: ${next}`);
  }

  /**
   * Toggle minimap
   */
  toggleMinimap() {
    this.game.minimapVisible = !this.game.minimapVisible;
    console.log(`[Debug] Minimap ${this.game.minimapVisible ? 'ON' : 'OFF'}`);
  }

  // ==================== ENTITY SPAWNERS ====================

  /**
   * Spawn Finn (player character) for testing
   */
  spawnFinn(x, y) {
    console.log(`[Debug] spawnFinn(${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn enemy for testing
   */
  spawnEnemy(type, x, y) {
    console.log(`[Debug] spawnEnemy(${type}, ${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn NPC for testing
   */
  spawnNPC(id, x, y) {
    console.log(`[Debug] spawnNPC(${id}, ${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn collectible for testing
   */
  spawnCollectible(type, x, y) {
    console.log(`[Debug] spawnCollectible(${type}, ${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn platform for testing
   */
  spawnPlatform(x, y, width, height) {
    console.log(`[Debug] spawnPlatform(${x}, ${y}, ${width}, ${height}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn hazard for testing
   */
  spawnHazard(type, x, y) {
    console.log(`[Debug] spawnHazard(${type}, ${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  /**
   * Spawn particles for testing
   */
  spawnParticles(type, x, y) {
    console.log(`[Debug] spawnParticles(${type}, ${x}, ${y}) - TODO: Implement`);
    // Will be implemented when integrated with game-monolith
  }

  // ==================== TEST MODES ====================

  /**
   * Test rendering system only
   */
  testRendering() {
    console.log('[Debug] Entering RENDERING TEST MODE');
    this.game.testMode = 'rendering';
    this.game.physics = false;
    this.game.ai = false;
    this.game.audio = false;
  }

  /**
   * Test AI system only
   */
  testAI() {
    console.log('[Debug] Entering AI TEST MODE');
    this.game.testMode = 'ai';
    this.aiVisualsVisible = true;
    this.game.physics = true;
    this.game.rendering = false;
  }

  /**
   * Test physics system only
   */
  testPhysics() {
    console.log('[Debug] Entering PHYSICS TEST MODE');
    this.game.testMode = 'physics';
    this.collidersVisible = true;
    this.game.rendering = false;
    this.game.ai = false;
  }

  /**
   * Test combat system only
   */
  testCombat() {
    console.log('[Debug] Entering COMBAT TEST MODE');
    this.game.testMode = 'combat';
    this.collidersVisible = true;
    this.game.physics = true;
    this.game.ai = true;
  }

  /**
   * Test UI system only
   */
  testUI() {
    console.log('[Debug] Entering UI TEST MODE');
    this.game.testMode = 'ui';
    this.game.physics = false;
    this.game.ai = false;
    this.game.rendering = false;
  }

  // ==================== RENDERING ====================

  /**
   * Render debug overlay
   */
  render(ctx) {
    if (!this.enabled) return;

    // Render colliders
    if (this.collidersVisible) {
      this.renderColliders(ctx);
    }

    // Render AI visuals
    if (this.aiVisualsVisible) {
      this.renderAIVisuals(ctx);
    }

    // Render triggers
    if (this.triggersVisible) {
      this.renderTriggers(ctx);
    }

    // Render performance stats
    if (this.performanceVisible) {
      this.renderPerformanceStats(ctx);
    }

    // Render overlay
    if (this.overlayVisible) {
      this.renderOverlay(ctx);
    }
  }

  /**
   * Render colliders
   */
  renderColliders(ctx) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // Will draw all physics bodies when integrated
  }

  /**
   * Render AI visuals
   */
  renderAIVisuals(ctx) {
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1;
    
    // Will draw AI paths and states when integrated
  }

  /**
   * Render trigger zones
   */
  renderTriggers(ctx) {
    ctx.strokeStyle = '#ffff00';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.lineWidth = 2;
    
    // Will draw trigger zones when integrated
  }

  /**
   * Render performance stats
   */
  renderPerformanceStats(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${Math.round(this.game.fps || 60)}`, 20, 30);
    ctx.fillText(`Entities: ${this.game.entityCount || 0}`, 20, 50);
    ctx.fillText(`Memory: ${(performance.memory?.usedJSHeapSize / 1048576).toFixed(1)}MB`, 20, 70);
  }

  /**
   * Render debug overlay
   */
  renderOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 300, 150);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.fillText('DEBUG MODE - Press F1 for help', 10, 30);
    ctx.fillText(`Test Entity: ${this.testEntities[this.currentTestEntity]}`, 10, 50);
    ctx.fillText(`Colliders: ${this.collidersVisible ? 'ON' : 'OFF'}`, 10, 70);
    ctx.fillText(`AI Visuals: ${this.aiVisualsVisible ? 'ON' : 'OFF'}`, 10, 90);
    ctx.fillText(`Triggers: ${this.triggersVisible ? 'ON' : 'OFF'}`, 10, 110);
    ctx.fillText(`Performance: ${this.performanceVisible ? 'ON' : 'OFF'}`, 10, 130);
  }
}
