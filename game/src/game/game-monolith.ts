/**
 * OTTERBLADE ODYSSEY - GAME MONOLITH
 * Complete game engine in single file for optimal JavaScript performance
 * ~4000 lines: Physics, AI, Systems, Controllers, Factories, Rendering
 * 
 * Architecture: Vanilla JS monolith > TypeScript micro-modules
 * Minifies well, loads fast, zero import complexity
 */

// ============================================================================
// MATTER.JS INITIALIZATION - Single import, loads dynamically in browser
// ============================================================================

let Matter = null;

export async function initializeGame() {
  if (typeof window === 'undefined') {
    throw new Error('Game only runs in browser');
  }
  
  if (!Matter) {
    console.log('[Game] Loading Matter.js dynamically...');
    Matter = (await import('matter-js')).default;
    window.Matter = Matter; // Global access
    console.log('[Game] ✅ Matter.js loaded successfully', Matter);
  } else {
    console.log('[Game] Matter.js already initialized');
  }
  
  return Matter;
}

// Helper to get Matter modules (after init)
function M() {
  if (!Matter) {
    console.error('[Game] ❌ Matter.js not initialized! Call initializeGame() first.');
    console.trace('Stack trace for Matter.js access before initialization:');
    throw new Error('Matter.js not initialized. Call initializeGame() and await it before using game functions.');
  }
  return Matter;
}

// ============================================================================
// IMPORTS - Only external dependencies (YUKA, Howler)
// ============================================================================

import { Vector3, Vehicle, StateMachine, State } from 'yuka';
import { Howl, Howler } from 'howler';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PLATFORM: 0x0004,
  ITEM: 0x0008,
  TRIGGER: 0x0010,
  NPC: 0x0040,
  HAZARD: 0x0080,
};

const PLAYER_PHYSICS = {
  maxSpeed: 5,
  acceleration: 0.8,
  jumpForce: -12,
  wallJumpForce: { x: 8, y: -11 },
  airControl: 0.6,
  coyoteTimeMs: 120,
  jumpBufferMs: 100,
};

export const CHAPTER_FILES = [
  'chapter-0-the-calling',
  'chapter-1-river-path',
  'chapter-2-gatehouse',
  'chapter-3-great-hall',
  'chapter-4-archives',
  'chapter-5-deep-cellars',
  'chapter-6-kitchen-gardens',
  'chapter-7-bell-tower',
  'chapter-8-storms-edge',
  'chapter-9-new-dawn',
];

// ============================================================================
// PHYSICS ENGINE & BODY CREATION
// ============================================================================

export function createPhysicsEngine() {
  console.log('[Game] Creating physics engine...');
  const { Engine } = M();
  const engine = Engine.create({
    gravity: { x: 0, y: 1.5 },
    enableSleeping: false,
  });
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  console.log('[Game] ✅ Physics engine created');
  return engine;
}

export function createFinnBody(x, y) {
  const { Bodies, Body } = M();
  
  const torso = Bodies.rectangle(0, 0, 28, 40, { label: 'finn_torso' });
  const head = Bodies.circle(0, -20, 12, { label: 'finn_head' });
  const feet = Bodies.rectangle(0, 24, 20, 8, { label: 'finn_feet', isSensor: true });
  
  const finn = Body.create({
    parts: [torso, head, feet],
    friction: 0.3,
    frictionAir: 0.02,
    restitution: 0,
    mass: 1,
    label: 'player',
    collisionFilter: {
      category: COLLISION_GROUPS.PLAYER,
      mask: 0xFFFF,
    },
  });
  
  Body.setPosition(finn, { x, y });
  finn.isGrounded = false;
  finn.canJump = true;
  
  return finn;
}

export function createPlatform(config) {
  const { Bodies } = M();
  const { x, y, width, height, type = 'stone' } = config;
  
  const frictions = { stone: 0.8, wood: 0.6, ice: 0.05, moss: 0.9 };
  
  return Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: `platform_${type}`,
    friction: frictions[type] || 0.8,
    collisionFilter: { category: COLLISION_GROUPS.PLATFORM, mask: 0xFFFF },
  });
}

export function checkGrounded(player, engine) {
  const { Query } = M();
  
  const feetSensor = player.parts.find((p) => p.label === 'finn_feet');
  if (!feetSensor) return false;

  const collisions = Query.collides(feetSensor, engine.world.bodies);
  const grounded = collisions.some(
    (c) => c.bodyA.label.includes('platform') || c.bodyB.label.includes('platform')
  );

  player.isGrounded = grounded;
  return grounded;
}

// ============================================================================
// PLAYER CONTROLLER - Movement & Combat
// ============================================================================

export class PlayerController {
  constructor(player, engine, gameState, audioManager) {
    this.player = player;
    this.engine = engine;
    this.gameState = gameState;
    this.audioManager = audioManager;

    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBufferTime = 0;
    this.comboTimer = 0;
    this.comboIndex = 0;
    this.attackCooldown = 0;
    this.parryWindow = 0;

    this.attacks = [
      { offsetX: 25, offsetY: -5, width: 35, height: 30, damage: 15, kb: { x: 5, y: 0 } },
      { offsetX: 30, offsetY: -10, width: 40, height: 35, damage: 20, kb: { x: 7, y: -2 } },
      { offsetX: 35, offsetY: -5, width: 50, height: 40, damage: 30, kb: { x: 10, y: -5 } },
    ];
  }

  update(deltaTime) {
    const { Body } = M();
    
    this.isGrounded = checkGrounded(this.player, this.engine);

    if (this.isGrounded) {
      this.coyoteTime = PLAYER_PHYSICS.coyoteTimeMs;
    } else {
      this.coyoteTime = Math.max(0, this.coyoteTime - deltaTime);
    }

    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime = Math.max(0, this.jumpBufferTime - deltaTime);
    }

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - deltaTime);
      if (this.comboTimer === 0) this.comboIndex = 0;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    }

    if (this.parryWindow > 0) {
      this.parryWindow = Math.max(0, this.parryWindow - deltaTime);
    }

    // Speed limit
    if (Math.abs(this.player.velocity.x) > PLAYER_PHYSICS.maxSpeed) {
      Body.setVelocity(this.player, {
        x: Math.sign(this.player.velocity.x) * PLAYER_PHYSICS.maxSpeed,
        y: this.player.velocity.y,
      });
    }
  }

  moveLeft() {
    const { Body } = M();
    const force = this.isGrounded ? PLAYER_PHYSICS.acceleration : PLAYER_PHYSICS.acceleration * PLAYER_PHYSICS.airControl;
    Body.applyForce(this.player, this.player.position, { x: -force, y: 0 });
  }

  moveRight() {
    const { Body } = M();
    const force = this.isGrounded ? PLAYER_PHYSICS.acceleration : PLAYER_PHYSICS.acceleration * PLAYER_PHYSICS.airControl;
    Body.applyForce(this.player, this.player.position, { x: force, y: 0 });
  }

  jump() {
    const { Body } = M();
    
    if (this.coyoteTime > 0 && this.player.canJump) {
      Body.setVelocity(this.player, { x: this.player.velocity.x, y: PLAYER_PHYSICS.jumpForce });
      this.player.canJump = false;
      this.coyoteTime = 0;
      this.audioManager?.playSFX('jump');
      return true;
    }

    this.jumpBufferTime = PLAYER_PHYSICS.jumpBufferMs;
    return false;
  }

  attack() {
    if (this.attackCooldown > 0) return null;

    const attackDef = this.attacks[this.comboIndex];
    const hitbox = this.createAttackHitbox(attackDef);

    this.comboIndex = (this.comboIndex + 1) % this.attacks.length;
    this.comboTimer = 800;
    this.attackCooldown = 300;

    this.audioManager?.playSFX('blade_swing');
    return hitbox;
  }

  createAttackHitbox(attackDef) {
    const { Bodies } = M();
    
    const facing = this.player.velocity.x >= 0 ? 1 : -1;
    const x = this.player.position.x + attackDef.offsetX * facing;
    const y = this.player.position.y + attackDef.offsetY;
    
    const hitbox = Bodies.rectangle(x, y, attackDef.width, attackDef.height, {
      isSensor: true,
      label: 'attack_hitbox',
    });
    
    hitbox.damage = attackDef.damage;
    hitbox.knockback = { x: attackDef.kb.x * facing, y: attackDef.kb.y };
    
    return hitbox;
  }

  takeDamage(amount, knockback = { x: 0, y: 0 }) {
    const { Body } = M();
    
    if (this.parryWindow > 0) {
      this.audioManager?.playSFX('parry_success');
      return { parried: true };
    }

    this.gameState.takeDamage(amount);
    Body.applyForce(this.player, this.player.position, { x: knockback.x * 0.1, y: knockback.y * 0.1 });
    this.audioManager?.playSFX('player_hit');

    return { parried: false };
  }
}

// ============================================================================
// AUDIO MANAGER - Howler.js integration
// ============================================================================

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.music = null;
    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    Howler.volume(1.0);
  }

  loadSound(id, src, options = {}) {
    const sound = new Howl({
      src: [src],
      volume: options.volume || this.sfxVolume,
      loop: options.loop || false,
      rate: options.rate || 1.0,
    });
    this.sounds.set(id, sound);
  }

  playSFX(id, options = {}) {
    const sound = this.sounds.get(id);
    if (sound) {
      if (options.rate) sound.rate(options.rate);
      sound.play();
    }
  }

  playMusic(id) {
    if (this.music) {
      this.music.fade(this.musicVolume, 0, 1000);
      setTimeout(() => this.music.stop(), 1000);
    }

    const music = this.sounds.get(id);
    if (music) {
      music.loop(true);
      music.volume(0);
      music.play();
      music.fade(0, this.musicVolume, 2000);
      this.music = music;
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.fade(this.musicVolume, 0, 1000);
      setTimeout(() => this.music.stop(), 1000);
      this.music = null;
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// ============================================================================
// INPUT MANAGER - Keyboard, Gamepad, Touch
// ============================================================================

export class InputManager {
  constructor() {
    if (typeof window === 'undefined') return; // SSR guard
    
    this.keys = {};
    this.gamepad = null;
    this.deadzone = 0.15;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad = e.gamepad;
      console.log('[Input] Gamepad connected:', e.gamepad.id);
    });
  }

  isPressed(action) {
    const mappings = {
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      jump: ['Space', 'KeyW', 'ArrowUp'],
      attack: ['KeyJ', 'KeyZ'],
      parry: ['KeyK', 'KeyX'],
    };

    const keys = mappings[action] || [];
    return keys.some((key) => this.keys[key]);
  }

  update() {
    const gamepads = navigator.getGamepads?.();
    if (gamepads && gamepads[0]) {
      this.gamepad = gamepads[0];
    }
  }

  getAxis(axis) {
    if (!this.gamepad) return 0;
    const value = this.gamepad.axes[axis] || 0;
    return Math.abs(value) > this.deadzone ? value : 0;
  }
}

// Singleton instance
export const inputManager = typeof window !== 'undefined' ? new InputManager() : null;

// ============================================================================
// AI MANAGER - YUKA integration for enemies & NPCs
// ============================================================================

export class AIManager {
  constructor() {
    this.entities = new Map();
    this.npcs = new Map();
  }

  addEnemy(id, config) {
    const enemy = new Vehicle();
    enemy.position.copy(new Vector3(config.position?.x || 0, config.position?.y || 0, 0));
    enemy.maxSpeed = config.speed || 1.0;
    enemy.id = id;
    enemy.type = config.type;
    enemy.health = config.health || 3;
    enemy.damage = config.damage || 1;
    enemy.aggroRadius = config.aggroRadius || 200;
    enemy.attackRange = config.attackRange || 50;
    enemy.onAlert = config.onAlert;
    enemy.onAttack = config.onAttack;
    enemy.onDeath = config.onDeath;
    enemy.playerTarget = null;
    enemy.state = 'patrol';
    
    this.entities.set(id, enemy);
    return enemy;
  }

  addNPC(id, config) {
    const npc = {
      id,
      name: config.name,
      position: config.position || { x: 0, y: 0 },
      dialogue: config.dialogue || [],
      storyState: config.storyState || 'initial',
    };
    this.npcs.set(id, npc);
    return npc;
  }

