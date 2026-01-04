/**
 * Physics System Monolith
 * Complete Matter.js physics integration for Otterblade Odyssey
 * Single file with all physics, no complex imports
 * Minifies well, loads once, executes fast
 */

// DYNAMIC MATTER.JS INITIALIZATION (runs once in browser)
let MatterLib = null;

export async function initPhysics() {
  if (typeof window === 'undefined') {
    throw new Error('Physics only available in browser');
  }
  
  if (!MatterLib) {
    MatterLib = (await import('matter-js')).default;
    window.Matter = MatterLib; // Global for compatibility
    console.log('[Physics] Matter.js loaded');
  }
  
  return MatterLib;
}

function M() {
  if (!MatterLib) throw new Error('Call initPhysics() first');
  return MatterLib;
}

// ============================================================================
// COLLISION GROUPS & MASKS
// ============================================================================

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

export const PLAYER_PHYSICS = {
  maxSpeed: 5,
  acceleration: 0.8,
  jumpForce: -12,
  wallJumpForce: { x: 8, y: -11 },
  airControl: 0.6,
  friction: 0.15,
  waterDrag: 0.85,
  coyoteTimeMs: 120,
  jumpBufferMs: 100,
};

// ============================================================================
// ENGINE & PLAYER CREATION
// ============================================================================

export function createPhysicsEngine() {
  const { Engine } = M();
  const engine = Engine.create({
    gravity: { x: 0, y: 1.5 },
    enableSleeping: false,
  });
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
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
      mask: COLLISION_MASKS.PLAYER,
    },
  });
  
  Body.setPosition(finn, { x, y });
  finn.isGrounded = false;
  finn.canJump = true;
  
  return finn;
}

export function createEnemyBody(x, y, type) {
  const { Bodies } = M();
  
  const sizes = {
    scout: { w: 28, h: 45 },
    frostwolf: { w: 50, h: 40 },
    frost_captain: { w: 35, h: 55 },
    frost_specter: { w: 40, h: 50 },
  };
  
  const size = sizes[type] || { w: 35, h: 50 };
  
  return Bodies.rectangle(x, y, size.w, size.h, {
    label: 'enemy',
    friction: 0.1,
    frictionAir: 0.02,
    restitution: 0,
    collisionFilter: {
      category: COLLISION_GROUPS.ENEMY,
      mask: COLLISION_MASKS.ENEMY,
    },
  });
}

// ============================================================================
// PLATFORMS & TERRAIN
// ============================================================================

export function createPlatform(config) {
  const { Bodies } = M();
  const { x, y, width, height, type = 'stone' } = config;
  
  const frictions = {
    stone: 0.8,
    wood: 0.6,
    ice: 0.05,
    moss: 0.9,
  };
  
  return Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: `platform_${type}`,
    friction: frictions[type] || 0.8,
    collisionFilter: {
      category: COLLISION_GROUPS.PLATFORM,
      mask: 0xFFFF,
    },
  });
}

export function createAttackHitbox(source, offsetX, offsetY, width, height, damage, knockback) {
  const { Bodies, Body } = M();
  
  const facing = source.velocity.x >= 0 ? 1 : -1;
  const x = source.position.x + offsetX * facing;
  const y = source.position.y + offsetY;
  
  const hitbox = Bodies.rectangle(x, y, width, height, {
    isSensor: true,
    label: 'attack_hitbox',
  });
  
  hitbox.damage = damage;
  hitbox.knockback = { x: knockback.x * facing, y: knockback.y };
  hitbox.source = source;
  
  setTimeout(() => Body.setPosition(hitbox, { x: -9999, y: -9999 }), 200);
  
  return hitbox;
}

// ============================================================================
// WATER & HAZARDS
// ============================================================================

export class WaterZone {
  constructor(bounds, buoyancy = 0.01, drag = 0.15, warmthDrain = 0.5) {
    this.bounds = bounds;
    this.buoyancy = buoyancy;
    this.drag = drag;
    this.warmthDrain = warmthDrain;
  }

  contains(body) {
    const pos = body.position;
    return (
      pos.x >= this.bounds.x &&
      pos.x <= this.bounds.x + this.bounds.width &&
      pos.y >= this.bounds.y &&
      pos.y <= this.bounds.y + this.bounds.height
    );
  }

  applyForces(body) {
    const { Body } = M();
    Body.applyForce(body, body.position, { x: 0, y: -this.buoyancy });
    body.velocity.x *= this.drag;
    body.velocity.y *= this.drag;
  }
}

export class HazardSystem {
  constructor() {
    this.hazards = [];
  }

  addHazard(type, bounds, damage, cooldown, warmthDrain = 0) {
    this.hazards.push({
      type,
      bounds,
      damage,
      cooldown,
      warmthDrain,
      lastHit: 0,
    });
  }

  checkCollisions(player, gameState, deltaTime) {
    const now = Date.now();
    for (const hazard of this.hazards) {
      if (this.isPlayerInBounds(player, hazard.bounds)) {
        if (now - hazard.lastHit > hazard.cooldown) {
          gameState.takeDamage(hazard.damage);
          if (hazard.warmthDrain > 0) {
            gameState.drainWarmth(hazard.warmthDrain * deltaTime);
          }
          hazard.lastHit = now;
        }
      }
    }
  }

