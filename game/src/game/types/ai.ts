/**
 * YUKA AI Type Definitions
 *
 * Type definitions for YUKA AI entities and behaviors
 * Used for enemy pathfinding and navigation
 */

import type * as Matter from 'matter-js';
import type * as YUKA from 'yuka';
import type { EnemyAIState, EnemyBehavior } from './entities';

/**
 * Extended YUKA Vehicle with game-specific properties
 */
export interface EnemyVehicle extends YUKA.Vehicle {
  // AI state
  aiState: EnemyAIState;
  behavior: EnemyBehavior;

  // Combat
  hp: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;

  // Detection
  alertRadius: number;
  detectionRadius: number;

  // Target
  target: Matter.Body | null;
  targetPosition: YUKA.Vector3 | null;

  // Patrol
  patrolPoints: YUKA.Vector3[];
  currentPatrolIndex: number;

  // Physics link
  matterBody: Matter.Body;
  entityId: string;
}

/**
 * AI Behavior configuration
 */
export interface AIBehaviorConfig {
  maxSpeed: number;
  maxForce: number;
  mass: number;
  updateOrientation: boolean;

  // Steering behaviors
  arriveDeceleration?: YUKA.Vector3;

  // Pathfinding
  usePathfinding: boolean;
  pathUpdateInterval: number;
}

/**
 * AI State Machine
 */
export interface AIStateMachine {
  currentState: EnemyAIState;
  previousState: EnemyAIState | null;

  update(deltaTime: number): void;
  changeState(newState: EnemyAIState): void;

  // State handlers
  onEnterState?(state: EnemyAIState): void;
  onExitState?(state: EnemyAIState): void;
  onUpdateState?(state: EnemyAIState, deltaTime: number): void;
}

/**
 * AI Manager interface
 * Manages all YUKA AI entities
 */
export interface AIManager {
  time: YUKA.Time;
  entityManager: YUKA.EntityManager;

  // Entity management
  register(vehicle: EnemyVehicle): void;
  unregister(vehicle: EnemyVehicle): void;

  // Update
  update(deltaTime: number): void;

  // Target management
  setTarget(entityId: string, target: Matter.Body): void;
  clearTarget(entityId: string): void;

  // Pathfinding
  findPath(start: YUKA.Vector3, end: YUKA.Vector3): YUKA.Vector3[] | null;
}

/**
 * Steering behavior types
 */
export type SteeringBehaviorType =
  | 'seek'
  | 'flee'
  | 'arrive'
  | 'pursue'
  | 'evade'
  | 'wander'
  | 'followPath';

/**
 * Steering behavior configuration
 */
export interface SteeringBehaviorConfig {
  type: SteeringBehaviorType;
  weight?: number;
  enabled: boolean;

  // Behavior-specific config
  arriveRadius?: number;
  fleeRadius?: number;
  wanderRadius?: number;
  wanderDistance?: number;
  wanderJitter?: number;
}

/**
 * Navigation mesh for pathfinding
 */
export interface NavigationMesh {
  graph: YUKA.Graph;
  regions: YUKA.Polygon[];

  findPath(start: YUKA.Vector3, end: YUKA.Vector3): YUKA.Vector3[];
  clampToMesh(position: YUKA.Vector3): YUKA.Vector3;
}

/**
 * Perception system for AI
 */
export interface PerceptionSystem {
  // Vision
  canSee(observer: YUKA.Vector3, target: YUKA.Vector3, obstacles: Matter.Body[]): boolean;

  // Hearing
  canHear(listener: YUKA.Vector3, sound: { position: YUKA.Vector3; volume: number }): boolean;

  // Memory
  lastSeenPosition: Map<string, { position: YUKA.Vector3; time: number }>;

  update(deltaTime: number): void;
}

/**
 * Boss AI configuration
 */
export interface BossAIConfig extends AIBehaviorConfig {
  phases: Array<{
    healthThreshold: number;
    behavior: EnemyBehavior;
    attackPattern: string;
    speedMultiplier: number;
  }>;

  currentPhase: number;

  // Special attacks
  specialAttacks: Array<{
    id: string;
    cooldown: number;
    damage: number;
    range: number;
    animation: string;
  }>;
}

/**
 * Helper to convert Matter.js position to YUKA Vector3
 */
export function toYukaVector(matterVector: Matter.Vector): any {
  // Import YUKA dynamically at runtime
  const { Vector3 } = require('yuka');
  return new Vector3(matterVector.x, matterVector.y, 0);
}

/**
 * Helper to convert YUKA Vector3 to Matter.js position
 */
export function toMatterVector(yukaVector: any): Matter.Vector {
  return { x: yukaVector.x, y: yukaVector.y };
}
