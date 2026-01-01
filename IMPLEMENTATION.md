# Otterblade Odyssey: Implementation Guide

*Technical patterns and implementation standards for developers*

---

## Overview

This document provides concrete implementation patterns for Otterblade Odyssey. It bridges the gap between architectural documentation (CLAUDE.md, AGENTS.md) and practical development.

---

## Entity Component System (ECS)

### Core Concepts

We use **Miniplex** for entity management. Entities are plain objects with optional components.

```typescript
// world.ts - Entity type definition
export type Entity = {
  // Required for all entities with position
  position: { x: number; y: number; z: number };

  // Optional components
  velocity?: { x: number; y: number; z: number };
  player?: true;
  enemy?: { type: EnemyType; state: EnemyState };
  health?: { current: number; max: number };
  collectible?: { type: CollectibleType; value: number };
  sprite?: { texture: string; frame: number; flipX: boolean };
  hitbox?: { width: number; height: number; offsetX: number; offsetY: number };
};
```

### Query Patterns

```typescript
// Create focused queries for system logic
export const queries = {
  // Entities that need physics updates
  moving: world.with("position", "velocity"),

  // Damageable entities
  damageable: world.with("position", "health", "hitbox"),

  // Specific entity types
  players: world.with("player", "position"),
  enemies: world.with("enemy", "position", "health"),
  collectibles: world.with("collectible", "position"),
};
```

### System Implementation

```typescript
// systems.ts - Movement system
export function movementSystem(dt: number): void {
  // Safe iteration with ES2022 for...of
  for (const entity of queries.moving) {
    entity.position.x += entity.velocity.x * dt;
    entity.position.y += entity.velocity.y * dt;
    entity.position.z += entity.velocity.z * dt;
  }
}

// Gravity system with ground check
export function gravitySystem(dt: number, gravity: number): void {
  for (const entity of queries.moving) {
    if (!entity.grounded) {
      entity.velocity.y -= gravity * dt;
    }
  }
}
```

### Entity Removal (Critical Pattern)

**Never remove entities during iteration.** Always collect first, remove after:

```typescript
// CORRECT: Collect and remove
export function cleanupSystem(): void {
  const toRemove: Entity[] = [];

  for (const entity of queries.damageable) {
    if (entity.health.current <= 0) {
      toRemove.push(entity);
    }
  }

  for (const entity of toRemove) {
    world.remove(entity);
  }
}

// WRONG: Removing during iteration
for (const entity of queries.damageable) {
  if (entity.health.current <= 0) {
    world.remove(entity); // This breaks iteration!
  }
}
```

---

## Physics Integration (Rapier2D)

### Physics World Setup

```typescript
// Physics2D.tsx
import { World, RigidBodyDesc, ColliderDesc } from "@dimforge/rapier2d-compat";

export function createPhysicsWorld(): World {
  const gravity = { x: 0.0, y: -9.81 };
  return new World(gravity);
}
```

### Collision Groups

```typescript
// constants.ts
export const COLLISION_GROUPS = {
  WORLD: 0x0001,
  PLAYER: 0x0002,
  ENEMY: 0x0004,
  PROJECTILE: 0x0008,
  COLLECTIBLE: 0x0010,
  TRIGGER: 0x0020,
} as const;

// Collision masks define what each group collides with
export const COLLISION_MASKS = {
  PLAYER: COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.COLLECTIBLE,
  ENEMY: COLLISION_GROUPS.WORLD | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.PROJECTILE,
  PROJECTILE: COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY,
} as const;
```

### Player Controller

```typescript
// Player.tsx - Core movement
function updatePlayerPhysics(
  rigidBody: RigidBody,
  input: InputState,
  dt: number
): void {
  const velocity = rigidBody.linvel();
  const isGrounded = checkGrounded(rigidBody);

  // Horizontal movement
  const targetVelX = input.horizontal * PLAYER_SPEED;
  const newVelX = lerp(velocity.x, targetVelX, PLAYER_ACCEL * dt);

  // Jump with coyote time
  let newVelY = velocity.y;
  if (input.jump && (isGrounded || coyoteTimeRemaining > 0)) {
    newVelY = JUMP_VELOCITY;
    coyoteTimeRemaining = 0;
  }

  rigidBody.setLinvel({ x: newVelX, y: newVelY }, true);
}
```