  isPlayerInBounds(player, bounds) {
    const pos = player.position;
    return (
      pos.x >= bounds.x &&
      pos.x <= bounds.x + bounds.width &&
      pos.y >= bounds.y &&
      pos.y <= bounds.y + bounds.height
    );
  }
}

export class MovingPlatform {
  constructor({ x, y, width, height, waypoints, speed = 2, waitTime = 1000, loop = true }) {
    const { Bodies } = M();
    
    this.body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: 'moving_platform',
      friction: 0.8,
    });
    
    this.waypoints = waypoints;
    this.speed = speed;
    this.waitTime = waitTime;
    this.loop = loop;
    this.currentWaypoint = 0;
    this.waitTimer = 0;
    this.isWaiting = false;
  }

  update(deltaTime) {
    const { Body } = M();
    
    if (this.isWaiting) {
      this.waitTimer += deltaTime;
      if (this.waitTimer >= this.waitTime) {
        this.isWaiting = false;
        this.waitTimer = 0;
        this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
      }
      return;
    }

    const target = this.waypoints[this.currentWaypoint];
    const dx = target.x - this.body.position.x;
    const dy = target.y - this.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      Body.setPosition(this.body, target);
      this.isWaiting = true;
    } else {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      Body.setPosition(this.body, {
        x: this.body.position.x + vx,
        y: this.body.position.y + vy,
      });
    }
  }
}

// ============================================================================
// GROUND DETECTION & QUERIES
// ============================================================================

export function checkGrounded(player, engine) {
  const { Query } = M();
  
  const feetSensor = player.parts.find((p) => p.label === 'finn_feet');
  if (!feetSensor) return false;

  const collisions = Query.collides(feetSensor, engine.world.bodies);
  const grounded = collisions.some(
    (c) =>
      c.bodyA.label.includes('platform') ||
      c.bodyB.label.includes('platform') ||
      c.bodyA.label === 'moving_platform' ||
      c.bodyB.label === 'moving_platform'
  );

  player.isGrounded = grounded;
  return grounded;
}

export function updateActiveRegion(engine, playerPos) {
  const { Sleeping } = M();
  
  const activationRadius = 800;

  for (const body of engine.world.bodies) {
    if (body.label.includes('enemy') || body.label === 'npc') {
      const dx = body.position.x - playerPos.x;
      const dy = body.position.y - playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < activationRadius) {
        Sleeping.set(body, false);
      } else {
        Sleeping.set(body, true);
      }
    }
  }
}

// ============================================================================
// PLAYER CONTROLLER (Movement & Combat)
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
    this.chargeAttackTime = 0;
    this.isCharging = false;

    this.touchingWall = null;
    this.wallSlideTimer = 0;

    this.attacks = [
      { offsetX: 25, offsetY: -5, width: 35, height: 30, damage: 15, kb: { x: 5, y: 0 } },
      { offsetX: 30, offsetY: -10, width: 40, height: 35, damage: 20, kb: { x: 7, y: -2 } },
      { offsetX: 35, offsetY: -5, width: 50, height: 40, damage: 30, kb: { x: 10, y: -5 } },
    ];

    this.hearthStrike = {
      offsetX: 40,
      offsetY: 0,
      width: 60,
      height: 50,
      damage: 50,
      kb: { x: 15, y: -8 },
      chargeTime: 1000,
    };
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

    if (this.touchingWall) {
      const wallJumpDir = this.touchingWall === 'left' ? 1 : -1;
      Body.setVelocity(this.player, {
        x: PLAYER_PHYSICS.wallJumpForce.x * wallJumpDir,
        y: PLAYER_PHYSICS.wallJumpForce.y,
      });
      this.touchingWall = null;
      this.audioManager?.playSFX('jump');
      return true;
    }

    this.jumpBufferTime = PLAYER_PHYSICS.jumpBufferMs;
    return false;
  }

  attack() {
    if (this.attackCooldown > 0) return null;

    const attackDef = this.attacks[this.comboIndex];
    const hitbox = createAttackHitbox(
      this.player,
      attackDef.offsetX,
      attackDef.offsetY,
      attackDef.width,
      attackDef.height,
      attackDef.damage,
      attackDef.kb
    );

    this.comboIndex = (this.comboIndex + 1) % this.attacks.length;
    this.comboTimer = 800;
    this.attackCooldown = 300;

    this.audioManager?.playSFX('blade_swing');
    return hitbox;
  }

  parry() {
    if (this.parryWindow > 0) return false;
    this.parryWindow = 300;
    this.audioManager?.playSFX('parry');
    return true;
  }

  startChargeAttack() {
    this.isCharging = true;
    this.chargeAttackTime = 0;
  }

  releaseChargeAttack() {
    if (!this.isCharging) return null;
    this.isCharging = false;

    if (this.chargeAttackTime >= this.hearthStrike.chargeTime) {
      const hitbox = createAttackHitbox(
        this.player,
        this.hearthStrike.offsetX,
        this.hearthStrike.offsetY,
        this.hearthStrike.width,
        this.hearthStrike.height,
        this.hearthStrike.damage,
        this.hearthStrike.kb
      );
      this.audioManager?.playSFX('hearth_strike');
      return hitbox;
    }

    return null;
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

  onSuccessfulParry(enemyBody) {
    const { Body } = M();
    const knockbackDir = enemyBody.position.x > this.player.position.x ? 1 : -1;
    Body.applyForce(enemyBody, enemyBody.position, { x: knockbackDir * 10, y: -5 });
  }
}
