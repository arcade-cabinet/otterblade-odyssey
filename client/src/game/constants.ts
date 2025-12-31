export const CHUNK_SIZE = 48;
export const SEGMENT_LEN = 190;
export const ROOM_LEN = 210;
export const BOSS_PERIOD = 720;
export const WORLD_Z = 0;

export const BIOMES = [
  {
    name: "VERDANT",
    bg: "#022c22",
    fog: "#064e3b",
    accent: "#34d399",
    sky1: "#061a16",
    sky2: "#0b3a2f",
  },
  {
    name: "CRYSTAL",
    bg: "#0f172a",
    fog: "#1e3a8a",
    accent: "#60a5fa",
    sky1: "#0a1020",
    sky2: "#1a2b6a",
  },
  {
    name: "MAGMA",
    bg: "#450a0a",
    fog: "#7f1d1d",
    accent: "#fca5a5",
    sky1: "#1b0303",
    sky2: "#5a0d0d",
  },
  {
    name: "AETHER",
    bg: "#2e1065",
    fog: "#581c87",
    accent: "#d8b4fe",
    sky1: "#12062a",
    sky2: "#3b0b62",
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
