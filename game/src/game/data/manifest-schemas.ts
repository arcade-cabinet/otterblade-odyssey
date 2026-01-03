/**
 * @fileoverview Comprehensive Zod schemas for chapter manifests.
 * These schemas mirror the JSON schemas in game/src/data/manifests/schema/
 */

import { z } from 'zod';

// ============================================================================
// PRIMITIVES
// ============================================================================

/** 2D position */
export const Position2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/** Rectangular region */
export const RegionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

/** Color (hex format) */
export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

// ============================================================================
// NARRATIVE
// ============================================================================

export const StoryBeatSchema = z.object({
  id: z.string(),
  moment: z.string(),
  triggeredBy: z.string(),
  // Flexible expression - allow any string for evolving content
  expression: z.string(),
});

export const EmotionalArcSchema = z.object({
  opening: z.string(),
  midpoint: z.string(),
  climax: z.string(),
  resolution: z.string(),
});

export const NarrativeSchema = z.object({
  theme: z.string(),
  quest: z.string(),
  emotionalArc: EmotionalArcSchema,
  storyBeats: z.array(StoryBeatSchema),
});

// ============================================================================
// CONNECTIONS
// ============================================================================

export const TransitionSchema = z.object({
  type: z.enum(['walk_in', 'cinematic', 'fade', 'warp']),
  cinematicId: z.string().nullable().optional(),
  playerSpawnPoint: Position2DSchema.optional(),
  exitPoint: Position2DSchema.optional(),
});

export const UnlockRequirementSchema = z.object({
  type: z.enum(['complete_chapter', 'collect_item', 'defeat_boss', 'trigger_fired']),
  value: z.union([z.string(), z.number()]),
});

export const ConnectionsSchema = z.object({
  previousChapter: z.number().nullable(),
  nextChapter: z.number().nullable(),
  transitionIn: TransitionSchema.optional(),
  transitionOut: TransitionSchema.optional(),
  unlockRequirements: z.array(UnlockRequirementSchema).optional(),
});

// ============================================================================
// NPCs
// ============================================================================

export const NPCBehaviorSchema = z
  .object({
    // Flexible idle behavior
    idle: z.string().optional(),
    patrolPath: z.array(Position2DSchema).optional(),
    interactRadius: z.number().optional(),
  })
  .passthrough();

export const NPCStateSchema = z.object({
  animation: z.string(),
  expression: z.string(),
  canInteract: z.boolean(),
});

export const NPCStoryStateSchema = z.object({
  initialState: z.string(),
  states: z.record(z.string(), NPCStateSchema),
});

export const NPCInteractionSchema = z.object({
  trigger: z.string().nullable().optional(),
  gesture: z.string().optional(),
  finnResponse: z.string().optional(),
  actions: z.array(
    z.object({
      type: z.string(),
      target: z.string().optional(),
      value: z.any().optional(),
    })
  ),
});

export const ChapterNPCSchema = z
  .object({
    id: z.string(),
    characterId: z.string().optional(),
    name: z.string(),
    // Flexible roles for varied NPCs
    role: z.string(),
    position: Position2DSchema,
    facing: z.enum(['left', 'right']).optional(),
    behavior: NPCBehaviorSchema.optional(),
    storyState: NPCStoryStateSchema.optional(),
    interactions: z.array(NPCInteractionSchema).optional(),
    givesQuest: z.string().optional(),
    isEssential: z.boolean().optional(),
  })
  .passthrough();

// ============================================================================
// QUESTS
// ============================================================================

export const QuestObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  // Flexible objective types for game design evolution
  type: z.string(),
  target: z.string().optional(),
  count: z.number().optional(),
  region: RegionSchema.optional(),
});

export const QuestRewardsSchema = z.object({
  emberShards: z.number().optional(),
  hearthstones: z.number().optional(),
  achievement: z.string().optional(),
});

export const QuestSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['main', 'side', 'hidden']),
  giver: z.string(),
  objectives: z.array(QuestObjectiveSchema),
  rewards: QuestRewardsSchema.optional(),
  completionTrigger: z.string().optional(),
});

// ============================================================================
// LEVEL
// ============================================================================

