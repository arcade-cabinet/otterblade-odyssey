/**
 * @fileoverview Data loaders that validate JSON content via Zod schemas.
 * Never import JSON directly - always use these typed loaders.
 */
import { fromError } from 'zod-validation-error';
import biomesData from '../../data/biomes.json';
import chaptersData from '../../data/chapters.json';
import { BiomesArraySchema, ChaptersArraySchema } from './schemas';
/**
 * Loads and validates chapter data from JSON.
 * Throws descriptive error if validation fails.
 */
export function loadChapters() {
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
export function loadBiomes() {
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
export function getChapterById(id) {
    const chapters = loadChapters();
    return chapters.find((ch) => ch.id === id);
}
/**
 * Get a biome by chapter ID.
 */
export function getBiomeByChapterId(chapterId) {
    const biomes = loadBiomes();
    return biomes.find((b) => b.chapterIds.includes(chapterId));
}
/**
 * Get all biome colors as a flat array for legacy compatibility.
 */
export function getBiomeColorsArray() {
    const chapters = loadChapters();
    const biomes = loadBiomes();
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