---

## State Management (Zustand)

### Store Structure

```typescript
// store.ts
interface GameState {
  // Player stats
  health: number;
  maxHealth: number;
  shards: number;

  // Progression
  currentChapter: number;
  currentCheckpoint: { x: number; y: number };
  unlockedChapters: number[];

  // UI state
  isPaused: boolean;
  showingCutscene: boolean;

  // Actions
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  collectShard: () => void;
  setCheckpoint: (pos: { x: number; y: number }) => void;
  advanceChapter: () => void;
  resetToCheckpoint: () => void;
}
```

### Persisted State

```typescript
// Use Zustand middleware for persistence
import { persist, createJSONStorage } from "zustand/middleware";

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: "otterblade-save",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist progression, not runtime state
        currentChapter: state.currentChapter,
        unlockedChapters: state.unlockedChapters,
        shards: state.shards,
      }),
    }
  )
);
```

### Actions Pattern

```typescript
// Immutable updates with proper bounds checking
takeDamage: (amount: number) => {
  set((state) => {
    const newHealth = Math.max(0, state.health - amount);
    return { health: newHealth };
  });

  // Side effects outside set()
  const { health } = get();
  if (health <= 0) {
    get().resetToCheckpoint();
  }
},
```

---

## Data Loading (Zod Validation)

### Schema Definitions

```typescript
// schemas.ts
import { z } from "zod";

export const ChapterSchema = z.object({
  id: z.number().min(0).max(9),
  name: z.string().min(1),
  setting: z.string(),
  quest: z.string(),
  hasBoss: z.boolean(),
  bossName: z.string().nullable(),
  assets: z.object({
    chapterPlate: z.string(),
    parallaxBg: z.string(),
  }),
});

export const BiomeSchema = z.object({
  id: z.string(),
  name: z.string(),
  chapterIds: z.array(z.number()),
  colors: z.object({
    bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fog: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sky1: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sky2: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  atmosphere: z.enum(["warm", "serene", "cozy", "tense", "hopeful", "dramatic", "triumphant"]),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "dawn", "sunset", "sunrise"]),
});

export type Chapter = z.infer<typeof ChapterSchema>;
export type Biome = z.infer<typeof BiomeSchema>;
```

### Typed Loaders

```typescript
// loaders.ts
import chaptersData from "@/data/chapters.json";
import biomesData from "@/data/biomes.json";

export function loadChapters(): Chapter[] {
  const result = z.array(ChapterSchema).safeParse(chaptersData);
  if (!result.success) {
    console.error("Invalid chapters.json:", result.error);
    throw new Error("Failed to load chapters data");
  }
  return result.data;
}

export function loadBiomes(): Biome[] {
  const result = z.array(BiomeSchema).safeParse(biomesData);
  if (!result.success) {
    console.error("Invalid biomes.json:", result.error);
    throw new Error("Failed to load biomes data");
  }
  return result.data;
}

// Get chapter by ID with type safety
export function getChapter(id: number): Chapter | undefined {
  return loadChapters().find((c) => c.id === id);
}

// Get biome for chapter
export function getBiomeForChapter(chapterId: number): Biome | undefined {
  return loadBiomes().find((b) => b.chapterIds.includes(chapterId));
}
```

---

## Level Definition Structure

### Level JSON Schema

