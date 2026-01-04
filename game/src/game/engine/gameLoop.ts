/**
 * Game Loop System
 * Main update and render loop with proper delta time calculation
 */

import type Matter from 'matter-js';
import { Vector3 } from 'yuka';
import { hearingSystem } from '../ai/PerceptionSystem';

// Import Matter.js modules
const { Runner, Body } = await import('matter-js').then(m => m.default);

/**
 * Camera configuration for following player
 */
interface Camera {
  x: number;
  y: number;
}

/**
 * Game controls state
 */
interface Controls {
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
 * Game loop parameters interface
 */
interface GameLoopParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  engine: Matter.Engine;
  runner: Matter.Runner;
  player: Matter.Body;
  playerController: any; // TODO: Type this properly
  playerRef: { position: { x: number; y: number } };
  inputManager: any; // TODO: Type this properly
  _audioManager: any; // TODO: Type this properly
  aiManager: any; // TODO: Type this properly
  bossAI?: any; // TODO: Type this properly
  enemyBodyMap: Map<string, Matter.Body>;
  lanternSystem: any; // TODO: Type this properly
  bellSystem: any; // TODO: Type this properly
  hearthSystem: any; // TODO: Type this properly
  hazardSystem: any; // TODO: Type this properly
  movingPlatforms: Array<{ update: (deltaTime: number) => void }>;
  waterZones: Array<any>; // TODO: Type this properly
  flowPuzzles: Array<any>; // TODO: Type this properly
  timingSequences: Array<{ update: (deltaTime: number) => void }>;
  gameStateObj: any; // TODO: Type this properly
  renderScene: (
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    animFrame: number,
    playerFacing: number,
    bossAI?: any
  ) => void;
}

/**
 * Game loop control interface
 */
interface GameLoopControl {
  start: () => void;
  stop: () => void;
}

/**
 * Create game loop with proper delta time tracking
 */
export function createGameLoop(params: GameLoopParams): GameLoopControl {
  const {
    canvas,
    ctx,
    engine,
    runner,
    player,
    playerController,
    playerRef,
    inputManager,
    _audioManager,
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
  const camera: Camera = { x: 0, y: 0 };

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
    const controls: Controls = {
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

    // Render scene
    renderScene(ctx, camera, animFrame, playerFacing, bossAI);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function start(): void {
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function stop(): void {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  return { start, stop };
}
