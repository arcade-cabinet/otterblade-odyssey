/**
 * Game Loop System
 * Main update and render loop with proper delta time calculation
 */

import type * as Matter from 'matter-js';
import { getMatterModules } from '../physics/matter-wrapper';
import { Vector3 } from 'yuka';
import { hearingSystem } from '../ai/PerceptionSystem';
import type { GameLoopParams, GameLoopController } from '../types/systems';

/**
 * Create game loop with proper delta time tracking
 */
export function createGameLoop(params: GameLoopParams): GameLoopController {
  const { Runner, Body } = getMatterModules();
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
    triggerSystem,
  } = params;

  let animFrame = 0;
  let playerFacing = 1;
  let lastTime = performance.now();
  let animationFrameId: number | null = null;
  const camera = { x: 0, y: 0 };
  
  // Max delta to prevent spiral of death when frame rate drops
  const MAX_DELTA_MS = 100;

  function gameLoop(currentTime: number): void {
    if (!canvas || !ctx) return;

    // Proper delta time calculation (not fixed 16.67ms)
    const delta = Math.min(currentTime - lastTime, MAX_DELTA_MS); // Cap at 100ms to prevent spiral of death
    lastTime = currentTime;
    if (gameStateObj.updateTimeScale) {
      gameStateObj.updateTimeScale(currentTime);
    }
    const timeScale = gameStateObj.getTimeScale ? gameStateObj.getTimeScale() : 1;
    if (gameStateObj.isPaused?.()) {
      renderScene(ctx, camera, animFrame, playerFacing, bossAI);
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    const scaledDelta = delta * timeScale;
    const deltaSec = scaledDelta / 1000;

    animFrame++;

    // Update input system
    inputManager.update();

    // Get unified controls
    const controls = {
      moveLeft: inputManager.isHeld('moveLeft'),
      moveRight: inputManager.isHeld('moveRight'),
      jump: inputManager.isPressed('jump'),
      attack: inputManager.isPressed('attack'),
      interact: inputManager.isPressed('interact'),
      pause: inputManager.isPressed('pause'),
    };

    // Update advanced player controller
    playerController.update(controls, deltaSec);

    // Update physics with actual delta time
    Runner.tick(runner, engine, scaledDelta);

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
      if (bossAI.updateTarget && gameStateObj.health && gameStateObj.maxHealth) {
        bossAI.updateTarget(
          { x: player.position.x, y: player.position.y },
          gameStateObj.health(),
          gameStateObj.maxHealth()
        );
      }
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
        lanternSystem.lightLantern(lantern, {
          position: player.position,
          gameState: gameStateObj,
        });
      }

      // Check bells
      for (const bell of bellSystem.bells) {
        bellSystem.ringBell(bell, { position: player.position, gameState: gameStateObj });
      }

      // Check hearths
      for (const hearth of hearthSystem.hearths) {
        hearthSystem.kindleHearth(hearth, {
          position: player.position,
          gameState: gameStateObj,
        });
      }
    }

    // Trigger system
    if (triggerSystem) {
      triggerSystem.update({ gameTime: currentTime });
    }

    // Update camera
    if (gameStateObj.getCameraPan) {
      const pan = gameStateObj.getCameraPan(currentTime);
      if (pan) {
        const progress = Math.min(1, (currentTime - pan.startTime) / pan.duration);
        const eased = progress * (2 - progress);
        camera.x = pan.target.x - canvas.width / 2;
        camera.y = pan.target.y - canvas.height / 2;
        camera.x += (player.position.x - canvas.width / 2 - camera.x) * eased;
        camera.y += (player.position.y - canvas.height / 2 - camera.y) * eased;
      } else {
        camera.x = player.position.x - canvas.width / 2;
        camera.y = player.position.y - canvas.height / 2;
      }
    } else {
      camera.x = player.position.x - canvas.width / 2;
      camera.y = player.position.y - canvas.height / 2;
    }

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
