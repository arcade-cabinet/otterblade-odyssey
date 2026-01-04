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
export interface AISystem extends GameSystem {
  register(entity: any): void;
  unregister(entity: any): void;
  setTarget(entityId: string, target: Matter.Body): void;
  enemies: Map<string, any>;
  npcs: Map<string, any>;
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
  update(controls: any, deltaTime: number): void;
  takeDamage(amount: number, knockback?: { x: number; y: number }): void;
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
 * Game loop parameters with proper typing
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
  lanternSystem: { update(deltaTime: number): void; lanterns: any[]; lightLantern(lantern: any, context: any): boolean };
  bellSystem: { update(deltaTime: number): void };
  hearthSystem: { update(deltaTime: number): void };
  hazardSystem: { update(deltaTime: number): void };
  movingPlatforms: Array<{ body: Matter.Body; def: any }>;
  waterZones: Array<{ x: number; y: number; width: number; height: number }>;
  flowPuzzles: Array<any>;
  timingSequences: Array<any>;
  gameStateObj: any;
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
