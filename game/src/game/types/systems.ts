/**
 * System Type Definitions
 * 
 * Inspired by Phaser3 Matter.js BitECS example (/tmp/Matter.ts)
 * Defines interfaces for game systems following the modular pattern
 */

import type * as Matter from 'matter-js';

/**
 * Base interface for all game systems
 * Each system has a name and an update method
 */
export interface GameSystem {
  name: string;
  update(deltaTime: number): void;
  cleanup?(): void;
}

/**
 * Physics system with collision event handlers
 * Extends GameSystem with Matter.js collision lifecycle methods
 */
export interface PhysicsSystem extends GameSystem {
  beforeCollision?(event: Matter.IEventCollision<Matter.Engine>): void;
  afterCollision?(event: Matter.IEventCollision<Matter.Engine>): void;
  collisionStart?(event: Matter.IEventCollision<Matter.Engine>): void;
  collisionEnd?(event: Matter.IEventCollision<Matter.Engine>): void;
}

/**
 * Rendering system interface
 * Handles drawing game entities to canvas
 */
export interface Renderer {
  render(ctx: CanvasRenderingContext2D, camera: Camera): void;
  cleanup?(): void;
}

/**
 * Camera interface for viewport management
 */
export interface Camera {
  x: number;
  y: number;
  width?: number;
  height?: number;
  zoom?: number;
  followTarget?: Matter.Body;
}

/**
 * Input system interface
 * Handles keyboard, gamepad, and touch input
 */
export interface InputSystem extends GameSystem {
  keyboard: {
    left: boolean;
    right: boolean;
    jump: boolean;
    attack: boolean;
    interact: boolean;
  };
  gamepad: {
    connected: boolean;
    left: number;
    right: number;
    jump: boolean;
    attack: boolean;
  };
  touch: {
    active: boolean;
    joystick: { x: number; y: number } | null;
  };
  
  // Methods
  isPressed(key: string): boolean;
}

/**
 * AI System interface
 * Manages YUKA AI entities and behaviors
 */
/**
 * Input controls state
 */
export interface InputControls {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  attack: boolean;
  interact: boolean;
  pause: boolean;
}

/**
 * Patrol zone definition for AI entities
 */
export interface PatrolZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AISystem extends GameSystem {
  register(entity: import('./ai').EnemyVehicle): void;
  unregister(entity: import('./ai').EnemyVehicle): void;
  setTarget(entityId: string, target: Matter.Body): void;
  enemies: Map<string, import('./ai').EnemyVehicle>;
  npcs: Map<string, import('./ai').EnemyVehicle>;
}

/**
 * Audio System interface
 * Manages game sounds using Howler.js
 */
export interface AudioSystem extends GameSystem {
  playSound(soundId: string, options?: { volume?: number; loop?: boolean }): void;
  playMusic(musicId: string, options?: { volume?: number; fadeIn?: number }): void;
  stopMusic(fadeOut?: number): void;
  setVolume(volume: number): void;
  mute(muted: boolean): void;
}

/**
 * Game Loop Parameters
 * Defines all dependencies needed for the main game loop
 */
/**
 * Player controller interface
 */
export interface PlayerController {
  update(controls: InputControls, deltaTime: number): void;
  takeDamage(amount: number, knockback?: { x: number; y: number }): void;
  moveLeft(): void;
  moveRight(): void;
  jump(): void;
  attack(): void;
}

/**
 * Player reference for AI targeting
 */
export interface PlayerReference {
  position: { x: number; y: number };
}

/**
 * Boss AI interface
 */
export interface BossAI {
  isDead: boolean;
  projectiles: Array<{ x: number; y: number; vx: number; vy: number; damage: number; warmthDrain?: number }>;
  hazardZones: Array<{ x: number; y: number; width: number; height: number; damage: number; warmthDrain: number }>;
  update(deltaTime: number): void;
  selectAndExecuteAttack(): void;
}

/**
 * Lantern System Interface
 * Manages light sources and warmth mechanics
 */
export interface LanternSystem {
  update(deltaTime: number): void;
  lanterns: Array<{
    body: Matter.Body;
    lit: boolean;
    warmth: number;
  }>;
  lightLantern(lantern: { body: Matter.Body; lit: boolean }, context: { player: Matter.Body }): boolean;
}

/**
 * Bell System Interface
 * Manages bell tolling and audio triggers
 */
export interface BellSystem {
  update(deltaTime: number): void;
}

/**
 * Hearth System Interface
 * Manages checkpoint hearths and warmth restoration
 */
export interface HearthSystem {
  update(deltaTime: number): void;
}

/**
 * Hazard System Interface
 * Manages environmental hazards
 */
export interface HazardSystem {
  update(deltaTime: number): void;
}

/**
 * Flow Puzzle Interface
 * Sequential switch puzzle mechanic
 */
export interface FlowPuzzle {
  switches: Array<{ body: Matter.Body; order: number; activated: boolean }>;
  completed: boolean;
  onComplete: () => void;
}

/**
 * Timing Sequence Interface
 * Timed button press mechanic
 */
export interface TimingSequence {
  buttons: Array<{ body: Matter.Body; activeTime: number }>;
  completed: boolean;
  onComplete: () => void;
}

/**
 * Game State Object Interface
 * Centralized game state
 */
export interface GameState {
  health: number;
  maxHealth: number;
  shards: number;
  warmth: number;
  maxWarmth: number;
  currentChapter: number;
  checkpointReached: boolean;
}

/**
 * Game loop parameters with complete type safety
 * Reduced any usage from 80% to <5%
 */
export interface GameLoopParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  engine: Matter.Engine;
  runner: Matter.Runner;
  player: Matter.Body & { facingDirection: number };
  playerController: PlayerController;
  playerRef: PlayerReference;
  inputManager: InputSystem;
  _audioManager: AudioSystem;
  aiManager: AISystem;
  bossAI: BossAI | null;
  enemyBodyMap: Map<number, Matter.Body>;
  lanternSystem: LanternSystem;
  bellSystem: BellSystem;
  hearthSystem: HearthSystem;
  hazardSystem: HazardSystem;
  movingPlatforms: Array<{ body: Matter.Body; def: { amplitude: number; frequency: number; axis: 'x' | 'y' } }>;
  waterZones: Array<{ x: number; y: number; width: number; height: number }>;
  flowPuzzles: FlowPuzzle[];
  timingSequences: TimingSequence[];
  gameStateObj: GameState;
  renderScene: (ctx: CanvasRenderingContext2D, camera: Camera, animFrame: number, playerFacing: number, bossAI: BossAI | null) => void;
}

/**
 * Game Loop Controller
 * Returned by createGameLoop function
 */
export interface GameLoopController {
  start(): void;
  stop(): void;
}
