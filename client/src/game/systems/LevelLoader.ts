/**
 * Level Loader - Instantiates levels from DDL manifests
 * Creates platforms/boundaries from JSON instead of random generation
 */

import type { ChapterManifest } from '@/data/schema/chapter-schema';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'platform' | 'wall';
}

export interface LevelGeometry {
  platforms: Platform[];
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export class LevelLoader {
  /**
   * Load level geometry from chapter manifest
   */
  loadLevelFromManifest(manifest: ChapterManifest): LevelGeometry {
    const level = manifest.levelDefinition;
    const platforms: Platform[] = [];

    // Convert DDL boundaries to platforms
    for (const boundary of level.boundaries) {
      platforms.push({
        x: boundary.x,
        y: boundary.y,
        width: boundary.width,
        height: boundary.height,
        type: boundary.type as 'ground' | 'platform' | 'wall'
      });
    }

    // Get spawn point from connections
    const spawn = manifest.connections.transitionIn.playerSpawnPoint;
    
    // Get exit point
    const exit = manifest.connections.transitionOut.exitPoint;

    // Calculate level bounds
    const bounds = {
      minX: Math.min(...level.boundaries.map(b => b.x)),
      maxX: Math.max(...level.boundaries.map(b => b.x + b.width)),
      minY: Math.min(...level.boundaries.map(b => b.y)),
      maxY: Math.max(...level.boundaries.map(b => b.y + b.height))
    };

    return {
      platforms,
      spawn,
      exit,
      bounds
    };
  }

  /**
   * Simple procedural fallback for testing
   * (Can remove once all manifests have boundaries defined)
   */
  generateSimplePlatforms(chapterId: number): LevelGeometry {
    const platforms: Platform[] = [];

    // Ground platform
    platforms.push({
      x: 0,
      y: 400,
      width: 1200,
      height: 50,
      type: 'ground'
    });

    // A few floating platforms for variety
    for (let i = 0; i < 5; i++) {
      platforms.push({
        x: 200 + i * 200,
        y: 300 - i * 20,
        width: 150,
        height: 20,
        type: 'platform'
      });
    }

    return {
      platforms,
      spawn: { x: 150, y: 300 },
      exit: { x: 1000, y: 350 },
      bounds: { minX: 0, maxX: 1200, minY: 0, maxY: 450 }
    };
  }
}

export const levelLoader = new LevelLoader();
