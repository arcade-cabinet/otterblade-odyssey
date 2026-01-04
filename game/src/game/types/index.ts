/**
 * Type Definitions Index
 * 
 * Central export point for all TypeScript type definitions
 * Import from this file to access all game types
 * 
 * @example
 * import type { Player, Enemy, GameSystem } from '@game/types';
 */

// System types
export type {
  GameSystem,
  PhysicsSystem,
  Renderer,
  Camera,
  InputSystem,
  AISystem,
  AudioSystem,
  GameLoopParams,
  GameLoopController,
} from './systems';

// Entity types
export type {
  Entity,
  Player,
  Enemy,
  Boss,
  Platform,
  Item,
  NPC,
  Trigger,
  Hazard,
  EnemyAIState,
  EnemyType,
  EnemyBehavior,
  PlatformType,
  ItemType,
  HazardType,
} from './entities';

// Entity type guards
export {
  isPlayer,
  isEnemy,
  isBoss,
  isPlatform,
  isItem,
  isNPC,
  isTrigger,
  isHazard,
} from './entities';

// Physics types
export type {
  BodyLabel,
  GameBody,
  PhysicsConfig,
  BodyOptions,
  CollisionPair,
  CollisionHandler,
} from './physics';

export {
  COLLISION_GROUPS,
  COLLISION_MASKS,
  DEFAULT_PHYSICS_CONFIG,
  isPlayerBody,
  isEnemyBody,
  isPlatformBody,
  isItemBody,
  isTriggerBody,
  isHazardBody,
  isBossBody,
} from './physics';

// AI types
export type {
  EnemyVehicle,
  AIBehaviorConfig,
  AIStateMachine,
  AIManager,
  SteeringBehaviorType,
  SteeringBehaviorConfig,
  NavigationMesh,
  PerceptionSystem,
  BossAIConfig,
} from './ai';

export {
  toYukaVector,
  toMatterVector,
} from './ai';

// Manifest types
export type {
  ChapterManifest,
  EnemyManifest,
  SoundManifest,
  Position2D,
  Region,
  Narrative,
  Connections,
} from './manifests';

// Canvas rendering types
export type {
  RenderContext,
  HexColor,
  CameraConfig,
  FinnRenderConfig,
  EnemyRenderConfig,
  ParticleConfig,
  ParticleEmitterConfig,
  ParallaxLayerConfig,
  AnimationFrame,
  AnimationSequence,
  ProceduralRenderer,
  DebugRenderOptions,
  SceneRenderer,
} from './canvas';

export { RenderLayer } from './canvas';