  update(deltaTime) {
    for (const [id, enemy] of this.entities) {
      if (!enemy.playerTarget) continue;

      const dx = enemy.playerTarget.x - enemy.position.x;
      const dy = enemy.playerTarget.y - enemy.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < enemy.aggroRadius && enemy.state === 'patrol') {
        enemy.state = 'chase';
        enemy.onAlert?.();
      }

      if (enemy.state === 'chase') {
        if (dist < enemy.attackRange) {
          enemy.state = 'attack';
          enemy.onAttack?.();
          setTimeout(() => {
            if (enemy.state === 'attack') enemy.state = 'chase';
          }, 1000);
        } else {
          const moveX = (dx / dist) * enemy.maxSpeed;
          enemy.position.x += moveX;
        }
      }

      if (enemy.health <= 0) {
        enemy.onDeath?.();
        this.entities.delete(id);
      }
    }
  }
}

// Singleton instance
export const aiManager = new AIManager();

// ============================================================================
// GAME INITIALIZATION FROM MANIFESTS
// ============================================================================

export function initializeChapter(chapterId, manifest, engine, gameState) {
  const { World, Bodies } = M();
  
  const platforms = [];
  const enemies = [];
  const npcs = [];
  const collectibles = [];

  // Build level geometry
  if (manifest.level?.segments) {
    for (const segment of manifest.level.segments) {
      if (segment.platforms) {
        for (const platformDef of segment.platforms) {
          const platform = createPlatform({
            x: platformDef.x,
            y: platformDef.y,
            width: platformDef.width,
            height: platformDef.height,
            type: platformDef.type || 'stone',
          });
          platforms.push({ body: platform, def: platformDef });
          World.add(engine.world, platform);
        }
      }

      if (segment.walls) {
        for (const wallDef of segment.walls) {
          const wall = createPlatform({
            x: wallDef.x,
            y: wallDef.y,
            width: wallDef.width,
            height: wallDef.height,
            type: wallDef.type || 'stone',
          });
          platforms.push({ body: wall, def: wallDef });
          World.add(engine.world, wall);
        }
      }
    }
  }

  // Build enemies from encounters
  if (manifest.encounters) {
    for (const encounter of manifest.encounters) {
      if (encounter.enemies) {
        for (const enemyDef of encounter.enemies) {
          const enemyBody = Bodies.rectangle(
            enemyDef.spawnPoint.x,
            enemyDef.spawnPoint.y,
            40,
            50,
            {
              label: 'enemy',
              friction: 0.1,
              frictionAir: 0.02,
            }
          );
          World.add(engine.world, enemyBody);

          const enemyAI = aiManager.addEnemy(enemyDef.id, {
            type: enemyDef.type,
            health: enemyDef.health || 3,
            damage: enemyDef.damage || 1,
            speed: enemyDef.speed || 1.0,
            aggroRadius: enemyDef.behavior?.aggroRadius || 200,
            attackRange: enemyDef.behavior?.attackRange || 50,
            position: enemyDef.spawnPoint,
            onAlert: () => audioManager.playSFX('enemy_alert'),
            onAttack: () => audioManager.playSFX('blade_swing'),
            onDeath: () => {
              audioManager.playSFX('enemy_hit');
              World.remove(engine.world, enemyBody);
            },
          });

          enemies.push({ body: enemyBody, ai: enemyAI });
        }
      }
    }
  }

  return { platforms, enemies, npcs, collectibles };
}

// ============================================================================
// GAME LOOP
// ============================================================================

