/**
 * @otterblade/config - Physics Constants
 * Physics configuration for Matter.js
 */

/** Chunk size for procedural generation */
export const CHUNK_SIZE = 48;

/** Length of a level segment */
export const SEGMENT_LEN = 190;

/** Length of a room */
export const ROOM_LEN = 210;

/** Distance between boss encounters */
export const BOSS_PERIOD = 720;

/** Z-position for world objects */
export const WORLD_Z = 0;

/** Collision groups for physics filtering */
export const CG = {
  PLAYER: 1,
  WORLD: 2,
  ENEMY: 4,
  ITEM: 8,
  TRAP: 16,
  HITBOX: 32,
  PROJECTILE: 64,
  GATE: 128,
} as const;

/** Player physics constants */
export const PLAYER_PHYSICS = {
  maxSpeed: 5,
  acceleration: 0.0008,
  airControl: 0.6,
  jumpForce: -12,
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
  gravity: 1.5,
} as const;

/** Story event types for ECS */
export const STORY_EVENTS = {
  CHAPTER_START: 'chapter_start',
  CHAPTER_COMPLETE: 'chapter_complete',
  BOSS_ENCOUNTER: 'boss_encounter',
  BOSS_DEFEATED: 'boss_defeated',
  CUTSCENE_START: 'cutscene_start',
  CUTSCENE_END: 'cutscene_end',
} as const;

export type StoryEventType = (typeof STORY_EVENTS)[keyof typeof STORY_EVENTS];
export type CollisionGroup = (typeof CG)[keyof typeof CG];
