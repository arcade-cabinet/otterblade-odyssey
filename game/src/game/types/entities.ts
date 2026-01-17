/**
 * Entity Type Definitions
 *
 * Defines types for all game entities (Player, Enemies, Platforms, Items, NPCs)
 * following the vanilla pattern from the POC
 */

import type * as Matter from 'matter-js';
import type * as YUKA from 'yuka';

/**
 * Base entity interface
 * All game entities extend this
 */
export interface Entity {
  id: string;
  type: 'player' | 'enemy' | 'platform' | 'item' | 'npc' | 'boss' | 'trigger' | 'hazard';
  body: Matter.Body;
  position: Matter.Vector;
}

/**
 * Player entity (Finn the Otter)
 */
export interface Player extends Entity {
  type: 'player';

  // Health
  health: number;
  maxHealth: number;

  // Combat
  attackDamage: number;
  attackCooldown: number;
  lastAttackTime: number;

  // Movement
  velocity: { x: number; y: number };
  grounded: boolean;
  jumpForce: number;
  moveSpeed: number;

  // Animation
  facing: 1 | -1; // 1 = right, -1 = left
  animState: 'idle' | 'running' | 'jumping' | 'falling' | 'attacking' | 'hurt' | 'dying';
  animFrame: number;

  // Inventory
  shards: number;
  hasOtterblade: boolean;

  // Status
  invulnerable: boolean;
  invulnerabilityTime: number;
}

/**
 * Enemy AI states
 */
export type EnemyAIState =
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'attack'
  | 'flee'
  | 'hurt'
  | 'dying'
  | 'dead';

/**
 * Enemy types from DDL manifests
 */
export type EnemyType = 'scout' | 'warrior' | 'brute' | 'archer' | 'shaman' | 'boss';

/**
 * Enemy behavior patterns
 */
export type EnemyBehavior =
  | 'patrol'
  | 'stationary'
  | 'aggressive'
  | 'defensive'
  | 'coward'
  | 'boss';

/**
 * Enemy entity (Galeborn)
 */
export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: EnemyType;

  // Health
  health: number;
  maxHealth: number;

  // Combat
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;

  // Movement
  speed: number;

  // AI
  aiState: EnemyAIState;
  behavior: EnemyBehavior;
  target: Matter.Body | null;
  patrolPoints: Array<{ x: number; y: number }>;
  currentPatrolIndex: number;
  alertRadius: number;

  // YUKA AI (optional, if using YUKA navigation)
  vehicle?: YUKA.Vehicle;

  // Animation
  facing: 1 | -1;
  animFrame: number;
  animSpeed: number;

  // Status
  invulnerable: boolean;
  invulnerabilityTime: number;
  knockbackVelocity?: { x: number; y: number };
}

/**
 * Boss enemy (Zephyros)
 */
export interface Boss extends Omit<Enemy, 'type'> {
  type: 'boss';
  enemyType: 'boss';

  // Boss-specific
  phase: 1 | 2 | 3;
  phaseTransitionHealth: number[];
  specialAttacks: string[];
  currentAttackPattern: string;

  // Multi-part body (for complex bosses)
  bodyParts?: Matter.Body[];
}

/**
 * Platform types
 */
export type PlatformType =
  | 'static'
  | 'moving'
  | 'crumbling'
  | 'semi-solid'
  | 'ice'
  | 'wood'
  | 'stone';

/**
 * Platform entity
 */
export interface Platform extends Entity {
  type: 'platform';
  platformType: PlatformType;

  // Movement (for moving platforms)
  isMoving?: boolean;
  movePoints?: Array<{ x: number; y: number }>;
  moveSpeed?: number;
  currentMoveIndex?: number;

  // Crumbling platforms
  isCrumbling?: boolean;
  crumbleTime?: number;
  crumbleDelay?: number;

  // Physics properties
  friction?: number;
  restitution?: number;
}

/**
 * Item types
 */
export type ItemType = 'shard' | 'health' | 'key' | 'otterblade' | 'collectible';

/**
 * Collectible item entity
 */
export interface Item extends Entity {
  type: 'item';
  itemType: ItemType;

  // Properties
  value?: number; // For shards, health amount, etc.
  collected: boolean;

  // Animation
  bobOffset: number;
  bobSpeed: number;
  rotationSpeed?: number;

  // Trigger
  triggerRadius?: number;
}

/**
 * NPC entity
 */
export interface NPC extends Entity {
  type: 'npc';

  // Identity
  npcId: string;
  npcType: string;

  // Dialogue
  dialogue?: string[];
  currentDialogueIndex: number;
  hasInteracted: boolean;

  // Animation
  facing: 1 | -1;
  animState: 'idle' | 'talking' | 'gesturing';
  animFrame: number;

  // Interaction
  interactionRadius: number;
  isInteractable: boolean;
}

/**
 * Action parameters interface for triggers
 */
export interface ActionParams {
  target?: string;
  amount?: number;
  duration?: number;
  value?: string | number | boolean;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Trigger zone entity
 */
export interface Trigger extends Entity {
  type: 'trigger';

  // Trigger properties
  triggerId: string;
  triggerType: 'cinematic' | 'checkpoint' | 'enemy_spawn' | 'dialogue' | 'chapter_transition';

  // State
  triggered: boolean;
  repeatable: boolean;

  // Action
  action: string;
  actionParams?: ActionParams;
}

/**
 * Hazard types
 */
export type HazardType = 'spikes' | 'fire' | 'water' | 'wind' | 'falling_block' | 'crusher';

/**
 * Hazard entity
 */
export interface Hazard extends Entity {
  type: 'hazard';
  hazardType: HazardType;

  // Damage
  damage: number;
  damageInterval: number; // For continuous damage
  lastDamageTime: number;

  // Animation/Movement
  isActive: boolean;
  activationDelay?: number;
  pattern?: string; // For crushers, falling blocks, etc.
}

/**
 * Type guards for runtime checks
 */
export function isPlayer(entity: Entity): entity is Player {
  return entity.type === 'player';
}

export function isEnemy(entity: Entity): entity is Enemy {
  return entity.type === 'enemy';
}

export function isBoss(entity: Entity): entity is Boss {
  return entity.type === 'boss';
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

export function isHazard(entity: Entity): entity is Hazard {
  return entity.type === 'hazard';
}
