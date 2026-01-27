/**
 * @otterblade/types - Core Game Types
 * Shared game entity and system types
 */

import type * as Matter from 'matter-js';
import type { Vector3 } from 'yuka';

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface Entity {
  id: string;
  type: string;
  position: { x: number; y: number; z?: number };
  active: boolean;
}

export interface NPC extends Entity {
  type: 'npc';
  npcId: string;
  npcType: string;
  dialogue?: string[];
  currentDialogueIndex: number;
  hasInteracted: boolean;
}

export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  aiState: string;
}

// ============================================================================
// PHYSICS TYPES
// ============================================================================

export interface PlayerBody extends Matter.Body {
  canJump?: boolean;
  isGrounded?: boolean;
  facingDirection?: number;
  parts?: Array<Matter.Body & { label?: string }>;
}

export interface TriggerBody extends Matter.Body {
  triggerId?: string;
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface GameState {
  health: number;
  maxHealth: number;
  shards: number;
  warmth: number;
  maxWarmth: number;
  currentChapter: number;
  checkpointPosition: { x: number; y: number };
  questProgress: Record<string, number>;
  unlockedChapters: number[];
  gameTime?: number;
  
  // Methods
  takeDamage(amount: number): void;
  heal(amount: number): void;
  collectShard(): void;
  updateWarmth(delta: number): void;
}

// ============================================================================
// BIOME TYPES (Legacy)
// ============================================================================

export interface BiomeColors {
  bg: string;
  fog: string;
  accent: string;
  sky1: string;
  sky2: string;
}

export interface Biome {
  id: string;
  name: string;
  chapterIds: number[];
  colors: BiomeColors;
  atmosphere?: {
    particleType?: string;
    particleDensity?: number;
    weather?: string;
  };
  audio?: {
    ambientTrack?: string;
    combatTrack?: string;
  };
}

// ============================================================================
// CHAPTER TYPES (Legacy Simple Format)
// ============================================================================

export interface ChapterAssets {
  chapterPlate: string;
  parallaxBg: string;
}

export interface Chapter {
  id: number;
  name: string;
  setting: string;
  quest: string;
  hasBoss: boolean;
  bossName: string | null;
  assets: ChapterAssets;
}
