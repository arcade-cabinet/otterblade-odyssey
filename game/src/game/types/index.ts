/**
 * Central export for all game type definitions
 */

export * from './systems';
export * from './entities';
export * from './physics';
export * from './ai';
export * from './canvas';

// Re-export commonly used types for convenience
export type {
  GameSystem,
  PhysicsSystem,
  Renderer,
  AISystem,
  InputSystem,
  AudioSystem,
} from './systems';

export type {
  Entity,
  Player,
  Enemy,
  Boss,
  Platform,
  Item,
  NPC,
  Trigger,
} from './entities';

export type {
  BodyConfig,
  PhysicsConfig,
  CollisionPair,
  CollisionHandler,
  PhysicsEngine,
} from './physics';

export type {
  AIState,
  AIBehaviorConfig,
  AIVehicle,
  AIManager,
  AIStateMachine,
} from './ai';

export type {
  RenderContext,
  Camera,
  RenderLayer,
  Drawable,
  CharacterRenderConfig,
  ProceduralRenderer,
} from './canvas';

// Re-export constants
export { PHYSICS_CONSTANTS } from './physics';
export { AI_PRESETS } from './ai';
export { BRAND_COLORS, RENDER_CONSTANTS } from './canvas';

// Re-export type guards
export {
  isPlayer,
  isEnemy,
  isBoss,
  isPlatform,
  isItem,
  isNPC,
  isTrigger,
} from './entities';

export {
  hasBodyLabel,
  isPlayerBody,
  isEnemyBody,
  isPlatformBody,
  createPlayerBodyConfig,
  createEnemyBodyConfig,
  createPlatformBodyConfig,
} from './physics';

export { isAIVehicle } from './ai';
