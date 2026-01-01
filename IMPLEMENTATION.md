# Otterblade Odyssey: Implementation Guide

> A comprehensive technical guide for implementing game features, based on proven patterns from POC development.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Physics System (Matter.js)](#physics-system-matterjs)
3. [Rendering Pipeline (Canvas 2D)](#rendering-pipeline-canvas-2d)
4. [Character Implementation](#character-implementation)
5. [Enemy AI with Yuka](#enemy-ai-with-yuka)
6. [Level Design & Chapters](#level-design--chapters)
7. [State Management (Zustand)](#state-management-zustand)
8. [Collision & Interaction System](#collision--interaction-system)
9. [Audio Pipeline](#audio-pipeline)
10. [Input Handling](#input-handling)
11. [Procedural Generation](#procedural-generation)
12. [Asset Manifest System](#asset-manifest-system)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Physics | Matter.js | 2D rigid body physics, collision detection |
| Rendering | Canvas 2D API | Procedural drawing, parallax backgrounds |
| State | Zustand + persist | Game state with Capacitor-aware persistence |
| AI | Yuka | Steering behaviors, FSM, pathfinding |
| Audio | Howler.js | Sound playback, spatial audio |
| UI | React + MUI | Menus, HUD, dialogs |

### Directory Structure

```
client/src/
├── game/
│   ├── core/            # Physics, rendering, game loop
│   │   ├── engine.ts    # Matter.js engine wrapper
│   │   ├── renderer.ts  # Canvas 2D renderer
│   │   └── loop.ts      # RequestAnimationFrame loop
│   ├── entities/        # Game entities
│   │   ├── player.ts    # Finn implementation
│   │   ├── enemies/     # Enemy types
│   │   └── npcs/        # NPC implementations
│   ├── systems/         # Game systems
│   │   ├── collision.ts # Collision handlers
│   │   ├── ai.ts        # Yuka AI manager
│   │   └── warmth.ts    # Warmth drain system
│   ├── drawing/         # Procedural drawing functions
│   │   ├── characters/  # Character drawing (Finn, enemies)
│   │   ├── environment/ # Platforms, backgrounds
│   │   └── effects/     # Particles, post-process
│   ├── store.ts         # Zustand state
│   └── constants.ts     # Game constants
├── data/
│   └── manifests/       # JSON content definitions
│       ├── chapters/    # Per-chapter level data
│       ├── schema/      # JSON schemas
│       └── *.json       # Other manifests
└── components/
    └── hud/             # Game UI components
```

---

## Physics System (Matter.js)

### Engine Setup

```typescript
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events, Query } = Matter;

// Create engine with custom gravity
const engine = Engine.create({
  gravity: { x: 0, y: 1.5 }, // Slightly heavier than default for otter weight
});

// Collision categories (bitmask)
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PLATFORM: 0x0004,
  ITEM: 0x0008,
  TRIGGER: 0x0010,
  PROJECTILE: 0x0020,
} as const;
```

### Compound Bodies for Characters

For realistic hitboxes that feel like an otter:

```typescript
/**
 * Creates Finn's physics body with proper otter proportions.
 * Compound body for head, torso, and tail collision.
 */
function createPlayerBody(x: number, y: number): Matter.Body {
  // Main torso - slightly wider for otter shape
  const torso = Bodies.rectangle(0, 0, 28, 40, {
    label: 'player_torso',
  });

  // Head - positioned above torso
  const head = Bodies.circle(0, -25, 12, {
    label: 'player_head',
  });

  // Create compound body
  const player = Body.create({
    parts: [torso, head],
    friction: 0.1,
    frictionAir: 0.02,
    restitution: 0,
    label: 'player',
    collisionFilter: {
      category: COLLISION_GROUPS.PLAYER,
      mask: COLLISION_GROUPS.PLATFORM | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.ITEM,
    },
  });

  Body.setPosition(player, { x, y });
  return player;
}
```

### Platform Types

```typescript
interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'semi_solid' | 'ice' | 'crumbling';
}

function createPlatform(config: PlatformConfig): Matter.Body {
  const options: Matter.IBodyDefinition = {
    isStatic: true,
    label: `platform_${config.type}`,
    friction: config.type === 'ice' ? 0.02 : 0.8,
    collisionFilter: {
      category: COLLISION_GROUPS.PLATFORM,
    },
  };

  // Semi-solid platforms (jump through from below)
  if (config.type === 'semi_solid') {
    options.isSensor = false; // Handled in collision callback
  }

  const platform = Bodies.rectangle(
    config.x, config.y,
    config.width, config.height,
    options
  );

  // Store metadata for rendering
  platform.platformType = config.type;
  return platform;
}
```

### Collision Detection

```typescript
Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;
    
    // Player landing on platform
    if (hasLabel(bodyA, 'player') && hasLabel(bodyB, 'platform')) {
      handlePlayerLand(bodyA, bodyB);
    }
    
    // Player touching enemy
    if (hasLabel(bodyA, 'player') && hasLabel(bodyB, 'enemy')) {
      handlePlayerEnemyContact(bodyA, bodyB);
    }
    
    // Player collecting item
    if (hasLabel(bodyA, 'player') && hasLabel(bodyB, 'item')) {
      handleItemCollection(bodyB);
    }
  }
});

// Semi-solid platform logic
Events.on(engine, 'beforeCollision', (event) => {
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;
    
    if (bodyB.platformType === 'semi_solid') {
      const playerBottom = bodyA.position.y + 20;
      const platformTop = bodyB.position.y - bodyB.bounds.max.y / 2;
      
      // Disable collision if player is below platform
      if (playerBottom > platformTop || bodyA.velocity.y < 0) {
        pair.isActive = false;
      }
    }
  }
});
```

---

## Rendering Pipeline (Canvas 2D)

### Renderer Setup

```typescript
interface Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: { x: number; y: number; zoom: number };
  time: number;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!;
  
  return {
    canvas,
    ctx,
    camera: { x: 0, y: 0, zoom: 1 },
    time: 0,
  };
}

function render(renderer: Renderer, gameState: GameState): void {
  const { ctx, canvas, camera, time } = renderer;
  
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Save state
  ctx.save();
  
  // Apply camera transform
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  
  // Render layers (back to front)
  renderParallaxBackground(renderer, gameState);
  renderPlatforms(renderer, gameState);
  renderItems(renderer, gameState);
  renderEnemies(renderer, gameState);
  renderPlayer(renderer, gameState);
  renderParticles(renderer, gameState);
  renderPostProcess(renderer, gameState);
  
  // Restore
  ctx.restore();
  
  // HUD renders without camera transform
  renderHUD(renderer, gameState);
  
  renderer.time++;
}
```

### Parallax Background System

```typescript
interface ParallaxLayer {
  factor: number;  // 0.1 = far background, 0.9 = near foreground
  render: (ctx: CanvasRenderingContext2D, offset: number, time: number) => void;
}

function renderParallaxBackground(renderer: Renderer, gameState: GameState): void {
  const { ctx, canvas, camera } = renderer;
  
  for (const layer of gameState.chapter.parallaxLayers) {
    const offset = camera.x * layer.factor;
    
    ctx.save();
    ctx.translate(-offset, 0);
    
    layer.render(ctx, offset, renderer.time);
    
    ctx.restore();
  }
}

// Example: Procedural forest background
function renderForestLayer(ctx: CanvasRenderingContext2D, offset: number, time: number): void {
  const treeSpacing = 120;
  const startX = Math.floor(offset / treeSpacing) * treeSpacing;
  
  for (let x = startX; x < startX + 1200; x += treeSpacing) {
    const seed = x * 0.1;
    const height = 100 + Math.sin(seed) * 50;
    const sway = Math.sin(time * 0.02 + seed) * 3;
    
    // Tree trunk
    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(x + sway, 400 - height, 20, height);
    
    // Foliage
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x + 10 + sway, 400 - height - 30, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

---

## Character Implementation

### Finn (Player Character)

The complete procedural drawing function for Finn:

```typescript
type FinnState = 'idle' | 'walking' | 'jumping' | 'falling' | 'attacking' | 'rolling' | 'slinking' | 'hurt';

interface FinnDrawContext {
  x: number;
  y: number;
  facing: 1 | -1;
  state: FinnState;
  animFrame: number;
  warmth: number;
  maxWarmth: number;
  attackFrame?: number;
}

/**
 * Draws Finn the Otter protagonist.
 * 
 * Color Palette:
 * - Fur: #8B6F47 (warm brown)
 * - Chest: #D4A574 (lighter tan)
 * - Outline: #6B5D4F (dark brown)
 * - Vest: #654321 (leather brown)
 * - Belt buckle: #F4D03F (gold)
 * - Blade: #ECF0F1 → #95A5A6 (gradient silver)
 * - Ember glow: #E67E22 (orange)
 */
export function drawFinn(ctx: CanvasRenderingContext2D, config: FinnDrawContext): void {
  const { x, y, facing, state, animFrame, warmth, maxWarmth } = config;
  
  ctx.save();
  ctx.translate(x, y);
  if (facing < 0) ctx.scale(-1, 1);
  
  const frame = Math.floor(animFrame / 10) % 4;
  const breathe = Math.sin(animFrame * 0.05) * 2;
  
  // ─────────────────────────────────────────────
  // 1. SHADOW
  // ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // ─────────────────────────────────────────────
  // 2. WARMTH AURA (visible when warm)
  // ─────────────────────────────────────────────
  const warmthRatio = warmth / maxWarmth;
  if (warmthRatio > 0.2) {
    const glowGradient = ctx.createRadialGradient(0, -10, 5, 0, -10, 40);
    glowGradient.addColorStop(0, `rgba(230, 126, 34, ${warmthRatio * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(230, 126, 34, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, -10, 40, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // ─────────────────────────────────────────────
  // 3. TAIL (animated wag)
  // ─────────────────────────────────────────────
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
  
  // ─────────────────────────────────────────────
  // 4. BACK LEG (with walk animation)
  // ─────────────────────────────────────────────
  ctx.fillStyle = '#8B6F47';
  if (state === 'walking') {
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
  
  // ─────────────────────────────────────────────
  // 5. BODY (with breathing)
  // ─────────────────────────────────────────────
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Chest fur (lighter)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // ─────────────────────────────────────────────
  // 6. LEATHER VEST
  // ─────────────────────────────────────────────
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.moveTo(-10, -8 + breathe);
  ctx.lineTo(-8, 8 + breathe);
  ctx.lineTo(8, 8 + breathe);
  ctx.lineTo(10, -8 + breathe);
  ctx.closePath();
  ctx.fill();
  
  // Belt
  ctx.fillStyle = '#5D4E37';
  ctx.fillRect(-10, 8 + breathe, 20, 4);
  ctx.fillStyle = '#F4D03F'; // Gold buckle
  ctx.fillRect(-2, 8 + breathe, 4, 4);
  
  // ─────────────────────────────────────────────
  // 7. FRONT LEG
  // ─────────────────────────────────────────────
  ctx.fillStyle = '#8B6F47';
  if (state === 'walking') {
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
  
  // ─────────────────────────────────────────────
  // 8. HEAD
  // ─────────────────────────────────────────────
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
  
  // ─────────────────────────────────────────────
  // 9. ARMS
  // ─────────────────────────────────────────────
  const armAngle = state === 'walking' ? Math.sin(frame * Math.PI / 2 + Math.PI) * 0.3 : 0;
  
  // Back arm
  ctx.fillStyle = '#8B6F47';
  ctx.save();
  ctx.translate(-10, -5 + breathe);
  ctx.rotate(armAngle);
  ctx.fillRect(-3, 0, 6, 15);
  ctx.beginPath();
  ctx.arc(0, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // ─────────────────────────────────────────────
  // 10. THE OTTERBLADE (when attacking)
  // ─────────────────────────────────────────────
  if (state === 'attacking') {
    ctx.save();
    ctx.translate(18, -8 + breathe);
    ctx.rotate(-Math.PI / 3);
    
    // Blade glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#E67E22';
    
    // Blade gradient
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
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  
  // Front arm
  const frontArmAngle = state === 'walking' ? Math.sin(frame * Math.PI / 2) * 0.3 :
                        state === 'attacking' ? -Math.PI / 4 : 0;
  ctx.fillStyle = '#8B6F47';
  ctx.save();
  ctx.translate(10, -5 + breathe);
  ctx.rotate(frontArmAngle);
  ctx.fillRect(-3, 0, 6, 15);
  ctx.beginPath();
  ctx.arc(0, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // ─────────────────────────────────────────────
  // 11. STATE-SPECIFIC EFFECTS
  // ─────────────────────────────────────────────
  if (state === 'rolling') {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#5DADE2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  if (state === 'slinking') {
    // Finn goes low on all fours
    // Body rotates and lowers
  }
  
  ctx.restore();
}
```

### Enemy Drawing (Galeborn Scout Example)

```typescript
interface EnemyDrawContext {
  x: number;
  y: number;
  facing: 1 | -1;
  type: 'scout' | 'frostwolf' | 'icebat' | 'frost_captain';
  hp: number;
  maxHp: number;
  animFrame: number;
}

export function drawGalebornScout(ctx: CanvasRenderingContext2D, config: EnemyDrawContext): void {
  const { x, y, facing, animFrame, hp, maxHp } = config;
  
  ctx.save();
  ctx.translate(x, y);
  if (facing < 0) ctx.scale(-1, 1);
  
  const frame = Math.floor(animFrame / 15) % 3;
  
  // Cold aura
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
  
  // Body (stoat/weasel shape)
  ctx.fillStyle = '#7F8C8D';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -5, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Head
  ctx.beginPath();
  ctx.ellipse(0, -20, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Pointed ears
  ctx.beginPath();
  ctx.arc(-5, -26, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -26, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Cold glowing eyes
  ctx.fillStyle = '#5DADE2';
  ctx.fillRect(-3, -21, 2, 3);
  ctx.fillRect(1, -21, 2, 3);
  
  // Frost breath particles
  ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(8 + i * 4, -18 + (Math.sin(animFrame * 0.1 + i) * 3), 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Spear arm
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
  
  // HP bar (if damaged)
  if (hp < maxHp) {
    const barWidth = 30;
    const barHeight = 4;
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-barWidth / 2, -35, barWidth, barHeight);
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(-barWidth / 2, -35, barWidth * (hp / maxHp), barHeight);
  }
  
  ctx.restore();
}
```

---

## Enemy AI with Yuka

### AI Manager Setup

```typescript
import { EntityManager, Time, GameEntity, StateMachine, State } from 'yuka';

class AIManager {
  private entityManager = new EntityManager();
  private time = new Time();
  
  update(delta: number): void {
    this.time.update();
    this.entityManager.update(this.time.getDelta());
  }
  
  addEnemy(enemy: EnemyEntity): void {
    this.entityManager.add(enemy);
  }
  
  removeEnemy(enemy: EnemyEntity): void {
    this.entityManager.remove(enemy);
  }
}
```

### Enemy Entity with FSM

```typescript
import { 
  GameEntity, 
  StateMachine, 
  State, 
  SteeringBehaviors,
  SeekBehavior,
  WanderBehavior,
  FleeBehavior
} from 'yuka';

class EnemyEntity extends GameEntity {
  stateMachine: StateMachine;
  steeringBehaviors: SteeringBehaviors;
  target: GameEntity | null = null;
  health: number;
  maxHealth: number;
  damage: number;
  aggroRadius: number;
  
  constructor(config: EnemyConfig) {
    super();
    
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.aggroRadius = config.aggroRadius;
    
    // Setup steering behaviors
    this.steeringBehaviors = new SteeringBehaviors(this);
    
    // Setup FSM
    this.stateMachine = new StateMachine(this);
    this.stateMachine.add('idle', new IdleState());
    this.stateMachine.add('patrol', new PatrolState());
    this.stateMachine.add('chase', new ChaseState());
    this.stateMachine.add('attack', new AttackState());
    this.stateMachine.add('flee', new FleeState());
    
    this.stateMachine.changeTo('idle');
  }
  
  update(delta: number): this {
    this.stateMachine.update();
    
    // Apply steering
    const force = this.steeringBehaviors.calculate();
    this.velocity.add(force.multiplyScalar(delta));
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(delta));
    
    return this;
  }
}
```

### State Implementations

```typescript
class IdleState extends State<EnemyEntity> {
  private idleTime = 0;
  
  enter(enemy: EnemyEntity): void {
    this.idleTime = 0;
  }
  
  execute(enemy: EnemyEntity): void {
    this.idleTime += 1;
    
    // Check for player in range
    const distToPlayer = enemy.position.distanceTo(player.position);
    if (distToPlayer < enemy.aggroRadius) {
      enemy.target = player;
      enemy.stateMachine.changeTo('chase');
      return;
    }
    
    // Start patrolling after idle time
    if (this.idleTime > 120) {
      enemy.stateMachine.changeTo('patrol');
    }
  }
  
  exit(enemy: EnemyEntity): void {}
}

class ChaseState extends State<EnemyEntity> {
  execute(enemy: EnemyEntity): void {
    if (!enemy.target) {
      enemy.stateMachine.changeTo('idle');
      return;
    }
    
    const distToTarget = enemy.position.distanceTo(enemy.target.position);
    
    // Lost target
    if (distToTarget > enemy.aggroRadius * 1.5) {
      enemy.target = null;
      enemy.stateMachine.changeTo('patrol');
      return;
    }
    
    // In attack range
    if (distToTarget < 50) {
      enemy.stateMachine.changeTo('attack');
      return;
    }
    
    // Seek toward target
    const seek = new SeekBehavior(enemy.target.position);
    enemy.steeringBehaviors.behaviors.push(seek);
  }
}

class AttackState extends State<EnemyEntity> {
  private cooldown = 0;
  
  enter(enemy: EnemyEntity): void {
    this.cooldown = 0;
  }
  
  execute(enemy: EnemyEntity): void {
    this.cooldown++;
    
    if (this.cooldown > 30) { // Attack every 30 frames
      if (enemy.target) {
        const distToTarget = enemy.position.distanceTo(enemy.target.position);
        if (distToTarget < 50) {
          // Deal damage
          damagePlayer(enemy.damage);
          this.cooldown = 0;
        } else {
          enemy.stateMachine.changeTo('chase');
        }
      }
    }
  }
}
```

---

## Level Design & Chapters

### Loading Chapter Data

```typescript
import type { ChapterManifest } from './types';

async function loadChapter(chapterId: number): Promise<ChapterManifest> {
  const response = await fetch(`/data/manifests/chapters/chapter-${chapterId}.json`);
  return response.json();
}

function instantiateChapter(chapter: ChapterManifest, engine: Matter.Engine): void {
  // Create platforms
  for (const segment of chapter.level.segments) {
    for (const platform of segment.platforms) {
      const body = createPlatform({
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: 25,
        type: platform.type as PlatformType,
      });
      World.add(engine.world, body);
    }
    
    // Create walls
    for (const wall of segment.walls ?? []) {
      const body = Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width,
        wall.height,
        { isStatic: true, label: 'wall' }
      );
      World.add(engine.world, body);
    }
  }
  
  // Spawn enemies
  for (const encounter of chapter.encounters) {
    if (!encounter.spawnedByTrigger) {
      spawnEnemy(encounter, engine);
    }
  }
  
  // Setup triggers
  for (const trigger of chapter.triggers) {
    registerTrigger(trigger);
  }
  
  // Setup NPCs
  for (const npc of chapter.npcs) {
    spawnNPC(npc, engine);
  }
}
```

### Trigger System

```typescript
interface Trigger {
  id: string;
  type: 'enter_region' | 'interact' | 'defeat_enemies' | 'timer';
  region?: { x: number; y: number; width: number; height: number };
  targetId?: string;
  requires?: string[];
  actions: TriggerAction[];
  once: boolean;
  fired: boolean;
}

class TriggerSystem {
  private triggers: Map<string, Trigger> = new Map();
  private completedTriggers: Set<string> = new Set();
  
  register(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }
  
  update(playerPos: { x: number; y: number }, gameState: GameState): void {
    for (const [id, trigger] of this.triggers) {
      if (trigger.once && trigger.fired) continue;
      
      // Check requirements
      if (trigger.requires?.some(req => !this.completedTriggers.has(req))) {
        continue;
      }
      
      let shouldFire = false;
      
      switch (trigger.type) {
        case 'enter_region':
          if (trigger.region && this.isInRegion(playerPos, trigger.region)) {
            shouldFire = true;
          }
          break;
          
        case 'defeat_enemies':
          if (gameState.enemies.length === 0) {
            shouldFire = true;
          }
          break;
      }
      
      if (shouldFire) {
        this.fireTrigger(trigger, gameState);
      }
    }
  }
  
  private fireTrigger(trigger: Trigger, gameState: GameState): void {
    trigger.fired = true;
    this.completedTriggers.add(trigger.id);
    
    for (const action of trigger.actions) {
      this.executeAction(action, gameState);
    }
  }
  
  private executeAction(action: TriggerAction, gameState: GameState): void {
    switch (action.type) {
      case 'show_toast':
        showToast(action.value as string);
        break;
      case 'spawn_enemies':
        (action.value as string[]).forEach(id => spawnEnemyById(id));
        break;
      case 'change_music':
        playMusic(action.target as string);
        break;
      case 'restore_warmth':
        gameState.warmth = Math.min(gameState.maxWarmth, gameState.warmth + (action.value as number));
        break;
      case 'shake_screen':
        startScreenShake(action.value as number);
        break;
      case 'start_sequence':
        startSequence(action.target as string);
        break;
    }
  }
  
  private isInRegion(pos: { x: number; y: number }, region: Trigger['region']): boolean {
    if (!region) return false;
    return pos.x >= region.x && 
           pos.x <= region.x + region.width &&
           pos.y >= region.y && 
           pos.y <= region.y + region.height;
  }
}
```

---

## State Management (Zustand)

### Store Structure

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage, STORAGE_KEYS } from '../lib/storage';

interface PersistedState {
  // Best scores and achievements
  bestScore: number;
  achievements: string[];
  unlockedChapters: number[];
  
  // Settings
  musicVolume: number;
  sfxVolume: number;
  hapticEnabled: boolean;
}

interface RuntimeState {
  // Current game session
  health: number;
  maxHealth: number;
  warmth: number;
  maxWarmth: number;
  emberShards: number;
  hearthstones: number;
  
  // Current chapter
  currentChapter: number;
  checkpointPosition: { x: number; y: number };
  
  // Controls
  controls: Controls;
  
  // Game state
  gameStarted: boolean;
  paused: boolean;
  gameOver: boolean;
}

export const useStore = create<PersistedState & RuntimeState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      bestScore: 0,
      achievements: [],
      unlockedChapters: [0],
      musicVolume: 0.7,
      sfxVolume: 0.8,
      hapticEnabled: true,
      
      // Runtime defaults
      health: 100,
      maxHealth: 100,
      warmth: 100,
      maxWarmth: 100,
      emberShards: 0,
      hearthstones: 0,
      currentChapter: 0,
      checkpointPosition: { x: 100, y: 450 },
      controls: createDefaultControls(),
      gameStarted: false,
      paused: false,
      gameOver: false,
      
      // Actions...
    }),
    {
      name: STORAGE_KEYS.GAME_SAVE,
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state): PersistedState => ({
        bestScore: state.bestScore,
        achievements: state.achievements,
        unlockedChapters: state.unlockedChapters,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        hapticEnabled: state.hapticEnabled,
      }),
    }
  )
);
```

---

## Audio Pipeline

### Audio Manager with Howler

```typescript
import { Howl, Howler } from 'howler';

interface AudioTrack {
  howl: Howl;
  volume: number;
  loop: boolean;
}

class AudioManager {
  private tracks: Map<string, AudioTrack> = new Map();
  private currentMusic: string | null = null;
  
  async preload(manifest: SoundManifest): Promise<void> {
    for (const sound of manifest.sounds) {
      const howl = new Howl({
        src: [sound.source],
        volume: sound.volume ?? 1,
        loop: sound.loop ?? false,
        preload: true,
      });
      
      this.tracks.set(sound.id, {
        howl,
        volume: sound.volume ?? 1,
        loop: sound.loop ?? false,
      });
    }
  }
  
  playSFX(id: string, options?: { volume?: number; pitch?: number }): void {
    const track = this.tracks.get(id);
    if (!track) return;
    
    const soundId = track.howl.play();
    
    if (options?.volume) {
      track.howl.volume(options.volume, soundId);
    }
    
    if (options?.pitch) {
      track.howl.rate(options.pitch, soundId);
    }
  }
  
  playMusic(id: string, fadeIn = 1000): void {
    // Fade out current music
    if (this.currentMusic) {
      const current = this.tracks.get(this.currentMusic);
      current?.howl.fade(current.volume, 0, fadeIn);
      setTimeout(() => current?.howl.stop(), fadeIn);
    }
    
    // Start new music
    const track = this.tracks.get(id);
    if (track) {
      track.howl.volume(0);
      track.howl.play();
      track.howl.fade(0, track.volume, fadeIn);
      this.currentMusic = id;
    }
  }
  
  setMusicVolume(volume: number): void {
    Howler.volume(volume);
  }
}

export const audioManager = new AudioManager();
```

---

## Input Handling

### Unified Input Manager

```typescript
interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  jump: boolean;
  attack: boolean;
  roll: boolean;
  slink: boolean;
  interact: boolean;
}

class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    up: false,
    jump: false,
    attack: false,
    roll: false,
    slink: false,
    interact: false,
  };
  
  private gamepadIndex: number | null = null;
  
  init(): void {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Gamepad
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true;
        break;
      case 'KeyW':
      case 'ArrowUp':
        this.state.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
      case 'ControlLeft':
        this.state.slink = true;
        break;
      case 'Space':
        e.preventDefault();
        this.state.jump = true;
        break;
      case 'KeyK':
      case 'KeyX':
        this.state.attack = true;
        break;
      case 'KeyL':
      case 'KeyC':
        this.state.roll = true;
        break;
      case 'KeyE':
      case 'KeyZ':
        this.state.interact = true;
        break;
    }
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'KeyW':
      case 'ArrowUp':
        this.state.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
      case 'ControlLeft':
        this.state.slink = false;
        break;
      case 'Space':
        this.state.jump = false;
        break;
      case 'KeyK':
      case 'KeyX':
        this.state.attack = false;
        break;
      case 'KeyL':
      case 'KeyC':
        this.state.roll = false;
        break;
      case 'KeyE':
      case 'KeyZ':
        this.state.interact = false;
        break;
    }
  }
  
  pollGamepad(): void {
    if (this.gamepadIndex === null) return;
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    if (!gamepad) return;
    
    // Left stick / D-pad
    this.state.left = gamepad.axes[0] < -0.3 || gamepad.buttons[14]?.pressed;
    this.state.right = gamepad.axes[0] > 0.3 || gamepad.buttons[15]?.pressed;
    this.state.up = gamepad.axes[1] < -0.3 || gamepad.buttons[12]?.pressed;
    this.state.slink = gamepad.axes[1] > 0.3 || gamepad.buttons[13]?.pressed;
    
    // Buttons (Xbox layout)
    this.state.jump = gamepad.buttons[0]?.pressed;     // A
    this.state.attack = gamepad.buttons[2]?.pressed;   // X
    this.state.roll = gamepad.buttons[1]?.pressed;     // B
    this.state.interact = gamepad.buttons[3]?.pressed; // Y
  }
  
  getState(): InputState {
    this.pollGamepad();
    return { ...this.state };
  }
  
  // Touch controls handled separately via React components
  setTouchControl(control: keyof InputState, value: boolean): void {
    this.state[control] = value;
  }
}

export const inputManager = new InputManager();
```

---

## Procedural Generation

### Simplex Noise for Terrain

```typescript
class SimplexNoise {
  private grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  private p: number[] = [];
  private perm: number[] = [];
  
  constructor(seed?: number) {
    const random = seed ? this.seededRandom(seed) : Math.random;
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(random() * 256);
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }
  
  noise(x: number, y: number): number {
    // Simplex noise implementation...
    // Returns value between -1 and 1
  }
  
  fractal(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return total / maxValue;
  }
}

// Usage for procedural terrain
function generateTerrainHeight(x: number, biome: BiomeConfig): number {
  const noise = new SimplexNoise(biome.seed);
  
  // Base terrain
  let height = noise.fractal(x * 0.01, 0, 4, 0.5) * biome.heightVariance;
  
  // Add biome-specific features
  if (biome.type === 'mountain') {
    height += Math.abs(noise.noise(x * 0.005, 0)) * 100;
  }
  
  return biome.baseHeight + height;
}
```

---

## Asset Manifest System

### Using Manifests for Content

All game content is defined in JSON manifests located in `client/src/data/manifests/`.

#### Schema Structure

- **`schema/chapter-schema.json`** - Complete chapter definition
- **`schema/sequences-schema.json`** - Scripted events
- **`schema/procedural-schema.json`** - Procedural assets
- **`schema/audio-schema.json`** - Sound definitions
- **`schema/input-schema.json`** - Input mappings

#### Loading Content

```typescript
import Ajv from 'ajv';
import chapterSchema from './schema/chapter-schema.json';

const ajv = new Ajv();
const validateChapter = ajv.compile(chapterSchema);

async function loadAndValidateChapter(chapterId: number): Promise<ChapterManifest> {
  const response = await fetch(`/manifests/chapters/chapter-${chapterId}.json`);
  const data = await response.json();
  
  if (!validateChapter(data)) {
    console.error('Invalid chapter manifest:', validateChapter.errors);
    throw new Error(`Invalid chapter ${chapterId}`);
  }
  
  return data as ChapterManifest;
}
```

---

## Animal Locomotion Terminology

To maintain brand consistency with otter-appropriate movement:

| Human Term | Otter Term | Description |
|------------|------------|-------------|
| Crouch | **Slink** | Going low on all fours, sneaking |
| Sprint | **Scamper** | Quick burst of speed |
| Walk | **Pad** | Normal movement |
| Swim | **Glide** | Water movement (if applicable) |
| Roll | **Tumble** | Evasive roll |
| Slide | **Belly-slide** | Sliding on belly (could be used for slopes) |

These terms are used in:
- UI/button labels
- Code variable names
- Documentation
- Chapter narratives

---

## Quick Reference

### Adding a New Enemy Type

1. Add to `client/src/data/manifests/enemies.json`
2. Create drawing function in `client/src/game/drawing/characters/`
3. Add AI behavior in `client/src/game/systems/ai.ts`
4. Register in enemy factory

### Adding a New Chapter

1. Create `chapter-{N}-{name}.json` in `client/src/data/manifests/chapters/`
2. Follow `chapter-schema.json` structure
3. Add required assets to manifests (cinematics, backgrounds, music)
4. Run asset generator if needed

### Adding a New NPC

1. Add character to `client/src/data/manifests/npcs.json`
2. Define `drawFunction` for procedural rendering
3. Set up behavior and interaction patterns
4. Reference in chapter manifest

### Adding a New Sound

1. Search Freesound: `pnpm --filter @otterblade/dev-tools cli -- --audio-search "query"`
2. Add to appropriate category or create manifest entry
3. Reference in chapter/interaction manifests

---

*"The code serves the story. Every function, every system, exists to make players feel like Finn."*
