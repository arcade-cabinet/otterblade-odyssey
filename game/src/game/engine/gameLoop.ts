/**
 * Game Loop System
 * Main update and render loop with proper delta time calculation
 * 
 * Migrated to TypeScript for type safety while preserving vanilla patterns.
 */

import Matter from 'matter-js';
const { Runner, Body } = Matter;

import { Vector3 } from 'yuka';
// @ts-ignore - JS file, no types yet
import { hearingSystem } from '../ai/PerceptionSystem';
import type { Camera } from '../types/canvas';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Player controls from input system
 */
export interface PlayerControls {
  left: boolean;
  right: boolean;
  up: boolean;
  jump: boolean;
  attack: boolean;
  parry: boolean;
  roll: boolean;
  slink: boolean;
  interact: boolean;
}

/**
 * Input manager interface
 */
export interface InputManager {
  update(): void;
  isPressed(action: string): boolean;
}

/**
 * Player controller interface
 */
export interface PlayerController {
  update(controls: PlayerControls, deltaTime: number): void;
  takeDamage(damage: number, knockback?: { x: number; y: number }): void;
}

/**
 * AI manager interface
 */
export interface AIManager {
  enemies: Map<string, any>;
  update(deltaTime: number): void;
}

/**
 * Boss AI interface
 */
export interface BossAI {
  isDead: boolean;
  projectiles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    warmthDrain?: number;
  }>;
  hazardZones: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    damage: number;
    warmthDrain: number;
  }>;
  update(deltaTime: number): void;
  selectAndExecuteAttack(): void;
}

/**
 * Environmental system interface
 */
export interface EnvironmentalSystem {
  update(deltaTime: number): void;
  lanterns?: any[];
  bells?: any[];
  hearths?: any[];
}

/**
 * Lantern system interface
 */
export interface LanternSystem extends EnvironmentalSystem {
  lanterns: any[];
  lightLantern(lantern: any, context: { position: Matter.Vector; gameState: any }): boolean;
}

/**
 * Bell system interface
 */
export interface BellSystem extends EnvironmentalSystem {
  bells: any[];
  ringBell(bell: any, context: { position: Matter.Vector; gameState: any }): boolean;
}

/**
 * Hearth system interface
 */
export interface HearthSystem extends EnvironmentalSystem {
  hearths: any[];
  kindleHearth(hearth: any, context: { position: Matter.Vector; gameState: any }): boolean;
}

/**
 * Hazard system interface
 */
export interface HazardSystem {
  checkCollisions(player: Matter.Body, gameState: any): void;
}

/**
 * Moving platform interface
 */
export interface MovingPlatform {
  update(deltaTime: number): void;
}

/**
 * Water zone interface
 */
export interface WaterZone {
  applyToBody(body: Matter.Body, deltaTime: number, gameState: any): void;
}

/**
 * Flow puzzle interface
 */
export interface FlowPuzzle {
  applyFlowToBody(body: Matter.Body): { x: number; y: number } | null;
}

/**
 * Timing sequence interface
 */
export interface TimingSequence {
  update(deltaTime: number): void;
}

/**
 * Game state interface
 */
export interface GameState {
  takeDamage(amount: number): void;
  drainWarmth(amount: number): void;
}

/**
 * Player reference for AI
 */
export interface PlayerRef {
  position: { x: number; y: number };
}

/**
 * Render scene function type
 */
export type RenderSceneFunction = (
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  animFrame: number,
  playerFacing: number,
  bossAI: BossAI | null
) => void;

/**
 * Game loop parameters
 */
export interface GameLoopParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  engine: Matter.Engine;
  runner: Matter.Runner;
  player: Matter.Body;
  playerController: PlayerController;
  playerRef: PlayerRef;
  inputManager: InputManager;
  _audioManager?: any; // Optional, not used in loop
  aiManager: AIManager;
  bossAI: BossAI | null;
  enemyBodyMap: Map<string, Matter.Body>;
  lanternSystem: LanternSystem;
  bellSystem: BellSystem;
  hearthSystem: HearthSystem;
  hazardSystem: HazardSystem;
  movingPlatforms: MovingPlatform[];
  waterZones: WaterZone[];
  flowPuzzles: FlowPuzzle[];
  timingSequences: TimingSequence[];
  gameStateObj: GameState;
  renderScene: RenderSceneFunction;
}

/**
 * Game loop control interface
 */
export interface GameLoop {
  start(): void;
  stop(): void;
}

// ============================================================================
// GAME LOOP IMPLEMENTATION
// ============================================================================

/**
 * Create game loop with proper delta time tracking
 * 
 * @param params - Game loop parameters
 * @returns Game loop control object with start() and stop() methods
 */
export function createGameLoop(params: GameLoopParams): GameLoop {
  const {
    canvas,
    ctx,
    engine,
    runner,
    player,
    playerController,
    playerRef,
    inputManager,
    aiManager,
    bossAI,
    enemyBodyMap,
    lanternSystem,
    bellSystem,
    hearthSystem,
    hazardSystem,
    movingPlatforms,
    waterZones,
    flowPuzzles,
    timingSequences,
    gameStateObj,
    renderScene,
  } = params;

  let animFrame = 0;
  let playerFacing = 1;
  let lastTime = performance.now();
  let animationFrameId: number | null = null;
  const camera: Camera = { x: 0, y: 0, zoom: 1, viewportWidth: canvas.width, viewportHeight: canvas.height };

  function gameLoop(currentTime: number): void {
    if (!canvas || !ctx) return;

    // Proper delta time calculation (not fixed 16.67ms)
    const delta = Math.min(currentTime - lastTime, 100); // Cap at 100ms to prevent spiral of death
    lastTime = currentTime;
    const deltaSec = delta / 1000;

    animFrame++;

    // Update input system
    inputManager.update();

    // Get unified controls
    const controls: PlayerControls = {
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

    // Update physics with actual delta time
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
        Body.setVelocity(enemyBody, {
          x: enemy.velocity.x,
          y: enemyBody.velocity.y,
        });
        enemy.position.x = enemyBody.position.x;
        enemy.position.y = enemyBody.position.y;
      }
    }

    // Update player reference for AI
    playerRef.position.x = player.position.x;
    playerRef.position.y = player.position.y;
    // @ts-ignore - Custom property added to Matter body
    playerFacing = player.facingDirection || 1;

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

    // Render scene
    renderScene(ctx, camera, animFrame, playerFacing, bossAI);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function start(): void {
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function stop(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  return { start, stop };
}
