/**
 * Matter.js physics type definitions and utilities
 * Type-safe wrappers for Matter.js bodies and physics operations
 */

import type Matter from 'matter-js';

/**
 * Physics body configuration for creating entities
 */
export interface BodyConfig {
  /** Body label for identification */
  label: string;
  
  /** Friction coefficient (0 = slippery, 1 = grippy) */
  friction?: number;
  
  /** Air resistance */
  frictionAir?: number;
  
  /** Bounciness (0 = no bounce, 1 = full bounce) */
  restitution?: number;
  
  /** Is body static (immovable)? */
  isStatic?: boolean;
  
  /** Is body a sensor (no collision response)? */
  isSensor?: boolean;
  
  /** Body density */
  density?: number;
  
  /** Collision filter category */
  category?: number;
  
  /** Collision filter mask */
  mask?: number;
}

/**
 * Physics engine configuration
 */
export interface PhysicsConfig {
  /** Gravity Y value (1.5 is POC-proven value) */
  gravityY?: number;
  
  /** Gravity X value */
  gravityX?: number;
  
  /** Enable sleeping (performance optimization) */
  enableSleeping?: boolean;
  
  /** Timing precision */
  timing?: {
    timeScale?: number;
  };
}

/**
 * Collision pair with type information
 */
export interface CollisionPair {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  collision: Matter.Collision;
}

/**
 * Collision handler callback type
 */
export type CollisionHandler = (pairs: CollisionPair[]) => void;

/**
 * Type-safe collision event listener
 */
export interface CollisionListener {
  /** Called when collision starts */
  onCollisionStart?: CollisionHandler;
  
  /** Called while collision is active */
  onCollisionActive?: CollisionHandler;
  
  /** Called when collision ends */
  onCollisionEnd?: CollisionHandler;
}

/**
 * Physics engine wrapper interface
 */
export interface PhysicsEngine {
  /** Matter.js engine instance */
  engine: Matter.Engine;
  
  /** Update physics simulation */
  update(deltaTime: number): void;
  
  /** Add body to world */
  addBody(body: Matter.Body): void;
  
  /** Remove body from world */
  removeBody(body: Matter.Body): void;
  
  /** Register collision listener */
  addCollisionListener(listener: CollisionListener): void;
  
  /** Cleanup physics engine */
  destroy(): void;
}

/**
 * POC-proven physics constants
 * These values are from pocs/otterblade_odyssey.html
 */
export const PHYSICS_CONSTANTS = {
  /** Perfect platforming gravity value */
  GRAVITY_Y: 1.5,
  
  /** Player body dimensions */
  PLAYER: {
    WIDTH: 35,
    HEIGHT: 55,
    FRICTION: 0.1,
    FRICTION_AIR: 0.01,
    RESTITUTION: 0,
  },
  
  /** Enemy body dimensions */
  ENEMY: {
    WIDTH: 28,
    HEIGHT: 45,
    FRICTION: 0.1,
    FRICTION_AIR: 0.01,
    RESTITUTION: 0,
  },
  
  /** Platform friction */
  PLATFORM: {
    FRICTION: 0.8,
    FRICTION_STATIC: 0.9,
  },
  
  /** Target frame rate */
  TARGET_FPS: 60,
  
  /** Fixed timestep for physics (milliseconds) */
  FIXED_TIMESTEP: 1000 / 60, // 16.67ms
} as const;

/**
 * Type guard to check if body has a specific label
 */
export function hasBodyLabel(body: Matter.Body, label: string): boolean {
  return body.label === label;
}

/**
 * Type guard to check if body is player
 */
export function isPlayerBody(body: Matter.Body): boolean {
  return hasBodyLabel(body, 'player');
}

/**
 * Type guard to check if body is enemy
 */
export function isEnemyBody(body: Matter.Body): boolean {
  return hasBodyLabel(body, 'enemy');
}

/**
 * Type guard to check if body is platform
 */
export function isPlatformBody(body: Matter.Body): boolean {
  return hasBodyLabel(body, 'platform');
}

/**
 * Helper to create player body with POC-proven settings
 */
export function createPlayerBodyConfig(): BodyConfig {
  return {
    label: 'player',
    friction: PHYSICS_CONSTANTS.PLAYER.FRICTION,
    frictionAir: PHYSICS_CONSTANTS.PLAYER.FRICTION_AIR,
    restitution: PHYSICS_CONSTANTS.PLAYER.RESTITUTION,
  };
}

/**
 * Helper to create enemy body config
 */
export function createEnemyBodyConfig(): BodyConfig {
  return {
    label: 'enemy',
    friction: PHYSICS_CONSTANTS.ENEMY.FRICTION,
    frictionAir: PHYSICS_CONSTANTS.ENEMY.FRICTION_AIR,
    restitution: PHYSICS_CONSTANTS.ENEMY.RESTITUTION,
  };
}

/**
 * Helper to create platform body config
 */
export function createPlatformBodyConfig(): BodyConfig {
  return {
    label: 'platform',
    friction: PHYSICS_CONSTANTS.PLATFORM.FRICTION,
    isStatic: true,
  };
}
