/**
 * PhysicsManager.ts
 * Comprehensive physics system with compound bodies, collision categories,
 * water physics, hazards, and platform varieties per PHYSICS.md
 */

import type * as Matter from 'matter-js';
import { getMatterModules } from '../physics/matter-wrapper';
import type { EnemyType } from '../types/entities';


// Collision category bitmasks (PHYSICS.md:100-154)
export const COLLISION_GROUPS = {
  NONE: 0x0000,
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PLATFORM: 0x0004,
  ITEM: 0x0008,
  TRIGGER: 0x0010,
  PROJECTILE: 0x0020,
  NPC: 0x0040,
  HAZARD: 0x0080,
  EFFECT: 0x0100,
  SEMI_SOLID: 0x0200,
};

// Collision masks define what each category collides WITH
export const COLLISION_MASKS = {
  PLAYER:
    COLLISION_GROUPS.PLATFORM |
    COLLISION_GROUPS.ENEMY |
    COLLISION_GROUPS.ITEM |
    COLLISION_GROUPS.TRIGGER |
    COLLISION_GROUPS.HAZARD |
    COLLISION_GROUPS.SEMI_SOLID,

  ENEMY: COLLISION_GROUPS.PLATFORM | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.PROJECTILE,

  ITEM: COLLISION_GROUPS.PLAYER,

  PROJECTILE: COLLISION_GROUPS.PLATFORM | COLLISION_GROUPS.ENEMY,

  NPC: COLLISION_GROUPS.PLATFORM,

  SEMI_SOLID: COLLISION_GROUPS.PLAYER,
};

/**
 * Creates physics engine with otter-appropriate gravity
 */
export function createPhysicsEngine(): Matter.Engine {
  const { Engine } = getMatterModules();
  const engine = Engine.create({
    gravity: { x: 0, y: 1.5 }, // POC-proven value
    enableSleeping: false,
  });

  engine.positionIterations = 8;
  engine.velocityIterations = 6;

  return engine;
}

/**
 * Creates Finn's compound body with head/torso/feet sensors (PHYSICS.md:173-214)
 */
export function createFinnBody(x: number, y: number): Matter.Body {
  const { Bodies, Body } = getMatterModules();
  // Main torso
  const torso = Bodies.rectangle(0, 0, 28, 40, {
    label: 'finn_torso',
  });

  // Head overlapping with torso top
  const head = Bodies.circle(0, -20, 12, {
    label: 'finn_head',
  });

  // Feet sensor for ground detection
  const feet = Bodies.rectangle(0, 24, 20, 8, {
    label: 'finn_feet',
    isSensor: true,
  });

  // Create compound body
  const finn = Body.create({
    parts: [torso, head, feet],
    friction: 0.3,
    frictionAir: 0.02,
    restitution: 0,
    mass: 1,
    label: 'player',
    collisionFilter: {
      category: COLLISION_GROUPS.PLAYER,
      mask: COLLISION_MASKS.PLAYER,
    },
  });

  Body.setPosition(finn, { x, y });

  // Custom properties
  finn.isGrounded = false;
  finn.canJump = true;
  finn.facingDirection = 1;
  finn.isRolling = false;
  finn.isInvulnerable = false;
  finn.isInWater = false;
  finn.swimTimer = 0;
  finn.wallSlideTimer = 0;
  finn.canWallJump = false;
  finn.isClimbing = false;
  finn.climbingWall = null;
  finn.parryWindow = 0;
  finn.comboIndex = 0;
  finn.attackCooldown = 0;
  finn.chargeAttackTime = 0;

  return finn;
}

/**
 * Creates enemy compound bodies (PHYSICS.md:218-308)
 */
export function createEnemyBody(x: number, y: number, type: string): Matter.Body {
  switch (type) {
    case 'scout':
      return createScoutBody(x, y);
    case 'frostwolf':
      return createFrostwolfBody(x, y);
    case 'icebat':
      return createIcebatBody(x, y);
    default:
      return createScoutBody(x, y);
  }
}