export function createGameLoop(params) {
  const {
    canvas,
    ctx,
    engine,
    player,
    playerController,
    gameState,
  } = params;

  let lastTime = performance.now();
  let animationFrameId = null;
  const camera = { x: 0, y: 0 };

  function gameLoop(currentTime) {
    if (!canvas || !ctx) return;

    const deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    // Update physics
    const { Engine } = M();
    Engine.update(engine, deltaTime);

    // Update player
    playerController.update(deltaTime);
    if (inputManager.isPressed('left')) playerController.moveLeft();
    if (inputManager.isPressed('right')) playerController.moveRight();
    if (inputManager.isPressed('jump')) playerController.jump();
    if (inputManager.isPressed('attack')) {
      const hitbox = playerController.attack();
      if (hitbox) {
        const { World } = M();
        World.add(engine.world, hitbox);
        setTimeout(() => World.remove(engine.world, hitbox), 200);
      }
    }

    // Update AI
    aiManager.update(deltaTime);

    // Camera follow player
    camera.x = player.position.x - canvas.width / 2;
    camera.y = player.position.y - canvas.height / 2;

    // Render
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw platforms
    ctx.fillStyle = '#4a4a5a';
    for (const body of engine.world.bodies) {
      if (body.label.includes('platform')) {
        const vertices = body.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw player (simple otter shape)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemies
    ctx.fillStyle = '#ff4444';
    for (const body of engine.world.bodies) {
      if (body.label === 'enemy') {
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${gameState.health()}/${gameState.maxHealth()}`, 20, 30);
    ctx.fillText(`Shards: ${gameState.shards?.() || 0}`, 20, 60);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function start() {
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function stop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  return { start, stop };
}

// ============================================================================
// RENDERING SYSTEM - Procedural Canvas 2D
// ============================================================================

/**
 * Camera system for following player with smooth interpolation
 */
export class Camera {
  constructor(canvas) {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.1;
    this.canvas = canvas;
    this.bounds = null;
  }

  follow(target, bounds = null) {
    this.targetX = target.position.x - this.canvas.width / 2;
    this.targetY = target.position.y - this.canvas.height / 2;
    
    if (bounds) {
      this.targetX = Math.max(bounds.minX, Math.min(bounds.maxX - this.canvas.width, this.targetX));
      this.targetY = Math.max(bounds.minY, Math.min(bounds.maxY - this.canvas.height, this.targetY));
    }
    
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }
}

/**
 * Procedural renderer for Finn (otter protagonist)
 * Ported from POC otterblade_odyssey.html lines 575-818
 * Full character with tail wag, breathing, vest, Otterblade, warmth aura
 */
export function renderFinn(ctx, body, state = { animation: 'idle', facing: 1, warmth: 100, maxWarmth: 100, animFrame: 0 }) {
  const { position, angle } = body;
  const { animation, facing, warmth, maxWarmth, animFrame } = state;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  if (facing < 0) ctx.scale(-1, 1);
  
  const frame = Math.floor(animFrame / 10) % 4;
  const breathe = Math.sin(animFrame * 0.05) * 2;
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Glow aura (warmth indicator)
  const warmthGlow = warmth / maxWarmth;
  const glowGradient = ctx.createRadialGradient(0, -10, 5, 0, -10, 40);
  glowGradient.addColorStop(0, `rgba(230, 126, 34, ${warmthGlow * 0.3})`);
  glowGradient.addColorStop(1, 'rgba(230, 126, 34, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, -10, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // Tail with wag animation
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  const tailWag = Math.sin(frame * Math.PI / 2) * 8;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(-20 + tailWag, 15, -25, 20);
  ctx.quadraticCurveTo(-28 + tailWag, 22, -25, 25);
  ctx.quadraticCurveTo(-15 + tailWag, 20, -8, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Back leg with walking animation
  ctx.fillStyle = '#8B6F47';
  if (animation === 'walking') {
    const legSwing = Math.sin(frame * Math.PI / 2 + Math.PI) * 8;
    ctx.fillRect(-12 - legSwing, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(-8 - legSwing, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-12, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(-8, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Body (otter torso) with breathing
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Chest fur (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Leather vest
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.moveTo(-10, -8 + breathe);
  ctx.lineTo(-8, 8 + breathe);
  ctx.lineTo(8, 8 + breathe);
  ctx.lineTo(10, -8 + breathe);
  ctx.closePath();
  ctx.fill();
  
  // Belt with golden buckle
  ctx.fillStyle = '#5D4E37';
  ctx.fillRect(-10, 8 + breathe, 20, 4);
  ctx.fillStyle = '#F4D03F';
  ctx.fillRect(-2, 8 + breathe, 4, 4);
  
  // Front leg with walking animation
  ctx.fillStyle = '#8B6F47';
  if (animation === 'walking') {
    const legSwing = Math.sin(frame * Math.PI / 2) * 8;
    ctx.fillRect(5 + legSwing, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(8 + legSwing, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(5, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(8, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -18 + breathe, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -16 + breathe, 6, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(12, -16 + breathe, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Whiskers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(8, -16 + i * 2 + breathe);
    ctx.lineTo(18, -15 + i * 2 + breathe);
    ctx.stroke();
  }
  
  // Eyes
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(-3, -20 + breathe, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -20 + breathe, 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye gleam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(-4, -21 + breathe, 1, 1);
  ctx.fillRect(2, -21 + breathe, 1, 1);
  
  // Ears
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(-7, -24 + breathe, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -24 + breathe, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Back arm
  ctx.fillStyle = '#8B6F47';
  const armAngle = animation === 'walking' ? Math.sin(frame * Math.PI / 2 + Math.PI) * 0.3 : 0;
  ctx.save();
  ctx.translate(-10, -5 + breathe);
  ctx.rotate(armAngle);
  ctx.fillRect(-3, 0, 6, 15);
  ctx.beginPath();
  ctx.arc(0, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // The Otterblade (when attacking)
  if (animation === 'attacking') {
    ctx.save();
    ctx.translate(18, -8 + breathe);
    ctx.rotate(-Math.PI / 3);
    
    // Blade glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#E67E22';
    
    // Blade with gradient
    const bladeGradient = ctx.createLinearGradient(0, -30, 0, 0);
    bladeGradient.addColorStop(0, '#ECF0F1');
    bladeGradient.addColorStop(0.5, '#BDC3C7');
    bladeGradient.addColorStop(1, '#95A5A6');
    ctx.fillStyle = bladeGradient;
    ctx.fillRect(-3, -30, 6, 30);
    
    // Blade edge gleam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-1, -30, 2, 30);
    
    // Everember glow on blade
    ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
    ctx.fillRect(-2, -30, 4, 15);
    
    // Guard
    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(-6, 0, 12, 3);
    
    // Handle
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, 3, 4, 10);
    
    // Pommel
    ctx.fillStyle = '#F4D03F';
    ctx.beginPath();
    ctx.arc(0, 13, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Legacy marks on handle
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-1, 5 + i * 2);
      ctx.lineTo(1, 5 + i * 2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  
  // Front arm
  ctx.fillStyle = '#8B6F47';
  const frontArmAngle = animation === 'walking' ? Math.sin(frame * Math.PI / 2) * 0.3 : 
                        animation === 'attacking' ? -Math.PI / 4 : 0;
  ctx.save();
  ctx.translate(10, -5 + breathe);
  ctx.rotate(frontArmAngle);
  ctx.fillRect(-3, 0, 6, 15);
  ctx.beginPath();
  ctx.arc(0, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Roll indicator
  if (animation === 'rolling') {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#5DADE2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
}

/**
 * Procedural renderer for enemies (Galeborn)
 * Ported from POC otterblade_odyssey.html lines 821-1010
 * Scout (stoat), Warrior (larger), Boss (massive) with cold auras
 */
export function renderEnemy(ctx, body, state = { enemyType: 'scout', animFrame: 0 }) {
  const { position, angle } = body;
  const { enemyType, animFrame } = state;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  
  const frame = Math.floor(animFrame / 15) % 3;
  
  // Cold aura (all Galeborn have this)
  const coldGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
  coldGradient.addColorStop(0, 'rgba(93, 173, 226, 0.3)');
  coldGradient.addColorStop(1, 'rgba(93, 173, 226, 0)');
  ctx.fillStyle = coldGradient;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  if (enemyType === 'scout') {
    // Galeborn Scout (Stoat/Weasel design)
    ctx.fillStyle = '#7F8C8D';
    ctx.strokeStyle = '#5D6D7E';
    ctx.lineWidth = 2;
    
    // Body
    ctx.beginPath();
    ctx.ellipse(0, -5, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(0, -20, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Ears
    ctx.beginPath();
    ctx.arc(-5, -26, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -26, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Cold eyes (glowing blue)
    ctx.fillStyle = '#5DADE2';
    ctx.fillRect(-3, -21, 2, 3);
    ctx.fillRect(1, -21, 2, 3);
    
    // Frost breath particles
    ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(8 + i * 4, -18 + Math.random() * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Arms with spear
    ctx.strokeStyle = '#5D6D7E';
    ctx.lineWidth = 3;
    const armSwing = Math.sin(frame * Math.PI) * 0.2;
    ctx.save();
    ctx.rotate(armSwing);
    ctx.strokeStyle = '#5D4E37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(20, -15);
    ctx.stroke();
    // Spear tip
    ctx.fillStyle = '#7F8C8D';
    ctx.beginPath();
    ctx.moveTo(20, -15);
    ctx.lineTo(25, -17);
    ctx.lineTo(23, -13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
  } else if (enemyType === 'warrior') {
    // Galeborn Warrior (larger, more menacing)
    ctx.fillStyle = '#5D6D7E';
    ctx.strokeStyle = '#34495E';
    ctx.lineWidth = 2.5;
    
    // Larger body
    ctx.beginPath();
    ctx.ellipse(0, -5, 16, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(0, -25, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Horned ears
    ctx.beginPath();
    ctx.moveTo(-7, -32);
    ctx.lineTo(-9, -38);
    ctx.lineTo(-5, -33);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -32);
    ctx.lineTo(9, -38);
    ctx.lineTo(5, -33);
    ctx.closePath();
    ctx.fill();
    
    // Fierce cold eyes
    ctx.fillStyle = '#3498DB';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3498DB';
    ctx.fillRect(-4, -26, 3, 4);
    ctx.fillRect(1, -26, 3, 4);
    ctx.shadowBlur = 0;
    
    // Ice crystals on body
    ctx.fillStyle = 'rgba(174, 214, 241, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(-6, -15);
    ctx.lineTo(-4, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(6, -10);
    ctx.lineTo(8, -5);
    ctx.closePath();
    ctx.fill();
    
    // Large weapon
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 4;
    const weaponSwing = Math.sin(frame * Math.PI) * 0.3;
    ctx.save();
    ctx.rotate(weaponSwing);
    ctx.beginPath();
    ctx.moveTo(10, -15);
    ctx.lineTo(28, -20);
    ctx.stroke();
    // Weapon head
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.moveTo(28, -20);
    ctx.lineTo(34, -23);
    ctx.lineTo(32, -17);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
  } else if (enemyType === 'boss') {
    // Galeborn Boss (massive, terrifying)
    ctx.fillStyle = '#34495E';
    ctx.strokeStyle = '#1A202C';
    ctx.lineWidth = 3;
    
    // Massive body
    ctx.beginPath();
    ctx.ellipse(0, -5, 24, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Large head
    ctx.beginPath();
    ctx.ellipse(0, -32, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Crown-like horns
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -42);
      ctx.lineTo(i * 10, -52);
      ctx.lineTo(i * 6, -43);
      ctx.closePath();
      ctx.fill();
    }
    
    // Piercing cold eyes with intense glow
    ctx.fillStyle = '#2980B9';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#2980B9';
    ctx.fillRect(-6, -34, 4, 5);
    ctx.fillRect(2, -34, 4, 5);
    ctx.shadowBlur = 0;
    
    // Eye gleam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(-5, -35, 2, 2);
    ctx.fillRect(3, -35, 2, 2);
    
    // Frost armor plates
    ctx.fillStyle = 'rgba(189, 195, 199, 0.7)';
    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -15);
      ctx.lineTo(i * 7 - 3, -10);
      ctx.lineTo(i * 7 + 3, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // Frost breath (constant for boss)
    ctx.fillStyle = 'rgba(236, 240, 241, 0.6)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(12 + i * 5, -30 + Math.random() * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Massive clawed arms
    ctx.strokeStyle = '#1A202C';
    ctx.lineWidth = 6;
    const bossArmSwing = Math.sin(frame * Math.PI) * 0.15;
    ctx.save();
    ctx.rotate(bossArmSwing);
    ctx.beginPath();
    ctx.moveTo(15, -20);
    ctx.lineTo(32, -25);
    ctx.stroke();
    // Claws
    ctx.fillStyle = '#2C3E50';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(32 + i * 3, -25);
      ctx.lineTo(38 + i * 3, -28);
      ctx.lineTo(36 + i * 3, -22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  
  ctx.restore();
}

/**
 * Render platform with texture
 */
export function renderPlatform(ctx, body, texture = 'stone') {
  const vertices = body.vertices;
  
  ctx.fillStyle = texture === 'wood' ? '#8B7355' : '#696969';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Add texture lines
  if (texture === 'wood') {
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(vertices[0].x + i, vertices[0].y);
      ctx.lineTo(vertices[0].x + i, vertices[2].y);
      ctx.stroke();
    }
  }
}

/**
 * Render collectible shard
 */
export function renderShard(ctx, position, time) {
  const pulse = Math.sin(time * 0.005) * 0.2 + 1;
  
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.scale(pulse, pulse);
  
  // Glow effect
  const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 15);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(0.5, '#FFA500');
  gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Crystal shape
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 8);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Particle system for effects (sparks, dust, magic)
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, config = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (config.speed || 2),
        vy: (Math.random() - 0.5) * (config.speed || 2) - (config.gravity || 0.5),
        life: config.life || 60,
        maxLife: config.life || 60,
        size: config.size || 3,
        color: config.color || '#FFD700',
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// ============================================================================
// NPC SYSTEM
// ============================================================================

export class NPC {
  constructor(config, body) {
    this.id = config.id;
    this.name = config.name;
    this.body = body;
    this.dialogue = config.dialogue || [];
    this.currentDialogueIndex = 0;
    this.isInteractable = true;
    this.state = config.initialState || 'idle';
  }

  interact(player) {
    if (!this.isInteractable) return null;
    
    const dialogue = this.dialogue[this.currentDialogueIndex];
    this.currentDialogueIndex = (this.currentDialogueIndex + 1) % this.dialogue.length;
    
    return dialogue;
  }

  update() {
    // Simple idle animation
    if (this.state === 'idle') {
      // Bobbing animation handled by renderer
    }
  }

  render(ctx) {
    const { position } = this.body;
    
    ctx.save();
    ctx.translate(position.x, position.y);
    
    // Draw NPC (friendly woodland creature)
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -3, 2, 0, Math.PI * 2);
    ctx.arc(5, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Speech indicator
    if (this.isInteractable) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '20px Arial';
      ctx.fillText('💬', 0, -25);
    }
    
    ctx.restore();
  }
}

// ============================================================================
// COLLECTIBLE SYSTEM
// ============================================================================

export class Collectible {
  constructor(type, position, value) {
    this.type = type; // 'shard', 'health', 'warmth'
    this.position = position;
    this.value = value;
    this.collected = false;
    this.spawnTime = Date.now();
  }

  collect(gameState) {
    if (this.collected) return;
    
    this.collected = true;
    
    switch (this.type) {
      case 'shard':
        // Handled by game state
        break;
      case 'health':
        gameState.restoreHealth(this.value);
        break;
      case 'warmth':
        gameState.restoreWarmth(this.value);
        break;
    }
    
    return this.type;
  }

  render(ctx) {
    if (this.collected) return;
    
    const time = Date.now() - this.spawnTime;
    
    switch (this.type) {
      case 'shard':
        renderShard(ctx, this.position, time);
        break;
      case 'health':
        ctx.fillStyle = '#E53E3E';
        ctx.font = '24px Arial';
        ctx.fillText('❤️', this.position.x - 12, this.position.y + 8);
        break;
      case 'warmth':
        ctx.fillStyle = '#F6AD55';
        ctx.font = '24px Arial';
        ctx.fillText('🔥', this.position.x - 12, this.position.y + 8);
        break;
    }
  }
}

// ============================================================================
// TRIGGER SYSTEM
// ============================================================================

export class Trigger {
  constructor(config) {
    this.id = config.id;
    this.type = config.type; // 'zone', 'interaction', 'event'
    this.bounds = config.bounds; // {x, y, width, height}
    this.action = config.action;
    this.once = config.once || false;
    this.triggered = false;
    this.condition = config.condition || (() => true);
  }

  check(player, gameState) {
    if (this.triggered && this.once) return null;
    if (!this.condition(gameState)) return null;
    
    const { position } = player;
    const { x, y, width, height } = this.bounds;
    
    if (position.x >= x && position.x <= x + width &&
        position.y >= y && position.y <= y + height) {
      this.triggered = true;
      return this.action;
    }
    
    return null;
  }

  render(ctx, debug = false) {
    if (!debug) return;
    
    ctx.strokeStyle = this.triggered ? '#48BB78' : '#F6AD55';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height
    );
    ctx.setLineDash([]);
  }
}

// ============================================================================
// LEVEL BUILDER - From Chapter Manifest
// ============================================================================

export function buildLevel(manifest, engine) {
  const { World } = M();
  const platforms = [];
  const npcs = [];
  const collectibles = [];
  const triggers = [];
  
  // Build platforms from manifest
  if (manifest.level?.platforms) {
    manifest.level.platforms.forEach(platformConfig => {
      const platform = createPlatform(platformConfig);
      platforms.push(platform);
      World.add(engine.world, platform);
    });
  }
  
  // Build walls
  if (manifest.level?.walls) {
    manifest.level.walls.forEach(wallConfig => {
      const wall = createPlatform({ ...wallConfig, isWall: true });
      platforms.push(wall);
      World.add(engine.world, wall);
    });
  }
  
  // Create NPCs
  if (manifest.npcs) {
    manifest.npcs.forEach(npcConfig => {
      const { Bodies } = M();
      const body = Bodies.circle(
        npcConfig.position.x,
        npcConfig.position.y,
        15,
        { isStatic: true, label: 'npc' }
      );
      const npc = new NPC(npcConfig, body);
      npcs.push(npc);
      World.add(engine.world, body);
    });
  }
  
  // Create collectibles
  if (manifest.collectibles) {
    manifest.collectibles.forEach(collectConfig => {
      const collectible = new Collectible(
        collectConfig.type,
        collectConfig.position,
        collectConfig.value || 1
      );
      collectibles.push(collectible);
    });
  }
  
  // Create triggers
  if (manifest.triggers) {
    manifest.triggers.forEach(triggerConfig => {
      const trigger = new Trigger(triggerConfig);
      triggers.push(trigger);
    });
  }
  
  return { platforms, npcs, collectibles, triggers };
}

// ============================================================================
// ENEMY AI SYSTEM (Enhanced with YUKA)
// ============================================================================

export class EnemyAI {
  constructor(body, enemyType, aiManager, playerRef) {
    this.body = body;
    this.type = enemyType;
    this.hp = enemyType === 'boss' ? 100 : enemyType === 'warrior' ? 50 : 25;
    this.maxHp = this.hp;
    this.damage = enemyType === 'boss' ? 15 : enemyType === 'warrior' ? 10 : 5;
    this.state = 'patrol';
    this.aiManager = aiManager;
    this.playerRef = playerRef;
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.detectionRadius = 200;
    this.attackRadius = 50;
    this.lastAttackTime = 0;
    this.attackCooldown = 1000;
  }

  update(deltaTime) {
    if (this.hp <= 0) {
      this.state = 'dead';
      return;
    }
    
    const playerDist = this.getPlayerDistance();
    
    // State machine
    switch (this.state) {
      case 'patrol':
        if (playerDist < this.detectionRadius) {
          this.state = 'chase';
        } else {
          this.patrol();
        }
        break;
        
      case 'chase':
        if (playerDist > this.detectionRadius * 1.5) {
          this.state = 'patrol';
        } else if (playerDist < this.attackRadius) {
          this.state = 'attack';
        } else {
          this.chasePlayer();
        }
        break;
        
      case 'attack':
        if (playerDist > this.attackRadius) {
          this.state = 'chase';
        } else {
          this.attack();
        }
        break;
    }
  }

  getPlayerDistance() {
    if (!this.playerRef) return Infinity;
    const dx = this.playerRef.position.x - this.body.position.x;
    const dy = this.playerRef.position.y - this.body.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  patrol() {
    // Simple patrol movement
    if (this.patrolPoints.length === 0) return;
    
    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.body.position.x;
    
    if (Math.abs(dx) < 10) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      const { Body } = M();
      Body.setVelocity(this.body, {
        x: dx > 0 ? 1 : -1,
        y: this.body.velocity.y
      });
    }
  }

  chasePlayer() {
    if (!this.playerRef) return;
    
    const dx = this.playerRef.position.x - this.body.position.x;
    const dy = this.playerRef.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const { Body } = M();
      const speed = this.type === 'boss' ? 2 : this.type === 'warrior' ? 1.5 : 1.2;
      Body.setVelocity(this.body, {
        x: (dx / dist) * speed,
        y: this.body.velocity.y
      });
    }
  }

  attack() {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) return;
    
    this.lastAttackTime = now;
    return { damage: this.damage, position: this.body.position };
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.state = 'dead';
    }
    return this.hp;
  }

  render(ctx, animFrame = 0) {
    if (this.state === 'dead') return;
    
    renderEnemy(ctx, this.body, { enemyType: this.type, animFrame });
    
    // Health bar
    const { position } = this.body;
    const hpPercent = this.hp / this.maxHp;
    
    ctx.fillStyle = '#E53E3E';
    ctx.fillRect(position.x - 15, position.y - 30, 30, 3);
    ctx.fillStyle = '#48BB78';
    ctx.fillRect(position.x - 15, position.y - 30, 30 * hpPercent, 3);
  }
}

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

export class AnimationController {
  constructor() {
    this.animations = new Map();
    this.currentAnim = null;
    this.frame = 0;
    this.frameTime = 0;
  }

  register(name, frames, fps = 10) {
    this.animations.set(name, {
      frames,
      fps,
      frameDuration: 1000 / fps,
    });
  }

  play(name, loop = true) {
    if (this.currentAnim === name) return;
    
    this.currentAnim = name;
    this.frame = 0;
    this.frameTime = 0;
    this.loop = loop;
  }

  update(deltaTime) {
    if (!this.currentAnim) return;
    
    const anim = this.animations.get(this.currentAnim);
    if (!anim) return;
    
    this.frameTime += deltaTime;
    
    if (this.frameTime >= anim.frameDuration) {
      this.frameTime = 0;
      this.frame++;
      
      if (this.frame >= anim.frames.length) {
        if (this.loop) {
          this.frame = 0;
        } else {
          this.frame = anim.frames.length - 1;
          this.currentAnim = null;
        }
      }
    }
  }

  getCurrentFrame() {
    if (!this.currentAnim) return null;
    const anim = this.animations.get(this.currentAnim);
    return anim ? anim.frames[this.frame] : null;
  }
}

// ============================================================================
// PARALLAX BACKGROUND SYSTEM
// ============================================================================

export class ParallaxLayer {
  constructor(config) {
    this.image = config.image;
    this.speed = config.speed || 0.5;
    this.offset = config.offset || 0;
    this.repeat = config.repeat || true;
    this.y = config.y || 0;
  }

  render(ctx, cameraX, canvasWidth, canvasHeight) {
    // Calculate parallax offset
    const parallaxX = cameraX * this.speed;
    
    if (this.image) {
      // Image-based layer (when we have assets)
      ctx.drawImage(this.image, -parallaxX + this.offset, this.y);
      
      if (this.repeat && this.image.width < canvasWidth + parallaxX) {
        ctx.drawImage(this.image, -parallaxX + this.offset + this.image.width, this.y);
      }
    } else {
      // Procedural gradient layer
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, this.topColor || '#87CEEB');
      gradient.addColorStop(1, this.bottomColor || '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }
}

export class ParallaxBackground {
  constructor() {
    this.layers = [];
  }

  addLayer(config) {
    this.layers.push(new ParallaxLayer(config));
  }

  render(ctx, camera, canvas) {
    this.layers.forEach(layer => {
      layer.render(ctx, camera.x, canvas.width, canvas.height);
    });
  }
}

// ============================================================================
// QUEST SYSTEM
// ============================================================================

export class Quest {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.objectives = config.objectives || [];
    this.currentObjective = 0;
    this.completed = false;
    this.rewards = config.rewards || {};
  }

  updateObjective(objectiveId, progress) {
    const obj = this.objectives.find(o => o.id === objectiveId);
    if (!obj) return false;
    
    obj.current = Math.min(obj.required, progress);
    
    if (obj.current >= obj.required) {
      obj.completed = true;
      this.currentObjective++;
      
      if (this.currentObjective >= this.objectives.length) {
        this.completed = true;
        return { completed: true, quest: this };
      }
      
      return { objectiveComplete: true, objective: obj };
    }
    
    return { progress: obj.current / obj.required };
  }

  getCurrentObjective() {
    return this.objectives[this.currentObjective];
  }

  render(ctx, x, y) {
    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#F4D03F';
    ctx.fillText(this.name, x, y);
    
    const current = this.getCurrentObjective();
    if (current) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(`${current.description} (${current.current}/${current.required})`, x, y + 20);
    }
    
    ctx.restore();
  }
}

export class QuestManager {
  constructor() {
    this.quests = new Map();
    this.activeQuests = [];
    this.completedQuests = [];
  }

  addQuest(config) {
    const quest = new Quest(config);
    this.quests.set(quest.id, quest);
    this.activeQuests.push(quest);
    return quest;
  }

  updateObjective(questId, objectiveId, progress) {
    const quest = this.quests.get(questId);
    if (!quest) return null;
    
    const result = quest.updateObjective(objectiveId, progress);
    
    if (result.completed) {
      this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
      this.completedQuests.push(quest);
    }
    
    return result;
  }

  getActiveQuests() {
    return this.activeQuests;
  }
}

// ============================================================================
// CINEMATIC SYSTEM
// ============================================================================

export class CinematicAction {
  constructor(type, config) {
    this.type = type; // 'camera', 'dialogue', 'move', 'wait', 'effect'
    this.config = config;
    this.duration = config.duration || 0;
    this.elapsed = 0;
    this.completed = false;
  }

  update(deltaTime, context) {
    this.elapsed += deltaTime;
    
    switch (this.type) {
      case 'camera':
        this.updateCamera(context.camera);
        break;
      case 'dialogue':
        this.updateDialogue(context);
        break;
      case 'move':
        this.updateMove(context);
        break;
      case 'wait':
        // Just wait
        break;
      case 'effect':
        this.updateEffect(context);
        break;
    }
    
    if (this.elapsed >= this.duration) {
      this.completed = true;
    }
    
    return this.completed;
  }

  updateCamera(camera) {
    const progress = Math.min(1, this.elapsed / this.duration);
    const eased = this.easeInOutCubic(progress);
    
    camera.x = this.config.startX + (this.config.endX - this.config.startX) * eased;
    camera.y = this.config.startY + (this.config.endY - this.config.startY) * eased;
  }

  updateDialogue(context) {
    if (this.elapsed < 100 && !this.shown) {
      context.showDialogue(this.config.text, this.config.speaker);
      this.shown = true;
    }
  }

  updateMove(context) {
    const progress = Math.min(1, this.elapsed / this.duration);
    const entity = context.entities.get(this.config.entityId);
    
    if (entity) {
      const { Body } = M();
      Body.setPosition(entity.body, {
        x: this.config.startX + (this.config.endX - this.config.startX) * progress,
        y: this.config.startY + (this.config.endY - this.config.startY) * progress,
      });
    }
  }

  updateEffect(context) {
    if (!this.triggered) {
      context.particles.emit(
        this.config.x,
        this.config.y,
        this.config.count || 10,
        this.config
      );
      this.triggered = true;
    }
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

export class CinematicSequence {
  constructor(actions) {
    this.actions = actions.map(a => new CinematicAction(a.type, a));
    this.currentAction = 0;
    this.playing = false;
    this.completed = false;
  }

  start() {
    this.playing = true;
    this.currentAction = 0;
  }

  update(deltaTime, context) {
    if (!this.playing || this.completed) return;
    
    const action = this.actions[this.currentAction];
    if (!action) {
      this.completed = true;
      this.playing = false;
      return;
    }
    
    if (action.update(deltaTime, context)) {
      this.currentAction++;
      
      if (this.currentAction >= this.actions.length) {
        this.completed = true;
        this.playing = false;
      }
    }
  }

  skip() {
    this.currentAction = this.actions.length;
    this.completed = true;
    this.playing = false;
  }
}

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

export class CombatController {
  constructor(entity, audioManager) {
    this.entity = entity;
    this.audioManager = audioManager;
    this.attacking = false;
    this.attackCooldown = 500;
    this.lastAttackTime = 0;
    this.comboCount = 0;
    this.comboWindow = 1000;
    this.lastComboTime = 0;
    this.hitboxes = [];
  }

  attack() {
    const now = Date.now();
    
    if (this.attacking || now - this.lastAttackTime < this.attackCooldown) {
      return false;
    }
    
    // Check combo
    if (now - this.lastComboTime < this.comboWindow) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    
    this.lastComboTime = now;
    this.lastAttackTime = now;
    this.attacking = true;
    
    // Create attack hitbox
    const direction = this.entity.facingRight ? 1 : -1;
    const hitbox = {
      x: this.entity.body.position.x + (30 * direction),
      y: this.entity.body.position.y,
      width: 40,
      height: 40,
      damage: 10 + (this.comboCount * 2),
      knockback: 5 + this.comboCount,
      lifetime: 150,
      direction,
    };
    
    this.hitboxes.push(hitbox);
    
    // Play attack sound
    this.audioManager?.playSound('sword_swing');
    
    // Reset attacking after animation
    setTimeout(() => {
      this.attacking = false;
    }, 300);
    
    return true;
  }

  update(deltaTime) {
    // Update hitboxes
    for (let i = this.hitboxes.length - 1; i >= 0; i--) {
      this.hitboxes[i].lifetime -= deltaTime;
      if (this.hitboxes[i].lifetime <= 0) {
        this.hitboxes.splice(i, 1);
      }
    }
    
    // Reset combo if window expired
    if (Date.now() - this.lastComboTime > this.comboWindow) {
      this.comboCount = 0;
    }
  }

  checkHit(targetBody, targetRect) {
    for (const hitbox of this.hitboxes) {
      // Simple AABB collision
      if (targetRect.x < hitbox.x + hitbox.width &&
          targetRect.x + targetRect.width > hitbox.x &&
          targetRect.y < hitbox.y + hitbox.height &&
          targetRect.y + targetRect.height > hitbox.y) {
        
        return {
          damage: hitbox.damage,
          knockback: hitbox.knockback,
          direction: hitbox.direction,
        };
      }
    }
    
    return null;
  }

  renderDebug(ctx) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    
    this.hitboxes.forEach(hitbox => {
      ctx.strokeRect(
        hitbox.x - hitbox.width / 2,
        hitbox.y - hitbox.height / 2,
        hitbox.width,
        hitbox.height
      );
    });
  }
}

// ============================================================================
// WEATHER & ENVIRONMENTAL EFFECTS
// ============================================================================

export class WeatherSystem {
  constructor() {
    this.currentWeather = 'clear';
    this.particles = [];
    this.windSpeed = 0;
    this.intensity = 1.0;
  }

  setWeather(type, intensity = 1.0) {
    this.currentWeather = type;
    this.intensity = intensity;
    this.particles = [];
    
    switch (type) {
      case 'rain':
        this.windSpeed = -0.5;
        break;
      case 'snow':
        this.windSpeed = -0.2;
        break;
      case 'storm':
        this.windSpeed = -1.5;
        break;
      default:
        this.windSpeed = 0;
    }
  }

  update(canvas) {
    const particleCount = Math.floor(100 * this.intensity);
    
    // Add new particles
    while (this.particles.length < particleCount) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        speed: 2 + Math.random() * 3,
        size: this.currentWeather === 'snow' ? 3 : 1,
      });
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speed * this.intensity;
      p.x += this.windSpeed;
      
      // Remove if off screen
      if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, canvas) {
    if (this.currentWeather === 'clear') return;
    
    ctx.save();
    
    switch (this.currentWeather) {
      case 'rain':
      case 'storm':
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
        ctx.lineWidth = 1;
        this.particles.forEach(p => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + this.windSpeed * 2, p.y + 10);
          ctx.stroke();
        });
        break;
        
      case 'snow':
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
    }
    
    // Storm lightning
    if (this.currentWeather === 'storm' && Math.random() < 0.001) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.restore();
  }
}

// ============================================================================
// DIALOGUE SYSTEM
// ============================================================================

export class DialogueBox {
  constructor() {
    this.active = false;
    this.text = '';
    this.speaker = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.typeSpeed = 50; // ms per character
    this.lastCharTime = 0;
    this.choices = [];
    this.onComplete = null;
  }

  show(text, speaker = '', choices = [], onComplete = null) {
    this.active = true;
    this.text = text;
    this.speaker = speaker;
    this.choices = choices;
    this.displayedText = '';
    this.charIndex = 0;
    this.onComplete = onComplete;
  }

  update(deltaTime) {
    if (!this.active || this.charIndex >= this.text.length) return;
    
    this.lastCharTime += deltaTime;
    
    if (this.lastCharTime >= this.typeSpeed) {
      this.lastCharTime = 0;
      this.displayedText += this.text[this.charIndex];
      this.charIndex++;
    }
  }

  skip() {
    this.displayedText = this.text;
    this.charIndex = this.text.length;
  }

  close() {
    this.active = false;
    if (this.onComplete) {
      this.onComplete();
    }
  }

  render(ctx, canvas) {
    if (!this.active) return;
    
    const boxHeight = 120;
    const boxY = canvas.height - boxHeight - 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(20, boxY, canvas.width - 40, boxHeight);
    
    // Border
    ctx.strokeStyle = '#F4D03F';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, boxY, canvas.width - 40, boxHeight);
    
    // Speaker name
    if (this.speaker) {
      ctx.fillStyle = '#F4D03F';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(this.speaker, 40, boxY + 30);
    }
    
    // Dialogue text
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    this.wrapText(ctx, this.displayedText, 40, boxY + 55, canvas.width - 80, 20);
    
    // Choices
    if (this.charIndex >= this.text.length && this.choices.length > 0) {
      ctx.font = '14px Arial';
      this.choices.forEach((choice, i) => {
        const y = boxY + boxHeight - 30 - (this.choices.length - 1 - i) * 20;
        ctx.fillStyle = '#F4D03F';
        ctx.fillText(`${i + 1}. ${choice.text}`, 40, y);
      });
    }
    
    // Continue indicator
    if (this.charIndex >= this.text.length && this.choices.length === 0) {
      ctx.fillStyle = '#F4D03F';
      ctx.font = '14px Arial';
      ctx.fillText('Press SPACE to continue...', canvas.width - 220, boxY + boxHeight - 15);
    }
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, lineY);
        line = word + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    });
    
    ctx.fillText(line, x, lineY);
  }
}

// ============================================================================
// SAVE SYSTEM
// ============================================================================

export class SaveManager {
  constructor() {
    this.storageKey = 'otterblade_save';
    this.currentSave = this.loadSave() || this.createNewSave();
  }

  createNewSave() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      chapter: 0,
      health: 5,
      maxHealth: 5,
      warmth: 100,
      shards: 0,
      checkpoints: {},
      completedQuests: [],
      achievements: [],
      inventory: [],
      unlockedAbilities: [],
      playtime: 0,
      deaths: 0,
      enemiesDefeated: 0,
    };
  }

  save(gameState) {
    const saveData = {
      ...this.currentSave,
      timestamp: Date.now(),
      chapter: gameState.currentChapter,
      health: gameState.health(),
      maxHealth: gameState.maxHealth(),
      warmth: gameState.warmth(),
      shards: gameState.shards,
      completedQuests: gameState.completedQuests || [],
      achievements: gameState.achievements || [],
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      this.currentSave = saveData;
      console.log('[Save] Game saved successfully');
      return true;
    } catch (error) {
      console.error('[Save] Failed to save game:', error);
      return false;
    }
  }

  loadSave() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      
      const saveData = JSON.parse(data);
      console.log('[Save] Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('[Save] Failed to load save:', error);
      return null;
    }
  }

  deleteSave() {
    try {
      localStorage.removeItem(this.storageKey);
      this.currentSave = this.createNewSave();
      console.log('[Save] Save deleted');
      return true;
    } catch (error) {
      console.error('[Save] Failed to delete save:', error);
      return false;
    }
  }

  hasSave() {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

export class Achievement {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.icon = config.icon;
    this.condition = config.condition;
    this.unlocked = false;
    this.unlockedAt = null;
    this.hidden = config.hidden || false;
  }

  check(gameState) {
    if (this.unlocked) return false;
    
    if (this.condition(gameState)) {
      this.unlocked = true;
      this.unlockedAt = Date.now();
      return true;
    }
    
    return false;
  }

  render(ctx, x, y) {
    const size = 64;
    
    // Background
    ctx.fillStyle = this.unlocked ? '#48BB78' : '#4A5568';
    ctx.fillRect(x, y, size, size);
    
    // Border
    ctx.strokeStyle = this.unlocked ? '#F4D03F' : '#718096';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // Icon
    if (this.unlocked || !this.hidden) {
      ctx.fillStyle = '#FFF';
      ctx.font = '32px Arial';
      ctx.fillText(this.icon || '🏆', x + 16, y + 45);
    } else {
      ctx.fillStyle = '#718096';
      ctx.font = '32px Arial';
      ctx.fillText('?', x + 20, y + 45);
    }
    
    // Name
    ctx.font = '12px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(this.name, x + size + 10, y + 20);
    
    // Description
    if (this.unlocked || !this.hidden) {
      ctx.font = '10px Arial';
      ctx.fillStyle = '#CBD5E0';
      ctx.fillText(this.description, x + size + 10, y + 40);
    }
  }
}

export class AchievementManager {
  constructor() {
    this.achievements = [];
    this.unlockedAchievements = [];
    this.notificationQueue = [];
    
    this.initializeAchievements();
  }

  initializeAchievements() {
    // Define all achievements
    this.register({
      id: 'first_steps',
      name: 'First Steps',
      description: 'Begin your journey',
      icon: '👣',
      condition: (state) => state.playtime > 0,
    });

    this.register({
      id: 'shard_collector',
      name: 'Shard Collector',
      description: 'Collect 10 Everember Shards',
      icon: '✨',
      condition: (state) => state.shards >= 10,
    });

    this.register({
      id: 'warrior',
      name: 'Warrior',
      description: 'Defeat 50 Galeborn',
      icon: '⚔️',
      condition: (state) => state.enemiesDefeated >= 50,
    });

    this.register({
      id: 'survivor',
      name: 'Survivor',
      description: 'Complete Chapter 1 without dying',
      icon: '❤️',
      condition: (state) => state.chapter > 1 && state.deaths === 0,
    });

    this.register({
      id: 'speedrunner',
      name: 'Speedrunner',
      description: 'Complete Chapter 0 in under 5 minutes',
      icon: '⚡',
      condition: (state) => state.chapter0Time && state.chapter0Time < 300000,
      hidden: true,
    });
  }

  register(config) {
    const achievement = new Achievement(config);
    this.achievements.push(achievement);
  }

  checkAchievements(gameState) {
    this.achievements.forEach(achievement => {
      if (achievement.check(gameState)) {
        this.unlockedAchievements.push(achievement);
        this.notificationQueue.push(achievement);
        console.log(`[Achievement] Unlocked: ${achievement.name}`);
      }
    });
  }

  getUnlockedCount() {
    return this.unlockedAchievements.length;
  }

  getTotalCount() {
    return this.achievements.length;
  }
}

// ============================================================================
// SOUND EFFECT MANAGER (Enhanced)
// ============================================================================

export class SoundEffectPlayer {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.soundMap = new Map();
    this.positionalSounds = [];
  }

  register(id, config) {
    this.soundMap.set(id, {
      ...config,
      volume: config.volume || 1.0,
      pitch: config.pitch || 1.0,
      loop: config.loop || false,
    });
  }

  play(id, options = {}) {
    const config = this.soundMap.get(id);
    if (!config) {
      console.warn(`[SFX] Sound not found: ${id}`);
      return null;
    }

    return this.audioManager.playSound(id, {
      volume: options.volume || config.volume,
      pitch: options.pitch || config.pitch,
      loop: options.loop || config.loop,
    });
  }

  playPositional(id, position, listener, maxDistance = 500) {
    const distance = Math.sqrt(
      Math.pow(position.x - listener.x, 2) +
      Math.pow(position.y - listener.y, 2)
    );

    if (distance > maxDistance) return null;

    const volume = Math.max(0, 1 - (distance / maxDistance));
    const pan = Math.max(-1, Math.min(1, (position.x - listener.x) / maxDistance));

    return this.play(id, { volume, pan });
  }

  initializeCommonSounds() {
    // Movement
    this.register('footstep', { volume: 0.3 });
    this.register('jump', { volume: 0.5 });
    this.register('land', { volume: 0.4 });
    this.register('dash', { volume: 0.6 });
    
    // Combat
    this.register('sword_swing', { volume: 0.5 });
    this.register('sword_hit', { volume: 0.7 });
    this.register('enemy_hurt', { volume: 0.6 });
    this.register('enemy_death', { volume: 0.5 });
    
    // Collectibles
    this.register('shard_collect', { volume: 0.7, pitch: 1.2 });
    this.register('health_pickup', { volume: 0.6 });
    this.register('checkpoint', { volume: 0.5 });
    
    // Environment
    this.register('door_open', { volume: 0.5 });
    this.register('lever_pull', { volume: 0.6 });
    this.register('bell_ring', { volume: 0.8 });
    this.register('fire_crackle', { volume: 0.3, loop: true });
  }
}

// ============================================================================
// ADVANCED PHYSICS INTERACTIONS
// ============================================================================

export class PhysicsHelper {
  static applyForce(body, force) {
    const { Body } = M();
    Body.applyForce(body, body.position, force);
  }

  static applyImpulse(body, impulse) {
    const { Body } = M();
    Body.setVelocity(body, {
      x: body.velocity.x + impulse.x,
      y: body.velocity.y + impulse.y,
    });
  }

  static getVelocityMagnitude(body) {
    return Math.sqrt(
      body.velocity.x * body.velocity.x +
      body.velocity.y * body.velocity.y
    );
  }

  static limitVelocity(body, maxSpeed) {
    const speed = this.getVelocityMagnitude(body);
    if (speed > maxSpeed) {
      const { Body } = M();
      const scale = maxSpeed / speed;
      Body.setVelocity(body, {
        x: body.velocity.x * scale,
        y: body.velocity.y * scale,
      });
    }
  }

  static applyKnockback(body, direction, force) {
    const { Body } = M();
    Body.setVelocity(body, {
      x: body.velocity.x + direction.x * force,
      y: body.velocity.y + direction.y * force,
    });
  }

  static raycast(engine, start, end) {
    const { Query } = M();
    const bodies = Query.ray(
      engine.world.bodies,
      start,
      end
    );
    return bodies;
  }

  static getGroundedSurface(body, engine, checkDistance = 5) {
    const { Query } = M();
    const start = { x: body.position.x, y: body.position.y + 25 };
    const end = { x: body.position.x, y: body.position.y + 25 + checkDistance };
    
    const collisions = Query.ray(engine.world.bodies, start, end);
    return collisions.length > 0 ? collisions[0] : null;
  }
}

// ============================================================================
// MOVING PLATFORM SYSTEM
// ============================================================================

export class MovingPlatform {
  constructor(body, path, speed) {
    this.body = body;
    this.path = path; // Array of {x, y} points
    this.currentPoint = 0;
    this.speed = speed || 1;
    this.direction = 1;
    this.mode = 'loop'; // 'loop' or 'pingpong'
    this.passengers = new Set();
  }

  update() {
    if (this.path.length < 2) return;

    const target = this.path[this.currentPoint];
    const dx = target.x - this.body.position.x;
    const dy = target.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      // Reached waypoint
      if (this.mode === 'loop') {
        this.currentPoint = (this.currentPoint + 1) % this.path.length;
      } else if (this.mode === 'pingpong') {
        this.currentPoint += this.direction;
        if (this.currentPoint >= this.path.length - 1 || this.currentPoint <= 0) {
          this.direction *= -1;
        }
      }
    } else {
      // Move towards waypoint
      const { Body } = M();
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      
      Body.setPosition(this.body, {
        x: this.body.position.x + vx,
        y: this.body.position.y + vy,
      });

      // Move passengers
      this.passengers.forEach(passenger => {
        Body.setPosition(passenger, {
          x: passenger.position.x + vx,
          y: passenger.position.y + vy,
        });
      });
    }
  }

  addPassenger(body) {
    this.passengers.add(body);
  }

  removePassenger(body) {
    this.passengers.delete(body);
  }

  render(ctx) {
    renderPlatform(ctx, this.body, 'wood');
    
    // Debug: Show path
    if (false) { // Set to true for debug
      ctx.strokeStyle = '#F4D03F';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      this.path.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ============================================================================
// HAZARD SYSTEM
// ============================================================================

export class Hazard {
  constructor(config) {
    this.type = config.type; // 'spikes', 'fire', 'water', 'wind'
    this.body = config.body;
    this.damage = config.damage || 1;
    this.damageInterval = config.damageInterval || 1000;
    this.lastDamageTime = 0;
    this.active = true;
    this.animationTime = 0;
  }

  checkCollision(player) {
    if (!this.active) return null;

    const { Query } = M();
    const colliding = Query.collides(this.body, [player]);
    
    if (colliding.length > 0) {
      const now = Date.now();
      if (now - this.lastDamageTime >= this.damageInterval) {
        this.lastDamageTime = now;
        return {
          damage: this.damage,
          type: this.type,
        };
      }
    }

    return null;
  }

  update(deltaTime) {
    this.animationTime += deltaTime;
  }

  render(ctx) {
    const { position } = this.body;
    const vertices = this.body.vertices;

    ctx.save();

    switch (this.type) {
      case 'spikes':
        ctx.fillStyle = '#718096';
        ctx.strokeStyle = '#4A5568';
        ctx.lineWidth = 2;
        
        // Draw base
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw spikes
        const width = Math.abs(vertices[1].x - vertices[0].x);
        const spikeCount = Math.floor(width / 20);
        for (let i = 0; i < spikeCount; i++) {
          const x = vertices[0].x + (i * 20) + 10;
          const y = vertices[0].y;
          ctx.beginPath();
          ctx.moveTo(x - 8, y);
          ctx.lineTo(x, y - 15);
          ctx.lineTo(x + 8, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;

      case 'fire':
        const flicker = Math.sin(this.animationTime * 0.01) * 0.2 + 0.8;
        const gradient = ctx.createRadialGradient(
          position.x, position.y, 10,
          position.x, position.y, 40
        );
        gradient.addColorStop(0, `rgba(255, 200, 0, ${flicker})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${flicker * 0.7})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(position.x, position.y, 40, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'water':
        ctx.fillStyle = 'rgba(64, 164, 223, 0.6)';
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Wave effect
        const wave = Math.sin(this.animationTime * 0.003) * 2;
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y + wave);
        ctx.lineTo(vertices[1].x, vertices[1].y + wave);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }
}

// ============================================================================
// CHECKPOINT SYSTEM
// ============================================================================

export class Checkpoint {
  constructor(position, id) {
    this.position = position;
    this.id = id;
    this.activated = false;
    this.radius = 30;
    this.animationTime = 0;
  }

  check(player) {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius && !this.activated) {
      this.activated = true;
      return true;
    }

    return false;
  }

  update(deltaTime) {
    this.animationTime += deltaTime;
  }

  render(ctx) {
    const pulse = Math.sin(this.animationTime * 0.003) * 0.2 + 0.8;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    if (this.activated) {
      // Activated state - golden glow
      const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 30);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 30 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.fillText('✓', -10, 8);
    } else {
      // Inactive state - subtle beacon
      ctx.strokeStyle = '#F4D03F';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#F4D03F';
      ctx.font = '20px Arial';
      ctx.fillText('📍', -10, 8);
    }

    ctx.restore();
  }
}

// ============================================================================
// TUTORIAL SYSTEM
// ============================================================================

export class TutorialHint {
  constructor(config) {
    this.id = config.id;
    this.text = config.text;
    this.position = config.position;
    this.trigger = config.trigger; // 'proximity', 'action', 'event'
    this.shown = false;
    this.dismissed = false;
    this.lifetime = config.lifetime || 5000;
    this.shownAt = 0;
  }

  show() {
    if (this.shown || this.dismissed) return false;
    this.shown = true;
    this.shownAt = Date.now();
    return true;
  }

  dismiss() {
    this.dismissed = true;
  }

  shouldHide() {
    return Date.now() - this.shownAt > this.lifetime;
  }

  render(ctx) {
    if (!this.shown || this.dismissed) return;

    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const padding = 10;
    const textWidth = ctx.measureText(this.text).width;
    ctx.fillRect(
      this.position.x - textWidth / 2 - padding,
      this.position.y - 40,
      textWidth + padding * 2,
      30
    );

    // Border
    ctx.strokeStyle = '#F4D03F';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.position.x - textWidth / 2 - padding,
      this.position.y - 40,
      textWidth + padding * 2,
      30
    );

    // Text
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.position.x, this.position.y - 20);

    ctx.restore();

    // Auto-hide after lifetime
    if (this.shouldHide()) {
      this.dismiss();
    }
  }
}

