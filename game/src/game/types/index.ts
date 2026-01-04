/**
 * Otterblade Odyssey Type Definitions
 * 
 * Central export for all game type definitions.
 * Import types from here for consistency.
 * 
 * @example
 * ```typescript
 * import type { Player, Enemy, GameSystem } from '@game/types';
 * ```
 */

// System types
export type {
  GameSystem,
  PhysicsSystem,
  Renderer,
  InputSystem,
  GameAction,
  GamepadState,
  TouchState,
  AudioSystem,
  AudioOptions,
  AISystem,
  CameraSystem,
  ParticleSystem,
  ParticleType,
  Particle,
  ParticleOptions,
} from './systems';

// Entity types
export type {
  Entity,
  EntityType,
  Player,
  PlayerAnimationState,
  Inventory,
  Enemy,
  EnemyType,
  AIState,
  EnemyAnimationState,
  Platform,
  PlatformAppearance,
  Item,
  ItemType,
  ItemEffect,
  NPC,
  NPCAppearance,
  Trigger,
  TriggerAction,
  Projectile,
  Hazard,
  HazardType,
  EntityFactoryOptions,
} from './entities';

// Entity type guards
export {
  isPlayer,
  isEnemy,
  isPlatform,
  isItem,
  isNPC,
  isTrigger,
  isProjectile,
  isHazard,
} from './entities';

// Physics types
export type {
  BodyLabel,
  PhysicsConfig,
  BodyOptions,
  CollisionFilter,
  CollisionPair,
  CollisionEvent,
  PhysicsUtils,
  RaycastResult,
  RaycastOptions,
} from './physics';

export {
  DEFAULT_PHYSICS_CONFIG,
  CollisionCategory,
  PLAYER_BODY_OPTIONS,
  ENEMY_BODY_OPTIONS,
  PLATFORM_BODY_OPTIONS,
  BodyDimensions,
  PhysicsConstants,
  hasLabel,
  isCollisionBetween,
  getOtherBody,
  createPhysicsEngine,
} from './physics';

// AI types
export type {
  AIBehaviorConfig,
  WanderConfig,
  AIEntity,
  AIStateMachine,
  SteeringBehaviors,
  AIPerception,
  Obstacle,
  AIDecisionWeights,
  ScoutAIBehavior,
  WarriorAIBehavior,
  BossAIBehavior,
  AIManager,
  PathNode,
  PathfindingGraph,
} from './ai';

export {
  DEFAULT_AI_CONFIGS,
  createAIEntity,
  createStateMachine,
} from './ai';

// Canvas rendering types
export type {
  RenderContext,
  Camera,
  Renderable,
  ColorPalette,
  ProceduralRenderOptions,
  FinnRenderState,
  EnemyRenderState,
  ParallaxLayer,
  ParticleRenderData,
  TextRenderOptions,
  UIElement,
  HealthBarOptions,
  AnimationFrame,
  AnimationSequence,
  RenderUtils,
  DebugRenderOptions,
  CanvasLayer,
  RenderStage,
  RenderPipeline,
} from './canvas';

export {
  FINN_PALETTE,
  ENEMY_PALETTES,
} from './canvas';

// Manifest types
export type {
  Position2D,
  Region,
  HexColor,
  StoryBeat,
  EmotionalArc,
  Narrative,
  TransitionType,
  Transition,
  UnlockRequirementType,
  UnlockRequirement,
  Connections,
  NPCBehavior,
  NPCState,
  NPCStoryState,
  NPCInteraction,
  ChapterNPC,
  QuestObjective,
  QuestRewards,
  QuestType,
  Quest,
  PlatformProperties,
  Wall,
  Ladder,
  KillZone,
  WaterZone,
  LevelSegment,
  Checkpoint,
  LevelBounds,
  Level,
  EnemyBehavior,
  EncounterDifficulty,
  Encounter,
  BossAttack,
  BossPhase,
  BossEncounter,
  TriggerCondition,
  ChapterTrigger,
  Collectible,
  CinematicShot,
  Cinematic,
  BackgroundLayer,
  Lighting,
  Weather,
  Environment,
  ChapterManifest,
  ManifestLoadResult,
  ManifestCacheEntry,
  ManifestLoaderConfig,
} from './manifests';

export {
  DEFAULT_MANIFEST_CONFIG,
} from './manifests';

// Re-export commonly used external types
export type { default as Matter } from 'matter-js';
export type * as YUKA from 'yuka';