function createScoutBody(x: number, y: number): Matter.Body {
  const { Bodies, Body } = getMatterModules();
  const body = Bodies.rectangle(0, 0, 24, 40, { label: 'scout_body' });
  const head = Bodies.circle(0, -22, 8, { label: 'scout_head' });

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

function createFrostwolfBody(x: number, y: number): Matter.Body {
  const { Bodies, Body } = getMatterModules();
  const body = Bodies.rectangle(0, 0, 50, 28, { label: 'frostwolf_body' });
  const head = Bodies.circle(22, -5, 10, { label: 'frostwolf_head' });

  const frostwolf = Body.create({
    parts: [body, head],
    friction: 0.4,
    frictionAir: 0.005,
    restitution: 0.15,
    mass: 1.5,
    label: 'enemy_frostwolf',
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });

  Body.setPosition(frostwolf, { x, y });
  return frostwolf;
}

function createIcebatBody(x: number, y: number): Matter.Body {
  const { Bodies, Body } = getMatterModules();
  const body = Bodies.circle(0, 0, 12, { label: 'icebat_body' });

  const icebat = Body.create({
    parts: [body],
    friction: 0,
    frictionAir: 0.1,
    restitution: 0,
    mass: 0.3,
    label: 'enemy_icebat',
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });

  icebat.ignoreGravity = true;
  Body.setPosition(icebat, { x, y });
  return icebat;
}

/**
 * Platform types with friction values (PHYSICS.md:358-367)
 */
function getFrictionForType(type: string): number {
  switch (type) {
    case 'ice':
      return 0.02; // Very slippery
    case 'stone':
      return 0.8; // Good grip
    case 'wood':
      return 0.6; // Moderate
    case 'earth':
      return 0.7; // Natural grip
    case 'semi_solid':
      return 0.5;
    default:
      return 0.5;
  }
}

/**
 * Platform configuration interface
 */
interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  properties?: any;
}

/**
 * Creates platform with type-based properties
 */
export function createPlatform(config: PlatformConfig): Matter.Body {
  const { Bodies } = getMatterModules();
  const friction = getFrictionForType(config.type || 'stone');
  const isSemiSolid = config.type === 'semi_solid';

  const platform = Bodies.rectangle(
    config.x + config.width / 2,
    config.y + config.height / 2,
    config.width,
    config.height,
    {
      isStatic: true,
      friction,
      restitution: 0,
      label: `platform_${config.type || 'stone'}`,
      collisionFilter: {
        category: isSemiSolid ? COLLISION_GROUPS.SEMI_SOLID : COLLISION_GROUPS.PLATFORM,
      },
    }
  );

  platform.platformType = config.type || 'stone';
  platform.properties = config.properties || {};

  return platform;
}

/**
 * Creates temporary attack hitbox (PHYSICS.md:664-714)
 */
export function createAttackHitbox(
  source: Matter.Body & { facingDirection?: number; label?: string },
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  damage: number,
  knockback: { x: number; y: number }
): Matter.Body & { damage: number; knockback: { x: number; y: number }; source: Matter.Body } {
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
        mask: source.label === 'player' ? COLLISION_GROUPS.ENEMY : COLLISION_GROUPS.PLAYER,
      },
    }
  );

  hitbox.damage = damage;
  hitbox.knockback = { x: knockback.x * facing, y: knockback.y };
  hitbox.source = source;

  return hitbox;
}

/**
 * Water zone physics (PHYSICS.md:844-902)
 */
export class WaterZone {
  region: { x: number; y: number; width: number; height: number };
  buoyancy: number;
  drag: number;
  warmthDrain: number;

  constructor(
    region: { x: number; y: number; width: number; height: number },
    buoyancy: number = 0.01,
    drag: number = 0.15,
    warmthDrain: number = 0.5
  ) {
    this.region = region; // { x, y, width, height }
    this.buoyancy = buoyancy;
    this.drag = drag;
    this.warmthDrain = warmthDrain;
  }

  applyToBody(
    body: Matter.Body & { label?: string; isInWater?: boolean; swimTimer?: number },
    delta: number,
    gameState?: { drainWarmth(amount: number): void }
  ): void {
    const submergedRatio = this.calculateSubmergedRatio(body.bounds);

    if (submergedRatio <= 0) return;

    // Buoyancy force
    const buoyancyForce = this.buoyancy * submergedRatio;
    Body.applyForce(body, body.position, { x: 0, y: -buoyancyForce });

    // Water drag
    const dragMult = 1 - this.drag * submergedRatio;
    Body.setVelocity(body, {
      x: body.velocity.x * dragMult,
      y: body.velocity.y * dragMult,
    });

    // Warmth drain for cold water
    if (body.label === 'player' && this.warmthDrain > 0 && gameState) {
      gameState.drainWarmth(this.warmthDrain * delta * submergedRatio);
    }

    // Mark as in water
    if (body.label === 'player') {
      body.isInWater = true;
      body.swimTimer = 10;
    }
  }

  calculateSubmergedRatio(bounds: Matter.Bounds): number {
    const bodyTop = bounds.min.y;
    const bodyBottom = bounds.max.y;
    const bodyHeight = bodyBottom - bodyTop;

    const waterTop = this.region.y;
    const waterBottom = this.region.y + this.region.height;

    if (bodyBottom < waterTop || bodyTop > waterBottom) return 0;

    const submergedTop = Math.max(bodyTop, waterTop);
    const submergedBottom = Math.min(bodyBottom, waterBottom);

    return (submergedBottom - submergedTop) / bodyHeight;
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this.region.x &&
      x <= this.region.x + this.region.width &&
      y >= this.region.y &&
      y <= this.region.y + this.region.height
    );
  }
}