```typescript
// Level definition for procedural generation + hand-crafted elements
export const LevelSchema = z.object({
  id: z.number(),
  chapterId: z.number(),
  name: z.string(),

  // Dimensions
  bounds: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),

  // Player spawn
  spawn: z.object({
    x: z.number(),
    y: z.number(),
  }),

  // Exit trigger
  exit: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    targetChapter: z.number(),
  }),

  // Platforms and terrain
  platforms: z.array(z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    type: z.enum(["solid", "passthrough", "crumbling", "moving"]),
    material: z.enum(["stone", "wood", "moss", "ice"]).optional(),
  })),

  // Checkpoints (hearth fires)
  checkpoints: z.array(z.object({
    x: z.number(),
    y: z.number(),
    id: z.string(),
  })),

  // Enemy spawns
  enemies: z.array(z.object({
    type: z.enum(["skirmisher", "shielded", "ranged", "flyer", "elite"]),
    x: z.number(),
    y: z.number(),
    patrolPath: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  })),

  // Collectibles
  collectibles: z.array(z.object({
    type: z.enum(["shard", "health", "secret"]),
    x: z.number(),
    y: z.number(),
  })),

  // Triggers (cutscenes, dialogue, events)
  triggers: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    type: z.enum(["dialogue", "cutscene", "event", "tutorial"]),
    data: z.record(z.unknown()),
  })),
});
```

---

## Combat System

### Attack Flow

```typescript
// Combat damage calculation
function calculateDamage(
  attacker: Entity,
  defender: Entity,
  attackType: AttackType
): number {
  const baseDamage = ATTACK_DAMAGES[attackType];

  // Critical hits on back attacks
  const isBehind = isAttackerBehindDefender(attacker, defender);
  const critMultiplier = isBehind ? 1.5 : 1.0;

  return Math.floor(baseDamage * critMultiplier);
}

// Parry window detection
function checkParry(
  defender: Entity,
  attackTimestamp: number
): boolean {
  if (!defender.parryState) return false;

  const parryStart = defender.parryState.startTime;
  const parryWindow = PARRY_WINDOW_MS;

  return (
    attackTimestamp >= parryStart &&
    attackTimestamp <= parryStart + parryWindow
  );
}
```

### Enemy AI States

```typescript
type EnemyState =
  | { type: "idle" }
  | { type: "patrol"; pathIndex: number }
  | { type: "alert"; targetPosition: { x: number; y: number } }
  | { type: "chase"; target: Entity }
  | { type: "attack"; cooldown: number }
  | { type: "stunned"; duration: number }
  | { type: "retreat"; destination: { x: number; y: number } };

function updateEnemyAI(enemy: Entity, player: Entity, dt: number): void {
  const state = enemy.enemy.state;
  const distance = getDistance(enemy.position, player.position);

  switch (state.type) {
    case "idle":
      if (distance < DETECTION_RANGE) {
        enemy.enemy.state = { type: "alert", targetPosition: player.position };
      }
      break;

    case "alert":
      // Investigate player's last known position
      if (distance < ATTACK_RANGE) {
        enemy.enemy.state = { type: "chase", target: player };
      }
      break;

    case "chase":
      if (distance < MELEE_RANGE) {
        enemy.enemy.state = { type: "attack", cooldown: ATTACK_COOLDOWN };
      } else if (distance > CHASE_ABANDON_RANGE) {
        enemy.enemy.state = { type: "retreat", destination: enemy.spawnPosition };
      }
      break;

    // ... other states
  }
}
```

---

## Audio System

### Audio Manager Pattern

```typescript
// audioManager.ts
class AudioManager {
  private context: AudioContext;
  private buffers: Map<string, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;

  async loadSound(id: string, url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, audioBuffer);
  }

  playSound(id: string, options?: { volume?: number; loop?: boolean }): void {
    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    source.loop = options?.loop ?? false;
    gainNode.gain.value = options?.volume ?? 1.0;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start();
  }

  playMusic(id: string): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
    }

    const buffer = this.buffers.get(id);
    if (!buffer) return;

    this.currentMusic = this.context.createBufferSource();
    this.currentMusic.buffer = buffer;
    this.currentMusic.loop = true;
    this.currentMusic.connect(this.context.destination);
    this.currentMusic.start();
  }
}

export const audioManager = new AudioManager();
```

---

## Animation System

### Sprite Animation Controller