export const PlatformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number().optional().default(24), // Default from JSON schema
  // Flexible platform types for varied level design
  type: z.string(),
  asset: z.string().optional(),
  properties: z
    .object({
      slippery: z.boolean().optional(),
      swaying: z.boolean().optional(),
      breakable: z.boolean().optional(),
    })
    .optional(),
});

export const WallSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  asset: z.string().optional(),
});

export const LadderSchema = z.object({
  x: z.number(),
  y: z.number(),
  height: z.number(),
  // Flexible ladder types
  type: z.string().optional(),
  asset: z.string().optional(),
});

export const KillZoneSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
});

// Water can be a region or a more complex object with flow direction
export const WaterZoneSchema = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    region: RegionSchema.optional(),
    flow: z.string().optional(),
    depth: z.string().optional(),
  })
  .passthrough();

export const LevelSegmentSchema = z.object({
  id: z.string(),
  startX: z.number(),
  endX: z.number(),
  platforms: z.array(PlatformSchema).optional(),
  walls: z.array(WallSchema).optional(),
  ceilings: z.array(WallSchema).optional(),
  ladders: z.array(LadderSchema).optional(),
  semiSolids: z.array(PlatformSchema).optional(),
  // Water zones can have flexible structure
  water: z.array(WaterZoneSchema).optional(),
  killZones: z.array(KillZoneSchema).optional(),
  scamperZones: z.array(RegionSchema).optional(),
});

export const CheckpointSchema = z.object({
  id: z.string(),
  position: Position2DSchema,
  // Flexible checkpoint types for game design flexibility
  type: z.string().optional(),
  requiresTrigger: z.string().nullable().optional(),
});

export const LevelSchema = z.object({
  bounds: z.object({
    startX: z.number(),
    endX: z.number(),
    minY: z.number(),
    maxY: z.number(),
  }),
  biome: z.string(),
  spawnPoint: Position2DSchema,
  segments: z.array(LevelSegmentSchema),
  checkpoints: z.array(CheckpointSchema).optional(),
});

// ============================================================================
// ENCOUNTERS
// ============================================================================

export const EnemyBehaviorSchema = z
  .object({
    // Flexible behavior types for varied AI
    type: z.string(),
    aggroRadius: z.number().optional(),
    guardRadius: z.number().optional(),
  })
  .passthrough();

export const EncounterSchema = z.object({
  id: z.string(),
  enemyType: z.string(),
  position: Position2DSchema,
  behavior: EnemyBehaviorSchema,
  spawnedByTrigger: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'boss']).optional(),
  isMiniboss: z.boolean().optional(),
});

// ============================================================================
// BOSS
// ============================================================================

export const BossAttackSchema = z.object({
  id: z.string(),
  // Flexible attack types
  type: z.string(),
  damage: z.number().optional(),
  warmthDrain: z.number().optional(),
  cooldown: z.number().optional(),
  duration: z.number().optional(),
  aoe: z.boolean().optional(),
  stun: z.boolean().optional(),
  count: z.number().optional(),
  // Additional properties for complex attacks
  name: z.string().optional(),
  description: z.string().optional(),
  telegraphTime: z.number().optional(),
});

export const BossPhaseSchema = z.object({
  name: z.string(),
  healthThreshold: z.number(),
  description: z.string().optional(),
  attacks: z.array(BossAttackSchema),
  behavior: z.enum(['aggressive', 'defensive', 'desperate', 'berserk']).optional(),
  enrageMusic: z.string().optional(),
  playerBuff: z
    .object({
      name: z.string(),
      description: z.string().optional(),
      damageBonus: z.number().optional(),
      warmthRegen: z.number().optional(),
    })
    .optional(),
});

export const BossSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['miniboss', 'chapter_boss', 'final_boss']),
  species: z.string().optional(),
  description: z.string().optional(),
  arenaPosition: Position2DSchema.optional(),
  stats: z.object({
    health: z.number(),
    damage: z.number(),
    speed: z.number(),
  }),
  phases: z.array(BossPhaseSchema),
  weaknesses: z
    .array(
      z.object({
        type: z.string(),
        multiplier: z.number(),
      })
    )
    .optional(),
  defeatSequence: z.string().optional(),
  lore: z.string().optional(),
  deathAnimation: z.string().optional(),
  deathDialogue: z.string().nullable().optional(),
});

// ============================================================================
// INTERACTIONS
// ============================================================================

