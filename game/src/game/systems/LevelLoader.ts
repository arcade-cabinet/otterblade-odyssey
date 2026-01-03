/**
 * Level Loader - Instantiates levels from DDL manifests
 * Creates platforms/boundaries from JSON instead of random generation
 */

import type { ChapterManifest } from '@/game/data/manifest-schemas';

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
    const level = manifest.level;
    const platforms: Platform[] = [];

    // Convert DDL segments and platforms to our Platform format
    for (const segment of level.segments) {
      // Add platforms from segment
      if (segment.platforms) {
        for (const platform of segment.platforms) {
          platforms.push({
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: 20, // Default platform thickness
            type: 'platform',
          });
        }
      }

      // Add walls from segment
      if (segment.walls) {
        for (const wall of segment.walls) {
          platforms.push({
            x: wall.x,
            y: wall.y,
            width: wall.width,
            height: wall.height,
            type: 'wall',
          });
        }
      }
    }

    // Get spawn point from level
    const spawn = {
      x: level.spawnPoint?.x ?? 100,
      y: level.spawnPoint?.y ?? 450,
    };

    // Get exit point from connections (with fallback)
    const exit = {
      x: manifest.connections.transitionOut?.exitPoint?.x ?? level.bounds.endX - 100,
      y: manifest.connections.transitionOut?.exitPoint?.y ?? 0,
    };

    // Use level bounds from manifest
    const bounds = {
      minX: level.bounds.startX,
      maxX: level.bounds.endX,
      minY: level.bounds.minY,
      maxY: level.bounds.maxY,
    };

    return {
      platforms,
      spawn,
      exit,
      bounds,
    };
  }

  /**
   * Simple procedural fallback for testing
   * (Can remove once all manifests have boundaries defined)
   */
  generateSimplePlatforms(_chapterId: number): LevelGeometry {
    const platforms: Platform[] = [];

    // Ground platform
    platforms.push({
      x: 0,
      y: 400,
      width: 1200,
      height: 50,
      type: 'ground',
    });

    // A few floating platforms for variety
    for (let i = 0; i < 5; i++) {
      platforms.push({
        x: 200 + i * 200,
        y: 300 - i * 20,
        width: 150,
        height: 20,
        type: 'platform',
      });
    }

    return {
      platforms,
      spawn: { x: 150, y: 300 },
      exit: { x: 1000, y: 350 },
      bounds: { minX: 0, maxX: 1200, minY: 0, maxY: 450 },
    };
  }
}

export const levelLoader = new LevelLoader();