export class TutorialManager {
  constructor() {
    this.hints = [];
    this.activeHints = [];
  }

  register(config) {
    this.hints.push(new TutorialHint(config));
  }

  checkTriggers(gameState, player) {
    this.hints.forEach(hint => {
      if (hint.shown || hint.dismissed) return;

      if (hint.trigger === 'proximity') {
        const dx = player.position.x - hint.position.x;
        const dy = player.position.y - hint.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          if (hint.show()) {
            this.activeHints.push(hint);
          }
        }
      }
    });

    // Remove dismissed hints
    this.activeHints = this.activeHints.filter(h => !h.dismissed);
  }

  render(ctx) {
    this.activeHints.forEach(hint => hint.render(ctx));
  }

  initializeBasicTutorials() {
    this.register({
      id: 'movement',
      text: 'Use ARROW KEYS or WASD to move',
      position: { x: 200, y: 300 },
      trigger: 'proximity',
    });

    this.register({
      id: 'jump',
      text: 'Press SPACE to jump',
      position: { x: 400, y: 300 },
      trigger: 'proximity',
    });

    this.register({
      id: 'attack',
      text: 'Press X or J to attack',
      position: { x: 600, y: 300 },
      trigger: 'proximity',
    });
  }
}

// ============================================================================
// ADVANCED PLAYER ABILITIES
// ============================================================================

