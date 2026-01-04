/**
 * AI type definitions for YUKA integration
 * 
 * Provides type-safe wrappers for YUKA AI entities and behaviors.
 */

import * as YUKA from 'yuka';

/**
 * AI state machine states
 */
export type AIState = 
  | 'idle'
  | 'patrol'
  | 'chase'
  | 'attack'
  | 'flee'
  | 'hurt'
  | 'death';

/**
 * AI behavior configuration
 */
export interface AIBehaviorConfig {
  /** Movement speed */
  maxSpeed: number;
  
  /** Maximum force for steering */
  maxForce: number;
  
  /** Arrival radius */
  arrivalRadius: number;
  
  /** Detection radius for player */
  detectionRadius: number;
  
  /** Attack range */
  attackRange: number;
  
  /** Flee distance threshold */
  fleeDistance?: number;
  
  /** Patrol waypoints */
  patrolWaypoints?: { x: number; y: number }[];
  
  /** Wander behavior settings */
  wander?: WanderConfig;
}

/**
 * Wander behavior configuration
 */
export interface WanderConfig {
  /** Wander circle distance */
  distance: number;
  
  /** Wander circle radius */
  radius: number;
  
  /** Maximum angle change per frame */
  jitter: number;
}

/**
 * AI entity that extends YUKA Vehicle
 */
export interface AIEntity {
  /** YUKA vehicle instance */
  vehicle: YUKA.Vehicle;
  
  /** Entity ID (links to game entity) */
  entityId: string;
  
  /** Current AI state */
  state: AIState;
  
  /** State machine */
  stateMachine: AIStateMachine;
  
  /** Steering behaviors */
  behaviors: SteeringBehaviors;
  
  /** Target entity (for chase/flee) */
  target?: { x: number; y: number; z: number };
  
  /** Patrol path */
  patrolPath?: YUKA.Path;
  
  /** Current patrol index */
  patrolIndex: number;
  
  /** Time in current state */
  stateTime: number;
  
  /** Last attack time */
  lastAttackTime: number;
  
  /** Attack cooldown (ms) */
  attackCooldown: number;
}

/**
 * AI state machine
 */
export interface AIStateMachine {
  /** Current state */
  currentState: AIState;
  
  /** Previous state */
  previousState: AIState | null;
  
  /** State enter callbacks */
  onEnter: Map<AIState, () => void>;
  
  /** State update callbacks */
  onUpdate: Map<AIState, (deltaTime: number) => void>;
  
  /** State exit callbacks */
  onExit: Map<AIState, () => void>;
  
  /** Change to new state */
  changeState(newState: AIState): void;
  
  /** Update current state */
  update(deltaTime: number): void;
}

/**
 * Steering behaviors collection
 */
export interface SteeringBehaviors {
  /** Seek behavior */
  seek?: YUKA.SeekBehavior;
  
  /** Flee behavior */
  flee?: YUKA.FleeBehavior;
  
  /** Arrive behavior */
  arrive?: YUKA.ArriveBehavior;
  
  /** Wander behavior */
  wander?: YUKA.WanderBehavior;
  
  /** Follow path behavior */
  followPath?: YUKA.FollowPathBehavior;
  
  /** Obstacle avoidance */
  obstacleAvoidance?: YUKA.ObstacleAvoidanceBehavior;
}

/**
 * AI perception data
 */
export interface AIPerception {
  /** Visible entities */
  visibleEntities: string[];
  
  /** Distance to player */
  distanceToPlayer: number;
  
  /** Can see player? */
  canSeePlayer: boolean;
  
  /** Nearby obstacles */
  nearbyObstacles: Obstacle[];
  
  /** Nearby allies */
  nearbyAllies: string[];
}

/**
 * Obstacle for AI navigation
 */
export interface Obstacle {
  /** Obstacle position */
  position: { x: number; y: number };
  
  /** Obstacle radius */
  radius: number;
  
  /** Obstacle type */
  type: 'static' | 'dynamic';
}

/**
 * AI decision weights
 */
export interface AIDecisionWeights {
  /** Aggression level (0-1) */
  aggression: number;
  
  /** Caution level (0-1) */
  caution: number;
  
  /** Curiosity level (0-1) */
  curiosity: number;
  
  /** Teamwork factor (0-1) */
  teamwork: number;
}

/**
 * Scout AI behavior (fast, light, evasive)
 */
export interface ScoutAIBehavior extends AIBehaviorConfig {
  maxSpeed: 3.0;
  detectionRadius: 150;
  attackRange: 30;
  fleeDistance: 50;
}

