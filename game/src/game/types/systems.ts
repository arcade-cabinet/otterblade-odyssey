/**
 * System interfaces for Otterblade Odyssey game engine
 * 
 * Based on vanilla JS patterns from POC, NOT ECS framework.
 * Systems are simple objects with update() methods.
 */

import type Matter from 'matter-js';

/**
 * Base system interface
 * All game systems implement this interface
 */
export interface GameSystem {
  /** Unique system identifier */
  name: string;
  
  /** Update system state (called every frame) */
  update(deltaTime: number): void;
  
  /** Optional cleanup method */
  cleanup?(): void;
}

/**
 * Physics system with collision callbacks
 * Wraps Matter.js engine
 */
export interface PhysicsSystem extends GameSystem {
  /** Called before collision resolution */
  beforeCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
  
  /** Called after collision resolution */
  afterCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
}

/**
 * Rendering system
 * Handles Canvas 2D drawing
 */
export interface Renderer {
  /** Canvas 2D rendering context */
  ctx: CanvasRenderingContext2D;
  
  /** Camera offset */
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  
  /** Render the current game state */
  render(): void;
  
  /** Clear the canvas */
  clear(): void;
}

/**
 * Input system
 * Handles keyboard, gamepad, and touch input
 */
export interface InputSystem extends GameSystem {
  /** Currently pressed keys */
  keys: Set<string>;
  
  /** Gamepad state */
  gamepad: GamepadState | null;
  
  /** Touch input state */
  touch: TouchState | null;
  
  /** Check if action is pressed */
  isActionPressed(action: GameAction): boolean;
}

export type GameAction = 
  | 'moveLeft' 
  | 'moveRight' 
  | 'jump' 
  | 'attack' 
  | 'interact'
  | 'pause';

export interface GamepadState {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: Map<number, boolean>;
}

export interface TouchState {
  joystick: { x: number; y: number } | null;
  buttons: Map<string, boolean>;
}

/**
 * Audio system
 * Manages sound effects and music via Howler.js
 */
export interface AudioSystem extends GameSystem {
  /** Play a sound effect */
  playSound(soundId: string, options?: AudioOptions): void;
  
  /** Play background music */
  playMusic(musicId: string, options?: AudioOptions): void;
  
  /** Stop all sounds */
  stopAll(): void;
  
  /** Set master volume (0-1) */
  setVolume(volume: number): void;
}

export interface AudioOptions {
  volume?: number;
  loop?: boolean;
  fade?: { from: number; to: number; duration: number };
}

/**
 * AI system
 * Manages YUKA entities and behaviors
 */
export interface AISystem extends GameSystem {
  /** Update all AI entities */
  update(deltaTime: number): void;
  
  /** Register an AI entity */
  addEntity(entity: unknown): void;
  
  /** Unregister an AI entity */
  removeEntity(entityId: string): void;
}

/**
 * Camera system
 * Follows player with smooth lerp
 */
export interface CameraSystem extends GameSystem {
  /** Target entity to follow */
  target: { x: number; y: number } | null;
  
  /** Current camera position */
  position: { x: number; y: number };
  
  /** Camera smoothing factor (0-1) */
  smoothing: number;
  
  /** Set camera target */
  setTarget(target: { x: number; y: number }): void;
}

/**
 * Particle system
 * Manages visual effects
 */
export interface ParticleSystem extends GameSystem {
  /** Spawn particle effect */
  spawn(type: ParticleType, x: number, y: number, options?: ParticleOptions): void;
  
  /** Active particles */
  particles: Particle[];
}

export type ParticleType = 
  | 'dust' 
  | 'spark' 
  | 'splash' 
  | 'leaf' 
  | 'impact';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ParticleOptions {
  count?: number;
  velocity?: { x: number; y: number };
  color?: string;
  size?: number;
  life?: number;
}
