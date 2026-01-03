/**
 * Level Factory
 *
 * Builds complete game levels from DDL JSON manifests.
 * Creates platforms, walls, hazards, water zones, checkpoints, etc.
 *
 * @module factories/level-factory
 */

import Matter from 'matter-js';
import { getChapterSpawnPoint, loadChapterManifest } from '../data/chapter-loaders';
import {
  createPlatform,
  HazardSystem,
  MovingPlatform,
  WaterZone,
} from '../physics/PhysicsManager.js';

const { World, Bodies } = Matter;

/**
 * Build a complete level from a chapter manifest
 *
 * @param {number} chapterId - Chapter ID (0-9)
 * @param {Object} engine - Matter.js engine
 * @returns {Object} Level data with all entities
 */
export function buildLevel(chapterId, engine) {
  if (typeof chapterId !== 'number' || chapterId < 0 || chapterId > 9) {
    throw new Error(`Invalid chapter ID: ${chapterId}. Must be 0-9.`);
  }

  if (!engine || !engine.world) {
    throw new Error('Invalid Matter.js engine provided to buildLevel');
  }

  // Load chapter manifest from DDL
  const manifest = loadChapterManifest(chapterId);
  const spawnPoint = getChapterSpawnPoint(chapterId);

  const level = {
    id: chapterId,
    name: manifest.name,
    theme: manifest.theme,
    spawnPoint: spawnPoint,
    platforms: [],
    walls: [],
    ceilings: [],
    hazards: [],
    waterZones: [],
    movingPlatforms: [],
    checkpoints: [],
    exits: [],
    secrets: [],
    bounds: null,
  };

  // Build from segments
  if (manifest.level?.segments) {
    for (const segment of manifest.level.segments) {
      buildSegment(segment, engine, level);
    }
  }

  // Build hazards
  if (manifest.level?.hazards) {
    for (const hazardDef of manifest.level.hazards) {
      const hazard = new HazardSystem({
        x: hazardDef.x,
        y: hazardDef.y,
        width: hazardDef.width,
        height: hazardDef.height,
        damage: hazardDef.damage || 1,
        type: hazardDef.type || 'spikes',
      });
      level.hazards.push(hazard);
      World.add(engine.world, hazard.body);
    }
  }

  // Build water zones
  if (manifest.level?.waterZones) {
    for (const waterDef of manifest.level.waterZones) {
      const water = new WaterZone(
        waterDef.x,
        waterDef.y,
        waterDef.width,
        waterDef.height,
        waterDef.current || { x: 0, y: 0 }
      );
      level.waterZones.push(water);
      World.add(engine.world, water.sensor);
    }
  }

  // Build moving platforms
  if (manifest.level?.movingPlatforms) {
    for (const platformDef of manifest.level.movingPlatforms) {
      const movingPlatform = new MovingPlatform(
        platformDef.startX,
        platformDef.startY,
        platformDef.endX,
        platformDef.endY,
        platformDef.width,
        platformDef.height,
        platformDef.speed || 2,
        platformDef.pauseDuration || 1000
      );
      level.movingPlatforms.push(movingPlatform);
      World.add(engine.world, movingPlatform.body);
    }
  }

  // Build checkpoints
  if (manifest.level?.checkpoints) {
    for (const checkpointDef of manifest.level.checkpoints) {
      const checkpoint = {
        id: checkpointDef.id,
        position: { x: checkpointDef.x, y: checkpointDef.y },
        type: checkpointDef.type || 'hearth',
        activated: false,
        sensor: Bodies.rectangle(
          checkpointDef.x,
          checkpointDef.y,
          checkpointDef.width || 60,
          checkpointDef.height || 80,
          { isSensor: true, label: 'checkpoint' }
        ),
      };
      level.checkpoints.push(checkpoint);
      World.add(engine.world, checkpoint.sensor);
    }
  }

  // Build exits
  if (manifest.level?.exits) {
    for (const exitDef of manifest.level.exits) {
      const exit = {
        id: exitDef.id,
        position: { x: exitDef.x, y: exitDef.y },
        destination: exitDef.destination,
        requiresQuest: exitDef.requiresQuest,
        locked: exitDef.locked || false,
        sensor: Bodies.rectangle(exitDef.x, exitDef.y, exitDef.width || 60, exitDef.height || 100, {
          isSensor: true,
          label: 'exit',
        }),
      };
      level.exits.push(exit);
      World.add(engine.world, exit.sensor);
    }
  }

  // Build secrets
  if (manifest.level?.secrets) {
    for (const secretDef of manifest.level.secrets) {
      const secret = {
        id: secretDef.id,
        position: { x: secretDef.x, y: secretDef.y },
        type: secretDef.type,
        reward: secretDef.reward,
        discovered: false,
        sensor: Bodies.rectangle(
          secretDef.x,
          secretDef.y,
          secretDef.width || 40,
          secretDef.height || 40,
          { isSensor: true, label: 'secret' }
        ),
      };
      level.secrets.push(secret);
      World.add(engine.world, secret.sensor);
    }
  }

  // Set level bounds
  if (manifest.level?.bounds) {
    level.bounds = {
      minX: manifest.level.bounds.minX,
      minY: manifest.level.bounds.minY,
      maxX: manifest.level.bounds.maxX,
      maxY: manifest.level.bounds.maxY,
    };
  } else {
    // Calculate bounds from platforms
    level.bounds = calculateBoundsFromPlatforms(level);
  }

  return level;
}

