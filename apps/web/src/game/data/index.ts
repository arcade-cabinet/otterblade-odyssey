/**
 * @fileoverview Barrel export for game data module.
 * Import all game data through this file.
 */

// Comprehensive chapter manifest system
export * from './chapter-loaders';
// Legacy chapter/biome loaders (simple format)
export * from './loaders';
export * from './manifest-schemas';
// NPC system
export * from './npc-loaders';
export * from './npc-schemas';
export * from './schemas';
