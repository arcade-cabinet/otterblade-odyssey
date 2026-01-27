/**
 * Matter.js Physics Type Definitions
 *
 * Type helpers and utilities for Matter.js physics bodies
 * Ensures type safety for collision detection and body manipulation
 */

import type * as Matter from 'matter-js';

/**
 * Body labels used for collision detection
 * These match the labels in PhysicsManager.js and enemy-factory.js
 */
export type BodyLabel =
  | 'player'
  | 'finn_torso'
  | 'finn_head'
  | 'finn_feet'
  | 'enemy'
  | 'platform'
  | 'item'
  | 'npc'
  | 'trigger'
  | 'hazard'
  | 'projectile'
  | 'boss'
  | 'boss_part';

/**
 * Collision groups from PhysicsManager.js
 */
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
} as const;

/**
 * Collision masks from PhysicsManager.js
 */
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
} as const;

/**
 * Extended Matter.js body with game-specific properties
 */
export interface GameBody extends Matter.Body {
  label: BodyLabel;
  entityId?: string; // Link to game entity
}

/**
 * Type guard to check if a body is a player body
 */
export function isPlayerBody(body: Matter.Body): boolean {
  return body.label === 'player' || body.label === 'finn_torso';
}

/**
 * Type guard to check if a body is an enemy body
 */
export function isEnemyBody(body: Matter.Body): boolean {
  return body.label === 'enemy';
}

/**
 * Type guard to check if a body is a platform
 */
export function isPlatformBody(body: Matter.Body): boolean {
  return body.label === 'platform';
}

/**
 * Type guard to check if a body is an item
 */
export function isItemBody(body: Matter.Body): boolean {
  return body.label === 'item';
}

/**
 * Type guard to check if a body is a trigger
 */
export function isTriggerBody(body: Matter.Body): boolean {
  return body.label === 'trigger';
}

/**
 * Type guard to check if a body is a hazard
 */
export function isHazardBody(body: Matter.Body): boolean {
  return body.label === 'hazard';
}

/**
 * Type guard to check if a body is a boss
 */
export function isBossBody(body: Matter.Body): boolean {
  return body.label === 'boss' || body.label === 'boss_part';
}

/**
 * Physics engine configuration
 */
export interface PhysicsConfig {
  gravity: { x: number; y: number };
  enableSleeping: boolean;
  positionIterations: number;
  velocityIterations: number;
}

/**
 * Default physics configuration from PhysicsManager.js
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: { x: 0, y: 1.5 }, // POC-proven value
  enableSleeping: false,
  positionIterations: 8,
  velocityIterations: 6,
};

/**
 * Body creation options
 */
export interface BodyOptions extends Matter.IBodyDefinition {
  label: BodyLabel;
  entityId?: string;
  collisionFilter?: {
    category: number;
    mask: number;
    group?: number;
  };
}

/**
 * Collision pair type
 */
export interface CollisionPair {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  collision: Matter.Collision;
}

/**
 * Collision event handler type
 */
export type CollisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => void;
