/**
 * @fileoverview Zod schemas for validating game data JSON files.
 * All game content loaded from JSON must pass through these schemas.
 */
import { z } from 'zod';
/**
 * Schema for chapter asset references
 */
export const ChapterAssetsSchema = z.object({
    chapterPlate: z.string(),
    parallaxBg: z.string(),
});
/**
 * Schema for individual chapter definitions
 */
export const ChapterSchema = z.object({
    id: z.number().int().nonnegative(),
    name: z.string().min(1),
    setting: z.string().min(1),
    quest: z.string().min(1),
    hasBoss: z.boolean(),
    bossName: z.string().nullable(),
    assets: ChapterAssetsSchema,
});
/**
 * Schema for the full chapters array
 */
export const ChaptersArraySchema = z.array(ChapterSchema);
/**
 * Schema for biome color palette
 */
export const BiomeColorsSchema = z.object({
    bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fog: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sky1: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    sky2: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
/**
 * Schema for individual biome definitions
 */
export const BiomeSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    chapterIds: z.array(z.number().int().nonnegative()),
    colors: BiomeColorsSchema,
    atmosphere: z.enum(['warm', 'serene', 'cozy', 'tense', 'hopeful', 'dramatic', 'triumphant']),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'dawn', 'sunset', 'sunrise']),
});
/**
 * Schema for the full biomes array
 */
export const BiomesArraySchema = z.array(BiomeSchema);
/**
 * Schema for sprite animation frame data
 */
export const AnimationFrameSchema = z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    duration: z.number().positive(),
});
/**
 * Schema for animation state definitions
 */
export const AnimationStateSchema = z.object({
    name: z.string().min(1),
    frames: z.array(AnimationFrameSchema),
    loop: z.boolean(),
    hitbox: z
        .object({
        offsetX: z.number(),
        offsetY: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
    })
        .optional(),
});
