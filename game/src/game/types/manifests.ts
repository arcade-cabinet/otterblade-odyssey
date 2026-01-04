/**
 * TypeScript type definitions for chapter manifests
 * 
 * These types are extracted from Zod schemas in manifest-schemas.ts
 * Provides type-safe access to JSON DDL definitions.
 */

import type { z } from 'zod';
import type * as schemas from '../data/manifest-schemas';

// ============================================================================
// PRIMITIVES
// ============================================================================

export type Position2D = z.infer<typeof schemas.Position2DSchema>;
export type Region = z.infer<typeof schemas.RegionSchema>;
export type HexColor = z.infer<typeof schemas.HexColorSchema>;

// ============================================================================
// NARRATIVE
// ============================================================================

export type StoryBeat = z.infer<typeof schemas.StoryBeatSchema>;
export type EmotionalArc = z.infer<typeof schemas.EmotionalArcSchema>;
export type Narrative = z.infer<typeof schemas.NarrativeSchema>;

// ============================================================================
// CONNECTIONS
// ============================================================================

export type TransitionType = 'walk_in' | 'cinematic' | 'fade' | 'warp';

export interface Transition {
  type: TransitionType;
  cinematicId?: string | null;
  playerSpawnPoint?: Position2D;
  exitPoint?: Position2D;
}

export type UnlockRequirementType = 
  | 'complete_chapter' 
  | 'collect_item' 
  | 'defeat_boss' 
  | 'trigger_fired';

export interface UnlockRequirement {
  type: UnlockRequirementType;
  value: string | number;
}

export interface Connections {
  previousChapter: number | null;
  nextChapter: number | null;
  transitionIn?: Transition;
  transitionOut?: Transition;
  unlockRequirements?: UnlockRequirement[];
}

// ============================================================================
// NPCs
// ============================================================================

export interface NPCBehavior {
  idle?: string;
  patrolPath?: Position2D[];
  interactRadius?: number;
  [key: string]: unknown; // Allow additional properties
}

export interface NPCState {
  animation: string;
  expression: string;
  canInteract: boolean;
}

export interface NPCStoryState {
  initialState: string;
  states: Record<string, NPCState>;
}

export interface NPCInteraction {
  trigger?: string | null;
  gesture?: string;
  finnResponse?: string;
  actions: Array<{
    type: string;
    target?: string;
    value?: unknown;
  }>;
}

export interface ChapterNPC {
  id: string;
  characterId?: string;
  name: string;
  role: string;
  position: Position2D;
  facing?: 'left' | 'right';
  behavior?: NPCBehavior;
  storyState?: NPCStoryState;
  interactions?: NPCInteraction[];
  givesQuest?: string;
  isEssential?: boolean;
  [key: string]: unknown; // Allow additional properties
}

// ============================================================================
// QUESTS
// ============================================================================

export interface QuestObjective {
  id: string;
  description: string;
  type: string;
  target?: string;
  count?: number;
  region?: Region;
}

export interface QuestRewards {
  emberShards?: number;
  hearthstones?: number;
  achievement?: string;
}

export type QuestType = 'main' | 'side' | 'hidden';

export interface Quest {
  id: string;
  name: string;
  type: QuestType;
  giver: string;
  objectives: QuestObjective[];
  rewards?: QuestRewards;
  completionTrigger?: string;
}

// ============================================================================
// LEVEL
// ============================================================================

export interface PlatformProperties {
  slippery?: boolean;
  swaying?: boolean;
  breakable?: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height?: number;
  type: string;
  asset?: string;
  properties?: PlatformProperties;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  asset?: string;
}

export interface Ladder {
  x: number;
  y: number;
  height: number;
  type?: string;
  asset?: string;
}

export interface KillZone {
  x: number;
  y: number;
  width: number;
}

export interface WaterZone {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  region?: Region;
  flow?: string;
  depth?: string;
  [key: string]: unknown; // Allow additional properties
}

export interface LevelSegment {
  id: string;
  startX: number;
  endX: number;
  platforms?: Platform[];
  walls?: Wall[];
  ceilings?: Wall[];
  ladders?: Ladder[];
  semiSolids?: Platform[];
  water?: WaterZone[];
  killZones?: KillZone[];
  scamperZones?: Region[];
}

export interface Checkpoint {
  id: string;
  position: Position2D;
  type?: string;
  requiresTrigger?: string | null;
}

export interface LevelBounds {
  startX: number;
  endX: number;
  minY: number;
  maxY: number;
}

export interface Level {
  bounds: LevelBounds;
  biome: string;
  spawnPoint: Position2D;
  segments: LevelSegment[];
  checkpoints?: Checkpoint[];
}

// ============================================================================
// ENCOUNTERS
// ============================================================================

export interface EnemyBehavior {
  type: string;
  aggroRadius?: number;
  guardRadius?: number;
  [key: string]: unknown; // Allow additional properties
}

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'boss';

export interface Encounter {
  id: string;
  enemyType: string;
  position: Position2D;
  behavior: EnemyBehavior;
  spawnedByTrigger?: string;
  difficulty?: EncounterDifficulty;
  isMiniboss?: boolean;
}

