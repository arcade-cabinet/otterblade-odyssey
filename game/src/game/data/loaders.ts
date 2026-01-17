/**
 * @fileoverview Data loaders that validate JSON content via Zod schemas.
 * Never import JSON directly - always use these typed loaders.
 */

import { fromError } from 'zod-validation-error';
import { type Biome, BiomesArraySchema, type Chapter, ChaptersArraySchema } from './schemas';

let cachedChapters: Chapter[] | null = null;
let cachedBiomes: Biome[] | null = null;

async function fetchJson(url: string, filePath: string): Promise<unknown> {
  if (typeof window === 'undefined') {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(new URL(filePath, import.meta.url), 'utf8');
    return JSON.parse(raw);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Preloads chapters and biomes data into cache.
 */
export async function preloadLegacyData(): Promise<void> {
  await Promise.all([loadChapters(), loadBiomes()]);
}

/**
 * Loads and validates chapter data from JSON.
 * Throws descriptive error if validation fails.
 */
export async function loadChapters(): Promise<Chapter[]> {
  if (cachedChapters) return cachedChapters;
  const data = await fetchJson('/data/chapters.json', '../../data/chapters.json');
  const result = ChaptersArraySchema.safeParse(data);

  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid chapters.json: ${error.message}`);
  }

  cachedChapters = result.data;
  return cachedChapters;
}

/**
 * Loads and validates biome data from JSON.
 * Throws descriptive error if validation fails.
 */
export async function loadBiomes(): Promise<Biome[]> {
  if (cachedBiomes) return cachedBiomes;
  const data = await fetchJson('/data/biomes.json', '../../data/biomes.json');
  const result = BiomesArraySchema.safeParse(data);

  if (!result.success) {
    const error = fromError(result.error);
    throw new Error(`Invalid biomes.json: ${error.message}`);
  }

  cachedBiomes = result.data;
  return cachedBiomes;
}

/**
 * Get a chapter by ID with type safety.
 */
export function getChapterById(id: number): Chapter | undefined {
  return getChaptersSync().find((ch) => ch.id === id);
}

/**
 * Get a biome by chapter ID.
 */
export function getBiomeByChapterId(chapterId: number): Biome | undefined {
  return getBiomesSync().find((b) => b.chapterIds.includes(chapterId));
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
  const chapters = getChaptersSync();
  const biomes = getBiomesSync();

  return chapters.map((ch) => {
    const biome = biomes.find((b) => b.chapterIds.includes(ch.id));
    const colors = biome?.colors ?? {
      bg: '#1a1a2e',
      fog: '#2a2a3e',
      accent: '#8fbc8f',
      sky1: '#1a1a24',
      sky2: '#2d2d3d',
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

/**
 * Gets cached chapters data synchronously.
 * Throws if preloadLegacyData has not completed.
 */
export function getChaptersSync(): Chapter[] {
  if (!cachedChapters) {
    throw new Error('Chapters not loaded. Call preloadLegacyData() first.');
  }
  return cachedChapters;
}

/**
 * Gets cached biomes data synchronously.
 * Throws if preloadLegacyData has not completed.
 */
export function getBiomesSync(): Biome[] {
  if (!cachedBiomes) {
    throw new Error('Biomes not loaded. Call preloadLegacyData() first.');
  }
  return cachedBiomes;
}
