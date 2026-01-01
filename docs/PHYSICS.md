# Otterblade Odyssey: Physics Implementation Guide

> Comprehensive documentation for Matter.js physics patterns, compound bodies, and collision handling.

## Table of Contents

1. [Engine Configuration](#engine-configuration)
2. [Collision Categories](#collision-categories)
3. [Compound Bodies](#compound-bodies)
4. [Platform Types](#platform-types)
5. [Character Physics](#character-physics)
6. [Combat Hitboxes](#combat-hitboxes)
7. [Environmental Interactions](#environmental-interactions)
8. [Performance Optimization](#performance-optimization)

---

## Engine Configuration

### Basic Setup

```typescript
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events, Query, Composite } = Matter;

/**
 * Creates the game physics engine with otter-appropriate gravity.
 * Slightly heavier than default to give Finn a weighty, grounded feel.
 */
export function createPhysicsEngine(): Matter.Engine {
  const engine = Engine.create({
    gravity: {
      x: 0,
      y: 1.5, // Default is 1.0; we use 1.5 for otter weight
    },
    enableSleeping: false, // Keep all bodies active for responsive gameplay
  });
  
  // Increase position iterations for better collision response
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  
  return engine;
}

/**
 * Fixed timestep update for consistent physics.
 * Call this every frame with accumulated delta.
 */
export function updatePhysics(engine: Matter.Engine, delta: number): void {
  const FIXED_TIMESTEP = 1000 / 60; // 60 FPS target
  
  Engine.update(engine, FIXED_TIMESTEP);
}
```

### World Bounds

```typescript
/**
 * Creates invisible walls to keep entities within the level.
 */
function createWorldBounds(
  engine: Matter.Engine, 
  width: number, 
  height: number
): void {
  const THICKNESS = 100;
  
  // Ground (thick for stability)
  const ground = Bodies.rectangle(
    width / 2, height + THICKNESS / 2,
    width * 3, THICKNESS,
    { isStatic: true, label: 'ground' }
  );
  
  // Ceiling (for indoor areas)
  const ceiling = Bodies.rectangle(
    width / 2, -THICKNESS / 2,
    width * 3, THICKNESS,
    { isStatic: true, label: 'ceiling' }
  );
  
  World.add(engine.world, [ground, ceiling]);
}
```

---

## Collision Categories

Use bitmask collision filtering for efficient group management:

```typescript
/**
 * Collision category bitmasks.
 * Each category is a power of 2 for bitwise operations.
 */
export const COLLISION_GROUPS = {
  NONE:       0x0000,
  PLAYER:     0x0001,
  ENEMY:      0x0002,
  PLATFORM:   0x0004,
  ITEM:       0x0008,
  TRIGGER:    0x0010,
  PROJECTILE: 0x0020,
  NPC:        0x0040,
  HAZARD:     0x0080,
  EFFECT:     0x0100,
} as const;

/**
 * Collision masks define what each category collides WITH.
 */
export const COLLISION_MASKS = {
  PLAYER: 
    COLLISION_GROUPS.PLATFORM | 
    COLLISION_GROUPS.ENEMY | 
    COLLISION_GROUPS.ITEM |
    COLLISION_GROUPS.TRIGGER |
    COLLISION_GROUPS.HAZARD,
  
  ENEMY:
    COLLISION_GROUPS.PLATFORM |
    COLLISION_GROUPS.PLAYER |
    COLLISION_GROUPS.PROJECTILE,
  
  ITEM:
    COLLISION_GROUPS.PLAYER,
  
  PROJECTILE:
    COLLISION_GROUPS.PLATFORM |
    COLLISION_GROUPS.ENEMY,
  
  NPC:
    COLLISION_GROUPS.PLATFORM,
} as const;

/**
 * Apply collision filter to a body.
 */
function setCollisionGroup(
  body: Matter.Body,
  category: number,
  mask: number
): void {
  body.collisionFilter = {
    category,
    mask,
    group: 0,
  };
}
```

---

## Compound Bodies

Compound bodies allow complex shapes while maintaining a single physics entity.

### Finn (Player) Compound Body

```typescript
/**
 * Creates Finn's physics body with realistic otter proportions.
 * 
 * Shape breakdown:
 * - Torso: Main collision (rectangle, slightly wide)
 * - Head: Circular, positioned above
 * - Tail: Ignored for gameplay, drawn only
 */
export function createFinnBody(x: number, y: number): Matter.Body {
  // Main torso - slightly wider than tall for otter shape
  const torso = Bodies.rectangle(0, 0, 28, 40, {
    label: 'finn_torso',
  });
  
  // Head - overlapping with torso top
  const head = Bodies.circle(0, -20, 12, {
    label: 'finn_head',
  });
  
  // Feet sensor - for ground detection
  const feet = Bodies.rectangle(0, 24, 20, 8, {
    label: 'finn_feet',
    isSensor: true,
  });
  
  // Create compound body
  const finn = Body.create({
    parts: [torso, head, feet],
    friction: 0.3,       // Moderate grip
    frictionAir: 0.02,   // Slight air resistance
    restitution: 0,      // No bounce
    mass: 1,             // Normalized mass
    label: 'player',
    collisionFilter: {
      category: COLLISION_GROUPS.PLAYER,
      mask: COLLISION_MASKS.PLAYER,
    },
  });
  
  // Position the compound body
  Body.setPosition(finn, { x, y });
  
  // Store custom properties
  finn.isGrounded = false;
  finn.canJump = true;
  finn.facingDirection = 1;
  
  return finn;
}
```

### Enemy Compound Bodies

```typescript
/**
 * Creates a Galeborn Scout with proper stoat proportions.
 */
export function createScoutBody(x: number, y: number): Matter.Body {
  // Elongated body (stoat/weasel shape)
  const body = Bodies.rectangle(0, 0, 24, 40, {
    label: 'scout_body',
  });
  
  // Smaller head
  const head = Bodies.circle(0, -22, 8, {
    label: 'scout_head',
  });
  
  const scout = Body.create({
    parts: [body, head],
    friction: 0.2,
    frictionAir: 0.01,
    restitution: 0.1,
    label: 'enemy_scout',
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });
  
  Body.setPosition(scout, { x, y });
  return scout;
}

/**
 * Creates a Frostwolf with quadruped proportions.
 */
export function createFrostwolfBody(x: number, y: number): Matter.Body {
  // Wide, low body
  const body = Bodies.rectangle(0, 0, 50, 28, {
    label: 'frostwolf_body',
  });
  
  // Head extending forward
  const head = Bodies.circle(22, -5, 10, {
    label: 'frostwolf_head',
  });
  
  const frostwolf = Body.create({
    parts: [body, head],
    friction: 0.4,       // Good grip for pouncing
    frictionAir: 0.005,  // Minimal air resistance
    restitution: 0.15,   // Slight bounce for pounce
    mass: 1.5,           // Heavier than Finn
    label: 'enemy_frostwolf',
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });
  
  Body.setPosition(frostwolf, { x, y });
  return frostwolf;
}

/**
 * Creates an Icebat with flight-appropriate shape.
 */
export function createIcebatBody(x: number, y: number): Matter.Body {
  // Small, light body
  const body = Bodies.ellipse(0, 0, 12, 8, 8, {
    label: 'icebat_body',
  });
  
  const icebat = Body.create({
    parts: [body],
    friction: 0,
    frictionAir: 0.1,    // High air resistance for flight
    restitution: 0,
    mass: 0.3,           // Very light
    label: 'enemy_icebat',
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });
  
  // Disable gravity for flying enemies
  icebat.ignoreGravity = true;
  
  Body.setPosition(icebat, { x, y });
  return icebat;
}
```

---

## Platform Types

### Solid Platforms

```typescript
interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  properties?: {
    slippery?: boolean;
    crumbling?: boolean;
    moving?: boolean;
  };
}

type PlatformType = 'stone' | 'wood' | 'ice' | 'earth' | 'semi_solid';

export function createPlatform(config: PlatformConfig): Matter.Body {
  const friction = getFrictionForType(config.type);
  
  const platform = Bodies.rectangle(
    config.x + config.width / 2,
    config.y + config.height / 2,
    config.width,
    config.height,
    {
      isStatic: true,
      friction,
      restitution: 0,
      label: `platform_${config.type}`,
      collisionFilter: {
        category: COLLISION_GROUPS.PLATFORM,
      },
    }
  );
  
  // Store metadata
  platform.platformType = config.type;
  platform.properties = config.properties ?? {};
  
  return platform;
}

function getFrictionForType(type: PlatformType): number {
  switch (type) {
    case 'ice': return 0.02;      // Very slippery
    case 'stone': return 0.8;     // Good grip
    case 'wood': return 0.6;      // Moderate
    case 'earth': return 0.7;     // Natural grip
    case 'semi_solid': return 0.5;
    default: return 0.5;
  }
}
```

### Semi-Solid Platforms (One-Way)

```typescript
/**
 * Handle semi-solid platforms that can be jumped through.
 * 
 * Logic:
 * - Player can pass through from below
 * - Player lands on top when falling
 * - Pressing down + jump drops through
 */
Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    handleSemiSolidCollision(pair);
  }
});

function handleSemiSolidCollision(pair: Matter.Pair): void {
  const { bodyA, bodyB } = pair;
  
  // Find which is player and which is platform
  const player = bodyA.label === 'player' ? bodyA : 
                 bodyB.label === 'player' ? bodyB : null;
  const platform = bodyA.platformType === 'semi_solid' ? bodyA :
                   bodyB.platformType === 'semi_solid' ? bodyB : null;
  
  if (!player || !platform) return;
  
  // Get player's feet position
  const playerBottom = player.position.y + getBodyHeight(player) / 2;
  const platformTop = platform.position.y - getBodyHeight(platform) / 2;
  
  // Disable collision if player is below or moving up
  if (playerBottom > platformTop - 5 || player.velocity.y < 0) {
    pair.isActive = false;
  }
}

/**
 * Drop through semi-solid when pressing down + jump.
 */
function handleDropThrough(player: Matter.Body, engine: Matter.Engine): void {
  const controls = getInputState();
  
  if (controls.slink && controls.jump && player.isOnSemiSolid) {
    // Temporarily disable collision with semi-solids
    player.collisionFilter.mask &= ~COLLISION_GROUPS.PLATFORM;
    
    // Re-enable after short delay
    setTimeout(() => {
      player.collisionFilter.mask |= COLLISION_GROUPS.PLATFORM;
    }, 200);
    
    // Small downward impulse
    Body.applyForce(player, player.position, { x: 0, y: 0.01 });
  }
}
```

### Moving Platforms

```typescript
interface MovingPlatformConfig extends PlatformConfig {
  waypoints: Array<{ x: number; y: number }>;
  speed: number;
  waitTime: number;
  loop: boolean;
}

class MovingPlatform {
  body: Matter.Body;
  waypoints: Array<{ x: number; y: number }>;
  currentWaypoint: number = 0;
  speed: number;
  waitTime: number;
  waitTimer: number = 0;
  loop: boolean;
  riders: Set<Matter.Body> = new Set();
  
  constructor(config: MovingPlatformConfig) {
    this.body = createPlatform({
      ...config,
      type: 'wood',
    });
    this.body.isStatic = false;
    this.body.isSleeping = false;
    
    this.waypoints = config.waypoints;
    this.speed = config.speed;
    this.waitTime = config.waitTime;
    this.loop = config.loop;
    
    // Set initial position
    Body.setPosition(this.body, this.waypoints[0]);
  }
  
  update(delta: number): void {
    if (this.waitTimer > 0) {
      this.waitTimer -= delta;
      Body.setVelocity(this.body, { x: 0, y: 0 });
      return;
    }
    
    const target = this.waypoints[this.currentWaypoint];
    const dx = target.x - this.body.position.x;
    const dy = target.y - this.body.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 2) {
      // Reached waypoint
      this.currentWaypoint++;
      if (this.currentWaypoint >= this.waypoints.length) {
        if (this.loop) {
          this.currentWaypoint = 0;
        } else {
          this.currentWaypoint = this.waypoints.length - 1;
        }
      }
      this.waitTimer = this.waitTime;
      Body.setVelocity(this.body, { x: 0, y: 0 });
    } else {
      // Move toward target
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      Body.setVelocity(this.body, { x: vx, y: vy });
      
      // Move riders
      for (const rider of this.riders) {
        Body.translate(rider, { x: vx * delta, y: vy * delta });
      }
    }
  }
  
  addRider(body: Matter.Body): void {
    this.riders.add(body);
  }
  
  removeRider(body: Matter.Body): void {
    this.riders.delete(body);
  }
}
```

---

## Character Physics

### Player Movement

```typescript
interface PlayerPhysicsConfig {
  moveSpeed: number;
  jumpForce: number;
  rollSpeed: number;
  slinkSpeed: number;
  airControl: number;
}

const PLAYER_PHYSICS: PlayerPhysicsConfig = {
  moveSpeed: 5,
  jumpForce: -12,
  rollSpeed: 8,
  slinkSpeed: 2.5,
  airControl: 0.7,
};

function updatePlayerPhysics(
  player: Matter.Body,
  controls: InputState,
  delta: number
): void {
  const isGrounded = checkGrounded(player);
  const isSLinking = controls.slink;
  
  // Horizontal movement
  let moveMultiplier = isGrounded ? 1 : PLAYER_PHYSICS.airControl;
  if (isSLinking) moveMultiplier *= 0.5;
  
  const targetVelX = 
    (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  
  if (targetVelX !== 0) {
    const speed = isSLinking ? PLAYER_PHYSICS.slinkSpeed : PLAYER_PHYSICS.moveSpeed;
    Body.setVelocity(player, {
      x: targetVelX * speed * moveMultiplier,
      y: player.velocity.y,
    });
    player.facingDirection = targetVelX;
  } else {
    // Apply friction when not moving
    Body.setVelocity(player, {
      x: player.velocity.x * 0.85,
      y: player.velocity.y,
    });
  }
  
  // Jump
  if (controls.jump && isGrounded && player.canJump) {
    Body.setVelocity(player, {
      x: player.velocity.x,
      y: PLAYER_PHYSICS.jumpForce,
    });
    player.canJump = false;
  }
  
  if (!controls.jump) {
    player.canJump = true;
  }
  
  // Variable jump height
  if (!controls.jump && player.velocity.y < -3) {
    Body.setVelocity(player, {
      x: player.velocity.x,
      y: player.velocity.y * 0.5,
    });
  }
  
  // Roll (invincibility frames)
  if (controls.roll && isGrounded && !player.isRolling) {
    startRoll(player);
  }
  
  // Clamp velocity
  const maxVelX = 12;
  const maxVelY = 20;
  Body.setVelocity(player, {
    x: Math.max(-maxVelX, Math.min(maxVelX, player.velocity.x)),
    y: Math.max(-maxVelY, Math.min(maxVelY, player.velocity.y)),
  });
}

function checkGrounded(player: Matter.Body): boolean {
  // Use feet sensor
  const feet = player.parts.find(p => p.label === 'finn_feet');
  if (!feet) return false;
  
  const collisions = Query.collides(feet, 
    Composite.allBodies(engine.world).filter(b => 
      b.label.startsWith('platform') || b.label === 'ground'
    )
  );
  
  return collisions.length > 0;
}
```

### Roll Mechanics

```typescript
function startRoll(player: Matter.Body): void {
  if (player.isRolling) return;
  
  player.isRolling = true;
  player.isInvulnerable = true;
  
  // Apply roll velocity
  const rollDir = player.facingDirection || 1;
  Body.setVelocity(player, {
    x: rollDir * PLAYER_PHYSICS.rollSpeed,
    y: player.velocity.y,
  });
  
  // Reduce collision box during roll
  // (Would need to swap body parts in actual implementation)
  
  // End roll after duration
  setTimeout(() => {
    player.isRolling = false;
    player.isInvulnerable = false;
  }, 500);
}
```

---

## Combat Hitboxes

### Attack Hitbox System

```typescript
interface AttackHitbox {
  body: Matter.Body;
  damage: number;
  knockback: { x: number; y: number };
  warmthDrain: number;
  duration: number;
  source: Matter.Body;
}

const activeHitboxes: AttackHitbox[] = [];

/**
 * Creates a temporary attack hitbox.
 */
function createAttackHitbox(
  source: Matter.Body,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  damage: number,
  knockback: { x: number; y: number }
): AttackHitbox {
  const facing = source.facingDirection || 1;
  
  const hitbox = Bodies.rectangle(
    source.position.x + offsetX * facing,
    source.position.y + offsetY,
    width,
    height,
    {
      isSensor: true,
      isStatic: true,
      label: 'attack_hitbox',
      collisionFilter: {
        category: COLLISION_GROUPS.EFFECT,
        mask: source.label === 'player' ? 
              COLLISION_GROUPS.ENEMY : 
              COLLISION_GROUPS.PLAYER,
      },
    }
  );
  
  World.add(engine.world, hitbox);
  
  const attackHitbox: AttackHitbox = {
    body: hitbox,
    damage,
    knockback: { x: knockback.x * facing, y: knockback.y },
    warmthDrain: 0,
    duration: 100,
    source,
  };
  
  activeHitboxes.push(attackHitbox);
  
  // Remove after duration
  setTimeout(() => {
    World.remove(engine.world, hitbox);
    const index = activeHitboxes.indexOf(attackHitbox);
    if (index > -1) activeHitboxes.splice(index, 1);
  }, attackHitbox.duration);
  
  return attackHitbox;
}

/**
 * Player attack patterns.
 */
function playerAttack(player: Matter.Body, attackIndex: number): void {
  // 3-hit combo
  const attacks = [
    { offsetX: 25, offsetY: -5, width: 35, height: 30, damage: 15, kb: { x: 5, y: 0 } },
    { offsetX: 30, offsetY: -10, width: 40, height: 35, damage: 20, kb: { x: 7, y: -2 } },
    { offsetX: 35, offsetY: -5, width: 50, height: 40, damage: 30, kb: { x: 10, y: -5 } },
  ];
  
  const attack = attacks[attackIndex % attacks.length];
  createAttackHitbox(
    player,
    attack.offsetX,
    attack.offsetY,
    attack.width,
    attack.height,
    attack.damage,
    attack.kb
  );
  
  // Play attack sound
  audioManager.playSFX('player_attack', { 
    pitch: 0.9 + Math.random() * 0.2 
  });
}
```

### Damage and Knockback

```typescript
function applyDamage(
  target: Matter.Body,
  damage: number,
  knockback: { x: number; y: number },
  warmthDrain: number = 0
): void {
  if (target.isInvulnerable) return;
  
  // Apply damage
  if (target.label === 'player') {
    const state = useStore.getState();
    state.hitPlayer(damage);
    state.drainWarmth(warmthDrain);
    
    // Screen shake
    startScreenShake(damage / 50);
  } else if (target.label.startsWith('enemy')) {
    target.hp -= damage;
    
    if (target.hp <= 0) {
      handleEnemyDeath(target);
    }
  }
  
  // Apply knockback
  Body.setVelocity(target, knockback);
  
  // Brief invulnerability
  target.isInvulnerable = true;
  setTimeout(() => {
    target.isInvulnerable = false;
  }, 300);
  
  // Damage flash effect
  target.damageFlashTimer = 10;
}
```

---

## Environmental Interactions

### Hazard Physics

```typescript
function setupHazards(engine: Matter.Engine): void {
  Events.on(engine, 'collisionActive', (event) => {
    for (const pair of event.pairs) {
      const hazard = findHazard(pair);
      if (!hazard) continue;
      
      const target = pair.bodyA === hazard.body ? pair.bodyB : pair.bodyA;
      
      if (target.label === 'player') {
        handleHazardContact(target, hazard);
      }
    }
  });
}

function handleHazardContact(
  player: Matter.Body,
  hazard: HazardConfig
): void {
  if (player.isInvulnerable) return;
  
  const now = performance.now();
  if (hazard.lastDamageTime && now - hazard.lastDamageTime < hazard.cooldown) {
    return;
  }
  
  hazard.lastDamageTime = now;
  
  switch (hazard.type) {
    case 'spikes':
      applyDamage(player, hazard.damage, { x: 0, y: -8 });
      break;
      
    case 'frost_trap':
      applyDamage(player, hazard.damage, { x: 0, y: 0 }, hazard.warmthDrain);
      // Slow effect
      player.slowedUntil = now + 2000;
      break;
      
    case 'fire':
      applyDamage(player, hazard.damage, { x: 0, y: 0 });
      // But restore warmth!
      useStore.getState().restoreWarmth(10);
      break;
  }
}
```

### Water Physics

```typescript
interface WaterZone {
  region: { x: number; y: number; width: number; height: number };
  buoyancy: number;
  drag: number;
  warmthDrain: number;
}

function handleWaterPhysics(
  body: Matter.Body,
  waterZone: WaterZone,
  delta: number
): void {
  const bounds = body.bounds;
  const submergedRatio = calculateSubmergedRatio(bounds, waterZone.region);
  
  if (submergedRatio <= 0) return;
  
  // Buoyancy force
  const buoyancyForce = waterZone.buoyancy * submergedRatio;
  Body.applyForce(body, body.position, { x: 0, y: -buoyancyForce });
  
  // Water drag
  const drag = 1 - (waterZone.drag * submergedRatio);
  Body.setVelocity(body, {
    x: body.velocity.x * drag,
    y: body.velocity.y * drag,
  });
  
  // Warmth drain for cold water
  if (body.label === 'player' && waterZone.warmthDrain > 0) {
    useStore.getState().drainWarmth(waterZone.warmthDrain * delta);
  }
  
  // Otters swim! Modify movement in water
  if (body.label === 'player') {
    body.isInWater = true;
    body.swimTimer = 10;
  }
}

function calculateSubmergedRatio(
  bounds: Matter.Bounds,
  waterRegion: WaterZone['region']
): number {
  const bodyTop = bounds.min.y;
  const bodyBottom = bounds.max.y;
  const bodyHeight = bodyBottom - bodyTop;
  
  const waterTop = waterRegion.y;
  const waterBottom = waterRegion.y + waterRegion.height;
  
  if (bodyBottom < waterTop || bodyTop > waterBottom) return 0;
  
  const submergedTop = Math.max(bodyTop, waterTop);
  const submergedBottom = Math.min(bodyBottom, waterBottom);
  
  return (submergedBottom - submergedTop) / bodyHeight;
}
```

---

## Performance Optimization

### Spatial Partitioning

Matter.js uses a built-in broadphase, but for large levels:

```typescript
/**
 * Only simulate bodies near the player.
 */
function updateActiveRegion(
  engine: Matter.Engine,
  playerPos: { x: number; y: number }
): void {
  const ACTIVE_RADIUS = 1000;
  
  const allBodies = Composite.allBodies(engine.world);
  
  for (const body of allBodies) {
    if (body.isStatic) continue;
    
    const distance = Math.abs(body.position.x - playerPos.x);
    
    if (distance > ACTIVE_RADIUS) {
      if (!body.isSleeping) {
        Sleeping.set(body, true);
      }
    } else {
      if (body.isSleeping) {
        Sleeping.set(body, false);
      }
    }
  }
}
```

### Body Pooling

```typescript
class BodyPool {
  private pools: Map<string, Matter.Body[]> = new Map();
  
  acquire(type: string, x: number, y: number): Matter.Body {
    const pool = this.pools.get(type) ?? [];
    
    if (pool.length > 0) {
      const body = pool.pop()!;
      Body.setPosition(body, { x, y });
      body.isSleeping = false;
      return body;
    }
    
    // Create new if pool empty
    return this.createBody(type, x, y);
  }
  
  release(body: Matter.Body): void {
    const type = body.poolType;
    if (!type) return;
    
    let pool = this.pools.get(type);
    if (!pool) {
      pool = [];
      this.pools.set(type, pool);
    }
    
    body.isSleeping = true;
    Body.setVelocity(body, { x: 0, y: 0 });
    pool.push(body);
  }
  
  private createBody(type: string, x: number, y: number): Matter.Body {
    // Factory for different body types
    switch (type) {
      case 'projectile':
        return createProjectileBody(x, y);
      case 'particle':
        return createParticleBody(x, y);
      default:
        throw new Error(`Unknown body type: ${type}`);
    }
  }
}

const bodyPool = new BodyPool();
```

---

## Debug Rendering

```typescript
function debugRender(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  camera: { x: number; y: number }
): void {
  const bodies = Composite.allBodies(engine.world);
  
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  
  for (const body of bodies) {
    // Draw bounds
    ctx.strokeStyle = body.isSensor ? 'rgba(0, 255, 0, 0.5)' : 
                      body.isStatic ? 'rgba(255, 255, 0, 0.5)' :
                      'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    const vertices = body.vertices;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw velocity
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(body.position.x, body.position.y);
    ctx.lineTo(
      body.position.x + body.velocity.x * 5,
      body.position.y + body.velocity.y * 5
    );
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = 'white';
    ctx.font = '10px monospace';
    ctx.fillText(body.label, body.position.x, body.position.y - 20);
  }
  
  ctx.restore();
}
```

---

*"Physics is the invisible hand that makes Finn feel real."*
