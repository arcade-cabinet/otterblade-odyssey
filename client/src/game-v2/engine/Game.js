/**
 * Main Game class - Heart of the engine
 */

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { InputManager } from './Input.js';
import { Player } from '../entities/Player.js';
import { store } from '../state/store.js';
import { ManifestLoader } from '../ddl/loader.js';
import { LevelBuilder } from '../ddl/builder.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.physics = new Physics();
    this.input = new InputManager();
    this.manifestLoader = new ManifestLoader();
    
    this.entities = [];
    this.player = null;
    this.currentChapter = 0;
    this.currentManifest = null;
    this.biome = 'forest';
    this.exitPoint = null;
    
    this.frame = 0;
    this.lastTime = 0;
    this.running = false;
  }

  async init() {
    // Load saved state
    store.load();
    
    // Pre-load all chapter manifests
    await this.manifestLoader.loadAllChapters();
    
    // Create player
    this.player = new Player(200, 300);
    this.entities.push(this.player);
    
    console.log('🎮 Game initialized');
  }

  async loadChapter(chapterId) {
    console.log(`📜 Loading Chapter ${chapterId}...`);
    
    // Clear existing entities except player
    this.entities = [this.player];
    
    // Load manifest from DDL
    this.currentManifest = await this.manifestLoader.loadChapter(chapterId);
    
    // Build level from manifest
    const level = LevelBuilder.build(this.currentManifest, this.player);
    this.entities.push(...level.entities);
    this.biome = level.biome;
    this.exitPoint = level.exitPoint;
    
    // Update store
    this.currentChapter = chapterId;
    store.set({ 
      currentChapter: chapterId,
      currentQuest: level.quest,
      currentLocation: level.name
    });
    
    console.log(`✅ Chapter ${chapterId} loaded: ${level.name}`);
    console.log(`🎯 Quest: ${level.quest}`);
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

    // Update enemies
    this.entities.forEach(entity => {
      if (entity.update && entity !== this.player) {
        entity.update(dt, this.player);
      }
    });

    // Update physics
    this.physics.update(this.entities, 1);
    
    // Check combat (player attacking enemies)
    if (this.player && this.player.state === 'attacking') {
      this.checkCombat();
    }

    // Check collectibles
    this.checkCollectibles();

    // Remove dead entities
    this.entities = this.entities.filter(e => !e.dead && !e.collected);
    
    // Update camera to follow player
    if (this.player) {
      this.renderer.setCamera(this.player.x, this.player.y - 100);
    }

    // Check exit (reached portal)
    if (this.player && this.exitPoint) {
      const dx = Math.abs(this.player.x - this.exitPoint.x);
      const dy = Math.abs(this.player.y - this.exitPoint.y);
      
      if (dx < 50 && dy < 50) {
        this.completeChapter();
      }
    }

    // Check game over
    if (this.player && this.player.health <= 0) {
      this.gameOver();
    }
  }

  checkCombat() {
    this.entities.forEach(entity => {
      if (!entity.health || entity === this.player) return;
      
      const dx = Math.abs(this.player.x - entity.x);
      const dy = Math.abs(this.player.y - entity.y);
      
      // Player's sword reach
      if (dx < 60 && dy < 40) {
        entity.takeDamage(1);
      }
    });
  }

  checkCollectibles() {
    this.entities.forEach(entity => {
      if (!entity.collect) return;
      
      const dx = Math.abs(this.player.x - entity.x);
      const dy = Math.abs(this.player.y - entity.y);
      
      if (dx < 30 && dy < 30) {
        entity.collect(this.player);
      }
    });
  }

  completeChapter() {
    console.log('🏆 Chapter complete!');
    
    const nextChapter = this.currentChapter + 1;
    
    if (nextChapter < 10) {
      console.log(`➡️ Moving to Chapter ${nextChapter}`);
      this.loadChapter(nextChapter);
    } else {
      console.log('🎉 GAME COMPLETE! Victory!');
      this.victory();
    }
  }

  gameOver() {
    console.log('💀 Game Over');
    this.stop();
    // Would show game over screen
  }

  victory() {
    console.log('🎊 VICTORY! All chapters complete!');
    this.stop();
    // Would show victory screen
  }

  render() {
    // Draw background
    const scrollX = this.player ? this.player.x : 0;
    this.renderer.drawBackground(this.biome, scrollX);
    
    // Draw platforms
    this.entities.forEach(entity => {
      if (entity.solid && !entity.isExit) {
        this.renderer.drawPlatform(entity);
      }
    });
    
    // Draw exit portal
    this.entities.forEach(entity => {
      if (entity.isExit) {
        this.renderer.drawExitPortal(entity);
      }
    });
    
    // Draw collectibles
    this.entities.forEach(entity => {
      if (entity.collect && !entity.collected) {
        this.renderer.drawCollectible(entity, this.frame);
      }
    });
    
    // Draw enemies
    this.entities.forEach(entity => {
      if (entity.health && entity !== this.player) {
        this.renderer.drawEnemy(entity, this.frame);
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
