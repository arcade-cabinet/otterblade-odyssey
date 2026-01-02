/**
 * Main Game Controller - Matter.js + Canvas 2D
 * Based on proven POC patterns from pocs/otterblade_odyssey.html
 */

import Matter from 'matter-js';
import { createInputManager } from '../systems/input.js';

const { Engine, World, Bodies, Body, Events } = Matter;

/**
 * Create and initialize the game
 * @returns {Game} Game instance
 */
export async function createGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill viewport
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create Matter.js engine with POC-proven gravity
  const engine = Engine.create();
  engine.gravity.y = 1.5; // POC-proven gravity value

  // Game state
  const game = {
    engine,
    canvas,
    ctx,
    running: false,
    lastTime: 0,
    input: null,

    // Entities (simple arrays - no ECS complexity)
    player: null,
    enemies: [],
    platforms: [],
    collectibles: [],

    // Camera
    camera: {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    },

    /**
     * Reset game to initial state
     */
    reset() {
      // Clear all entities
      World.clear(this.engine.world, false);
      this.enemies = [];
      this.platforms = [];
      this.collectibles = [];

      // Initialize input manager
      if (!this.input) {
        this.input = createInputManager(this);
      }

      // Create player at spawn point
      this.createPlayer(100, 100);

      // Create simple test level
      this.createTestLevel();
    },

    /**
     * Create player entity with Matter.js body
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createPlayer(x, y) {
      // POC-proven player body dimensions: 35x55
      const playerBody = Bodies.rectangle(x, y, 35, 55, {
        label: 'player',
        friction: 0.1,
        frictionAir: 0.01,
        restitution: 0,
        inertia: Infinity // Prevent rotation
      });

      this.player = {
        body: playerBody,
        health: 5,
        maxHealth: 5,
        warmth: 100,
        maxWarmth: 100,
        shards: 0,
        facing: 1, // 1 = right, -1 = left
        grounded: false,
        velocity: { x: 0, y: 0 },

        // Animation state
        state: 'idle', // idle, walking, jumping, attacking, rolling
        animFrame: 0,
        animTimer: 0
      };

      World.add(this.engine.world, playerBody);
    },

    /**
     * Create simple test level with platforms
     */
    createTestLevel() {
      // Ground platform
      const ground = Bodies.rectangle(400, 550, 800, 60, {
        label: 'platform',
        isStatic: true,
        friction: 1
      });

      // Left wall
      const leftWall = Bodies.rectangle(10, 300, 20, 600, {
        label: 'platform',
        isStatic: true
      });

      // Right wall
      const rightWall = Bodies.rectangle(790, 300, 20, 600, {
        label: 'platform',
        isStatic: true
      });

      // Floating platforms
      const platform1 = Bodies.rectangle(200, 400, 150, 20, {
        label: 'platform',
        isStatic: true,
        friction: 1
      });

      const platform2 = Bodies.rectangle(600, 350, 150, 20, {
        label: 'platform',
        isStatic: true,
        friction: 1
      });

      this.platforms = [ground, leftWall, rightWall, platform1, platform2];
      World.add(this.engine.world, this.platforms);
    },

    /**
     * Start the game loop
     */
    start() {
      this.running = true;
      this.lastTime = performance.now();
      this.gameLoop();
    },

    /**
     * Stop the game loop
     */
    stop() {
      this.running = false;
    },

    /**
     * Main game loop - updates physics and renders
     */
    gameLoop() {
      if (!this.running) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
      this.lastTime = currentTime;

      // Update game state
      this.update(deltaTime);

      // Render game
      this.render();

      // Request next frame
      requestAnimationFrame(() => this.gameLoop());
    },

    /**
     * Update game state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
      // Update Matter.js physics (60fps)
      Engine.update(this.engine, 1000 / 60);

      // Update input and apply to player
      if (this.input) {
        this.input.update();
      }

      // Update player
      if (this.player) {
        this.updatePlayer(dt);
      }

      // Update enemies
      this.enemies.forEach(enemy => this.updateEnemy(enemy, dt));

      // Update camera to follow player
      this.updateCamera();

      // Check collisions
      this.checkCollisions();
    },

    /**
     * Update player state
     * @param {number} dt - Delta time in seconds
     */
    updatePlayer(dt) {
      // Get player body velocity
      this.player.velocity = this.player.body.velocity;

      // Update animation timer
      this.player.animTimer += dt;

      // Decrease warmth over time
      this.player.warmth = Math.max(0, this.player.warmth - dt * 2);

      // Game over if warmth reaches 0
      if (this.player.warmth <= 0) {
        this.gameOver();
      }

      // Update HUD
      this.updateHUD();
    },

    /**
     * Update enemy AI
     * @param {object} enemy - Enemy entity
     * @param {number} dt - Delta time
     */
    updateEnemy(enemy, dt) {
      // TODO: Implement YUKA AI pathfinding
      // For now, simple patrol behavior
    },

    /**
     * Update camera to follow player
     */
    updateCamera() {
      if (!this.player) return;

      const playerPos = this.player.body.position;

      // Center camera on player (with smooth follow)
      const targetX = playerPos.x - this.canvas.width / 2;
      const targetY = playerPos.y - this.canvas.height / 2;

      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;
    },

    /**
     * Check for collisions between entities
     */
    checkCollisions() {
      // Check if player is grounded
      this.player.grounded = false;

      const playerBody = this.player.body;
      const playerBounds = playerBody.bounds;

      // Simple ground check
      for (const platform of this.platforms) {
        const platformBounds = platform.bounds;

        // Check if player is on top of platform
        if (
          playerBounds.max.y >= platformBounds.min.y - 2 &&
          playerBounds.max.y <= platformBounds.min.y + 5 &&
          playerBounds.max.x > platformBounds.min.x &&
          playerBounds.min.x < platformBounds.max.x
        ) {
          this.player.grounded = true;
          break;
        }
      }
    },

    /**
     * Render the game
     */
    render() {
      // Clear canvas
      this.ctx.fillStyle = '#2d1810'; // Warm dark brown background
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Apply camera transform
      this.ctx.save();
      this.ctx.translate(-this.camera.x, -this.camera.y);

      // Render platforms
      this.renderPlatforms();

      // Render player
      if (this.player) {
        this.renderPlayer();
      }

      // Render enemies
      this.enemies.forEach(enemy => this.renderEnemy(enemy));

      this.ctx.restore();
    },

    /**
     * Render platforms
     */
    renderPlatforms() {
      this.ctx.fillStyle = '#6b5d4f'; // Stone color

      for (const platform of this.platforms) {
        const pos = platform.position;
        const bounds = platform.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;

        this.ctx.fillRect(
          pos.x - width / 2,
          pos.y - height / 2,
          width,
          height
        );
      }
    },

    /**
     * Render player (procedural otter from POC)
     * TODO: Extract to game/src/rendering/finn.js
     */
    renderPlayer() {
      const pos = this.player.body.position;
      const ctx = this.ctx;

      // Save context
      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Flip if facing left
      if (this.player.facing < 0) {
        ctx.scale(-1, 1);
      }

      // Body (warm brown)
      ctx.fillStyle = '#8B6F47';
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 27, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(0, -20, 12, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Snout (lighter)
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(8, -18, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#2d1810';
      ctx.beginPath();
      ctx.arc(5, -22, 2, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillStyle = '#6B5D4F';
      ctx.beginPath();
      ctx.ellipse(-15, 10, 8, 4, Math.PI * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },

    /**
     * Render enemy
     * @param {object} enemy - Enemy entity
     */
    renderEnemy(enemy) {
      // TODO: Implement procedural enemy rendering
    },

    /**
     * Update HUD elements
     */
    updateHUD() {
      const healthBar = document.getElementById('healthBar');
      const warmthBar = document.getElementById('warmthBar');
      const shardsCount = document.getElementById('shardsCount');

      if (healthBar) {
        healthBar.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
      }

      if (warmthBar) {
        warmthBar.style.width = `${(this.player.warmth / this.player.maxWarmth) * 100}%`;
      }

      if (shardsCount) {
        shardsCount.textContent = this.player.shards;
      }
    },

    /**
     * Handle game over
     */
    gameOver() {
      this.stop();

      const gameOverOverlay = document.getElementById('gameOverOverlay');
      const hud = document.getElementById('hud');

      if (gameOverOverlay) {
        gameOverOverlay.classList.remove('hidden');
      }

      if (hud) {
        hud.classList.add('hidden');
      }
    }
  };

  return game;
}