/**
 * Build a level segment (contains platforms, walls, ceilings)
 * @private
 */
function buildSegment(segment, engine, level) {
  // Build platforms
  if (segment.platforms) {
    for (const platformDef of segment.platforms) {
      const platform = createPlatform(engine, {
        x: platformDef.x,
        y: platformDef.y,
        width: platformDef.width,
        height: platformDef.height,
        friction: platformDef.friction || 0.8,
        asset: platformDef.asset,
        type: platformDef.type || 'solid',
      });

      level.platforms.push({
        body: platform,
        asset: platformDef.asset,
        type: platformDef.type || 'solid',
        friction: platformDef.friction || 0.8,
      });
    }
  }

  // Build walls
  if (segment.walls) {
    for (const wallDef of segment.walls) {
      const wall = Bodies.rectangle(
        wallDef.x,
        wallDef.y,
        wallDef.width,
        wallDef.height,
        {
          isStatic: true,
          label: 'wall',
          friction: 0.1,
        }
      );
      World.add(engine.world, wall);

      level.walls.push({
        body: wall,
        asset: wallDef.asset,
      });
    }
  }

  // Build ceilings
  if (segment.ceilings) {
    for (const ceilingDef of segment.ceilings) {
      const ceiling = Bodies.rectangle(
        ceilingDef.x,
        ceilingDef.y,
        ceilingDef.width,
        ceilingDef.height,
        {
          isStatic: true,
          label: 'ceiling',
          friction: 0.1,
        }
      );
      World.add(engine.world, ceiling);

      level.ceilings.push({
        body: ceiling,
        asset: ceilingDef.asset,
      });
    }
  }
}

/**
 * Calculate level bounds from platform positions
 * @private
 */
function calculateBoundsFromPlatforms(level) {
  if (level.platforms.length === 0) {
    return { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const platform of level.platforms) {
    const bounds = platform.body.bounds;
    minX = Math.min(minX, bounds.min.x);
    minY = Math.min(minY, bounds.min.y);
    maxX = Math.max(maxX, bounds.max.x);
    maxY = Math.max(maxY, bounds.max.y);
  }

  // Add padding
  const padding = 200;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

/**
 * Cleanup level (remove all bodies from world)
 *
 * @param {Object} level - Level to cleanup
 * @param {Object} engine - Matter.js engine
 */
export function cleanupLevel(level, engine) {
  if (!level || !engine) return;

  // Remove all platforms
  for (const platform of level.platforms) {
    World.remove(engine.world, platform.body);
  }

  // Remove all walls
  for (const wall of level.walls) {
    World.remove(engine.world, wall.body);
  }

  // Remove all ceilings
  for (const ceiling of level.ceilings) {
    World.remove(engine.world, ceiling.body);
  }

  // Remove hazards
  for (const hazard of level.hazards) {
    World.remove(engine.world, hazard.body);
  }

  // Remove water zones
  for (const water of level.waterZones) {
    World.remove(engine.world, water.sensor);
  }

  // Remove moving platforms
  for (const platform of level.movingPlatforms) {
    World.remove(engine.world, platform.body);
  }

  // Remove checkpoints
  for (const checkpoint of level.checkpoints) {
    World.remove(engine.world, checkpoint.sensor);
  }

  // Remove exits
  for (const exit of level.exits) {
    World.remove(engine.world, exit.sensor);
  }

  // Remove secrets
  for (const secret of level.secrets) {
    World.remove(engine.world, secret.sensor);
  }

  // Clear arrays
  level.platforms = [];
  level.walls = [];
  level.ceilings = [];
  level.hazards = [];
  level.waterZones = [];
  level.movingPlatforms = [];
  level.checkpoints = [];
  level.exits = [];
  level.secrets = [];
}