/**
 * Warrior AI behavior (balanced, aggressive)
 */
export interface WarriorAIBehavior extends AIBehaviorConfig {
  maxSpeed: 2.0;
  detectionRadius: 120;
  attackRange: 40;
}

/**
 * Boss AI behavior (slow, powerful, strategic)
 */
export interface BossAIBehavior extends AIBehaviorConfig {
  maxSpeed: 1.5;
  detectionRadius: 200;
  attackRange: 60;
  /** Boss phase (changes behavior) */
  phase: 1 | 2 | 3;
  
  /** Phase transition HP thresholds */
  phaseThresholds: number[];
}

/**
 * Create AI entity with YUKA vehicle
 */
export function createAIEntity(
  entityId: string,
  position: { x: number; y: number },
  config: AIBehaviorConfig
): AIEntity {
  const vehicle = new YUKA.Vehicle();
  vehicle.position.set(position.x, 0, position.y); // YUKA uses XZ plane
  vehicle.maxSpeed = config.maxSpeed;
  vehicle.maxForce = config.maxForce;
  
  const entity: AIEntity = {
    vehicle,
    entityId,
    state: 'idle',
    stateMachine: createStateMachine(),
    behaviors: {},
    patrolIndex: 0,
    stateTime: 0,
    lastAttackTime: 0,
    attackCooldown: config.attackRange || 1000,
  };
  
  return entity;
}

/**
 * Create AI state machine
 */
export function createStateMachine(): AIStateMachine {
  return {
    currentState: 'idle',
    previousState: null,
    onEnter: new Map(),
    onUpdate: new Map(),
    onExit: new Map(),
    
    changeState(newState: AIState) {
      if (this.currentState === newState) return;
      
      // Exit current state
      const exitCallback = this.onExit.get(this.currentState);
      if (exitCallback) exitCallback();
      
      // Change state
      this.previousState = this.currentState;
      this.currentState = newState;
      
      // Enter new state
      const enterCallback = this.onEnter.get(newState);
      if (enterCallback) enterCallback();
    },
    
    update(deltaTime: number) {
      const updateCallback = this.onUpdate.get(this.currentState);
      if (updateCallback) updateCallback(deltaTime);
    },
  };
}

/**
 * AI manager interface
 */
export interface AIManager {
  /** YUKA entity manager */
  entityManager: YUKA.EntityManager;
  
  /** YUKA time instance */
  time: YUKA.Time;
  
  /** All AI entities */
  aiEntities: Map<string, AIEntity>;
  
  /** Add AI entity */
  addEntity(entity: AIEntity): void;
  
  /** Remove AI entity */
  removeEntity(entityId: string): void;
  
  /** Update all AI entities */
  update(deltaTime: number): void;
  
  /** Set player position (for chase/flee behaviors) */
  setPlayerPosition(position: { x: number; y: number }): void;
}

/**
 * Pathfinding graph node
 */
export interface PathNode {
  /** Node position */
  position: { x: number; y: number };
  
  /** Connected nodes */
  neighbors: PathNode[];
  
  /** Node cost */
  cost: number;
  
  /** Is node walkable? */
  walkable: boolean;
}

/**
 * Pathfinding graph
 */
export interface PathfindingGraph {
  /** All nodes */
  nodes: PathNode[];
  
  /** Find path between two points */
  findPath(
    start: { x: number; y: number },
    goal: { x: number; y: number }
  ): { x: number; y: number }[] | null;
  
  /** Add obstacle to graph */
  addObstacle(position: { x: number; y: number }, radius: number): void;
  
  /** Remove obstacle from graph */
  removeObstacle(position: { x: number; y: number }, radius: number): void;
}

/**
 * Default AI behavior configs for different enemy types
 */
export const DEFAULT_AI_CONFIGS = {
  scout: {
    maxSpeed: 3.0,
    maxForce: 5.0,
    arrivalRadius: 10,
    detectionRadius: 150,
    attackRange: 30,
    fleeDistance: 50,
  } as ScoutAIBehavior,
  
  warrior: {
    maxSpeed: 2.0,
    maxForce: 4.0,
    arrivalRadius: 15,
    detectionRadius: 120,
    attackRange: 40,
  } as WarriorAIBehavior,
  
  boss: {
    maxSpeed: 1.5,
    maxForce: 6.0,
    arrivalRadius: 20,
    detectionRadius: 200,
    attackRange: 60,
    phase: 1,
    phaseThresholds: [0.66, 0.33],
  } as BossAIBehavior,
} as const;
