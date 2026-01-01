/**
 * @fileoverview Zod schemas for NPC (Non-Player Character) data.
 * These schemas validate the npcs.json manifest.
 */

import { z } from 'zod';
import { HexColorSchema } from './manifest-schemas';

// ============================================================================
// SPECIES
// ============================================================================

export const SpeciesColorsSchema = z.record(z.string(), z.array(HexColorSchema));

export const SpeciesSchema = z.object({
  description: z.string(),
  physique: z.string(),
  personality: z.array(z.string()),
  roles: z.array(z.string()),
  colors: SpeciesColorsSchema,
});

export const SpeciesMapSchema = z.record(z.string(), SpeciesSchema);

// ============================================================================
// CHARACTER DEFINITIONS (Actual structure from npcs.json)
// ============================================================================

export const HitboxSchema = z.object({
  width: z.number(),
  height: z.number(),
  offsetY: z.number().optional(),
});

export const ProceduralConfigSchema = z.object({
  type: z.enum(['player_character', 'npc', 'npc_group']),
  drawFunction: z.string(),
  hitbox: HitboxSchema,
  variant: z.string().optional(),
  animations: z.array(z.string()).optional(),
  count: z.number().optional(),
});

export const DialogueConfigSchema = z.object({
  style: z.enum(['gesture', 'speech', 'mixed']),
  gestures: z.array(z.string()).optional(),
});

export const CharacterDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  title: z.string().optional(),
  role: z.enum([
    'protagonist',
    'mentor',
    'ally',
    'guide',
    'oracle',
    'quest_giver',
    'ambient',
  ]),
  chapters: z.array(z.number()).optional(),
  description: z.string().optional(),
  backstory: z.string().optional(),
  arc: z.string().optional(),
  personality: z.array(z.string()).optional(),
  procedural: ProceduralConfigSchema,
  dialogue: DialogueConfigSchema.optional(),
});

// ============================================================================
// BEHAVIORS (Descriptive format from actual file)
// ============================================================================

export const NPCBehaviorDescriptionSchema = z.object({
  types: z.array(z.string()).optional(),
  description: z.string(),
  properties: z.array(z.string()).optional(),
});

export const NPCBehaviorsSchema = z.object({
  idle: NPCBehaviorDescriptionSchema,
  patrol: NPCBehaviorDescriptionSchema,
  follow: NPCBehaviorDescriptionSchema,
  flee: NPCBehaviorDescriptionSchema,
  escort: NPCBehaviorDescriptionSchema,
  scripted: NPCBehaviorDescriptionSchema,
});

// ============================================================================
// GESTURE LIBRARY (Arrays of gesture names by category)
// ============================================================================

export const GestureLibrarySchema = z.object({
  greetings: z.array(z.string()),
  directions: z.array(z.string()),
  emotions: z.array(z.string()),
  blessings: z.array(z.string()),
  actions: z.array(z.string()),
  combat: z.array(z.string()),
});

// ============================================================================
// ROOT NPC MANIFEST
// ============================================================================

export const NPCManifestSchema = z.object({
  $schema: z.string().optional(),
  version: z.string(),
  category: z.literal('npcs'),
  description: z.string(),
  species: SpeciesMapSchema,
  characters: z.array(CharacterDefinitionSchema),
  npcBehaviors: NPCBehaviorsSchema,
  gestureLibrary: GestureLibrarySchema,
});

// ============================================================================
// TYPES
// ============================================================================

export type Species = z.infer<typeof SpeciesSchema>;
export type CharacterDefinition = z.infer<typeof CharacterDefinitionSchema>;
export type ProceduralConfig = z.infer<typeof ProceduralConfigSchema>;
export type DialogueConfig = z.infer<typeof DialogueConfigSchema>;
export type NPCBehaviors = z.infer<typeof NPCBehaviorsSchema>;
export type GestureLibrary = z.infer<typeof GestureLibrarySchema>;
export type NPCManifest = z.infer<typeof NPCManifestSchema>;