export class AbilitySystem {
  constructor(player, audioManager) {
    this.player = player;
    this.audioManager = audioManager;
    this.abilities = new Map();
    this.cooldowns = new Map();
    this.unlocked = new Set();
    
    this.initializeAbilities();
  }

  initializeAbilities() {
    // Dash ability
    this.register({
      id: 'dash',
      name: 'Dash',
      cooldown: 1000,
      execute: (direction) => {
        const { Body } = M();
        const dashForce = 15;
        Body.setVelocity(this.player, {
          x: direction * dashForce,
          y: this.player.velocity.y * 0.5,
        });
        this.audioManager?.playSound('dash');
        
        // Add dash particles
        return {
          particles: true,
          invincible: 200, // ms of invincibility
        };
      },
    });

    // Wall jump ability
    this.register({
      id: 'wall_jump',
      name: 'Wall Jump',
      cooldown: 500,
      execute: (wallSide) => {
        const { Body } = M();
        Body.setVelocity(this.player, {
          x: wallSide === 'left' ? 8 : -8,
          y: -10,
        });
        this.audioManager?.playSound('jump');
        return { success: true };
      },
    });

    // Double jump ability
    this.register({
      id: 'double_jump',
      name: 'Double Jump',
      cooldown: 0,
      execute: () => {
        const { Body } = M();
        Body.setVelocity(this.player, {
          x: this.player.velocity.x,
          y: -9,
        });
        this.audioManager?.playSound('jump');
        return { success: true };
      },
    });

    // Ground slam ability
    this.register({
      id: 'ground_slam',
      name: 'Ground Slam',
      cooldown: 3000,
      execute: () => {
        const { Body } = M();
        Body.setVelocity(this.player, {
          x: 0,
          y: 15,
        });
        return {
          aoe: true,
          radius: 100,
          damage: 20,
        };
      },
    });

    // Heal ability
    this.register({
      id: 'heal',
      name: 'Heal',
      cooldown: 30000,
      execute: (gameState) => {
        gameState.restoreHealth(2);
        this.audioManager?.playSound('heal');
        return { success: true };
      },
    });
  }

