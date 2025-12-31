/**
 * @fileoverview Data loaders that validate JSON content via Zod schemas.
 * Never import JSON directly - always use these typed loaders.
 */

import { fromError } from "zod-validation-error";
import {
  ChaptersArraySchema,
  BiomesArraySchema,
  type Chapter,
  type Biome,
} from "./schemas";

import chaptersData from "../../data/chapters.json";
import biomesData from "../../data/biomes.json";

/**
 * Loads and validates chapter data from JSON.
 * Throws descriptive error if validation fails.
 */
export function loadChapters(): Chapter[] {
  const result = ChaptersArraySchema.safeParse(chaptersData);

  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid chapters.json: ${error.message}`);
  }

  return result.data;
}

/**
 * Loads and validates biome data from JSON.
 * Throws descriptive error if validation fails.
 */
export function loadBiomes(): Biome[] {
  const result = BiomesArraySchema.safeParse(biomesData);

  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid biomes.json: ${error.message}`);
  }

  return result.data;
}

/**
 * Get a chapter by ID with type safety.
 */
export function getChapterById(id: number): Chapter | undefined {
  const chapters = loadChapters();
  return chapters.find((ch) => ch.id === id);
}

/**
 * Get a biome by chapter ID.
 */
export function getBiomeByChapterId(chapterId: number): Biome | undefined {
  const biomes = loadBiomes();
  return biomes.find((b) => b.chapterIds.includes(chapterId));
}

/**
 * Get all biome colors as a flat array for legacy compatibility.
 */
export function getBiomeColorsArray(): Array<{
  name: string;
  bg: string;
  fog: string;
  accent: string;
  sky1: string;
  sky2: string;
  quest: string;
}> {
  const chapters = loadChapters();
  const biomes = loadBiomes();

  return chapters.map((ch) => {
    const biome = biomes.find((b) => b.chapterIds.includes(ch.id));
    const colors = biome?.colors ?? {
      bg: "#1a1a2e",
      fog: "#2a2a3e",
      accent: "#8fbc8f",
      sky1: "#1a1a24",
      sky2: "#2d2d3d",
    };

    return {
      name: ch.name,
      bg: colors.bg,
      fog: colors.fog,
      accent: colors.accent,
      sky1: colors.sky1,
      sky2: colors.sky2,
      quest: ch.quest,
    };
  });
}
