import { z } from "zod";
const ChapterAssetsSchema = z.object({
  chapterPlate: z.string(),
  parallaxBg: z.string()
});
const ChapterSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  setting: z.string().min(1),
  quest: z.string().min(1),
  hasBoss: z.boolean(),
  bossName: z.string().nullable(),
  assets: ChapterAssetsSchema
});
const ChaptersArraySchema = z.array(ChapterSchema);
const BiomeColorsSchema = z.object({
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fog: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sky1: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sky2: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});
const BiomeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  chapterIds: z.array(z.number().int().nonnegative()),
  colors: BiomeColorsSchema,
  atmosphere: z.enum(["warm", "serene", "cozy", "tense", "hopeful", "dramatic", "triumphant"]),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night", "dawn", "sunset", "sunrise"])
});
const BiomesArraySchema = z.array(BiomeSchema);
const AnimationFrameSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  duration: z.number().positive()
});
const AnimationStateSchema = z.object({
  name: z.string().min(1),
  frames: z.array(AnimationFrameSchema),
  loop: z.boolean(),
  hitbox: z.object({
    offsetX: z.number(),
    offsetY: z.number(),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional()
});
export {
  AnimationFrameSchema,
  AnimationStateSchema,
  BiomeColorsSchema,
  BiomeSchema,
  BiomesArraySchema,
  ChapterAssetsSchema,
  ChapterSchema,
  ChaptersArraySchema
};
