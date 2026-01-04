/**
 * Physics type definitions for Matter.js integration
 * 
 * Provides type-safe wrappers for Matter.js bodies and collision detection.
 */

import type Matter from 'matter-js';

/**
 * Custom body labels for collision detection
 * These match the labels used in game code
 */
export type BodyLabel = 
  | 'player'
  | 'enemy'
  | 'platform'
  | 'item'
  | 'npc'
  | 'trigger'
  | 'projectile'
  | 'hazard'
  | 'wall'
  | 'ground'
  | 'ceiling';

/**
 * Physics configuration
 * Based on POC values (proven to work)
 */
export interface PhysicsConfig {
  /** Gravity Y (default: 1.5 from POC) */
  gravity: number;
  
  /** Enable sleeping for performance */
  enableSleeping: boolean;
  
  /** Physics timestep (60fps = 1000/60 ≈ 16.67ms) */
  timestep: number;
  
  /** Position iterations for solver */
  positionIterations: number;
  
  /** Velocity iterations for solver */
  velocityIterations: number;
}

/**
 * Default physics config from POC
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 1.5,
  enableSleeping: false,
  timestep: 1000 / 60,
  positionIterations: 6,
  velocityIterations: 4,
};

/**
 * Body creation options
 * Type-safe wrapper for Matter.IBodyDefinition
 */
export interface BodyOptions {
  label: BodyLabel;
  friction?: number;
  frictionAir?: number;
  restitution?: number;
  density?: number;
  isStatic?: boolean;
  isSensor?: boolean;
  collisionFilter?: CollisionFilter;
  render?: {
    fillStyle?: string;
    strokeStyle?: string;
    lineWidth?: number;
  };
}

/**
 * Collision filter configuration
 */
export interface CollisionFilter {
  /** Collision category bitmask */
  category?: number;
  
  /** Collision mask (what this body collides with) */
  mask?: number;
  
  /** Collision group (negative = never collide with same group) */
  group?: number;
}

/**
 * Collision categories for filtering
 */
export const CollisionCategory = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PLATFORM: 0x0004,
  ITEM: 0x0008,
  PROJECTILE: 0x0010,
  TRIGGER: 0x0020,
  HAZARD: 0x0040,
  NPC: 0x0080,
} as const;

/**
 * Player body options (from POC)
 */
export const PLAYER_BODY_OPTIONS: BodyOptions = {
  label: 'player',
  friction: 0.1,
  frictionAir: 0.01,
  restitution: 0,
  collisionFilter: {
    category: CollisionCategory.PLAYER,
    mask: CollisionCategory.PLATFORM | CollisionCategory.ENEMY | CollisionCategory.ITEM | CollisionCategory.TRIGGER | CollisionCategory.HAZARD,
  },
};

/**
 * Enemy body options
 */
export const ENEMY_BODY_OPTIONS: BodyOptions = {
  label: 'enemy',
  friction: 0.1,
  frictionAir: 0.01,
  restitution: 0,
  collisionFilter: {
    category: CollisionCategory.ENEMY,
    mask: CollisionCategory.PLATFORM | CollisionCategory.PLAYER | CollisionCategory.PROJECTILE,
  },
};

/**
 * Platform body options
 */
export const PLATFORM_BODY_OPTIONS: BodyOptions = {
  label: 'platform',
  friction: 0.8,
  isStatic: true,
  collisionFilter: {
    category: CollisionCategory.PLATFORM,
    mask: 0xFFFFFFFF, // Collide with everything
  },
};

/**
 * Collision pair
 */
export interface CollisionPair {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  collision: Matter.Collision;
}

/**
 * Collision event data
 */
export interface CollisionEvent {
  name: 'collisionStart' | 'collisionActive' | 'collisionEnd';
  pairs: CollisionPair[];
  timestamp: number;
  source: Matter.Engine;
}

/**
 * Type guard: Check if body has specific label
 */
export function hasLabel(body: Matter.Body, label: BodyLabel): boolean {
  return body.label === label;
}

/**
 * Type guard: Check if collision involves specific labels
 */
export function isCollisionBetween(
  pair: CollisionPair,
  labelA: BodyLabel,
  labelB: BodyLabel
): boolean {
  return (
    (pair.bodyA.label === labelA && pair.bodyB.label === labelB) ||
    (pair.bodyA.label === labelB && pair.bodyB.label === labelA)
  );
}

/**
 * Get the other body in a collision pair
 */
export function getOtherBody(
  pair: CollisionPair,
  body: Matter.Body
): Matter.Body | null {
  if (pair.bodyA === body) return pair.bodyB;
  if (pair.bodyB === body) return pair.bodyA;
  return null;
}

/**
 * Physics utility functions
 */
export interface PhysicsUtils {
  /** Apply force to body */
  applyForce(
    body: Matter.Body,
    force: { x: number; y: number },
    point?: { x: number; y: number }
  ): void;
  
  /** Set body velocity */
  setVelocity(body: Matter.Body, velocity: { x: number; y: number }): void;
  
  /** Set body position */
  setPosition(body: Matter.Body, position: { x: number; y: number }): void;
  
  /** Check if body is grounded */
  isGrounded(body: Matter.Body, world: Matter.World): boolean;
  
  /** Get bodies in radius */
  getBodiesInRadius(
    world: Matter.World,
    center: { x: number; y: number },
    radius: number
  ): Matter.Body[];
}

/**
 * Raycast result
 */
export interface RaycastResult {
  body: Matter.Body;
  point: { x: number; y: number };
  normal: { x: number; y: number };
  distance: number;
}

/**
 * Raycast options
 */
export interface RaycastOptions {
  /** Ignore bodies with these labels */
  ignoreLabels?: BodyLabel[];
  
  /** Only hit bodies with these labels */
  onlyLabels?: BodyLabel[];
  
  /** Maximum raycast distance */
  maxDistance?: number;
  
  /** Include sensor bodies? */
  includeSensors?: boolean;
}

/**
 * Body dimensions
 * Common sizes from POC
 */
export const BodyDimensions = {
  PLAYER: { width: 35, height: 55 },
  ENEMY_SCOUT: { width: 28, height: 45 },
  ENEMY_WARRIOR: { width: 32, height: 50 },
  ENEMY_BOSS: { width: 64, height: 96 },
} as const;

/**
 * Physics constants from POC
 */
export const PhysicsConstants = {
  /** Player movement speed */
  PLAYER_MOVE_SPEED: 5,
  
  /** Player jump force */
  PLAYER_JUMP_FORCE: -12,
  
  /** Maximum fall speed */
  MAX_FALL_SPEED: 15,
  
  /** Air control factor */
  AIR_CONTROL: 0.3,
  
  /** Ground detection threshold */
  GROUND_THRESHOLD: 2,
} as const;

/**
 * Create physics engine with default config
 */
export function createPhysicsEngine(
  config?: Partial<PhysicsConfig>
): Matter.Engine {
  const Matter = require('matter-js');
  const finalConfig = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  
  const engine = Matter.Engine.create();
  engine.gravity.y = finalConfig.gravity;
  engine.enableSleeping = finalConfig.enableSleeping;
  engine.positionIterations = finalConfig.positionIterations;
  engine.velocityIterations = finalConfig.velocityIterations;
  
  return engine;
}