```typescript
interface AnimationDefinition {
  frames: number[];
  frameRate: number;
  loop: boolean;
}

const PLAYER_ANIMATIONS: Record<string, AnimationDefinition> = {
  idle: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
  run: { frames: [4, 5, 6, 7, 8, 9], frameRate: 12, loop: true },
  jump: { frames: [10, 11], frameRate: 10, loop: false },
  fall: { frames: [12, 13], frameRate: 8, loop: true },
  attack: { frames: [14, 15, 16, 17], frameRate: 16, loop: false },
  hurt: { frames: [18, 19], frameRate: 8, loop: false },
  crouch: { frames: [20, 21], frameRate: 6, loop: false },
};

function updateAnimation(entity: Entity, dt: number): void {
  const anim = PLAYER_ANIMATIONS[entity.animation.current];
  entity.animation.frameTime += dt;

  const frameDuration = 1 / anim.frameRate;
  if (entity.animation.frameTime >= frameDuration) {
    entity.animation.frameTime -= frameDuration;
    entity.animation.frameIndex++;

    if (entity.animation.frameIndex >= anim.frames.length) {
      if (anim.loop) {
        entity.animation.frameIndex = 0;
      } else {
        entity.animation.frameIndex = anim.frames.length - 1;
        entity.animation.complete = true;
      }
    }
  }

  entity.sprite.frame = anim.frames[entity.animation.frameIndex];
}
```

---

## Mobile Input Handling

### Touch Control Implementation

```typescript
// TouchControls.tsx
function TouchControls(): JSX.Element {
  const handleTouchStart = (e: TouchEvent, action: string) => {
    e.preventDefault(); // Prevent scroll/zoom
    inputState.set(action, true);

    // Haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = (e: TouchEvent, action: string) => {
    e.preventDefault();
    inputState.set(action, false);
  };

  return (
    <div
      className="touch-controls"
      style={{ touchAction: "none" }} // Critical: prevent browser gestures
    >
      <button
        onTouchStart={(e) => handleTouchStart(e, "left")}
        onTouchEnd={(e) => handleTouchEnd(e, "left")}
        onTouchCancel={(e) => handleTouchEnd(e, "left")}
      >
        ←
      </button>
      {/* ... other buttons */}
    </div>
  );
}
```

---

## Performance Patterns

### Object Pooling

```typescript
// Avoid garbage collection spikes with object pools
class Pool<T> {
  private available: T[] = [];
  private create: () => T;
  private reset: (obj: T) => void;

  constructor(create: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.create = create;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(create());
    }
  }

  acquire(): T {
    return this.available.pop() ?? this.create();
  }

  release(obj: T): void {
    this.reset(obj);
    this.available.push(obj);
  }
}

// Usage for particles
const particlePool = new Pool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }),
  (p) => { p.life = 0; }
);
```

### Frame Budget Management

```typescript
// Spread work across frames
class WorkQueue {
  private queue: (() => void)[] = [];
  private maxWorkPerFrame = 2; // ms

  add(work: () => void): void {
    this.queue.push(work);
  }

  process(): void {
    const start = performance.now();

    while (
      this.queue.length > 0 &&
      performance.now() - start < this.maxWorkPerFrame
    ) {
      const work = this.queue.shift();
      work?.();
    }
  }
}
```

---

## Testing Patterns

See [TESTING.md](./TESTING.md) for comprehensive testing strategy and patterns.

---

## Common Pitfalls

### 1. Query Iteration
```typescript
// WRONG: forEach doesn't work with Miniplex queries
queries.moving.forEach(e => { }); // Error!

// CORRECT: Use for...of (requires ES2022)
for (const e of queries.moving) { }
```

### 2. Asset Imports
```typescript
// WRONG: Direct imports from attached_assets
import bg from "../attached_assets/...";

// CORRECT: Use @assets alias
import bg from "@assets/images/parallax/village.png";
```

### 3. Package Manager
```bash
# WRONG
npm install package
yarn add package

# CORRECT
pnpm add package
```

### 4. JSON Imports
```typescript
// WRONG: Direct JSON import
import data from "./data.json";

// CORRECT: Use typed loaders
import { loadChapters } from "./data/loaders";
const chapters = loadChapters();
```

---

## Reference

- [CLAUDE.md](./CLAUDE.md) - Agent instructions and quick reference
- [AGENTS.md](./AGENTS.md) - Quality standards
- [WORLD.md](./WORLD.md) - Lore and world-building
- [BRAND.md](./BRAND.md) - Visual style guide
- [TESTING.md](./TESTING.md) - Testing strategy
