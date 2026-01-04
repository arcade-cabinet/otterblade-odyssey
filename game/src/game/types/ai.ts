/**
 * YUKA AI type definitions and interfaces
 * Type-safe wrappers for YUKA pathfinding and behavior
 */

import type * as YUKA from 'yuka';

/**
 * AI state machine states for enemies
 */
export type AIState = 
  | 'idle'      // Standing still
  | 'patrol'    // Following waypoints
  | 'chase'     // Pursuing player
  | 'attack'    // Attacking player
  | 'flee'      // Running away
  | 'hurt'      // Taking damage (stun)
  | 'dead';     // Defeated

/**
 * AI behavior configuration
 */
export interface AIBehaviorConfig {
  /** Detection radius for player awareness */
  detectionRadius: number;
  
  /** Attack range */
  attackRange: number;
  
  /** Movement speed */
  speed: number;
  
  /** Maximum speed */
  maxSpeed: number;
  
  /** Maximum force for steering */
  maxForce: number;
  
  /** Patrol waypoints */
  patrolPoints?: { x: number; y: number }[];
  
  /** Should loop patrol path? */
  loopPatrol?: boolean;
  
  /** Delay at each waypoint (seconds) */
  waypointDelay?: number;
}

/**
 * YUKA vehicle with AI state
 * Extends YUKA.Vehicle with game-specific properties
 */
export interface AIVehicle extends YUKA.Vehicle {
  /** Current AI state */
  aiState: AIState;
  
  /** Reference to associated enemy entity ID */
  entityId: string;
  
  /** Current target (usually player) */
  target?: YUKA.Vector3;
  
  /** Patrol path */
  path?: YUKA.Path;
  
  /** Current waypoint index */
  currentWaypoint?: number;
  
  /** Time at current waypoint */
  waypointTimer?: number;
  
  /** Follow behavior for pathfinding */
  followBehavior?: YUKA.FollowPathBehavior;
  
  /** Seek behavior for chasing */
  seekBehavior?: YUKA.SeekBehavior;
  
  /** Flee behavior for escaping */
  fleeBehavior?: YUKA.FleeBehavior;
}

/**
 * Navigation graph for pathfinding
 */
export interface NavigationGraph {
  /** YUKA graph instance */
  graph: YUKA.Graph;
  
  /** Add node to graph */
  addNode(x: number, y: number, z?: number): number;
  
  /** Add edge between nodes */
  addEdge(fromIndex: number, toIndex: number): void;
  
  /** Find path between two points */
  findPath(start: YUKA.Vector3, end: YUKA.Vector3): YUKA.Vector3[] | null;
}

/**
 * Entity manager for YUKA
 */
export interface AIManager {
  /** YUKA entity manager */
  entityManager: YUKA.EntityManager;
  
  /** Navigation graph for level */
  navGraph?: NavigationGraph;
  
  /** Update AI simulation */
  update(deltaTime: number): void;
  
  /** Add AI vehicle to manager */
  addVehicle(vehicle: AIVehicle): void;
  
  /** Remove AI vehicle from manager */
  removeVehicle(vehicle: AIVehicle): void;
  
  /** Get vehicle by entity ID */
  getVehicle(entityId: string): AIVehicle | undefined;
  
  /** Create navigation graph from level data */
  createNavGraph(platforms: { x: number; y: number; width: number; height: number }[]): void;
  
  /** Cleanup AI manager */
  destroy(): void;
}

/**
 * AI state machine interface
 */
export interface AIStateMachine {
  /** Current state */
  currentState: AIState;
  
  /** Previous state */
  previousState?: AIState;
  
  /** Transition to new state */
  transitionTo(newState: AIState): void;
  
  /** Update current state logic */
  update(vehicle: AIVehicle, deltaTime: number): void;
  
  /** Check if can transition to state */
  canTransitionTo(state: AIState): boolean;
}

/**
 * Steering behavior type
 */
export type SteeringBehaviorType = 
  | 'seek'
  | 'flee'
  | 'arrive'
  | 'pursuit'
  | 'evade'
  | 'wander'
  | 'follow_path';

/**
 * Steering behavior configuration
 */
export interface SteeringBehaviorConfig {
  type: SteeringBehaviorType;
  weight?: number;
  active?: boolean;
}

/**
 * Default AI behavior presets
 */
export const AI_PRESETS = {
  SCOUT: {
    detectionRadius: 150,
    attackRange: 40,
    speed: 1.2,
    maxSpeed: 2.0,
    maxForce: 1.5,
  },
  WARRIOR: {
    detectionRadius: 200,
    attackRange: 50,
    speed: 1.0,
    maxSpeed: 1.8,
    maxForce: 2.0,
  },
  BOSS: {
    detectionRadius: 300,
    attackRange: 80,
    speed: 0.8,
    maxSpeed: 1.5,
    maxForce: 2.5,
  },
} as const;

/**
 * Helper to create AI vehicle from behavior config
 */
export function createAIVehicleConfig(config: AIBehaviorConfig): Partial<YUKA.Vehicle> {
  return {
    maxSpeed: config.maxSpeed,
    maxForce: config.maxForce,
  };
}

/**
 * Type guard to check if vehicle is AI vehicle
 */
export function isAIVehicle(vehicle: YUKA.Vehicle): vehicle is AIVehicle {
  return 'aiState' in vehicle && 'entityId' in vehicle;
}
