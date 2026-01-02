/** @jsxImportSource solid-js */
/**
 * Otterblade Odyssey - Main Game Component
 * Full production implementation with proper library integration
 * - YUKA.js for AI (enemies, NPCs, pathfinding)
 * - Howler.js for audio (music, SFX, ambient)
 * - nipplejs for touch controls
 * - Matter.js for physics
 * - DDL factory patterns throughout
 */

import Matter from 'matter-js';
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { Vector3 } from 'yuka';
// AI systems
import { ZephyrosAI } from './ai/BossAI';
import { hearingSystem } from './ai/PerceptionSystem';
import TouchControls from './components/TouchControls';
// DDL loaders
import {
  getChapterCollectibles,
  getChapterEncounters,
  getChapterNPCs,
  getChapterSpawnPoint,
  loadChapterManifest,
} from './data/chapter-loaders';
// Physics and environment systems
import {
  BellSystem,
  FlowPuzzle,
  HearthSystem,
  LanternSystem,
  TimingSequence,
} from './environment/EnvironmentalSystems';
import {
  createFinnBody,
  createPhysicsEngine,
  createPlatform,
  HazardSystem,
  MovingPlatform,
  WaterZone,
} from './physics/PhysicsManager';
import { PlayerController } from './physics/PlayerController';
import { aiManager } from './systems/AIManager';
import { audioManager } from './systems/AudioManager';
import { inputManager } from './systems/InputManager';

const { World, Bodies, Body, Runner, Events } = Matter;

