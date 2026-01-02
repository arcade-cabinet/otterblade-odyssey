/**
 * Level Builder - Constructs game level from DDL manifest
 */

import { Platform } from '../entities/Platform.js';
import { Enemy } from '../entities/Enemy.js';
import { Collectible } from '../entities/Collectible.js';

export class LevelBuilder {
  static build(manifest, player) {
    const entities = [];

    // Create platforms from boundaries
    manifest.levelDefinition.boundaries.forEach(boundary => {
      const platform = new Platform(
        boundary.x,
        boundary.y,
        boundary.width,
        boundary.height,
        boundary.type
      );
      entities.push(platform);
    });

    // Position player at spawn point
    const spawn = manifest.connections.transitionIn.playerSpawnPoint;
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;

    // Create enemies from spawns
    if (manifest.levelDefinition.enemySpawns) {
      manifest.levelDefinition.enemySpawns.forEach(spawnData => {
        const enemy = new Enemy(
          spawnData.x,
          spawnData.y,
          spawnData.type,
          spawnData.behaviorPattern
        );
        entities.push(enemy);
      });
    }

    // Create collectibles
    if (manifest.levelDefinition.collectibles) {
      manifest.levelDefinition.collectibles.forEach(collectData => {
        const collectible = new Collectible(
          collectData.x,
          collectData.y,
          collectData.type
        );
        entities.push(collectible);
      });
    }

    // Create exit portal
    const exit = manifest.connections.transitionOut.exitPoint;
    const exitPortal = {
      x: exit.x,
      y: exit.y,
      width: 60,
      height: 80,
      isExit: true,
      nextChapter: manifest.connections.nextChapter
    };
    entities.push(exitPortal);

    return {
      entities,
      biome: manifest.levelDefinition.biome || 'forest',
      name: manifest.name,
      quest: manifest.narrative.quest,
      exitPoint: exit
    };
  }
}