// ============================================================================
// BOSS
// ============================================================================

export interface BossAttack {
  id: string;
  type: string;
  damage?: number;
  warmthDrain?: number;
  cooldown?: number;
  duration?: number;
  aoe?: boolean;
  stun?: boolean;
  count?: number;
  name?: string;
  description?: string;
  telegraphTime?: number;
}

export interface BossPhase {
  phase: number;
  hpThreshold: number;
  attacks: BossAttack[];
  mechanics?: string[];
  environmentalChanges?: string[];
}

export interface BossEncounter {
  id: string;
  name: string;
  hp: number;
  phases: BossPhase[];
  arena: Region;
  music?: string;
  defeatTrigger?: string;
}

// ============================================================================
// TRIGGERS
// ============================================================================

export interface TriggerCondition {
  type: string;
  value?: unknown;
}

export interface TriggerAction {
  type: string;
  target?: string;
  value?: unknown;
  delay?: number;
}

export interface ChapterTrigger {
  id: string;
  position?: Position2D;
  region?: Region;
  conditions?: TriggerCondition[];
  actions: TriggerAction[];
  isRepeatable?: boolean;
  cooldown?: number;
}

// ============================================================================
// COLLECTIBLES
// ============================================================================

export interface Collectible {
  id: string;
  type: 'emberShard' | 'hearthstone' | 'questItem' | 'secret';
  position: Position2D;
  value?: number;
  requiresTrigger?: string;
  hiddenUntil?: string;
}

// ============================================================================
// CINEMATICS
// ============================================================================

export interface CinematicShot {
  duration: number;
  camera: {
    focus: Position2D | string; // Position or entity ID
    zoom?: number;
    pan?: Position2D;
  };
  actors: Array<{
    id: string;
    animation?: string;
    movement?: Position2D;
    gesture?: string;
  }>;
  music?: {
    track: string;
    volume?: number;
    fade?: boolean;
  };
  sfx?: string[];
}

export interface Cinematic {
  id: string;
  name: string;
  trigger?: string;
  shots: CinematicShot[];
  skippable?: boolean;
  showUI?: boolean;
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

export interface BackgroundLayer {
  asset: string;
  parallaxSpeed: number;
  opacity?: number;
  tint?: HexColor;
}

export interface Lighting {
  ambient: HexColor;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  torches?: Position2D[];
  dynamicLights?: Array<{
    position: Position2D;
    color: HexColor;
    radius: number;
    intensity: number;
  }>;
}

export interface Weather {
  type: 'clear' | 'rain' | 'snow' | 'wind' | 'storm';
  intensity?: number;
  particles?: {
    count: number;
    speed: number;
  };
}

export interface Environment {
  backgroundLayers?: BackgroundLayer[];
  lighting?: Lighting;
  weather?: Weather;
  ambientSounds?: string[];
}

// ============================================================================
// CHAPTER MANIFEST (ROOT)
// ============================================================================

export interface ChapterManifest {
  /** Chapter metadata */
  id: number;
  name: string;
  location: string;
  
  /** Narrative elements */
  narrative: Narrative;
  
  /** Chapter connections */
  connections: Connections;
  
  /** Level geometry */
  level: Level;
  
  /** NPCs in this chapter */
  npcs?: ChapterNPC[];
  
  /** Quests available */
  quests?: Quest[];
  
  /** Enemy encounters */
  encounters?: Encounter[];
  
  /** Boss fight (if any) */
  boss?: BossEncounter;
  
  /** Triggers and events */
  triggers?: ChapterTrigger[];
  
  /** Collectibles */
  collectibles?: Collectible[];
  
  /** Cinematics */
  cinematics?: Cinematic[];
  
  /** Environment configuration */
  environment?: Environment;
  
  /** Additional metadata */
  metadata?: {
    estimatedPlaytime?: number;
    difficulty?: string;
    requiredShards?: number;
    tags?: string[];
  };
}

// ============================================================================
// MANIFEST LOADER TYPES
// ============================================================================

/**
 * Result from loading a chapter manifest
 */
export interface ManifestLoadResult {
  success: boolean;
  manifest?: ChapterManifest;
  error?: string;
}

/**
 * Manifest cache entry
 */
export interface ManifestCacheEntry {
  manifest: ChapterManifest;
  timestamp: number;
}

/**
 * Manifest loader configuration
 */
export interface ManifestLoaderConfig {
  /** Base path for manifest files */
  basePath: string;
  
  /** Enable caching? */
  enableCache: boolean;
  
  /** Validate manifests with Zod? */
  validateSchemas: boolean;
  
  /** Throw on validation errors? */
  throwOnValidationError: boolean;
}

/**
 * Default manifest loader config
 */
export const DEFAULT_MANIFEST_CONFIG: ManifestLoaderConfig = {
  basePath: '/data/manifests/chapters',
  enableCache: true,
  validateSchemas: true,
  throwOnValidationError: false,
};
