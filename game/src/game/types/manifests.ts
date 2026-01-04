/**
 * DDL Manifest Type Definitions
 * 
 * TypeScript types derived from Zod schemas in manifest-schemas.ts
 * These types ensure type safety when loading and using chapter manifests
 */

import { z } from 'zod';
import type { 
  Position2DSchema,
  RegionSchema,
  NarrativeSchema,
  ConnectionsSchema,
} from '../data/manifest-schemas';

/**
 * Chapter Manifest
 * Top-level structure for each chapter definition
 */
export interface ChapterManifest {
  id: number;
  name: string;
  location: string;
  
  narrative: {
    theme: string;
    quest: string;
    emotionalArc: {
      opening: string;
      midpoint: string;
      climax: string;
      resolution: string;
    };
    storyBeats: Array<{
      id: string;
      moment: string;
      triggeredBy: string;
      expression: string;
    }>;
  };
  
  connections: {
    previousChapter: number | null;
    nextChapter: number | null;
    transitionIn?: {
      type: 'walk_in' | 'cinematic' | 'fade' | 'warp';
      cinematicId?: string | null;
      playerSpawnPoint?: { x: number; y: number };
      exitPoint?: { x: number; y: number };
    };
    transitionOut?: {
      type: 'walk_in' | 'cinematic' | 'fade' | 'warp';
      cinematicId?: string | null;
      playerSpawnPoint?: { x: number; y: number };
      exitPoint?: { x: number; y: number };
    };
    unlockRequirements?: Array<{
      type: 'complete_chapter' | 'collect_item' | 'defeat_boss' | 'trigger_fired';
      value: string | number;
    }>;
  };
  
  level: {
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    playerSpawn: { x: number; y: number };
    platforms: Array<{
      id: string;
      position: { x: number; y: number };
      width: number;
      height: number;
      type: 'static' | 'moving' | 'crumbling' | 'semi-solid' | 'ice';
      friction?: number;
      movementPath?: Array<{ x: number; y: number }>;
      crumbleDelay?: number;
    }>;
    hazards?: Array<{
      id: string;
      type: 'spikes' | 'fire' | 'water' | 'wind' | 'falling_block' | 'crusher';
      position: { x: number; y: number };
      width: number;
      height: number;
      damage: number;
      pattern?: string;
    }>;
    waterZones?: Array<{
      id: string;
      region: { x: number; y: number; width: number; height: number };
      type: 'shallow' | 'deep' | 'current';
      currentDirection?: { x: number; y: number };
    }>;
  };
  
  npcs?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    behavior?: any;
    dialogue?: any;
    storyState?: any;
  }>;
  
  encounters?: Array<{
    id: string;
    enemyType: string;
    position: { x: number; y: number };
    behavior?: string;
    patrolPoints?: Array<{ x: number; y: number }>;
    health?: number;
    damage?: number;
    speed?: number;
    alertRadius?: number;
    attackRange?: number;
  }>;
  
  collectibles?: Array<{
    id: string;
    type: 'shard' | 'health' | 'key' | 'otterblade' | 'collectible';
    position: { x: number; y: number };
    value?: number;
    required?: boolean;
  }>;
  
  triggers?: Array<{
    id: string;
    type: 'cinematic' | 'checkpoint' | 'enemy_spawn' | 'dialogue' | 'chapter_transition';
    region: { x: number; y: number; width: number; height: number };
    action: string;
    repeatable?: boolean;
    conditions?: any;
  }>;
  
  cinematics?: Array<{
    id: string;
    triggerId?: string;
    sequence: Array<{
      type: string;
      duration: number;
      [key: string]: any;
    }>;
  }>;
  
  quests?: Array<{
    id: string;
    objectives: Array<{
      id: string;
      description: string;
      type: string;
      target?: any;
      condition?: any;
    }>;
  }>;
  
  settings?: {
    ambientSound?: string;
    musicTrack?: string;
    lighting?: {
      ambient: string;
      directional?: {
        color: string;
        intensity: number;
        angle: number;
      };
    };
    weather?: string;
    timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  };
}

/**
 * Enemy manifest
 * Defines enemy types and their stats
 */
export interface EnemyManifest {
  id: string;
  name: string;
  description: string;
  
  stats: {
    health: number;
    damage: number;
    speed: number;
    alertRadius: number;
    attackRange: number;
    width: number;
    height: number;
  };
  
  behavior: {
    defaultBehavior: 'patrol' | 'stationary' | 'aggressive' | 'defensive' | 'coward';
    patrolSpeed?: number;
    chaseSpeed?: number;
    fleeHealthThreshold?: number;
  };
  
  rendering: {
    color: string;
    secondaryColor?: string;
    size: { width: number; height: number };
    features?: string[];
  };
  
  sounds?: {
    alert?: string;
    attack?: string;
    hurt?: string;
    death?: string;
  };
}

/**
 * Sound manifest
 * Defines all game sounds
 */
export interface SoundManifest {
  music: Record<string, {
    id: string;
    file: string;
    volume: number;
    loop: boolean;
  }>;
  
  sfx: Record<string, {
    id: string;
    file: string;
    volume: number;
  }>;
  
  ambient: Record<string, {
    id: string;
    file: string;
    volume: number;
    loop: boolean;
  }>;
}

/**
 * Type helpers for manifest validation
 */
export type Position2D = z.infer<typeof Position2DSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type Connections = z.infer<typeof ConnectionsSchema>;
