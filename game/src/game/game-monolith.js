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

// All functions exported inline above
