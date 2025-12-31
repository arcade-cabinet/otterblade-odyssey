import { getBiomeColorsArray, loadBiomes, loadChapters } from "./data";
const CHUNK_SIZE = 48;
const SEGMENT_LEN = 190;
const ROOM_LEN = 210;
const BOSS_PERIOD = 720;
const WORLD_Z = 0;
const FALLBACK_COLORS = {
  bg: "#2d4a3e",
  fog: "#4a6a5e",
  accent: "#c4a35a",
  sky1: "#87ceeb",
  sky2: "#4a6a5e"
};
function loadChaptersWithColors() {
  try {
    const chapters = loadChapters();
    const biomes = loadBiomes();
    const biomeColors = getBiomeColorsArray();
    const unmappedChapters = chapters.filter(
      (ch) => !biomes.some((b) => b.chapterIds.includes(ch.id))
    );
    if (unmappedChapters.length > 0) {
      console.warn(
        `[constants] ${unmappedChapters.length} chapters have no biome mapping: ` + unmappedChapters.map((ch) => ch.name).join(", ")
      );
    }
    return chapters.map((ch, idx) => {
      const colors = biomeColors[idx];
      if (!colors) {
        console.warn(
          `[constants] Missing biome colors for chapter ${idx} (${ch.name}), using fallback.`
        );
      }
      return {
        ...ch,
        bg: colors?.bg ?? FALLBACK_COLORS.bg,
        fog: colors?.fog ?? FALLBACK_COLORS.fog,
        accent: colors?.accent ?? FALLBACK_COLORS.accent,
        sky1: colors?.sky1 ?? FALLBACK_COLORS.sky1,
        sky2: colors?.sky2 ?? FALLBACK_COLORS.sky2
      };
    });
  } catch (error) {
    console.error("[constants] Failed to load chapter data:", error);
    return [
      {
        id: 0,
        name: "Error Loading Data",
        setting: "Unknown",
        quest: "Please refresh the page",
        hasBoss: false,
        bossName: null,
        assets: {
          chapterPlate: "",
          parallaxBg: ""
        },
        bg: FALLBACK_COLORS.bg,
        fog: FALLBACK_COLORS.fog,
        accent: FALLBACK_COLORS.accent,
        sky1: FALLBACK_COLORS.sky1,
        sky2: FALLBACK_COLORS.sky2
      }
    ];
  }
}
const CHAPTERS = loadChaptersWithColors();
const BIOMES = CHAPTERS.map((ch) => ({
  name: ch.name,
  bg: ch.bg,
  fog: ch.fog,
  accent: ch.accent,
  sky1: ch.sky1,
  sky2: ch.sky2,
  quest: ch.quest
}));
const CG = {
  PLAYER: 1,
  WORLD: 2,
  ENEMY: 4,
  ITEM: 8,
  TRAP: 16,
  HITBOX: 32,
  PROJECTILE: 64,
  GATE: 128
};
const STORY_EVENTS = {
  CHAPTER_START: "chapter_start",
  CHAPTER_COMPLETE: "chapter_complete",
  BOSS_ENCOUNTER: "boss_encounter",
  BOSS_DEFEATED: "boss_defeated",
  CUTSCENE_START: "cutscene_start",
  CUTSCENE_END: "cutscene_end"
};
export {
  BIOMES,
  BOSS_PERIOD,
  CG,
  CHAPTERS,
  CHUNK_SIZE,
  ROOM_LEN,
  SEGMENT_LEN,
  STORY_EVENTS,
  WORLD_Z
};
