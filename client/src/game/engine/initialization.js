/**
 * Game Initialization System
 * Handles level loading, entity spawning, and system setup from DDL manifests
 */

import Matter from 'matter-js';
import { Vector3 } from 'yuka';
import { ZephyrosAI } from '../ai/BossAI';
import { hearingSystem } from '../ai/PerceptionSystem';
import {
  getChapterCollectibles,
  getChapterEncounters,
  getChapterNPCs,
  getChapterSpawnPoint,
  loadChapterManifest,
} from '../data/chapter-loaders';
import { FlowPuzzle, TimingSequence } from '../environment/EnvironmentalSystems';
import { createPlatform, MovingPlatform, WaterZone } from '../physics/PhysicsManager';

const { World, Bodies } = Matter;

/**
 * Initialize chapter data and manifest
 * @param {number} chapterId - Chapter ID to load
 * @returns {Object} - Chapter manifest and spawn point
 */
export function initializeChapterData(chapterId) {
  try {
    const manifest = loadChapterManifest(chapterId);
    const spawnPoint = getChapterSpawnPoint(chapterId);

    if (!manifest) {
      throw new Error(`Failed to load chapter ${chapterId} manifest`);
    }
    if (!spawnPoint) {
      throw new Error(`No spawn point defined for chapter ${chapterId}`);
    }

    console.log(`Loading Chapter ${chapterId}: ${manifest.name}`);
    console.log(`Quest: ${manifest.narrative?.quest || 'No quest defined'}`);

    return { manifest, spawnPoint };
  } catch (error) {
    console.error('Failed to load chapter data:', error);
    throw error;
  }
}

/**
 * Initialize quest system from manifest
 * @param {Object} manifest - Chapter manifest
 * @param {Function} setActiveQuest - Set active quest state
 * @param {Function} setQuestObjectives - Set quest objectives state
 */
export function initializeQuests(manifest, setActiveQuest, setQuestObjectives) {
  if (manifest.quests && manifest.quests.length > 0) {
    const mainQuest = manifest.quests[0];
    setActiveQuest(mainQuest.name);
    setQuestObjectives(
      mainQuest.objectives.map((obj) => ({
        id: obj.id,
        description: obj.description,
        completed: false,
        optional: obj.optional || false,
      }))
    );
  }
}

/**
 * Initialize audio system with chapter music and sounds
 * @param {Object} audioManager - Audio manager instance
 * @param {Object} manifest - Chapter manifest
 */
export function initializeAudio(audioManager, manifest) {
  try {
    audioManager.loadChapterAudio(manifest);

    // Start background music after short delay
    if (manifest.media?.audio?.music?.[0]) {
      setTimeout(() => {
        try {
          audioManager.playMusic(manifest.media.audio.music[0].id);
        } catch (audioError) {
          console.warn('Failed to play background music:', audioError);
        }
      }, 500);
    }
  } catch (error) {
    console.warn('Audio loading failed (continuing without audio):', error);
  }
}

/**
 * Build level geometry from DDL manifest
 * @param {Object} engine - Matter.js engine
 * @param {Object} manifest - Chapter manifest
 * @param {Array} platforms - Platform collection
 * @param {Array} walls - Wall collection
 * @param {Array} ceilings - Ceiling collection
 * @param {Array} movingPlatforms - Moving platform collection
 * @param {Object} hazardSystem - Hazard system instance
 * @param {Array} waterZones - Water zone collection
 * @param {Object} lanternSystem - Lantern system instance
 * @param {Object} bellSystem - Bell system instance
 * @param {Object} hearthSystem - Hearth system instance
 * @param {Array} flowPuzzles - Flow puzzle collection
 * @param {Array} timingSequences - Timing sequence collection
 */
