/**
 * Core system interfaces for Otterblade Odyssey game engine
 * Inspired by Phaser3 Matter.js BitECS example pattern
 */

import type Matter from 'matter-js';

/**
 * Base interface for all game systems
 * Systems are responsible for updating game state and logic
 */
export interface GameSystem {
  /** Unique identifier for the system */
  name: string;
  
  /** Update system logic each frame */
  update(deltaTime: number): void;
  
  /** Optional cleanup when system is destroyed */
  cleanup?(): void;
}

/**
 * Physics system interface with collision handling
 * Extends GameSystem with Matter.js collision callbacks
 */
export interface PhysicsSystem extends GameSystem {
  /** Called before collision resolution */
  beforeCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
  
  /** Called after collision resolution */
  afterCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
}

/**
 * Renderer interface for canvas drawing
 */
export interface Renderer {
  /** Render the current game state to canvas */
  render(): void;
  
  /** Clear the canvas */
  clear?(): void;
  
  /** Resize canvas to new dimensions */
  resize?(width: number, height: number): void;
}

/**
 * AI system interface for enemy behavior
 */
export interface AISystem extends GameSystem {
  /** Add an entity to AI control */
  addEntity?(entityId: string): void;
  
  /** Remove an entity from AI control */
  removeEntity?(entityId: string): void;
}

/**
 * Input system interface for player controls
 */
export interface InputSystem extends GameSystem {
  /** Check if a key is currently pressed */
  isKeyPressed?(key: string): boolean;
  
  /** Check if a button is currently pressed */
  isButtonPressed?(button: number): boolean;
}

/**
 * Audio system interface for sound management
 */
export interface AudioSystem extends GameSystem {
  /** Play a sound effect */
  playSound?(soundId: string, volume?: number): void;
  
  /** Play background music */
  playMusic?(musicId: string, volume?: number, loop?: boolean): void;
  
  /** Stop all sounds */
  stopAll?(): void;
}
