/**
 * Type Definitions Index
 *
 * Central export point for all TypeScript type definitions
 * Import from this file to access all game types
 *
 * @example
 * import type { Player, Enemy, GameSystem } from '@game/types';
 */

// AI types
export type {
  AIBehaviorConfig,
  AIManager,
  AIStateMachine,
  BossAIConfig,
  EnemyVehicle,
  NavigationMesh,
  PerceptionSystem,
  SteeringBehaviorConfig,
  SteeringBehaviorType,
} from './ai';
export {
  toMatterVector,
  toYukaVector,
} from './ai';
// Canvas rendering types
export type {
  AnimationFrame,
  AnimationSequence,
  CameraConfig,
  DebugRenderOptions,
  EnemyRenderConfig,
  FinnRenderConfig,
  HexColor,
  ParallaxLayerConfig,
  ParticleConfig,
  ParticleEmitterConfig,
  ProceduralRenderer,
  RenderContext,
  SceneRenderer,
} from './canvas';
export { RenderLayer } from './canvas';
// Entity types
export type {
  Boss,
  Enemy,
  EnemyAIState,
  EnemyBehavior,
  EnemyType,
  Entity,
  Hazard,
  HazardType,
  Item,
  ItemType,
  NPC,
  Platform,
  PlatformType,
  Player,
  Trigger,
} from './entities';
// Entity type guards
export {
  isBoss,
  isEnemy,
  isHazard,
  isItem,
  isNPC,
  isPlatform,
  isPlayer,
  isTrigger,
} from './entities';
// Manifest types
export type {
  ChapterManifest,
  Connections,
  EnemyManifest,
  Narrative,
  Position2D,
  Region,
  SoundManifest,
} from './manifests';
// Physics types
export type {
  BodyLabel,
  BodyOptions,
  CollisionHandler,
  CollisionPair,
  GameBody,
  PhysicsConfig,
} from './physics';
export {
  COLLISION_GROUPS,
  COLLISION_MASKS,
  DEFAULT_PHYSICS_CONFIG,
  isBossBody,
  isEnemyBody,
  isHazardBody,
  isItemBody,
  isPlatformBody,
  isPlayerBody,
  isTriggerBody,
} from './physics';
// System types
export type {
  AISystem,
  AudioSystem,
  Camera,
  GameLoopController,
  GameLoopParams,
  GameSystem,
  InputSystem,
  PhysicsSystem,
  Renderer,
} from './systems';