export function buildLevelGeometry(
  engine,
  manifest,
  platforms,
  walls,
  ceilings,
  movingPlatforms,
  hazardSystem,
  waterZones,
  lanternSystem,
  bellSystem,
  hearthSystem,
  flowPuzzles,
  timingSequences
) {
  if (!manifest.level?.segments) return;

  for (const segment of manifest.level.segments) {
    // Platforms with type-based friction
    if (segment.platforms) {
      for (const platformDef of segment.platforms) {
        const platform = createPlatform({
          x: platformDef.x,
          y: platformDef.y,
          width: platformDef.width,
          height: platformDef.height,
          type: platformDef.type || 'stone',
          properties: platformDef.properties,
        });
        platforms.push({ body: platform, def: platformDef });
        World.add(engine.world, platform);

        // Add moving platform if specified
        if (platformDef.moving && platformDef.waypoints) {
          const movingPlatform = new MovingPlatform({
            x: platformDef.x,
            y: platformDef.y,
            width: platformDef.width,
            height: platformDef.height,
            waypoints: platformDef.waypoints,
            speed: platformDef.speed || 2,
            waitTime: platformDef.waitTime || 1000,
            loop: platformDef.loop !== false,
          });
          movingPlatforms.push(movingPlatform);
          World.add(engine.world, movingPlatform.body);
        }
      }
    }

    // Walls
    if (segment.walls) {
      for (const wallDef of segment.walls) {
        const wall = createPlatform({
          x: wallDef.x,
          y: wallDef.y,
          width: wallDef.width,
          height: wallDef.height,
          type: wallDef.type || 'stone',
        });
        walls.push({ body: wall, def: wallDef });
        World.add(engine.world, wall);
      }
    }

    // Ceilings
    if (segment.ceilings) {
      for (const ceilingDef of segment.ceilings) {
        const ceiling = createPlatform({
          x: ceilingDef.x,
          y: ceilingDef.y,
          width: ceilingDef.width,
          height: ceilingDef.height,
          type: ceilingDef.type || 'stone',
        });
        ceilings.push({ body: ceiling, def: ceilingDef });
        World.add(engine.world, ceiling);
      }
    }

    // Environmental hazards
    if (segment.hazards) {
      for (const hazardDef of segment.hazards) {
        hazardSystem.addHazard(
          hazardDef.type,
          {
            x: hazardDef.x,
            y: hazardDef.y,
            width: hazardDef.width,
            height: hazardDef.height,
          },
          hazardDef.damage || 1,
          hazardDef.cooldown || 1000,
          hazardDef.warmthDrain || 0
        );
      }
    }

    // Water zones
    if (segment.water) {
      for (const waterDef of segment.water) {
        waterZones.push(
          new WaterZone(
            {
              x: waterDef.x,
              y: waterDef.y,
              width: waterDef.width,
              height: waterDef.height,
            },
            waterDef.buoyancy || 0.01,
            waterDef.drag || 0.15,
            waterDef.warmthDrain || 0.5
          )
        );
      }
    }

    // Environmental objects
    if (segment.lanterns) {
      for (const lanternDef of segment.lanterns) {
        lanternSystem.addLantern(lanternDef.x, lanternDef.y, lanternDef.radius || 150);
      }
    }

    if (segment.bells) {
      for (const bellDef of segment.bells) {
        bellSystem.addBell(bellDef.x, bellDef.y, bellDef.summons || 'help');
      }
    }

    if (segment.hearths) {
      for (const hearthDef of segment.hearths) {
        hearthSystem.addHearth(hearthDef.x, hearthDef.y);
      }
    }

    // Puzzles
    if (segment.flowPuzzles) {
      for (const puzzleDef of segment.flowPuzzles) {
        const puzzle = new FlowPuzzle();
        for (const region of puzzleDef.regions) {
          puzzle.addFlowRegion(
            region.x,
            region.y,
            region.width,
            region.height,
            region.direction,
            region.strength
          );
        }
        for (const valve of puzzleDef.valves || []) {
          puzzle.addValve(valve.x, valve.y, valve.controlsRegionIndex);
        }
        flowPuzzles.push(puzzle);
      }
    }

    if (segment.timingSequences) {
      for (const seqDef of segment.timingSequences) {
        const sequence = new TimingSequence();
        for (const gate of seqDef.gates) {
          sequence.addGate(
            gate.x,
            gate.y,
            gate.width,
            gate.height,
            gate.openDuration,
            gate.closedDuration,
            gate.offset || 0
          );
        }
        timingSequences.push(sequence);
        sequence.start();
      }
    }
  }
}

/**
 * Build NPCs from DDL with YUKA AI
 * @param {number} chapterId - Chapter ID
 * @param {Object} engine - Matter.js engine
 * @param {Object} aiManager - AI manager instance
 * @returns {Map} - NPC bodies map
 */
export function buildNPCs(chapterId, engine, aiManager) {
  const npcBodies = new Map();

  try {
    const npcData = getChapterNPCs(chapterId);
    for (const npcDef of npcData) {
      try {
        const npc = aiManager.addNPC(npcDef.id, npcDef);

        // Create physics body for NPC
        const npcBody = Bodies.rectangle(npcDef.position?.x || 0, npcDef.position?.y || 0, 35, 55, {
          isStatic: true,
          label: 'npc',
          isSensor: true,
        });
        npcBodies.set(npcDef.id, { npc, body: npcBody });
        World.add(engine.world, npcBody);
      } catch (npcError) {
        console.error(`Failed to create NPC ${npcDef.id}:`, npcError);
      }
    }
  } catch (error) {
    console.warn('Failed to load NPCs (continuing without them):', error);
  }

  return npcBodies;
}

/**
 * Build enemies and boss from DDL with YUKA AI
 * @param {number} chapterId - Chapter ID
 * @param {Object} engine - Matter.js engine
 * @param {Object} aiManager - AI manager instance
 * @param {Object} audioManager - Audio manager instance
 * @param {Object} playerRef - Player reference for AI targeting
 * @param {Object} gameStateObj - Game state object
 * @param {Object} playerController - Player controller
 * @param {Matter.Body} player - Player physics body
 * @returns {Object} - { enemyBodyMap, bossAI }
 */
