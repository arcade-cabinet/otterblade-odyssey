import { World } from 'miniplex';
import type { Chapter, StoryEventType } from '../constants';

export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };

  health?: { current: number; max: number };

  player?: true;
  enemy?: { type: 'skirmisher' | 'shielded' | 'ranged' | 'flyer' | 'trap' | 'elite' };
  boss?: { phase: number; maxPhase: number; name: string };

  sprite?: { src: string; width: number; height: number; flipX?: boolean };
  parallax?: { layer: number; scrollFactor: number };

  platform?: { width: number; height: number };
  checkpoint?: { roomIndex: number };
  shard?: true;

  facingRight?: boolean;
  grounded?: boolean;

  controls?: {
    left: boolean;
    right: boolean;
    jump: boolean;
    crouch: boolean;
    attack: boolean;
  };

  coyoteTime?: number;
  jumpBuffer?: number;

  damage?: { amount: number; source: Entity };
  dead?: true;

  tag?: string[];

  story?: {
    currentChapter: number;
    chaptersCompleted: number[];
    bossesDefeated: string[];
    totalShards: number;
  };

  chapter?: {
    id: number;
    data: Chapter;
    isActive: boolean;
    isCompleted: boolean;
    startTime?: number;
    completionTime?: number;
  };

  cutscene?: {
    type: 'intro' | 'outro' | 'chapter_plate' | 'boss_intro' | 'boss_defeat';
    chapterId: number;
    duration: number;
    startTime: number;
    isPlaying: boolean;
  };

  storyEvent?: {
    type: StoryEventType;
    chapterId: number;
    timestamp: number;
    data?: Record<string, unknown>;
  };

  narrative?: {
    questText: string;
    chapterName: string;
    setting: string;
  };
};

export const world = new World<Entity>();

export const queries = {
  players: world.with('player', 'position'),
  enemies: world.with('enemy', 'position'),
  bosses: world.with('boss', 'position', 'health'),
  moving: world.with('position', 'velocity'),
  sprites: world.with('sprite', 'position'),
  parallaxLayers: world.with('parallax', 'sprite'),
  platforms: world.with('platform', 'position'),
  checkpoints: world.with('checkpoint', 'position'),
  shards: world.with('shard', 'position'),
  withHealth: world.with('health'),
  dead: world.with('dead'),
  controlled: world.with('controls', 'velocity'),

  story: world.with('story'),
  chapters: world.with('chapter'),
  activeChapter: world.with('chapter').where((e) => e.chapter.isActive),
  cutscenes: world.with('cutscene'),
  playingCutscenes: world.with('cutscene').where((e) => e.cutscene.isPlaying),
  storyEvents: world.with('storyEvent'),
  narratives: world.with('narrative'),
};
