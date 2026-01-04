/**
 * Entity type definitions for Otterblade Odyssey
 * 
 * Entities are simple JavaScript objects with Matter.js bodies.
 * NOT using ECS framework - vanilla patterns from POC.
 */

import type Matter from 'matter-js';

/**
 * Base entity interface
 * All game entities implement this
 */
export interface Entity {
  /** Unique entity identifier */
  id: string;
  
  /** Entity type discriminator */
  type: EntityType;
  
  /** Matter.js physics body */
  body: Matter.Body;
  
  /** Entity metadata */
  metadata?: Record<string, unknown>;
}

export type EntityType = 
  | 'player' 
  | 'enemy' 
  | 'platform' 
  | 'item' 
  | 'npc'
  | 'trigger'
  | 'projectile'
  | 'hazard';

/**
 * Player entity (Finn the otter)
 */
export interface Player extends Entity {
  type: 'player';
  
  /** Current health */
  health: number;
  
  /** Maximum health */
  maxHealth: number;
  
  /** Attack damage */
  attackDamage: number;
  
  /** Current velocity */
  velocity: { x: number; y: number };
  
  /** Is player grounded? */
  isGrounded: boolean;
  
  /** Current animation state */
  animationState: PlayerAnimationState;
  
  /** Is player attacking? */
  isAttacking: boolean;
  
  /** Attack cooldown timer */
  attackCooldown: number;
  
  /** Facing direction (1 = right, -1 = left) */
  facingDirection: 1 | -1;
  
  /** Inventory */
  inventory: Inventory;
}

export type PlayerAnimationState = 
  | 'idle' 
  | 'walk' 
  | 'run' 
  | 'jump' 
  | 'fall' 
  | 'attack' 
  | 'hurt' 
  | 'death';

export interface Inventory {
  /** Collected shards */
  shards: number;
  
  /** Collected items */
  items: string[];
  
  /** Max inventory slots */
  maxSlots: number;
}

/**
 * Enemy entity (Galeborn)
 */
export interface Enemy extends Entity {
  type: 'enemy';
  
  /** Enemy subtype */
  enemyType: EnemyType;
  
  /** Current health */
  hp: number;
  
  /** Maximum health */
  maxHp: number;
  
  /** Attack damage */
  damage: number;
  
  /** Movement speed */
  speed: number;
  
  /** Current AI state */
  aiState: AIState;
  
  /** Detection radius */
  detectionRadius: number;
  
  /** Attack range */
  attackRange: number;
  
  /** Attack cooldown */
  attackCooldown: number;
  
  /** Patrol path (if patrolling) */
  patrolPath?: { x: number; y: number }[];
  
  /** Current patrol index */
  patrolIndex?: number;
  
  /** Target entity (when chasing) */
  target?: { x: number; y: number };
  
  /** Facing direction */
  facingDirection: 1 | -1;
  
  /** Animation state */
  animationState: EnemyAnimationState;
}

export type EnemyType = 
  | 'scout' 
  | 'warrior' 
  | 'archer' 
  | 'boss';

export type AIState = 
  | 'idle' 
  | 'patrol' 
  | 'chase' 
  | 'attack' 
  | 'flee' 
  | 'hurt' 
  | 'death';

export type EnemyAnimationState = 
  | 'idle' 
  | 'walk' 
  | 'attack' 
  | 'hurt' 
  | 'death';

/**
 * Platform entity (solid terrain)
 */
export interface Platform extends Entity {
  type: 'platform';
  
  /** Platform width */
  width: number;
  
  /** Platform height */
  height: number;
  
  /** Is platform solid? */
  isSolid: boolean;
  
  /** Platform color/texture */
  appearance: PlatformAppearance;
}

export interface PlatformAppearance {
  color?: string;
  texture?: string;
  pattern?: 'stone' | 'wood' | 'grass' | 'metal';
}

/**
 * Item entity (collectibles)
 */