  register(config) {
    this.abilities.set(config.id, config);
  }

  unlock(abilityId) {
    this.unlocked.add(abilityId);
    console.log(`[Ability] Unlocked: ${abilityId}`);
  }

  canUse(abilityId) {
    if (!this.unlocked.has(abilityId)) return false;
    
    const lastUse = this.cooldowns.get(abilityId) || 0;
    const ability = this.abilities.get(abilityId);
    const now = Date.now();
    
    return now - lastUse >= ability.cooldown;
  }

  use(abilityId, ...args) {
    if (!this.canUse(abilityId)) return null;
    
    const ability = this.abilities.get(abilityId);
    this.cooldowns.set(abilityId, Date.now());
    
    return ability.execute(...args);
  }

  getCooldownRemaining(abilityId) {
    const lastUse = this.cooldowns.get(abilityId) || 0;
    const ability = this.abilities.get(abilityId);
    const elapsed = Date.now() - lastUse;
    
    return Math.max(0, ability.cooldown - elapsed);
  }

  renderCooldowns(ctx, x, y) {
    let offsetY = 0;
    
    this.unlocked.forEach(abilityId => {
      const ability = this.abilities.get(abilityId);
      const remaining = this.getCooldownRemaining(abilityId);
      const cooldownPercent = remaining / ability.cooldown;
      
      // Ability icon background
      ctx.fillStyle = remaining > 0 ? '#4A5568' : '#48BB78';
      ctx.fillRect(x, y + offsetY, 40, 40);
      
      // Cooldown overlay
      if (remaining > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y + offsetY, 40, 40 * cooldownPercent);
      }
      
      // Border
      ctx.strokeStyle = '#F4D03F';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + offsetY, 40, 40);
      
      // Ability name
      ctx.fillStyle = '#FFF';
      ctx.font = '10px Arial';
      ctx.fillText(ability.name.substring(0, 6), x + 45, y + offsetY + 15);
      
      // Cooldown time
      if (remaining > 0) {
        ctx.fillText(`${(remaining / 1000).toFixed(1)}s`, x + 45, y + offsetY + 30);
      }
      
      offsetY += 50;
    });
  }
}

