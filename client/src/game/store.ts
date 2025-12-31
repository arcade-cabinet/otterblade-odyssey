import { create } from "zustand";
import { BIOMES } from "./constants";

interface PlatformAABB {
  minX: number;
  maxX: number;
  topY: number;
}

interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  attack: boolean;
  up: boolean;
  down: boolean;
}

interface GameState {
  runId: number;
  gameStarted: boolean;
  gameOver: boolean;

  health: number;
  shards: number;
  bankedShards: number;
  score: number;
  bestScore: number;
  distance: number;
  bestDistance: number;

  biomeIndex: number;
  accent: string;

  inBossFight: boolean;
  bossHp: number;
  bossMax: number;
  bossIndex: number;

  checkpointX: number;
  checkpointY: number;
  checkpointSeen: number;

  toast: string;
  toastUntil: number;

  controls: Controls;

  playerX: number;
  playerY: number;
  playerFacingRight: boolean;
  playerState: string;

  damageFlash: number;

  platformAABBs: Map<string, PlatformAABB>;
  registerPlatform: (id: string, aabb: PlatformAABB) => void;
  unregisterPlatform: (id: string) => void;

  quality: number;
  avgMs: number;
  showQualityBadgeUntil: number;

  setControl: (key: keyof Controls, value: boolean) => void;
  setBiomeMeta: (idx: number, accent: string) => void;
  setPlayerPos: (x: number, y: number) => void;
  setPlayerFacing: (facingRight: boolean) => void;
  setPlayerState: (state: string) => void;

  toastMsg: (msg: string, ms?: number) => void;

  startGame: () => void;
  advanceScore: (newDistance: number) => void;
  addShard: () => void;
  checkpoint: (roomIndex: number, x: number, y: number) => void;
  setBossState: (
    inBossFight: boolean,
    bossHp: number,
    bossMax: number,
    bossIndex: number
  ) => void;
  hitPlayer: (dmg?: number) => void;
  respawnFromCheckpoint: () => void;
}

export const useStore = create<GameState>((set, get) => ({
  runId: 0,
  gameStarted: false,
  gameOver: false,

  health: 5,
  shards: 0,
  bankedShards: 0,
  score: 0,
  bestScore: 0,
  distance: 0,
  bestDistance: 0,

  biomeIndex: 0,
  accent: BIOMES[0].accent,

  inBossFight: false,
  bossHp: 0,
  bossMax: 0,
  bossIndex: 0,

  checkpointX: 0,
  checkpointY: 8,
  checkpointSeen: -1,

  toast: "",
  toastUntil: 0,

  controls: {
    left: false,
    right: false,
    jump: false,
    crouch: false,
    attack: false,
    up: false,
    down: false,
  },

  playerX: 0,
  playerY: 0,
  playerFacingRight: true,
  playerState: "run",

  damageFlash: 0,

  platformAABBs: new Map(),
  registerPlatform: (id, aabb) =>
    set((s) => {
      const m = new Map(s.platformAABBs);
      m.set(id, aabb);
      return { platformAABBs: m };
    }),
  unregisterPlatform: (id) =>
    set((s) => {
      const m = new Map(s.platformAABBs);
      m.delete(id);
      return { platformAABBs: m };
    }),

  quality: 2,
  avgMs: 16.7,
  showQualityBadgeUntil: 0,

  setControl: (k, v) => set((s) => ({ controls: { ...s.controls, [k]: v } })),
  setBiomeMeta: (idx, accent) => set({ biomeIndex: idx, accent }),
  setPlayerPos: (x, y) => set({ playerX: x, playerY: y }),
  setPlayerFacing: (fr) => set({ playerFacingRight: fr }),
  setPlayerState: (st) => set({ playerState: st }),

  toastMsg: (msg, ms = 1200) => set({ toast: msg, toastUntil: performance.now() + ms }),

  startGame: () =>
    set((s) => ({
      runId: s.runId + 1,
      gameStarted: true,
      gameOver: false,
      health: 5,
      shards: 0,
      bankedShards: 0,
      score: 0,
      distance: 0,
      inBossFight: false,
      bossHp: 0,
      bossMax: 0,
      bossIndex: 0,
      checkpointX: 0,
      checkpointY: 8,
      checkpointSeen: -1,
      toast: "",
      toastUntil: 0,
      playerState: "run",
      damageFlash: 0,
      quality: 2,
      avgMs: 16.7,
      showQualityBadgeUntil: 0,
    })),

  advanceScore: (newDistance) =>
    set((s) => {
      const d = Math.max(s.distance, newDistance);
      const base = Math.floor(d * 10);
      const score = Math.max(s.score, base);
      return { distance: d, score };
    }),

  addShard: () => set((s) => ({ shards: s.shards + 1, score: s.score + 180 })),

  checkpoint: (roomIndex, x, y) =>
    set((s) => {
      const banked = s.bankedShards + s.shards;
      const health = Math.min(5, s.health + 1);
      return {
        checkpointSeen: roomIndex,
        checkpointX: x,
        checkpointY: y,
        bankedShards: banked,
        shards: 0,
        health,
        score: s.score + 400,
        toast: "Checkpoint acquired",
        toastUntil: performance.now() + 1300,
      };
    }),

  setBossState: (inBossFight, bossHp, bossMax, bossIndex) =>
    set({ inBossFight, bossHp, bossMax, bossIndex }),

  hitPlayer: (dmg = 1) =>
    set((s) => {
      if (s.gameOver) return s;
      const now = performance.now();
      const nh = s.health - dmg;
      const gameOver = nh <= 0;
      return {
        health: nh,
        gameOver,
        bestScore: Math.max(s.bestScore, s.score),
        bestDistance: Math.max(s.bestDistance, s.distance),
        damageFlash: now + 140,
      };
    }),

  respawnFromCheckpoint: () =>
    set((s) => ({
      gameOver: false,
      health: 5,
      shards: 0,
      score: Math.max(0, s.score - 900),
      distance: Math.max(0, s.distance - 80),
      inBossFight: false,
      bossHp: 0,
      bossMax: 0,
      bossIndex: 0,
      toast: "Restored from shrine",
      toastUntil: performance.now() + 1200,
      playerState: "run",
    })),
}));