export const InteractionStateSchema = z.object({
  asset: z.string(),
  solid: z.boolean().optional(),
  actions: z
    .array(
      z.object({
        type: z.string(),
        target: z.string().optional(),
        value: z.any().optional(),
      })
    )
    .optional(),
});

export const InteractionSchema = z.object({
  id: z.string(),
  // Flexible interaction types for game design evolution
  type: z.string(),
  position: Position2DSchema,
  asset: z.string().optional(),
  activateRadius: z.number().optional(),
  initialState: z.string().optional(),
  states: z.record(z.string(), InteractionStateSchema).optional(),
  requires: z
    .object({
      trigger: z.string().optional(),
      item: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// TRIGGERS
// ============================================================================

export const TriggerActionSchema = z.object({
  type: z.string(),
  target: z.string().optional(),
  value: z.any().optional(),
  delay: z.number().optional(),
  duration: z.number().optional(),
});

export const TriggerSchema = z.object({
  id: z.string(),
  type: z.enum([
    'enter_region',
    'exit_region',
    'interact',
    'defeat_enemies',
    'collect_item',
    'timer',
    'health_below',
    'warmth_below',
    'boss_health',
    'quest_complete',
    'flag_set',
  ]),
  region: RegionSchema.optional(),
  targetId: z.string().optional(),
  threshold: z.number().optional(),
  delay: z.number().optional(),
  requires: z.array(z.string()).optional(),
  once: z.boolean().optional(),
  actions: z.array(TriggerActionSchema),
});

// ============================================================================
// SEQUENCES
// ============================================================================

export const SequenceActionSchema = z.object({
  type: z.string(),
  target: z.string().optional(),
  value: z.any().optional(),
  delay: z.number().optional(),
  async: z.boolean().optional(),
});

export const SequenceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    playerControl: z.enum(['full', 'limited', 'none']).optional(),
    skippable: z.boolean().optional(),
    once: z.boolean().optional(),
    // Actions may be defined elsewhere or inline
    actions: z.array(SequenceActionSchema).optional(),
  })
  .passthrough();

// ============================================================================
// COLLECTIBLES & SECRETS
// ============================================================================

export const CollectibleSchema = z.object({
  id: z.string(),
  type: z.enum(['ember_shard', 'hearthstone', 'health_pickup', 'warmth_pickup', 'lore_fragment']),
  position: Position2DSchema,
  value: z.number().optional(),
});

export const SecretSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['hidden_room', 'hidden_wall', 'buried_treasure']),
  entrance: RegionSchema,
  hint: z.string().optional(),
  rewards: z
    .object({
      emberShards: z.number().optional(),
      hearthstones: z.number().optional(),
      achievement: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// MEDIA
// ============================================================================

export const MediaSchema = z.object({
  chapterPlate: z.string(),
  parallaxBackground: z.string(),
  introCinematic: z.string().nullable().optional(),
  outroCinematic: z.string().nullable().optional(),
  bossIntroCinematic: z.string().nullable().optional(),
  musicTracks: z.record(z.string(), z.string().nullable()).optional(),
  ambientSounds: z.array(z.string()).optional(),
});

// ============================================================================
// ENVIRONMENT
// ============================================================================

export const LightingSchema = z.object({
  ambientColor: HexColorSchema,
  ambientIntensity: z.number(),
  warmthInfluence: z.boolean().optional(),
});

export const WeatherSchema = z.object({
  // Flexible weather types
  type: z.string(),
  intensity: z.number(),
  affectsGameplay: z.boolean().optional(),
});

export const ParticleLayerSchema = z.object({
  type: z.string(),
  density: z.number(),
  region: RegionSchema.optional(),
});

export const EnvironmentSchema = z.object({
  lighting: LightingSchema,
  weather: WeatherSchema.optional(),
  warmthDrain: z.number().optional(),
  particles: z.array(ParticleLayerSchema).optional(),
});

// ============================================================================
// MOTION CHALLENGES
// ============================================================================

export const MotionInputSchema = z.object({
  primaryAxis: z.enum(['alpha', 'beta', 'gamma']),
  sensitivity: z.number(),
  deadzone: z.number().optional(),
  smoothing: z.number().optional(),
  calibrationRequired: z.boolean().optional(),
});

export const AlternativeInputSchema = z.object({
  type: z.enum(['arrow_keys', 'stick', 'button_hold']),
  config: z.record(z.string(), z.any()).optional(),
});

export const MotionChallengeSchema = z.object({
  id: z.string(),
  type: z.enum(['balance_beam', 'shake_free', 'tilt_aim']),
  position: Position2DSchema.optional(),
  description: z.string().optional(),
  motionInput: MotionInputSchema.optional(),
  alternativeInput: AlternativeInputSchema.optional(),
  beam: z
    .object({
      length: z.number(),
      width: z.number(),
      wobble: z.number().optional(),
      wind: z
        .object({
          direction: z.number(),
          strength: z.number(),
          gusts: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  visualFeedback: z
    .object({
      indicator: z.string(),
      showGuides: z.boolean().optional(),
    })
    .optional(),
  hapticFeedback: z
    .object({
      onSuccess: z.string().optional(),
      onFail: z.string().optional(),
      continuous: z
        .object({
          patternId: z.string(),
          modulatedBy: z.string(),
        })
        .optional(),
    })
    .optional(),
  failCondition: z
    .object({
      type: z.enum(['fall', 'timeout', 'damage']),
      penalty: z
        .object({
          damage: z.number().optional(),
          warmthDrain: z.number().optional(),
          restart: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  successReward: z
    .object({
      emberShards: z.number().optional(),
    })
    .optional(),
});

// ============================================================================
// PROCEDURAL
// ============================================================================

export const ProceduralBackgroundSchema = z.object({
  id: z.string(),
  layer: z.number(),
  parallaxFactor: z.number().optional(),
  baseColor: HexColorSchema.optional(),
  gradientStops: z
    .array(
      z.object({
        color: HexColorSchema,
        position: z.number(),
      })
    )
    .optional(),
  procedural: z.record(z.string(), z.any()).optional(),
});

export const PostProcessSchema = z.object({
  type: z.enum(['vignette', 'bloom', 'color_grading', 'frost_overlay']),
  intensity: z.number().optional(),
  color: HexColorSchema.optional(),
  temperature: z.number().optional(),
  contrast: z.number().optional(),
  saturation: z.number().optional(),
  threshold: z.number().optional(),
});

export const ProceduralSchema = z.object({
  backgrounds: z.array(ProceduralBackgroundSchema).optional(),
  postProcess: z.array(PostProcessSchema).optional(),
});

// ============================================================================
// CHAPTER MANIFEST
// ============================================================================

export const ChapterManifestSchema = z.object({
  $schema: z.string().optional(),
  id: z.number().int(),
  name: z.string(),
  location: z.string(),

  narrative: NarrativeSchema,
  connections: ConnectionsSchema,
  npcs: z.array(ChapterNPCSchema).optional(),
  quests: z.array(QuestSchema).optional(),
  level: LevelSchema,
  encounters: z.array(EncounterSchema).optional(),
  boss: BossSchema.nullable().optional(),
  interactions: z.array(InteractionSchema).optional(),
  triggers: z.array(TriggerSchema).optional(),
  sequences: z.array(SequenceSchema).optional(),
  collectibles: z.array(CollectibleSchema).optional(),
  secrets: z.array(SecretSchema).optional(),
  media: MediaSchema,
  environment: EnvironmentSchema,
  motionChallenges: z.array(MotionChallengeSchema).optional(),
  procedural: ProceduralSchema.optional(),
  credits: z
    .object({
      showAfterCompletion: z.boolean().optional(),
      musicTrack: z.string().optional(),
      style: z.string().optional(),
      duration: z.number().optional(),
    })
    .optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type Position2D = z.infer<typeof Position2DSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type ChapterManifest = z.infer<typeof ChapterManifestSchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type StoryBeat = z.infer<typeof StoryBeatSchema>;
export type ChapterNPC = z.infer<typeof ChapterNPCSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type LevelSegment = z.infer<typeof LevelSegmentSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type Encounter = z.infer<typeof EncounterSchema>;
export type Boss = z.infer<typeof BossSchema>;
export type BossPhase = z.infer<typeof BossPhaseSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Trigger = z.infer<typeof TriggerSchema>;
export type TriggerAction = z.infer<typeof TriggerActionSchema>;
export type Sequence = z.infer<typeof SequenceSchema>;
export type Collectible = z.infer<typeof CollectibleSchema>;
export type Secret = z.infer<typeof SecretSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
export type MotionChallenge = z.infer<typeof MotionChallengeSchema>;

// ============================================================================
// NON-CHAPTER MANIFEST SCHEMAS
// ============================================================================

/**
 * Schema for asset configuration (sprite sheets, images, etc.)
 */
export const AssetConfigSchema = z.object({
  columns: z.number().optional(),
  rows: z.number().optional(),
  frameWidth: z.number().optional(),
  frameHeight: z.number().optional(),
  size: z.string().optional(),
  quality: z.string().optional(),
  transparent: z.boolean().optional(),
  fps: z.number().optional(),
}).passthrough();

/**
 * Schema for generation prompts
 */
export const GenerationPromptSchema = z.object({
  subject: z.string().optional(),
  physique: z.string().optional(),
  fur: z.string().optional(),
  outfit: z.string().optional(),
  expression: z.string().optional(),
  animation: z.string().optional(),
  behavior: z.string().optional(),
  style: z.string().optional(),
  negative: z.string().optional(),
  setting: z.string().optional(),
  mood: z.string().optional(),
  visualElements: z.string().optional(),
  palette: z.string().optional(),
}).passthrough();

/**
 * Schema for a single asset entry
 */
export const AssetEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  status: z.enum(['pending', 'complete', 'needs_regeneration', 'approved', 'rejected']),
  type: z.string(),
  config: AssetConfigSchema.optional(),
  prompt: GenerationPromptSchema.optional(),
}).passthrough();

/**
 * Enemies manifest schema
 */
export const EnemiesManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('enemies'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  brandGuidance: z.object({
    faction: z.string(),
    aesthetic: z.string(),
    tone: z.string(),
    style: z.string(),
  }).passthrough().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Species definition for NPCs
 */
export const SpeciesDefinitionSchema = z.object({
  description: z.string(),
  physique: z.string(),
  personality: z.array(z.string()),
  roles: z.array(z.string()),
  colors: z.object({
    fur: z.array(z.string()).optional(),
    belly: z.array(z.string()).optional(),
    stripes: z.array(z.string()).optional(),
  }).passthrough(),
}).passthrough();

/**
 * NPCs manifest schema
 */
export const NPCsManifestSchema = z.object({
  $schema: z.string().optional(),
  version: z.string(),
  category: z.literal('npcs'),
  description: z.string(),
  species: z.record(z.string(), SpeciesDefinitionSchema),
  npcs: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Sprites manifest schema
 */
export const SpritesManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('sprites'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Cinematics manifest schema
 */
export const CinematicsManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('cinematics'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Sounds manifest schema
 */
export const SoundsManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('sounds'),
  provider: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Effects manifest schema
 */
export const EffectsManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('effects'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Items manifest schema
 */
export const ItemsManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('items'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Scenes manifest schema
 */
export const ScenesManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('scenes'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

/**
 * Chapter plates manifest schema
 */
export const ChapterPlatesManifestSchema = z.object({
  $schema: z.string().optional(),
  category: z.literal('chapter-plates'),
  provider: z.string().optional(),
  model: z.string().optional(),
  outputDir: z.string().optional(),
  assets: z.array(AssetEntrySchema),
}).passthrough();

// Export inferred types
export type AssetEntry = z.infer<typeof AssetEntrySchema>;
export type AssetConfig = z.infer<typeof AssetConfigSchema>;
export type GenerationPrompt = z.infer<typeof GenerationPromptSchema>;
export type EnemiesManifest = z.infer<typeof EnemiesManifestSchema>;
export type NPCsManifest = z.infer<typeof NPCsManifestSchema>;
export type SpritesManifest = z.infer<typeof SpritesManifestSchema>;
export type CinematicsManifest = z.infer<typeof CinematicsManifestSchema>;
export type SoundsManifest = z.infer<typeof SoundsManifestSchema>;
export type EffectsManifest = z.infer<typeof EffectsManifestSchema>;
export type ItemsManifest = z.infer<typeof ItemsManifestSchema>;
export type ScenesManifest = z.infer<typeof ScenesManifestSchema>;
export type ChapterPlatesManifest = z.infer<typeof ChapterPlatesManifestSchema>;