// ============================================================================
// UI SYSTEM
// ============================================================================

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.elements = [];
    this.notifications = [];
    this.fadeInDuration = 300;
    this.fadeOutDuration = 300;
  }

  showNotification(text, duration = 3000, type = 'info') {
    this.notifications.push({
      text,
      duration,
      type,
      createdAt: Date.now(),
      alpha: 0,
      fadingOut: false,
    });
  }

  updateNotifications() {
    const now = Date.now();
    
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const notif = this.notifications[i];
      const elapsed = now - notif.createdAt;
      
      // Fade in
      if (elapsed < this.fadeInDuration) {
        notif.alpha = elapsed / this.fadeInDuration;
      }
      // Display
      else if (elapsed < notif.duration - this.fadeOutDuration) {
        notif.alpha = 1;
      }
      // Fade out
      else if (elapsed < notif.duration) {
        const fadeProgress = (elapsed - (notif.duration - this.fadeOutDuration)) / this.fadeOutDuration;
        notif.alpha = 1 - fadeProgress;
        notif.fadingOut = true;
      }
      // Remove
      else {
        this.notifications.splice(i, 1);
      }
    }
  }

  renderNotifications(ctx) {
    let offsetY = 100;
    
    this.notifications.forEach(notif => {
      ctx.save();
      ctx.globalAlpha = notif.alpha;
      
      // Background
      const colors = {
        info: 'rgba(66, 153, 225, 0.9)',
        success: 'rgba(72, 187, 120, 0.9)',
        warning: 'rgba(237, 137, 54, 0.9)',
        error: 'rgba(229, 62, 62, 0.9)',
      };
      
      ctx.fillStyle = colors[notif.type] || colors.info;
      const textWidth = ctx.measureText(notif.text).width;
      const boxWidth = textWidth + 40;
      const x = (this.canvas.width - boxWidth) / 2;
      
      ctx.fillRect(x, offsetY, boxWidth, 50);
      
      // Border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, offsetY, boxWidth, 50);
      
      // Text
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(notif.text, this.canvas.width / 2, offsetY + 30);
      
      ctx.restore();
      
      offsetY += 60;
    });
  }

  update() {
    this.updateNotifications();
  }

  render(ctx) {
    this.renderNotifications(ctx);
  }
}

// ============================================================================
// SCENE TRANSITION SYSTEM
// ============================================================================

export class SceneTransition {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.progress = 0;
    this.duration = 1000;
    this.type = 'fade'; // 'fade', 'wipe', 'circle'
    this.direction = 'out'; // 'out' or 'in'
    this.onComplete = null;
  }

  start(type, direction, duration, onComplete) {
    this.active = true;
    this.progress = 0;
    this.type = type || 'fade';
    this.direction = direction || 'out';
    this.duration = duration || 1000;
    this.onComplete = onComplete;
    this.startTime = Date.now();
  }

  update() {
    if (!this.active) return;
    
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(1, elapsed / this.duration);
    
    if (this.progress >= 1) {
      this.active = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    const alpha = this.direction === 'out' ? this.progress : 1 - this.progress;
    
    switch (this.type) {
      case 'fade':
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
        
      case 'wipe':
        ctx.fillStyle = '#000';
        const wipeWidth = this.canvas.width * alpha;
        ctx.fillRect(0, 0, wipeWidth, this.canvas.height);
        break;
        
      case 'circle':
        ctx.fillStyle = '#000';
        const maxRadius = Math.sqrt(
          Math.pow(this.canvas.width / 2, 2) +
          Math.pow(this.canvas.height / 2, 2)
        );
        const radius = maxRadius * (this.direction === 'out' ? 1 - alpha : alpha);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          this.canvas.width / 2,
          this.canvas.height / 2,
          radius,
          0,
          Math.PI * 2
        );
        ctx.clip();
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
        break;
    }
    
    ctx.restore();
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================================

export class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frameTime = 16.67;
    this.frames = [];
    this.maxSamples = 60;
    this.lastTime = performance.now();
  }

  update() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    this.frames.push(delta);
    if (this.frames.length > this.maxSamples) {
      this.frames.shift();
    }
    
    const avgDelta = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.frameTime = avgDelta;
    this.fps = 1000 / avgDelta;
  }

  getFPS() {
    return Math.round(this.fps);
  }

  getFrameTime() {
    return Math.round(this.frameTime * 10) / 10;
  }

  render(ctx, x, y) {
    ctx.save();
    ctx.font = '12px monospace';
    ctx.fillStyle = this.fps < 30 ? '#E53E3E' : this.fps < 50 ? '#F6AD55' : '#48BB78';
    ctx.fillText(`FPS: ${this.getFPS()}`, x, y);
    ctx.fillText(`Frame: ${this.getFrameTime()}ms`, x, y + 15);
    ctx.restore();
  }
}

export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize || 100;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  insert(entity) {
    const cells = this.getCells(entity.bounds);
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey).push(entity);
    });
  }

  query(bounds) {
    const cells = this.getCells(bounds);
    const results = new Set();
    
    cells.forEach(cellKey => {
      const entities = this.grid.get(cellKey);
      if (entities) {
        entities.forEach(entity => results.add(entity));
      }
    });
    
    return Array.from(results);
  }

  getCells(bounds) {
    const cells = [];
    const minX = Math.floor(bounds.minX / this.cellSize);
    const maxX = Math.floor(bounds.maxX / this.cellSize);
    const minY = Math.floor(bounds.minY / this.cellSize);
    const maxY = Math.floor(bounds.maxY / this.cellSize);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    
    return cells;
  }
}

export class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.available = [];
    this.inUse = new Set();
    
    // Pre-create objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  acquire() {
    let obj;
    
    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.factory();
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (!this.inUse.has(obj)) return;
    
    this.inUse.delete(obj);
    this.available.push(obj);
    
    // Reset object if it has a reset method
    if (obj.reset) {
      obj.reset();
    }
  }

  clear() {
    this.available = [];
    this.inUse.clear();
  }
}

// ============================================================================
// MINIMAP SYSTEM
// ============================================================================

export class Minimap {
  constructor(config) {
    this.width = config.width || 200;
    this.height = config.height || 150;
    this.x = config.x || 10;
    this.y = config.y || 10;
    this.scale = config.scale || 0.1;
    this.visible = true;
    this.levelBounds = config.levelBounds;
  }

  toggle() {
    this.visible = !this.visible;
  }

