/**
 * Matter.js Centralized Import
 * SINGLE point of entry for ALL Matter.js usage in the game
 * Prevents module-scope destructuring that breaks Astro SSR
 */

import type * as Matter from 'matter-js';

/**
 * Matter.js modules interface
 */
interface MatterModulesType {
  Engine: typeof Matter.Engine;
  World: typeof Matter.World;
  Bodies: typeof Matter.Bodies;
  Body: typeof Matter.Body;
  Events: typeof Matter.Events;
  Runner: typeof Matter.Runner;
  Query: typeof Matter.Query;
  Composite: typeof Matter.Composite;
  Sleeping: typeof Matter.Sleeping;
  Vector: typeof Matter.Vector;
  Matter: typeof Matter;
}

let MatterModules: MatterModulesType | null = null;

/**
 * Initialize Matter.js (call once at game startup in browser)
 */
export async function initializeMatter(): Promise<MatterModulesType> {
  if (typeof window === 'undefined') {
    throw new Error('Matter.js can only be initialized in browser context');
  }

  if (!MatterModules) {
    // Dynamic import ensures Matter.js only loads in browser
    const MatterLib = (await import('matter-js')).default;

    // Pre-extract all modules so they're ready to use
    MatterModules = {
      Engine: MatterLib.Engine,
      World: MatterLib.World,
      Bodies: MatterLib.Bodies,
      Body: MatterLib.Body,
      Events: MatterLib.Events,
      Runner: MatterLib.Runner,
      Query: MatterLib.Query,
      Composite: MatterLib.Composite,
      Sleeping: MatterLib.Sleeping,
      Vector: MatterLib.Vector,
      Matter: MatterLib, // Full library if needed
    };

    // Export to global for compatibility with existing code
    (window as Window & { Matter: typeof MatterLib }).Matter = MatterLib;

    console.log('[Physics] Matter.js initialized');
  }

  return MatterModules;
}

/**
 * Get Matter.js modules (throws if not initialized)
 */
export function getMatterModules(): MatterModulesType {
  if (!MatterModules) {
    throw new Error('Matter.js not initialized. Call initializeMatter() first at game startup.');
  }
  return MatterModules;
}

/**
 * Check if Matter.js is initialized
 */
export function isMatterInitialized(): boolean {
  return MatterModules !== null;
}
