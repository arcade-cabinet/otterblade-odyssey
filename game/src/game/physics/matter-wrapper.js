/**
 * Matter.js Centralized Import
 * SINGLE point of entry for ALL Matter.js usage in the game
 * Prevents module-scope destructuring that breaks Astro SSR
 */

let MatterModules = null;

/**
 * Initialize Matter.js (call once at game startup in browser)
 * @returns {Promise<Object>} Matter.js modules
 */
export async function initializeMatter() {
  if (typeof window === 'undefined') {
    throw new Error('Matter.js can only be initialized in browser context');
  }
  
  if (!MatterModules) {
    // Dynamic import ensures Matter.js only loads in browser
    const Matter = (await import('matter-js')).default;
    
    // Pre-extract all modules so they're ready to use
    MatterModules = {
      Engine: Matter.Engine,
      World: Matter.World,
      Bodies: Matter.Bodies,
      Body: Matter.Body,
      Events: Matter.Events,
      Runner: Matter.Runner,
      Query: Matter.Query,
      Composite: Matter.Composite,
      Sleeping: Matter.Sleeping,
      Vector: Matter.Vector,
      Matter: Matter, // Full library if needed
    };
    
    // Export to global for compatibility with existing code
    window.Matter = Matter;
    
    console.log('[Physics] Matter.js initialized');
  }
  
  return MatterModules;
}

/**
 * Get Matter.js modules (throws if not initialized)
 * @returns {Object} Matter.js modules
 */
export function getMatterModules() {
  if (!MatterModules) {
    throw new Error('Matter.js not initialized. Call initializeMatter() first at game startup.');
  }
  return MatterModules;
}

/**
 * Check if Matter.js is initialized
 * @returns {boolean} True if initialized
 */
export function isMatterInitialized() {
  return MatterModules !== null;
}