  render(ctx, player, entities, platforms) {
    if (!this.visible) return;
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Border
    ctx.strokeStyle = '#F4D03F';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Platforms
    ctx.fillStyle = '#718096';
    platforms.forEach(platform => {
      const x = this.x + (platform.position.x - this.levelBounds.minX) * this.scale;
      const y = this.y + (platform.position.y - this.levelBounds.minY) * this.scale;
      ctx.fillRect(x, y, 5, 2);
    });
    
    // Enemies
    ctx.fillStyle = '#E53E3E';
    entities.enemies?.forEach(enemy => {
      if (enemy.state === 'dead') return;
      const x = this.x + (enemy.body.position.x - this.levelBounds.minX) * this.scale;
      const y = this.y + (enemy.body.position.y - this.levelBounds.minY) * this.scale;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // NPCs
    ctx.fillStyle = '#48BB78';
    entities.npcs?.forEach(npc => {
      const x = this.x + (npc.body.position.x - this.levelBounds.minX) * this.scale;
      const y = this.y + (npc.body.position.y - this.levelBounds.minY) * this.scale;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Player
    ctx.fillStyle = '#F4D03F';
    const px = this.x + (player.position.x - this.levelBounds.minX) * this.scale;
    const py = this.y + (player.position.y - this.levelBounds.minY) * this.scale;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    ctx.strokeStyle = '#F4D03F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 8, py + Math.sin(player.angle) * 8);
    ctx.stroke();
    
    ctx.restore();
  }
}

// ============================================================================
// DEBUG TOOLS
// ============================================================================

export class DebugOverlay {
  constructor() {
    this.enabled = false;
    this.showColliders = false;
    this.showGrid = false;
    this.showVelocity = false;
    this.showAI = false;
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  renderColliders(ctx, bodies) {
    if (!this.enabled || !this.showColliders) return;
    
    ctx.save();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    bodies.forEach(body => {
      ctx.beginPath();
      const vertices = body.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // Center of mass
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  renderVelocity(ctx, body) {
    if (!this.enabled || !this.showVelocity) return;
    
    ctx.save();
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(body.position.x, body.position.y);
    ctx.lineTo(
      body.position.x + body.velocity.x * 10,
      body.position.y + body.velocity.y * 10
    );
    ctx.stroke();
    
    ctx.restore();
  }

  renderGrid(ctx, canvas, cellSize = 100) {
    if (!this.enabled || !this.showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  renderAIDebug(ctx, enemies) {
    if (!this.enabled || !this.showAI) return;
    
    enemies.forEach(enemy => {
      const { position } = enemy.body;
      
      // State text
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px monospace';
      ctx.fillText(enemy.state, position.x - 20, position.y - 30);
      
      // Detection radius
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(position.x, position.y, enemy.detectionRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Attack radius
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(position.x, position.y, enemy.attackRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  render(ctx, gameState) {
    if (!this.enabled) return;
    
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 120);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '12px monospace';
    ctx.fillText('DEBUG MODE', 20, 30);
    ctx.fillText(`[1] Colliders: ${this.showColliders}`, 20, 50);
    ctx.fillText(`[2] Grid: ${this.showGrid}`, 20, 65);
    ctx.fillText(`[3] Velocity: ${this.showVelocity}`, 20, 80);
    ctx.fillText(`[4] AI: ${this.showAI}`, 20, 95);
    ctx.fillText(`[~] Toggle Debug`, 20, 115);
    
    ctx.restore();
  }
}

// ============================================================================
// INTEGRATED GAME STATE MANAGER
// ============================================================================

export class GameStateManager {
  constructor() {
    this.currentChapter = 0;
    this.currentCheckpoint = null;
    this.health = 5;
    this.maxHealth = 5;
    this.warmth = 100;
    this.maxWarmth = 100;
    this.shards = 0;
    this.inventory = [];
    this.abilities = new Set();
    this.flags = new Map(); // Game flags for story progression
    this.completedQuests = [];
    this.activeQuests = [];
    this.achievements = [];
    this.playtime = 0;
    this.deaths = 0;
    this.enemiesDefeated = 0;
    this.shardsCollected = 0;
    this.listeners = new Map();
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // Health system
  takeDamage(amount) {
    const oldHealth = this.health;
    this.health = Math.max(0, this.health - amount);
    
    this.emit('healthChanged', {
      old: oldHealth,
      new: this.health,
      damage: amount,
    });
    
    if (this.health <= 0) {
      this.emit('death', {});
      this.deaths++;
    }
    
    return this.health;
  }

  restoreHealth(amount) {
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    this.emit('healthChanged', {
      old: oldHealth,
      new: this.health,
      healed: amount,
    });
    
    return this.health;
  }

  // Warmth system
  drainWarmth(amount) {
    const oldWarmth = this.warmth;
    this.warmth = Math.max(0, this.warmth - amount);
    
    this.emit('warmthChanged', {
      old: oldWarmth,
      new: this.warmth,
    });
    
    // Take damage when warmth reaches zero
    if (this.warmth <= 0) {
      this.takeDamage(1);
    }
    
    return this.warmth;
  }

  restoreWarmth(amount) {
    const oldWarmth = this.warmth;
    this.warmth = Math.min(this.maxWarmth, this.warmth + amount);
    
    this.emit('warmthChanged', {
      old: oldWarmth,
      new: this.warmth,
    });
    
    return this.warmth;
  }

  // Shards
  collectShard() {
    this.shards++;
    this.shardsCollected++;
    
    this.emit('shardCollected', {
      total: this.shards,
    });
    
    return this.shards;
  }

  spendShards(amount) {
    if (this.shards < amount) return false;
    
    this.shards -= amount;
    this.emit('shardsSpent', {
      amount,
      remaining: this.shards,
    });
    
    return true;
  }

  // Flags for story progression
  setFlag(key, value) {
    this.flags.set(key, value);
    this.emit('flagChanged', { key, value });
  }

  getFlag(key) {
    return this.flags.get(key);
  }

  hasFlag(key) {
    return this.flags.has(key);
  }

  // Checkpoints
  setCheckpoint(checkpointId, position) {
    this.currentCheckpoint = {
      id: checkpointId,
      position,
      timestamp: Date.now(),
    };
    
    this.emit('checkpointReached', this.currentCheckpoint);
  }

  respawn() {
    if (!this.currentCheckpoint) return null;
    
    this.health = this.maxHealth;
    this.warmth = this.maxWarmth;
    
    this.emit('respawn', this.currentCheckpoint);
    
    return this.currentCheckpoint.position;
  }

  // Quest management
  startQuest(quest) {
    this.activeQuests.push(quest);
    this.emit('questStarted', quest);
  }

  completeQuest(quest) {
    this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
    this.completedQuests.push(quest);
    this.emit('questCompleted', quest);
    
    // Apply rewards
    if (quest.rewards.shards) {
      this.shards += quest.rewards.shards;
    }
    if (quest.rewards.maxHealth) {
      this.maxHealth += quest.rewards.maxHealth;
      this.health = this.maxHealth;
    }
    if (quest.rewards.ability) {
      this.abilities.add(quest.rewards.ability);
    }
  }

  // Inventory
  addItem(item) {
    this.inventory.push(item);
    this.emit('itemAdded', item);
  }

  removeItem(itemId) {
    const index = this.inventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const item = this.inventory.splice(index, 1)[0];
      this.emit('itemRemoved', item);
      return item;
    }
    return null;
  }

  hasItem(itemId) {
    return this.inventory.some(i => i.id === itemId);
  }

  // Serialization
  toJSON() {
    return {
      currentChapter: this.currentChapter,
      currentCheckpoint: this.currentCheckpoint,
      health: this.health,
      maxHealth: this.maxHealth,
      warmth: this.warmth,
      maxWarmth: this.maxWarmth,
      shards: this.shards,
      inventory: this.inventory,
      abilities: Array.from(this.abilities),
      flags: Array.from(this.flags.entries()),
      completedQuests: this.completedQuests,
      activeQuests: this.activeQuests,
      achievements: this.achievements,
      playtime: this.playtime,
      deaths: this.deaths,
      enemiesDefeated: this.enemiesDefeated,
      shardsCollected: this.shardsCollected,
    };
  }

  fromJSON(data) {
    Object.assign(this, data);
    this.abilities = new Set(data.abilities);
    this.flags = new Map(data.flags);
  }
}

// ============================================================================
// ADVANCED LEVEL FEATURES
// ============================================================================

export class InteractiveDoor {
  constructor(config) {
    this.id = config.id;
    this.position = config.position;
    this.body = config.body;
    this.locked = config.locked || false;
    this.keyRequired = config.keyRequired;
    this.open = false;
    this.opening = false;
    this.openProgress = 0;
    this.destination = config.destination;
  }

  interact(player, gameState) {
    if (this.locked) {
      if (this.keyRequired && !gameState.hasItem(this.keyRequired)) {
        return {
          success: false,
          message: 'Locked - Key required',
        };
      }
      this.locked = false;
    }
    
    this.opening = true;
    return {
      success: true,
      destination: this.destination,
    };
  }

  update(deltaTime) {
    if (this.opening && this.openProgress < 1) {
      this.openProgress += deltaTime / 1000;
      if (this.openProgress >= 1) {
        this.open = true;
        this.opening = false;
      }
    }
  }

  render(ctx) {
    const { position } = this;
    
    ctx.save();
    ctx.translate(position.x, position.y);
    
    // Door frame
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-40, -80, 80, 160);
    
    // Door
    if (!this.open) {
      const offset = this.openProgress * 70;
      ctx.fillStyle = '#654321';
      ctx.fillRect(-35 + offset, -75, 70, 150);
      
      // Handle
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(-10 + offset, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Lock indicator
    if (this.locked) {
      ctx.fillStyle = '#E53E3E';
      ctx.font = '24px Arial';
      ctx.fillText('🔒', -12, -85);
    }
    
    ctx.restore();
  }
}

export class Lever {
  constructor(config) {
    this.id = config.id;
    this.position = config.position;
    this.active = false;
    this.onActivate = config.onActivate;
    this.oneTime = config.oneTime || false;
    this.used = false;
  }

  interact() {
    if (this.oneTime && this.used) return false;
    
    this.active = !this.active;
    this.used = true;
    
    if (this.onActivate) {
      this.onActivate(this.active);
    }
    
    return true;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    // Base
    ctx.fillStyle = '#718096';
    ctx.fillRect(-15, 0, 30, 40);
    
    // Lever
    ctx.strokeStyle = this.active ? '#48BB78' : '#E53E3E';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    const angle = this.active ? -Math.PI / 4 : Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(Math.cos(angle) * 25, 20 + Math.sin(angle) * 25);
    ctx.stroke();
    
    // Handle
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 25, 20 + Math.sin(angle) * 25, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class PressurePlate {
  constructor(config) {
    this.id = config.id;
    this.position = config.position;
    this.body = config.body;
    this.pressed = false;
    this.requiredWeight = config.requiredWeight || 1;
    this.currentWeight = 0;
    this.onActivate = config.onActivate;
    this.onDeactivate = config.onDeactivate;
  }

  update(bodies) {
    const { Query } = M();
    const touching = Query.collides(this.body, bodies);
    
    const oldWeight = this.currentWeight;
    this.currentWeight = touching.length;
    
    const wasPressed = this.pressed;
    this.pressed = this.currentWeight >= this.requiredWeight;
    
    if (this.pressed && !wasPressed) {
      if (this.onActivate) this.onActivate();
    } else if (!this.pressed && wasPressed) {
      if (this.onDeactivate) this.onDeactivate();
    }
  }

  render(ctx) {
    ctx.save();
    
    const vertices = this.body.vertices;
    
    ctx.fillStyle = this.pressed ? '#48BB78' : '#718096';
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#4A5568';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
  }
}

export class BreakableWall {
  constructor(config) {
    this.id = config.id;
    this.body = config.body;
    this.hp = config.hp || 3;
    this.maxHp = this.hp;
    this.broken = false;
    this.cracks = [];
  }

  takeDamage(amount) {
    if (this.broken) return false;
    
    this.hp -= amount;
    
    // Add crack visual
    this.cracks.push({
      x: Math.random(),
      y: Math.random(),
      angle: Math.random() * Math.PI * 2,
    });
    
    if (this.hp <= 0) {
      this.broken = true;
      return true; // Wall destroyed
    }
    
    return false;
  }

  render(ctx) {
    if (this.broken) return;
    
    const vertices = this.body.vertices;
    
    // Wall
    ctx.fillStyle = '#A0AEC0';
    ctx.strokeStyle = '#718096';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cracks
    ctx.strokeStyle = '#4A5568';
    ctx.lineWidth = 2;
    
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[0].y);
    
    this.cracks.forEach(crack => {
      const x = vertices[0].x + crack.x * width;
      const y = vertices[0].y + crack.y * height;
      const len = 20;
      
      ctx.beginPath();
      ctx.moveTo(
        x - Math.cos(crack.angle) * len,
        y - Math.sin(crack.angle) * len
      );
      ctx.lineTo(
        x + Math.cos(crack.angle) * len,
        y + Math.sin(crack.angle) * len
      );
      ctx.stroke();
    });
    
    // HP indicator
    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#48BB78' : hpPercent > 0.25 ? '#F6AD55' : '#E53E3E';
    const barWidth = width * 0.8;
    const barX = vertices[0].x + (width - barWidth) / 2;
    const barY = vertices[0].y + height + 10;
    
    ctx.fillRect(barX, barY, barWidth * hpPercent, 5);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(barX, barY, barWidth, 5);
  }
}

export class TeleportPad {
  constructor(config) {
    this.id = config.id;
    this.position = config.position;
    this.body = config.body;
    this.destination = config.destination;
    this.cooldown = config.cooldown || 1000;
    this.lastUsed = 0;
    this.active = true;
    this.animationTime = 0;
  }

  canUse() {
    return this.active && Date.now() - this.lastUsed >= this.cooldown;
  }

  use(player) {
    if (!this.canUse()) return null;
    
    this.lastUsed = Date.now();
    
    const { Body } = M();
    Body.setPosition(player, this.destination);
    
    return {
      success: true,
      destination: this.destination,
    };
  }

  update(deltaTime) {
    this.animationTime += deltaTime;
  }

  render(ctx) {
    const { position } = this;
    const pulse = Math.sin(this.animationTime * 0.005) * 0.3 + 0.7;
    
    ctx.save();
    ctx.translate(position.x, position.y);
    
    // Outer ring
    ctx.strokeStyle = `rgba(100, 200, 255, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center
    ctx.fillStyle = `rgba(150, 220, 255, ${pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Particles
    for (let i = 0; i < 8; i++) {
      const angle = (this.animationTime * 0.001 + i * Math.PI / 4) % (Math.PI * 2);
      const x = Math.cos(angle) * 30;
      const y = Math.sin(angle) * 30;
      
      ctx.fillStyle = '#64B5F6';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

// ============================================================================
// BOSS FIGHT SYSTEM
// ============================================================================

export class BossController extends EnemyAI {
  constructor(body, bossConfig, aiManager, playerRef) {
    super(body, 'boss', aiManager, playerRef);
    
    this.name = bossConfig.name;
    this.hp = bossConfig.hp || 200;
    this.maxHp = this.hp;
    this.phases = bossConfig.phases || [];
    this.currentPhase = 0;
    this.attacks = bossConfig.attacks || [];
    this.attackPattern = 0;
    this.enraged = false;
    this.vulnerable = false;
    this.invulnerable = false;
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    const phaseThreshold = 1 - (this.currentPhase + 1) / this.phases.length;
    
    if (hpPercent <= phaseThreshold && this.currentPhase < this.phases.length - 1) {
      this.enterNextPhase();
    }
    
    // Boss-specific AI
    this.updateBossAI(deltaTime);
  }

  enterNextPhase() {
    this.currentPhase++;
    const phase = this.phases[this.currentPhase];
    
    console.log(`[Boss] Entering phase ${this.currentPhase + 1}: ${phase.name}`);
    
    // Apply phase changes
    if (phase.enraged) this.enraged = true;
    if (phase.speed) this.speed = phase.speed;
    if (phase.damage) this.damage = phase.damage;
    
    // Trigger phase event (cutscene, dialogue, etc.)
    this.emit('phaseChange', {
      phase: this.currentPhase,
      config: phase,
    });
  }

  updateBossAI(deltaTime) {
    if (this.invulnerable) return;
    
    // Execute attack pattern
    const attack = this.attacks[this.attackPattern];
    if (attack && this.canAttack()) {
      this.executeAttack(attack);
      this.attackPattern = (this.attackPattern + 1) % this.attacks.length;
    }
  }

  executeAttack(attack) {
    console.log(`[Boss] Executing attack: ${attack.name}`);
    
    switch (attack.type) {
      case 'charge':
        this.chargeAttack();
        break;
      case 'projectile':
        this.projectileAttack(attack);
        break;
      case 'aoe':
        this.aoeAttack(attack);
        break;
      case 'summon':
        this.summonMinions(attack);
        break;
    }
  }

  chargeAttack() {
    if (!this.playerRef) return;
    
    const dx = this.playerRef.position.x - this.body.position.x;
    const dy = this.playerRef.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const { Body } = M();
      Body.setVelocity(this.body, {
        x: (dx / dist) * 8,
        y: (dy / dist) * 8,
      });
    }
  }

  projectileAttack(attack) {
    // This would spawn projectile entities
    return {
      type: 'projectile',
      position: this.body.position,
      direction: this.getPlayerDirection(),
      damage: attack.damage || 15,
    };
  }

  aoeAttack(attack) {
    return {
      type: 'aoe',
      position: this.body.position,
      radius: attack.radius || 150,
      damage: attack.damage || 20,
    };
  }

  summonMinions(attack) {
    return {
      type: 'summon',
      count: attack.count || 3,
      enemyType: attack.enemyType || 'scout',
    };
  }

  getPlayerDirection() {
    if (!this.playerRef) return { x: 1, y: 0 };
    
    const dx = this.playerRef.position.x - this.body.position.x;
    const dy = this.playerRef.position.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 1, y: 0 };
  }

  render(ctx) {
    super.render(ctx);
    
    // Boss name plate
    const { position } = this.body;
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(position.x - 100, position.y - 60, 200, 30);
    
    // Border
    ctx.strokeStyle = '#E53E3E';
    ctx.lineWidth = 2;
    ctx.strokeRect(position.x - 100, position.y - 60, 200, 30);
    
    // Boss name
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, position.x, position.y - 40);
    
    // Phase indicator
    if (this.phases.length > 0) {
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(
        `Phase ${this.currentPhase + 1}/${this.phases.length}`,
        position.x,
        position.y - 65
      );
    }
    
    ctx.restore();
  }
}

// All functions exported inline above