// Procedural rendering functions
function drawFinn(ctx, position, _facing, animFrame) {
  if (!ctx || !position || typeof animFrame !== 'number') {
    console.error('Invalid parameters to drawFinn');
    return;
  }
  if (!ctx || !position || typeof animFrame !== 'number') {
    console.error('Invalid parameters to drawFinn');
    return;
  }
  ctx.save();
  ctx.translate(position.x, position.y);

  const breathe = Math.sin(animFrame * 0.05) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (warm brown otter)
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20 + breathe * 0.5, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -18 + breathe * 0.5, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#4A3C2B';
  ctx.beginPath();
  ctx.arc(12, -18 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(3, -22 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(4, -23 + breathe * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-8, -28 + breathe * 0.5, 5, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(6, -28 + breathe * 0.5, 5, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Whiskers (subtle)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -18 + breathe * 0.5);
  ctx.lineTo(18, -20 + breathe * 0.5);
  ctx.moveTo(5, -16 + breathe * 0.5);
  ctx.lineTo(18, -16 + breathe * 0.5);
  ctx.moveTo(5, -14 + breathe * 0.5);
  ctx.lineTo(18, -12 + breathe * 0.5);
  ctx.stroke();

  // Arms
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-10, 5 + breathe * 0.8, 5, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(10, 5 + breathe * 0.8, 5, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Otterblade (simplified)
  ctx.fillStyle = '#C0C0C0';
  ctx.strokeStyle = '#7F8C8D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(12, -5);
  ctx.lineTo(11, -20);
  ctx.lineTo(9, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail (behind)
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.quadraticCurveTo(-8, 25, -12, 30);
  ctx.quadraticCurveTo(-14, 32, -10, 34);
  ctx.quadraticCurveTo(-4, 28, 2, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
}

function drawEnemy(ctx, enemy, _animFrame) {
  const x = enemy.position.x;
  const y = enemy.position.y;
  const facing = enemy.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (Galeborn soldier - dark blue-gray)
  ctx.fillStyle = '#2C3E50';
  ctx.strokeStyle = '#1C2833';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#34495E';
  ctx.strokeStyle = '#1C2833';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -18, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet
  ctx.fillStyle = '#7F8C8D';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -20, 10, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eyes (glowing menacing)
  ctx.fillStyle = '#E74C3C';
  ctx.shadowColor = '#E74C3C';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(-4, -18, 2, 0, Math.PI * 2);
  ctx.arc(4, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Weapon (spear)
  ctx.fillStyle = '#95A5A6';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(10, -5);
  ctx.lineTo(10, -25);
  ctx.lineTo(8, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spear tip
  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.moveTo(9, -25);
  ctx.lineTo(12, -30);
  ctx.lineTo(9, -27);
  ctx.lineTo(6, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawNPC(ctx, npc, animFrame) {
  const x = npc.position.x;
  const y = npc.position.y;
  const facing = npc.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.04) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (friendly woodland creature)
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 15, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest
  ctx.fillStyle = '#D4C4B0';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -18 + breathe * 0.5, 13, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4C4B0';
  ctx.beginPath();
  ctx.ellipse(7, -17 + breathe * 0.5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#5D4E37';
  ctx.beginPath();
  ctx.arc(10, -17 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (kind and wise)
  ctx.fillStyle = '#4A3C2B';
  ctx.beginPath();
  ctx.arc(3, -20 + breathe * 0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(4, -21 + breathe * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-7, -26 + breathe * 0.5, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(6, -26 + breathe * 0.5, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawBoss(ctx, boss, animFrame) {
  const x = boss.position.x;
  const y = boss.position.y;
  const facing = boss.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const pulse = Math.sin(animFrame * 0.08) * 3;

  // Shadow (larger)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 50, 45, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (Zephyros - frost giant badger)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0 + pulse, 35, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Frost aura
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#88CCFF';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0 + pulse, 40 + pulse * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Chest
  ctx.fillStyle = '#C5D9ED';
  ctx.beginPath();
  ctx.ellipse(5, 5 + pulse, 25, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (massive)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -35 + pulse * 0.5, 28, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#C5D9ED';
  ctx.beginPath();
  ctx.ellipse(15, -32 + pulse * 0.5, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(22, -32 + pulse * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (piercing blue)
  ctx.fillStyle = '#3498DB';
  ctx.shadowColor = '#3498DB';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(6, -38 + pulse * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye pupil
  ctx.fillStyle = '#1C2833';
  ctx.beginPath();
  ctx.arc(7, -38 + pulse * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ears (badger style)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-15, -50 + pulse * 0.5, 8, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(12, -50 + pulse * 0.5, 8, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Claws (massive)
  ctx.fillStyle = '#7F8C8D';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;

  // Left claw
  ctx.beginPath();
  ctx.moveTo(-25, 15 + pulse);
  ctx.lineTo(-28, 25 + pulse);
  ctx.lineTo(-26, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-22, 15 + pulse);
  ctx.lineTo(-25, 25 + pulse);
  ctx.lineTo(-23, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-19, 15 + pulse);
  ctx.lineTo(-22, 25 + pulse);
  ctx.lineTo(-20, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right claw
  ctx.beginPath();
  ctx.moveTo(25, 15 + pulse);
  ctx.lineTo(28, 25 + pulse);
  ctx.lineTo(26, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(22, 15 + pulse);
  ctx.lineTo(25, 25 + pulse);
  ctx.lineTo(23, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(19, 15 + pulse);
  ctx.lineTo(22, 25 + pulse);
  ctx.lineTo(20, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Health bar (boss)
  const barWidth = 80;
  const healthRatio = boss.hp / boss.maxHp;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-barWidth / 2, -65, barWidth, 5);

  ctx.fillStyle = healthRatio > 0.3 ? '#2ECC71' : '#E74C3C';
  ctx.fillRect(-barWidth / 2, -65, barWidth * healthRatio, 5);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-barWidth / 2, -65, barWidth, 5);

  // Phase indicator
  ctx.fillStyle = '#F4D03F';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Phase ${boss.phase}`, 0, -72);

  ctx.restore();
}

export default function OtterbladeGame() {
  let canvasRef;
  const setCanvasRef = (el) => {
    canvasRef = el;
  };

  // Game state
  const [currentChapter] = createSignal(0);
  const [health, setHealth] = createSignal(5);
  const [maxHealth] = createSignal(5);
  const [warmth, setWarmth] = createSignal(100);
  const [maxWarmth] = createSignal(100);
  const [shards, setShards] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [questObjectives, setQuestObjectives] = createSignal([]);
  const [activeQuest, setActiveQuest] = createSignal(null);

  // Game state object for systems
  const gameStateObj = {
    health: () => health(),
    maxHealth: () => maxHealth(),
    warmth: () => warmth(),
    maxWarmth: () => maxWarmth(),
    takeDamage: (amount) => setHealth((h) => Math.max(0, h - amount)),
    restoreHealth: (amount) => setHealth((h) => Math.min(maxHealth(), h + amount)),
    drainWarmth: (amount) => setWarmth((w) => Math.max(0, w - amount)),
    restoreWarmth: (amount) => setWarmth((w) => Math.min(maxWarmth(), w + amount)),
    setCheckpoint: (pos) => console.log('Checkpoint set:', pos),
    summonAlly: (pos) => console.log('Ally summoned:', pos),
    alertGuards: (pos) => console.log('Guards alerted:', pos),
    rallyAllies: () => console.log('Allies rallied'),
    onBossDefeated: () => console.log('Boss defeated!'),
  };

  createEffect(() => {
    if (!gameStarted()) return;

    const canvas = canvasRef;
    if (!canvas) {
      console.error('Canvas ref not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create Matter.js engine with comprehensive physics
    const engine = createPhysicsEngine();
    const runner = Runner.create();

    // Environmental systems
    const lanternSystem = new LanternSystem(audioManager);
    const bellSystem = new BellSystem(audioManager);
    const hearthSystem = new HearthSystem(audioManager);
    const hazardSystem = new HazardSystem();
    const waterZones = [];
    const movingPlatforms = [];
    const flowPuzzles = [];
    const timingSequences = [];

    // Load chapter manifest with error handling
    let manifest, spawnPoint;
    const chapterId = currentChapter();

    try {
      manifest = loadChapterManifest(chapterId);
      spawnPoint = getChapterSpawnPoint(chapterId);

      if (!manifest) {
        throw new Error(`Failed to load chapter ${chapterId} manifest`);
      }
      if (!spawnPoint) {
        throw new Error(`No spawn point defined for chapter ${chapterId}`);
      }

      console.log(`Loading Chapter ${chapterId}: ${manifest.name}`);
      console.log(`Quest: ${manifest.narrative?.quest || 'No quest defined'}`);
    } catch (error) {
      console.error('Failed to load chapter data:', error);
      alert(`Error loading game chapter: ${error.message}`);
      return;
    }

    // Initialize quest system
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

    // Load chapter audio with Howler.js
    try {
      audioManager.loadChapterAudio(manifest);

      // Start background music
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

    // Create player with compound body (head/torso/feet sensors)
    const player = createFinnBody(spawnPoint.x, spawnPoint.y);
    World.add(engine.world, player);

    // Create advanced player controller
    const playerController = new PlayerController(player, engine, gameStateObj, audioManager);

    // Create player reference for AI
    const playerRef = {
      position: new Vector3(player.position.x, player.position.y, 0),
      body: player,
    };

    // Map to track enemy AI to physics body relationships for efficient lookup
    const enemyBodyMap = new Map();

    // Build level geometry from DDL with advanced physics
    const platforms = [];
    const walls = [];
    const ceilings = [];

    if (manifest.level?.segments) {
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

    // Build navigation mesh from platforms for AI pathfinding
    try {
      aiManager.buildNavMesh(platforms);
    } catch (error) {
      console.warn('NavMesh generation failed, AI pathfinding will be limited:', error);
    }

    // Build NPCs from DDL with YUKA AI
    const npcBodies = new Map(); // Track NPC bodies for interaction
    try {
      const npcData = getChapterNPCs(chapterId);
      for (const npcDef of npcData) {
        try {
          const npc = aiManager.addNPC(npcDef.id, npcDef);

          // Create physics body for NPC
          const npcBody = Bodies.rectangle(
            npcDef.position?.x || 0,
            npcDef.position?.y || 0,
            35,
            55,
            {
              isStatic: true,
              label: 'npc',
              isSensor: true,
            }
          );
          npcBodies.set(npcDef.id, { npc, body: npcBody });
          World.add(engine.world, npcBody);
        } catch (npcError) {
          console.error(`Failed to create NPC ${npcDef.id}:`, npcError);
        }
      }
    } catch (error) {
      console.warn('Failed to load NPCs (continuing without them):', error);
    }

    // Build enemies from DDL with YUKA AI and perception
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

            // Set player as target
            bossAI.target = playerRef;

            // Register as hearing listener
            hearingSystem.addListener(bossAI);

            console.log('Boss spawned: Zephyros');
          }

          // Regular enemies
          if (encounter.enemies) {
            for (const enemyDef of encounter.enemies) {
              // Create enemy physics body
              const enemyBody = Bodies.rectangle(enemyDef.spawnPoint.x, enemyDef.spawnPoint.y, 40, 50, {
                label: 'enemy',
                friction: 0.1,
                frictionAir: 0.02,
                restitution: 0,
              });
              World.add(engine.world, enemyBody);

              // Create YUKA AI for enemy
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
                onAlert: () => {
                  audioManager.playSFX('enemy_alert');
                },
                onAttack: () => {
                  audioManager.playSFX('blade_swing', { rate: 0.9 });
                  // Apply damage to player
                  if (Math.abs(player.position.x - enemyBody.position.x) < 50) {
                    const result = playerController.takeDamage(enemyDef.damage || 1, {
                      x: player.velocity.x + (player.position.x > enemyBody.position.x ? 5 : -5),
                      y: -3,
                    });

                    // Check if player parried
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

              // Set player as target for AI
              enemyAI.playerTarget = playerRef;

              // Add to efficient body lookup map
              enemyBodyMap.set(enemyDef.id, enemyBody);

              // Register as hearing listener
              hearingSystem.addListener(enemyAI);

              // Initialize position
              enemyAI.position.copy(new Vector3(enemyDef.spawnPoint.x, enemyDef.spawnPoint.y, 0));
            }
          }
        } catch (encounterError) {
          console.error(`Failed to process encounter:`, encounterError);
        }
      }
    } catch (error) {
      console.warn('Failed to load enemies (continuing without them):', error);
    }

    // Build interactions from DDL
    const interactions = [];
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

    // Build collectibles from DDL
    const collectibles = [];
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

    // Collision handling
    Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        // Player collects shard
        if (
          (bodyA === player && bodyB.label === 'collectible') ||
          (bodyB === player && bodyA.label === 'collectible')
        ) {
          const collectibleBody = bodyA === player ? bodyB : bodyA;
          const collectible = collectibles.find((c) => c.body === collectibleBody);
          if (collectible && !collectible.collected) {
            collectible.collected = true;
            World.remove(engine.world, collectibleBody);
            setShards((s) => s + 1);
            audioManager.playSFX('shard_pickup');
          }
        }

        // Player takes damage from enemy
        if (
          (bodyA === player && bodyB.label === 'enemy') ||
          (bodyB === player && bodyA.label === 'enemy')
        ) {
          if (health() > 0) {
            setHealth((h) => Math.max(0, h - 1));
            audioManager.playSFX('enemy_hit', { volume: 0.7 });
          }
        }

        // Player interacts with NPCs
        if (
          (bodyA === player && bodyB.label === 'npc') ||
          (bodyB === player && bodyA.label === 'npc')
        ) {
          const npcBody = bodyA === player ? bodyB : bodyA;

          // Find NPC by body
          for (const [npcId, npcData] of npcBodies) {
            if (npcData.body === npcBody && inputManager.isPressed('interact')) {
              const npc = npcData.npc;
              const playerPos = new Vector3(player.position.x, player.position.y, 0);

              // Trigger NPC interaction
              const interactionData = npc.interact(playerPos);
              if (interactionData) {
                console.log(`Interacting with NPC: ${npcId}`);
                audioManager.playSFX('menu_select');

                // Handle dialogue or quest progression
                if (interactionData.type === 'dialogue') {
                  console.log(`Dialogue: ${interactionData.dialogue}`);
                }

                // Execute interaction actions
                if (interactionData.actions) {
                  for (const action of interactionData.actions) {
                    if (action.type === 'restore_health') {
                      setHealth(maxHealth());
                      audioManager.playSFX('bell_ring', { volume: 0.5 });
                    }
                    if (action.type === 'give_item') {
                      const objectives = questObjectives();
                      const updated = objectives.map((o) =>
                        o.id === action.target ? { ...o, completed: true } : o
                      );
                      setQuestObjectives(updated);
                    }
                  }
                }
              }
            }
          }
        }

        // Player interacts with objects
        if (
          (bodyA === player && bodyB.label.startsWith('interaction_')) ||
          (bodyB === player && bodyA.label.startsWith('interaction_'))
        ) {
          const interactionBody = bodyA === player ? bodyB : bodyA;
          const interaction = interactions.find((i) => i.body === interactionBody);
          if (interaction && inputManager.isPressed('interact')) {
            audioManager.playSFX('door_open');
            console.log(`Interacting with ${interaction.def.id}`);

            // Execute DDL actions
            if (interaction.def.states?.[interaction.state]) {
              const stateData = interaction.def.states[interaction.state];
              if (stateData.actions) {
                for (const action of stateData.actions) {
                  if (action.type === 'restore_health') {
                    setHealth(maxHealth());
                  }
                  if (action.type === 'give_item') {
                    const objectives = questObjectives();
                    const updated = objectives.map((o) =>
                      o.id === action.target ? { ...o, completed: true } : o
                    );
                    setQuestObjectives(updated);
                  }
                }
              }
            }
          }
        }
      }
    });

    // Camera
    const camera = { x: 0, y: 0 };
    let animFrame = 0;
    let playerFacing = 1;

    // Game loop
    function gameLoop() {
      if (!canvas || !ctx) return;

      animFrame++;
      const delta = 16.67; // ms
      const deltaSec = delta / 1000;

      // Update input system
      inputManager.update();

      // Get unified controls
      const controls = {
        left: inputManager.isPressed('left'),
        right: inputManager.isPressed('right'),
        up: inputManager.isPressed('up'),
        jump: inputManager.isPressed('jump'),
        attack: inputManager.isPressed('attack'),
        parry: inputManager.isPressed('parry'),
        roll: inputManager.isPressed('roll'),
        slink: inputManager.isPressed('slink'),
        interact: inputManager.isPressed('interact'),
      };

      // Update advanced player controller
      playerController.update(controls, deltaSec);

      // Update physics
      Runner.tick(runner, engine, delta);

      // Update environmental systems
      lanternSystem.update(deltaSec);
      bellSystem.update(deltaSec);
      hearthSystem.update(deltaSec);

      // Update moving platforms
      for (const platform of movingPlatforms) {
        platform.update(deltaSec);
      }

      // Update timing sequences
      for (const sequence of timingSequences) {
        sequence.update(deltaSec);
      }

      // Apply water physics
      for (const waterZone of waterZones) {
        waterZone.applyToBody(player, deltaSec, gameStateObj);
      }

      // Check hazards
      hazardSystem.checkCollisions(player, gameStateObj);

      // Apply flow puzzles
      for (const puzzle of flowPuzzles) {
        const flow = puzzle.applyFlowToBody(player);
        if (flow) {
          Body.applyForce(player, player.position, { x: flow.x * 0.001, y: flow.y * 0.001 });
        }
      }

      // Update hearing system
      hearingSystem.update();

      // Emit footstep sounds for hearing
      if (Math.abs(player.velocity.x) > 1 && animFrame % 20 === 0) {
        hearingSystem.emit(
          new Vector3(player.position.x, player.position.y, 0),
          0.3,
          'footstep',
          player
        );
      }

      // Update AI system with YUKA
      aiManager.update(deltaSec);

      // Update boss AI
      if (bossAI && !bossAI.isDead) {
        bossAI.update(deltaSec);

        // Boss attacks player
        bossAI.selectAndExecuteAttack();

        // Check boss projectile collisions
        for (let i = bossAI.projectiles.length - 1; i >= 0; i--) {
          const proj = bossAI.projectiles[i];
          const dist = Math.sqrt(
            (player.position.x - proj.x) ** 2 + (player.position.y - proj.y) ** 2
          );

          if (dist < 30) {
            playerController.takeDamage(proj.damage, {
              x: player.velocity.x + proj.vx * 0.5,
              y: -3,
            });
            gameStateObj.drainWarmth(proj.warmthDrain || 0);
            bossAI.projectiles.splice(i, 1);
          }
        }

        // Check boss hazard zones
        for (const zone of bossAI.hazardZones) {
          if (
            player.position.x >= zone.x &&
            player.position.x <= zone.x + zone.width &&
            player.position.y >= zone.y &&
            player.position.y <= zone.y + zone.height
          ) {
            if (animFrame % 10 === 0) {
              gameStateObj.takeDamage(zone.damage);
              gameStateObj.drainWarmth(zone.warmthDrain);
            }
          }
        }
      }

      // Sync AI positions with physics bodies (using efficient Map lookup)
      for (const [enemyId, enemy] of aiManager.enemies.entries()) {
        const enemyBody = enemyBodyMap.get(enemyId);
        if (enemyBody) {
          // Copy AI velocity to physics
          Body.setVelocity(enemyBody, {
            x: enemy.velocity.x,
            y: enemyBody.velocity.y,
          });
          // Sync positions
          enemy.position.x = enemyBody.position.x;
          enemy.position.y = enemyBody.position.y;
        }
      }

      // Update player reference for AI
      playerRef.position.x = player.position.x;
      playerRef.position.y = player.position.y;
      playerFacing = player.facingDirection;

      // Environmental interactions
      if (controls.interact) {
        // Check lanterns
        for (const lantern of lanternSystem.lanterns) {
          if (
            lanternSystem.lightLantern(lantern, {
              position: player.position,
              gameState: gameStateObj,
            })
          ) {
            console.log('Lit lantern');
          }
        }

        // Check bells
        for (const bell of bellSystem.bells) {
          if (bellSystem.ringBell(bell, { position: player.position, gameState: gameStateObj })) {
            console.log('Rang bell');
          }
        }

        // Check hearths
        for (const hearth of hearthSystem.hearths) {
          if (
            hearthSystem.kindleHearth(hearth, {
              position: player.position,
              gameState: gameStateObj,
            })
          ) {
            console.log('Kindled hearth');
          }
        }
      }

      // Update camera
      camera.x = player.position.x - canvas.width / 2;
      camera.y = player.position.y - canvas.height / 2;

      // === RENDER ===
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const biome = manifest.level?.biome || 'abbey';
      const bgColors = {
        village: '#2C3E50',
        forest: '#1a3a1a',
        abbey: '#1a1a24',
        catacombs: '#0d0d15',
      };
      ctx.fillStyle = bgColors[biome] || '#1a1a24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // Draw platforms
      for (const platform of platforms) {
        const bounds = platform.body.bounds;
        const type = platform.def.type;
        ctx.fillStyle = type === 'wood' ? '#8B4513' : '#696969';
        ctx.strokeStyle = type === 'wood' ? '#654321' : '#505050';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw walls
      for (const wall of walls) {
        const bounds = wall.body.bounds;
        ctx.fillStyle = '#5D4E37';
        ctx.strokeStyle = '#4A3C2B';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw ceilings
      for (const ceiling of ceilings) {
        const bounds = ceiling.body.bounds;
        ctx.fillStyle = '#8B7355';
        ctx.strokeStyle = '#6B5A45';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw interactions
      for (const interaction of interactions) {
        const pos = interaction.body.position;
        const type = interaction.def.type;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        if (type === 'shrine' || type === 'hearth') {
          // Hearth with animated flame
          ctx.fillStyle = '#FF6B35';
          ctx.beginPath();
          ctx.arc(0, 0, 20 + Math.sin(animFrame * 0.1) * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, -5, 10 + Math.sin(animFrame * 0.15) * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'door') {
          // Door
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(-25, -35, 50, 70);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 3;
          ctx.strokeRect(-25, -35, 50, 70);
        }

        ctx.restore();
      }

      // Draw water zones
      for (const waterZone of waterZones) {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.fillRect(
          waterZone.region.x,
          waterZone.region.y,
          waterZone.region.width,
          waterZone.region.height
        );
      }

      // Draw environmental systems
      lanternSystem.render(ctx, camera);
      bellSystem.render(ctx, camera);
      hearthSystem.render(ctx, camera);

      // Draw flow puzzles
      for (const puzzle of flowPuzzles) {
        puzzle.render(ctx, camera);
      }

      // Draw timing sequences
      for (const sequence of timingSequences) {
        sequence.render(ctx, camera);
      }

      // Draw collectibles
      for (const collectible of collectibles) {
        if (!collectible.collected) {
          const pos = collectible.body.position;
          ctx.save();
          ctx.translate(pos.x, pos.y);

          // Rotating golden shard
          ctx.rotate(animFrame * 0.05);
          ctx.fillStyle = '#FFD700';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        }
      }

      // Draw NPCs
      for (const npc of aiManager.npcs.values()) {
        drawNPC(ctx, npc, animFrame);
      }

      // Draw enemies
      for (const enemy of aiManager.enemies.values()) {
        if (enemy.hp > 0) {
          drawEnemy(ctx, enemy, animFrame);
        }
      }

      // Draw boss
      if (bossAI && !bossAI.isDead) {
        drawBoss(ctx, bossAI, animFrame);

        // Draw boss projectiles
        for (const proj of bossAI.projectiles) {
          ctx.save();
          ctx.translate(proj.x, proj.y);

          // Frost wave visual
          ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
          ctx.shadowColor = '#88CCFF';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(0, 0, proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        }

        // Draw boss hazard zones
        for (const zone of bossAI.hazardZones) {
          ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

          // Particle effects
          for (let i = 0; i < 5; i++) {
            const px = zone.x + Math.random() * zone.width;
            const py = zone.y + Math.random() * zone.height;
            ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw player (Finn)
      drawFinn(ctx, player.position, playerFacing, animFrame);

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Start game loop
    let animationFrameId = requestAnimationFrame(gameLoop);

    // Register cleanup
    onCleanup(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      audioManager.stopAll();
      aiManager.destroy();
      inputManager.reset();
      // Cleanup environmental systems (correct variable names)
      lanternSystem?.destroy?.();
      bellSystem?.destroy?.();
      hearthSystem?.destroy?.();
      for (const sequence of timingSequences) {
        sequence?.destroy?.();
      }
      Engine.clear(engine);
      World.clear(engine.world, false);
      enemyBodyMap.clear();
    });
      // Cancel animation frame to prevent memory leaks
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      audioManager.stopAll();
      aiManager.destroy();
      inputManager.reset();
      // Cleanup environmental systems
      lanternManager?.destroy();
      bellManager?.destroy();
      hearthManager?.destroy();
      timingSequenceManager?.destroy();
      Engine.clear(engine);
      World.clear(engine.world, false);
      // Clear enemy body map
      enemyBodyMap.clear();
    });
  });

  return (
    <>
      <Show when={!gameStarted()}>
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(180deg, #1a1a24 0%, #2C3E50 100%)',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            color: '#F4D03F',
          }}
        >
          <h1
            style={{
              'font-size': '48px',
              'font-weight': 'bold',
              'margin-bottom': '20px',
              color: '#E67E22',
            }}
          >
            Otterblade Odyssey
          </h1>
          <h2
            style={{
              'font-size': '24px',
              'margin-bottom': '40px',
              color: '#F4D03F',
            }}
          >
            A Redwall-inspired woodland epic
          </h2>
          <button
            type="button"
            onClick={() => setGameStarted(true)}
            style={{
              padding: '15px 40px',
              'font-size': '20px',
              background: '#E67E22',
              color: 'white',
              border: 'none',
              'border-radius': '8px',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            Begin Journey
          </button>
        </div>
      </Show>

      <Show when={gameStarted()}>
        <canvas ref={setCanvasRef} style={{ display: 'block' }} />

        {/* HUD */}
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.7)',
            'border-radius': '10px',
            color: '#F4D03F',
            'font-family': 'monospace',
            'min-width': '250px',
          }}
        >
          <div style={{ 'font-size': '18px', 'margin-bottom': '10px', color: '#E67E22' }}>
            Chapter {currentChapter()}: {loadChapterManifest(currentChapter()).name}
          </div>
          <div style={{ 'margin-bottom': '10px' }}>
            <span style={{ color: '#F4D03F' }}>Health: </span>
            <For each={Array(maxHealth()).fill(0)}>
              {(_, i) => <span>{i() < health() ? '❤️' : '🖤'}</span>}
            </For>
          </div>
          <div style={{ 'margin-bottom': '10px' }}>
            <span style={{ color: '#F4D03F' }}>Warmth: </span>
            <div
              style={{
                display: 'inline-block',
                width: '100px',
                height: '12px',
                background: '#333',
                border: '1px solid #F4D03F',
                'vertical-align': 'middle',
              }}
            >
              <div
                style={{
                  width: `${(warmth() / maxWarmth()) * 100}%`,
                  height: '100%',
                  background: warmth() > 50 ? '#FF6B35' : '#E67E22',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ 'margin-left': '8px' }}>
              {warmth()}/{maxWarmth()}
            </span>
          </div>
          <div>
            <span style={{ color: '#F4D03F' }}>Shards: </span>
            <span>✨ {shards()}</span>
          </div>

          <Show when={activeQuest()}>
            <div
              style={{
                'margin-top': '15px',
                'padding-top': '10px',
                'border-top': '1px solid #F4D03F',
              }}
            >
              <div style={{ 'font-weight': 'bold', color: '#8FBC8F' }}>{activeQuest()}</div>
              <For each={questObjectives()}>
                {(obj) => (
                  <div style={{ 'font-size': '12px', 'margin-top': '5px' }}>
                    <span>{obj.completed ? '✓' : '○'}</span> {obj.description}
                    {obj.optional && <span style={{ color: '#7F8C8D' }}> (optional)</span>}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Touch Controls */}
        <TouchControls />
      </Show>
    </>
  );
}