/**
 * Hazard system (PHYSICS.md:792-838)
 */
interface Hazard {
  type: 'spikes' | 'frost_trap' | 'fire';
  region: { x: number; y: number; width: number; height: number };
  damage: number;
  cooldown: number;
  warmthDrain: number;
  lastDamageTime: number;
}

export class HazardSystem {
  hazards: Hazard[];

  constructor() {
    this.hazards = [];
  }

  addHazard(
    type: 'spikes' | 'frost_trap' | 'fire',
    region: { x: number; y: number; width: number; height: number },
    damage: number,
    cooldown: number = 1000,
    warmthDrain: number = 0
  ): void {
    this.hazards.push({
      type, // 'spikes' | 'frost_trap' | 'fire'
      region, // { x, y, width, height }
      damage,
      cooldown,
      warmthDrain,
      lastDamageTime: 0,
    });
  }

  checkCollisions(
    player: Matter.Body & { isInvulnerable?: boolean; slowedUntil?: number },
    gameState: { takeDamage(amount: number): void; drainWarmth(amount: number): void; restoreWarmth(amount: number): void }
  ): void {
    if (player.isInvulnerable) return;

    const now = performance.now();

    for (const hazard of this.hazards) {
      if (this.isBodyInRegion(player, hazard.region)) {
        if (hazard.lastDamageTime && now - hazard.lastDamageTime < hazard.cooldown) {
          continue;
        }

        hazard.lastDamageTime = now;
        this.applyHazardEffect(player, hazard, gameState);
      }
    }
  }

  isBodyInRegion(body: Matter.Body, region: { x: number; y: number; width: number; height: number }): boolean {
    const { x, y } = body.position;
    return (
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height
    );
  }

  applyHazardEffect(
    player: Matter.Body & { slowedUntil?: number },
    hazard: Hazard,
    gameState: { takeDamage(amount: number): void; drainWarmth(amount: number): void; restoreWarmth(amount: number): void }
  ): void {
    switch (hazard.type) {
      case 'spikes':
        gameState.takeDamage(hazard.damage);
        Body.setVelocity(player, { x: player.velocity.x, y: -8 });
        break;

      case 'frost_trap':
        gameState.takeDamage(hazard.damage);
        gameState.drainWarmth(hazard.warmthDrain);
        player.slowedUntil = performance.now() + 2000;
        break;

      case 'fire':
        gameState.takeDamage(hazard.damage);
        gameState.restoreWarmth(10); // Fire restores warmth!
        break;
    }
  }
}

/**
 * Moving platform system (PHYSICS.md:432-511)
 */
interface MovingPlatformConfig {
  waypoints: Matter.Vector[];
  speed: number;
  waitTime?: number;
  loop?: boolean;
  type?: string;
  [key: string]: any;
}

export class MovingPlatform {
  body: Matter.Body;
  waypoints: Matter.Vector[];
  currentWaypoint: number;
  speed: number;
  waitTime: number;
  waitTimer: number;
  loop: boolean;
  riders: Set<Matter.Body>;

  constructor(config: MovingPlatformConfig) {
    this.body = createPlatform({ ...config, type: 'wood' });
    this.body.isStatic = false;
    this.body.isSleeping = false;

    this.waypoints = config.waypoints;
    this.currentWaypoint = 0;
    this.speed = config.speed;
    this.waitTime = config.waitTime || 0;
    this.waitTimer = 0;
    this.loop = config.loop ?? true;
    this.riders = new Set();

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

/**
 * Player physics constants (PHYSICS.md:528-534)
 */
export const PLAYER_PHYSICS = {
  moveSpeed: 5,
  jumpForce: -12,
  rollSpeed: 8,
  slinkSpeed: 2.5,
  airControl: 0.7,
  wallSlideSpeed: 2,
  wallJumpForce: { x: 8, y: -10 },
  climbSpeed: 3,
  swimSpeed: 4,
};

/**
 * Check if player is grounded using feet sensor
 */
export function checkGrounded(
  player: Matter.Body & { parts: Matter.Body[] },
  engine: Matter.Engine
): boolean {
  const feet = player.parts.find((p) => p.label === 'finn_feet');
  if (!feet) return false;

  const collisions = Query.collides(
    feet,
    Composite.allBodies(engine.world).filter(
      (b) => b.label.startsWith('platform') || b.label === 'ground'
    )
  );

  return collisions.length > 0;
}

/**
 * Update active region for performance (PHYSICS.md:916-940)
 */
export function updateActiveRegion(
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
