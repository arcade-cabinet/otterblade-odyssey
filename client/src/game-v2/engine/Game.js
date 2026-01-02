/**
 * Main Game class - Heart of the engine
 */

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { InputManager } from './Input.js';
import { Player } from '../entities/Player.js';
import { store } from '../state/store.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.physics = new Physics();
    this.input = new InputManager();
    
    this.entities = [];
    this.player = null;
    this.currentChapter = 0;
    this.biome = 'forest';
    
    this.frame = 0;
    this.lastTime = 0;
    this.running = false;
    
    this.dt = 16.67; // Target 60fps
  }

  async init() {
    // Load saved state
    store.load();
    
    // Create player
    this.player = new Player(200, 300);
    this.entities.push(this.player);
    
    console.log('🎮 Game initialized');
  }

  async loadChapter(chapterId) {
    console.log(`📜 Loading Chapter ${chapterId}...`);
    
    // Clear existing entities except player
    this.entities = this.entities.filter(e => e === this.player);
    
    // Would load from DDL here
    // For now: simple test platforms
    this.createTestLevel();
    
    this.currentChapter = chapterId;
    store.set({ currentChapter: chapterId });
    
    console.log(`✅ Chapter ${chapterId} loaded`);
  }

  createTestLevel() {
    // Temporary test platforms
    const platforms = [
      { x: 0, y: 450, width: 1200, height: 50, solid: true, width: 30, height: 30 },
      { x: 300, y: 350, width: 150, height: 20, solid: true, width: 30, height: 20 },
      { x: 550, y: 300, width: 150, height: 20, solid: true, width: 30, height: 20 },
      { x: 800, y: 250, width: 150, height: 20, solid: true, width: 30, height: 20 },
    ];
    
    platforms.forEach(p => this.entities.push(p));
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
    console.log('▶️ Game started');
  }

  stop() {
    this.running = false;
    console.log('⏸️ Game stopped');
  }

  update(dt) {
    // Update input
    const commands = this.input.getCommands();
    
    // Update player
    if (this.player) {
      this.player.handleInput(commands);
      this.player.update(dt);
    }

    // Update physics
    this.physics.update(this.entities, 1);
    
    // Update camera to follow player
    if (this.player) {
      this.renderer.setCamera(this.player.x, this.player.y - 100);
    }

    // Check win condition (reached right edge)
    if (this.player && this.player.x > 1000) {
      console.log('🏆 Chapter complete!');
      // Would transition to next chapter
    }
  }

  render() {
    // Draw background
    const scrollX = this.player ? this.player.x : 0;
    this.renderer.drawBackground(this.biome, scrollX);
    
    // Draw platforms
    this.entities.forEach(entity => {
      if (entity.solid) {
        this.renderer.drawPlatform(entity);
      }
    });
    
    // Draw player
    if (this.player) {
      this.renderer.drawPlayer(this.player, this.frame);
    }
    
    this.frame++;
  }

  gameLoop(timestamp = 0) {
    if (!this.running) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (dt < 100) { // Cap delta to prevent spiral of death
      this.update(dt);
      this.render();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // Export API for Playwright testing
  getAPI() {
    return {
      getPlayer: () => this.player,
      getState: () => ({
        chapter: this.currentChapter,
        health: this.player?.health || 0,
        position: { x: this.player?.x || 0, y: this.player?.y || 0 }
      }),
      loadChapter: (id) => this.loadChapter(id),
      isChapterComplete: () => this.player && this.player.x > 1000
    };
  }
}
