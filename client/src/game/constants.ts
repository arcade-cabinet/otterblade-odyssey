export const CHUNK_SIZE = 48;
export const SEGMENT_LEN = 190;
export const ROOM_LEN = 210;
export const BOSS_PERIOD = 720;
export const WORLD_Z = 0;

export interface Chapter {
  id: number;
  name: string;
  setting: string;
  quest: string;
  bg: string;
  fog: string;
  accent: string;
  sky1: string;
  sky2: string;
  chapterPlate: string;
  parallaxBg?: string;
  hasBoss: boolean;
  bossName?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 0,
    name: "PROLOGUE",
    setting: "Otter's Village",
    quest: "Answer the Call",
    bg: "#2a3a2a",
    fog: "#4a5a4a",
    accent: "#8fbc8f",
    sky1: "#1a2518",
    sky2: "#3d5a3d",
    chapterPlate: "prologue_village_chapter_plate.png",
    parallaxBg: "outer_ruins_parallax_background.png",
    hasBoss: false,
  },
  {
    id: 1,
    name: "ABBEY APPROACH",
    setting: "Forest, Bridge",
    quest: "Reach the Gatehouse",
    bg: "#2d3b2d",
    fog: "#4a6741",
    accent: "#8fbc8f",
    sky1: "#1a2518",
    sky2: "#3d5a3d",
    chapterPlate: "abbey_approach_chapter_plate.png",
    parallaxBg: "abbey_exterior_parallax_background.png",
    hasBoss: false,
  },
  {
    id: 2,
    name: "GATEHOUSE",
    setting: "Entry, Threshold",
    quest: "Cross the Threshold",
    bg: "#3d2b1f",
    fog: "#5c4033",
    accent: "#d4a574",
    sky1: "#1f1510",
    sky2: "#4a3628",
    chapterPlate: "gatehouse_bridge_chapter_plate.png",
    parallaxBg: "abbey_exterior_parallax_background.png",
    hasBoss: true,
    bossName: "Gatehouse Guardian",
  },
  {
    id: 3,
    name: "GREAT HALL",
    setting: "Interior, Oath",
    quest: "Defend the Great Hall",
    bg: "#3d2b1f",
    fog: "#5c4033",
    accent: "#d4a574",
    sky1: "#1f1510",
    sky2: "#4a3628",
    chapterPlate: "great_hall_oath_chapter_plate.png",
    parallaxBg: "abbey_interior_parallax_background.png",
    hasBoss: true,
    bossName: "Hall Invader",
  },
  {
    id: 4,
    name: "LIBRARY",
    setting: "Maps, Secrets",
    quest: "Find the Ancient Map",
    bg: "#3d2b1f",
    fog: "#5c4033",
    accent: "#c9a86c",
    sky1: "#1f1510",
    sky2: "#4a3628",
    chapterPlate: "library_map_table_chapter_plate.png",
    parallaxBg: "abbey_interior_parallax_background.png",
    hasBoss: false,
  },
  {
    id: 5,
    name: "DUNGEON",
    setting: "Catacombs",
    quest: "Descend into the Depths",
    bg: "#1a1a24",
    fog: "#2d2d3d",
    accent: "#e67e22",
    sky1: "#0d0d12",
    sky2: "#1a1a28",
    chapterPlate: "dungeon_descent_chapter_plate.png",
    parallaxBg: "dungeon_parallax_background.png",
    hasBoss: true,
    bossName: "Dungeon Keeper",
  },
  {
    id: 6,
    name: "COURTYARD",
    setting: "Gardens, Rally",
    quest: "Rally the Defenders",
    bg: "#4a5d3a",
    fog: "#6b8e4a",
    accent: "#c0392b",
    sky1: "#2d3a24",
    sky2: "#5a7048",
    chapterPlate: "courtyard_rally_chapter_plate.png",
    parallaxBg: "courtyard_parallax_background.png",
    hasBoss: false,
  },
  {
    id: 7,
    name: "ROOFTOPS",
    setting: "Bells, Rafters",
    quest: "Ascend to the Bells",
    bg: "#3a3a4a",
    fog: "#5a5a6a",
    accent: "#cd7f32",
    sky1: "#1a1a24",
    sky2: "#3d3d4d",
    chapterPlate: "rooftop_wind_chapter_plate.png",
    parallaxBg: "rooftops_parallax_background.png",
    hasBoss: true,
    bossName: "Bell Tower Sentinel",
  },
  {
    id: 8,
    name: "FINAL ASCENT",
    setting: "High Keep",
    quest: "Reach Zephyros",
    bg: "#2a2a3a",
    fog: "#4a4a5a",
    accent: "#ffd700",
    sky1: "#151520",
    sky2: "#2d2d40",
    chapterPlate: "final_ascent_chapter_plate.png",
    parallaxBg: "rooftops_parallax_background.png",
    hasBoss: true,
    bossName: "Zephyros",
  },
  {
    id: 9,
    name: "EPILOGUE",
    setting: "Victory, Dawn",
    quest: "A New Dawn",
    bg: "#4a5d3a",
    fog: "#7a9e5a",
    accent: "#ffd700",
    sky1: "#3d4a34",
    sky2: "#6a8058",
    chapterPlate: "epilogue_victory_chapter_plate.png",
    parallaxBg: "abbey_exterior_parallax_background.png",
    hasBoss: false,
  },
];

export const BIOMES = CHAPTERS.map((ch) => ({
  name: ch.name,
  bg: ch.bg,
  fog: ch.fog,
  accent: ch.accent,
  sky1: ch.sky1,
  sky2: ch.sky2,
  quest: ch.quest,
}));

export const CG = {
  PLAYER: 1,
  WORLD: 2,
  ENEMY: 4,
  ITEM: 8,
  TRAP: 16,
  HITBOX: 32,
  PROJECTILE: 64,
  GATE: 128,
};

export const STORY_EVENTS = {
  CHAPTER_START: "chapter_start",
  CHAPTER_COMPLETE: "chapter_complete",
  BOSS_ENCOUNTER: "boss_encounter",
  BOSS_DEFEATED: "boss_defeated",
  CUTSCENE_START: "cutscene_start",
  CUTSCENE_END: "cutscene_end",
} as const;

export type StoryEventType = (typeof STORY_EVENTS)[keyof typeof STORY_EVENTS];
