export const CHUNK_SIZE = 48;
export const SEGMENT_LEN = 190;
export const ROOM_LEN = 210;
export const BOSS_PERIOD = 720;
export const WORLD_Z = 0;

export const BIOMES = [
  {
    name: "ABBEY EXTERIOR",
    bg: "#2d3b2d",
    fog: "#4a6741",
    accent: "#8fbc8f",
    sky1: "#1a2518",
    sky2: "#3d5a3d",
    quest: "Reach the Gatehouse",
  },
  {
    name: "ABBEY INTERIOR",
    bg: "#3d2b1f",
    fog: "#5c4033",
    accent: "#d4a574",
    sky1: "#1f1510",
    sky2: "#4a3628",
    quest: "Defend the Great Hall",
  },
  {
    name: "DUNGEON",
    bg: "#1a1a24",
    fog: "#2d2d3d",
    accent: "#e67e22",
    sky1: "#0d0d12",
    sky2: "#1a1a28",
    quest: "Descend into the Depths",
  },
  {
    name: "COURTYARD",
    bg: "#4a5d3a",
    fog: "#6b8e4a",
    accent: "#c0392b",
    sky1: "#2d3a24",
    sky2: "#5a7048",
    quest: "Rally the Defenders",
  },
  {
    name: "ROOFTOPS",
    bg: "#3a3a4a",
    fog: "#5a5a6a",
    accent: "#cd7f32",
    sky1: "#1a1a24",
    sky2: "#3d3d4d",
    quest: "Ascend to the Bells",
  },
  {
    name: "OUTER RUINS",
    bg: "#2a3a2a",
    fog: "#4a5a4a",
    accent: "#6b8e23",
    sky1: "#151f15",
    sky2: "#2d402d",
    quest: "Follow the River Path",
  },
];

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