export function buildEnemies(
  chapterId,
  engine,
  aiManager,
  audioManager,
  playerRef,
  gameStateObj,
  playerController,
  player
) {
  const enemyBodyMap = new Map();
  let bossAI = null;

  try {
    const encounterData = getChapterEncounters(chapterId);

    for (const encounter of encounterData) {
      try {
        // Check for boss encounter
        if (encounter.type === 'boss' && encounter.boss) {
          const bossDef = encounter.boss;
          bossAI = new ZephyrosAI(
            {
              x: bossDef.spawnPoint?.x || 500,
              y: bossDef.spawnPoint?.y || 300,
              health: bossDef.health || 500,
              damage: bossDef.damage || 35,
              speed: bossDef.speed || 1.2,
            },
            gameStateObj,
            audioManager
          );

          bossAI.target = playerRef;
          hearingSystem.addListener(bossAI);
          console.log('Boss spawned: Zephyros');
        }

        // Regular enemies
        if (encounter.enemies) {
          for (const enemyDef of encounter.enemies) {
            const enemyBody = Bodies.rectangle(
              enemyDef.spawnPoint.x,
              enemyDef.spawnPoint.y,
              40,
              50,
              {
                label: 'enemy',
                friction: 0.1,
                frictionAir: 0.02,
                restitution: 0,
              }
            );
            World.add(engine.world, enemyBody);

            const enemyAI = aiManager.addEnemy(enemyDef.id, {
              id: enemyDef.id,
              type: enemyDef.type,
              health: enemyDef.health || 3,
              damage: enemyDef.damage || 1,
              speed: enemyDef.speed || 1.0,
              aggroRadius: enemyDef.behavior?.aggroRadius || 200,
              attackRange: enemyDef.behavior?.attackRange || 50,
              patrolZone: {
                x: enemyDef.spawnPoint.x - 100,
                width: 200,
              },
              onAlert: () => audioManager.playSFX('enemy_alert'),
              onAttack: () => {
                audioManager.playSFX('blade_swing', { rate: 0.9 });
                if (Math.abs(player.position.x - enemyBody.position.x) < 50) {
                  const result = playerController.takeDamage(enemyDef.damage || 1, {
                    x: player.velocity.x + (player.position.x > enemyBody.position.x ? 5 : -5),
                    y: -3,
                  });

                  if (result.parried) {
                    playerController.onSuccessfulParry(enemyBody);
                  }
                }
              },
              onDeath: () => {
                audioManager.playSFX('enemy_hit');
                World.remove(engine.world, enemyBody);
                enemyBodyMap.delete(enemyDef.id);
              },
            });

            enemyAI.playerTarget = playerRef;
            enemyBodyMap.set(enemyDef.id, enemyBody);
            hearingSystem.addListener(enemyAI);
            enemyAI.position.copy(new Vector3(enemyDef.spawnPoint.x, enemyDef.spawnPoint.y, 0));
          }
        }
      } catch (encounterError) {
        console.error('Failed to process encounter:', encounterError);
      }
    }
  } catch (error) {
    console.warn('Failed to load enemies (continuing without them):', error);
  }

  return { enemyBodyMap, bossAI };
}

/**
 * Build interactions and collectibles from DDL
 * @param {number} chapterId - Chapter ID
 * @param {Object} engine - Matter.js engine
 * @param {Object} manifest - Chapter manifest
 * @returns {Object} - { interactions, collectibles }
 */
export function buildInteractionsAndCollectibles(chapterId, engine, manifest) {
  const interactions = [];
  const collectibles = [];

  // Build interactions
  if (manifest.interactions) {
    for (const interactionDef of manifest.interactions) {
      const interactionBody = Bodies.rectangle(
        interactionDef.position.x,
        interactionDef.position.y,
        60,
        60,
        {
          isStatic: true,
          label: `interaction_${interactionDef.type}`,
          isSensor: true,
        }
      );
      interactions.push({
        body: interactionBody,
        def: interactionDef,
        state: interactionDef.initialState,
      });
      World.add(engine.world, interactionBody);
    }
  }

  // Build collectibles
  const collectibleData = getChapterCollectibles(chapterId);
  for (const collectibleDef of collectibleData) {
    const collectibleBody = Bodies.rectangle(
      collectibleDef.position.x,
      collectibleDef.position.y,
      20,
      20,
      {
        isStatic: true,
        label: 'collectible',
        isSensor: true,
      }
    );
    collectibles.push({
      body: collectibleBody,
      def: collectibleDef,
      collected: false,
    });
    World.add(engine.world, collectibleBody);
  }

  return { interactions, collectibles };
}
