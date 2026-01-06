/**
 * game/index.ts
 * Central export point for game engine - replaces game-monolith.js
 * Consolidates TypeScript modules into single import interface
 */

// Physics & initialization
export { initializeMatter as initializeGame } from './physics/matter-wrapper';
export { createPhysicsEngine, createFinnBody } from './physics/PhysicsManager';

// Game loop and rendering
export { createGameLoop } from './engine/gameLoop';

// Game systems (singletons)
export { audioManager } from './systems/AudioManager';
export { inputManager } from './systems/InputManager';
export { aiManager } from './systems/AIManager';

// Player
export { PlayerController } from './player/PlayerController';

// Level building
import { buildLevel } from './factories/level-factory';
import { buildEnemies } from './factories/enemy-factory';
import type * as Matter from 'matter-js';

export function initializeChapter(chapterId: number, manifest: any, engine: Matter.Engine, gameState: any) {
  // Build level (platforms, walls, hazards, etc.)
  const level = buildLevel(chapterId, engine);

  // Build enemies
  const enemies = buildEnemies(chapterId, engine);

  // Return compatible object
  return {
    ...level,
    enemies,
  };
}

// Constants
export const CHAPTER_FILES = [
  'chapter-0-the-calling',
  'chapter-1-river-path',
  'chapter-2-gatehouse',
  'chapter-3-great-hall',
  'chapter-4-archives',
  'chapter-5-deep-cellars',
  'chapter-6-kitchen-gardens',
  'chapter-7-bell-tower',
  'chapter-8-storms-edge',
  'chapter-9-new-dawn',
];
