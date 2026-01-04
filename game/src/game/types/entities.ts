/**
 * Entity type definitions for Otterblade Odyssey
 * All game entities extend the base Entity interface
 */

import type Matter from 'matter-js';

/**
 * Base entity interface - all game objects are entities
 */
export interface Entity {
  /** Unique identifier */
  id: string;
  
  /** Entity type discriminator */
  type: 'player' | 'enemy' | 'platform' | 'item' | 'npc' | 'trigger' | 'boss';
  
  /** Matter.js physics body */
  body: Matter.Body;
}

/**
 * Player entity - Finn the otter protagonist
 */
export interface Player extends Entity {
  type: 'player';
  
  /** Current health */
  health: number;
  
  /** Maximum health */
  maxHealth: number;
  
  /** Attack damage dealt */
  attackDamage: number;
  
  /** Current velocity */
  velocity: { x: number; y: number };
  
  /** Is player attacking? */
  isAttacking?: boolean;
  
  /** Is player on ground? */
  onGround?: boolean;
  
  /** Direction facing (1 = right, -1 = left) */
  facing?: number;
}

/**
 * Enemy entity - Galeborn adversaries
 */
export interface Enemy extends Entity {
  type: 'enemy';
  
  /** Enemy variant type */
  enemyType: 'scout' | 'warrior' | 'boss';
  
  /** Current hit points */
  hp: number;
  
  /** Damage dealt to player */
  damage: number;
  
  /** Movement speed */
  speed: number;
  
  /** Current AI state */
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'hurt';
  
  /** Patrol waypoints for idle/patrol states */
  patrolPoints?: { x: number; y: number }[];
  
  /** Current waypoint index */
  currentWaypoint?: number;
  
  /** Detection radius for player */
  detectionRadius?: number;
  
  /** Attack range */
  attackRange?: number;
}

/**
 * Platform entity - static or moving platforms
 */
export interface Platform extends Entity {
  type: 'platform';
  
  /** Width of platform */
  width: number;
  
  /** Height of platform */
  height: number;
  
  /** Is platform moving? */
  isMoving?: boolean;
  
  /** Platform movement path */
  movementPath?: { x: number; y: number }[];
}

/**
 * Collectible item entity
 */
export interface Item extends Entity {
  type: 'item';
  
  /** Item variant type */
  itemType: 'shard' | 'health' | 'key' | 'scroll';
  
  /** Has item been collected? */
  collected?: boolean;
  
  /** Value or quantity */
  value?: number;
}

/**
 * NPC entity - friendly characters
 */
export interface NPC extends Entity {
  type: 'npc';
  
  /** NPC name */
  name: string;
  
  /** NPC role/occupation */
  role: string;
  
  /** Dialogue lines */
  dialogue?: string[];
  
  /** Current dialogue index */
  currentDialogue?: number;
}

/**
 * Trigger entity - invisible collision zones
 */
export interface Trigger extends Entity {
  type: 'trigger';
  
  /** Trigger action type */
  triggerType: 'cutscene' | 'checkpoint' | 'quest' | 'chapter_end';
  
  /** Has trigger been activated? */
  activated?: boolean;
  
  /** Callback function when triggered */
  onTrigger?: () => void;
}

/**
 * Boss entity - chapter boss enemies
 */
export interface Boss extends Omit<Enemy, 'type'> {
  type: 'boss';
  enemyType: 'boss';
  
  /** Boss name */
  name: string;
  
  /** Maximum HP for health bar */
  maxHp: number;
  
  /** Boss phase (for multi-phase fights) */
  phase?: number;
  
  /** Special abilities */
  abilities?: string[];
}

/**
 * Type guard to check if entity is a player
 */
export function isPlayer(entity: Entity): entity is Player {
  return entity.type === 'player';
}

/**
 * Type guard to check if entity is an enemy
 */
export function isEnemy(entity: Entity): entity is Enemy {
  return entity.type === 'enemy';
}

/**
 * Type guard to check if entity is a boss
 */
export function isBoss(entity: Entity): entity is Boss {
  return entity.type === 'boss';
}

/**
 * Type guard to check if entity is a platform
 */
export function isPlatform(entity: Entity): entity is Platform {
  return entity.type === 'platform';
}

/**
 * Type guard to check if entity is an item
 */
export function isItem(entity: Entity): entity is Item {
  return entity.type === 'item';
}

/**
 * Type guard to check if entity is an NPC
 */
export function isNPC(entity: Entity): entity is NPC {
  return entity.type === 'npc';
}

/**
 * Type guard to check if entity is a trigger
 */
export function isTrigger(entity: Entity): entity is Trigger {
  return entity.type === 'trigger';
}