export interface Item extends Entity {
  type: 'item';
  
  /** Item subtype */
  itemType: ItemType;
  
  /** Item value */
  value: number;
  
  /** Is item collected? */
  isCollected: boolean;
  
  /** Pickup effect */
  effect?: ItemEffect;
}

export type ItemType = 
  | 'shard' 
  | 'health' 
  | 'powerup' 
  | 'key' 
  | 'quest';

export interface ItemEffect {
  type: 'heal' | 'damage' | 'speed' | 'invincibility';
  value: number;
  duration?: number;
}

/**
 * NPC entity (non-hostile characters)
 */
export interface NPC extends Entity {
  type: 'npc';
  
  /** NPC name */
  name: string;
  
  /** NPC role */
  role: string;
  
  /** Dialogue lines */
  dialogue: string[];
  
  /** Current dialogue index */
  dialogueIndex: number;
  
  /** Is NPC interactive? */
  isInteractive: boolean;
  
  /** Interaction range */
  interactionRange: number;
  
  /** NPC appearance */
  appearance: NPCAppearance;
}

export interface NPCAppearance {
  species: 'otter' | 'badger' | 'mouse' | 'squirrel' | 'hedgehog';
  color: string;
  accessories?: string[];
}

/**
 * Trigger entity (invisible event zones)
 */
export interface Trigger extends Entity {
  type: 'trigger';
  
  /** Trigger action */
  action: TriggerAction;
  
  /** Is trigger active? */
  isActive: boolean;
  
  /** Has trigger been activated? */
  hasTriggered: boolean;
  
  /** Can trigger repeat? */
  isRepeatable: boolean;
  
  /** Trigger bounds */
  bounds: { x: number; y: number; width: number; height: number };
}

export type TriggerAction = 
  | 'cutscene' 
  | 'dialogue' 
  | 'checkpoint' 
  | 'boss_fight' 
  | 'level_complete'
  | 'spawn_enemies';

/**
 * Projectile entity (thrown/shot objects)
 */
export interface Projectile extends Entity {
  type: 'projectile';
  
  /** Projectile damage */
  damage: number;
  
  /** Projectile speed */
  speed: number;
  
  /** Direction vector */
  direction: { x: number; y: number };
  
  /** Owner entity ID */
  ownerId: string;
  
  /** Lifetime remaining */
  lifetime: number;
  
  /** Has projectile hit something? */
  hasHit: boolean;
}

/**
 * Hazard entity (damaging environment)
 */
export interface Hazard extends Entity {
  type: 'hazard';
  
  /** Hazard subtype */
  hazardType: HazardType;
  
  /** Damage per tick */
  damage: number;
  
  /** Is hazard active? */
  isActive: boolean;
  
  /** Hazard bounds */
  bounds: { x: number; y: number; width: number; height: number };
}

export type HazardType = 
  | 'spikes' 
  | 'fire' 
  | 'water' 
  | 'poison' 
  | 'falling';

/**
 * Type guard functions
 */
export function isPlayer(entity: Entity): entity is Player {
  return entity.type === 'player';
}

export function isEnemy(entity: Entity): entity is Enemy {
  return entity.type === 'enemy';
}

export function isPlatform(entity: Entity): entity is Platform {
  return entity.type === 'platform';
}

export function isItem(entity: Entity): entity is Item {
  return entity.type === 'item';
}

export function isNPC(entity: Entity): entity is NPC {
  return entity.type === 'npc';
}

export function isTrigger(entity: Entity): entity is Trigger {
  return entity.type === 'trigger';
}

export function isProjectile(entity: Entity): entity is Projectile {
  return entity.type === 'projectile';
}

export function isHazard(entity: Entity): entity is Hazard {
  return entity.type === 'hazard';
}

/**
 * Entity factory options
 */
export interface EntityFactoryOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  properties?: Record<string, unknown>;
}
