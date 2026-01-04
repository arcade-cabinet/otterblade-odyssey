/**
 * Collision System
 *
 * Handles all collision detection and response logic.
 *
 * @module systems/collision-system
 */

import { getMatterModules } from '../physics/matter-wrapper';


/**
 * Collision System class
 */
export class CollisionSystem {
  constructor(engine) {
    this.engine = engine;
    this.collisionHandlers = new Map();
    this.setupCollisionListeners();
  }

  /**
   * Setup Matter.js collision listeners
   * @private
   */
  setupCollisionListeners() {
    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        this.handleCollisionStart(pair.bodyA, pair.bodyB);
      }
    });

    Events.on(this.engine, 'collisionActive', (event) => {
      for (const pair of event.pairs) {
        this.handleCollisionActive(pair.bodyA, pair.bodyB);
      }
    });

    Events.on(this.engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        this.handleCollisionEnd(pair.bodyA, pair.bodyB);
      }
    });
  }

  /**
   * Handle collision start
   * @private
   */
  handleCollisionStart(bodyA, bodyB) {
    const key = this.getCollisionKey(bodyA.label, bodyB.label);
    const handler = this.collisionHandlers.get(key);

    if (handler?.onStart) {
      handler.onStart(bodyA, bodyB);
    }

    // Also try reverse order
    const reverseKey = this.getCollisionKey(bodyB.label, bodyA.label);
    const reverseHandler = this.collisionHandlers.get(reverseKey);

    if (reverseHandler?.onStart) {
      reverseHandler.onStart(bodyB, bodyA);
    }
  }

  /**
   * Handle collision active (continuous)
   * @private
   */
  handleCollisionActive(bodyA, bodyB) {
    const key = this.getCollisionKey(bodyA.label, bodyB.label);
    const handler = this.collisionHandlers.get(key);

    if (handler?.onActive) {
      handler.onActive(bodyA, bodyB);
    }

    // Also try reverse order
    const reverseKey = this.getCollisionKey(bodyB.label, bodyA.label);
    const reverseHandler = this.collisionHandlers.get(reverseKey);

    if (reverseHandler?.onActive) {
      reverseHandler.onActive(bodyB, bodyA);
    }
  }

  /**
   * Handle collision end
   * @private
   */
  handleCollisionEnd(bodyA, bodyB) {
    const key = this.getCollisionKey(bodyA.label, bodyB.label);
    const handler = this.collisionHandlers.get(key);

    if (handler?.onEnd) {
      handler.onEnd(bodyA, bodyB);
    }

    // Also try reverse order
    const reverseKey = this.getCollisionKey(bodyB.label, bodyA.label);
    const reverseHandler = this.collisionHandlers.get(reverseKey);

    if (reverseHandler?.onEnd) {
      reverseHandler.onEnd(bodyB, bodyA);
    }
  }

  /**
   * Get collision key from labels
   * @private
   */
  getCollisionKey(labelA, labelB) {
    return `${labelA}:${labelB}`;
  }

  /**
   * Register collision handler
   *
   * @param {string} labelA - First body label
   * @param {string} labelB - Second body label
   * @param {Object} handlers - Handler functions {onStart, onActive, onEnd}
   */
  registerHandler(labelA, labelB, handlers) {
    const key = this.getCollisionKey(labelA, labelB);
    this.collisionHandlers.set(key, handlers);
  }

  /**
   * Unregister collision handler
   *
   * @param {string} labelA - First body label
   * @param {string} labelB - Second body label
   */
  unregisterHandler(labelA, labelB) {
    const key = this.getCollisionKey(labelA, labelB);
    this.collisionHandlers.delete(key);
  }

  /**
   * Register common game collision handlers
   *
   * @param {Object} gameState - Current game state
   */
  registerGameHandlers(gameState) {
    // Player vs Platform (for jump reset)
    this.registerHandler('player', 'platform', {
      onStart: (player, platform) => {
        if (player.position.y < platform.position.y) {
          gameState.player.grounded = true;
          gameState.player.canJump = true;
        }
      },
      onEnd: (_player, _platform) => {
        gameState.player.grounded = false;
      },
    });

    // Player vs Enemy
    this.registerHandler('player', 'enemy', {
      onStart: (_player, enemy) => {
        // Find enemy object
        const enemyObj = gameState.enemies.find((e) => e.body === enemy);
        if (!enemyObj) return;

        // Check if player is attacking
        if (gameState.player.attacking) {
          gameState.damageEnemy?.(enemyObj, gameState.player.damage);
          gameState.camera?.shake(5, 100);
        } else {
          // Player takes damage
          gameState.damagePlayer?.(enemyObj.damage);
          gameState.camera?.shake(8, 200);
        }
      },
    });

    // Player vs Collectible
    this.registerHandler('player', 'collectible', {
      onStart: (_player, collectible) => {
        if (collectible.collected) return;

        collectible.collected = true;
        gameState.collectItem?.(collectible.itemType, collectible.amount);
        gameState.audioManager?.playSFX('collect');
      },
    });

    // Player vs Hazard
    this.registerHandler('player', 'hazard', {
      onActive: (_player, hazard) => {
        // Damage over time
        if (!hazard.lastDamageTime || Date.now() - hazard.lastDamageTime > 500) {
          gameState.damagePlayer?.(hazard.damage || 1);
          hazard.lastDamageTime = Date.now();
          gameState.camera?.shake(5, 150);
        }
      },
    });

    // Player vs Water
    this.registerHandler('player', 'water', {
      onStart: (_player, water) => {
        gameState.player.inWater = true;
        gameState.player.waterCurrent = water.current || { x: 0, y: 0 };
      },
      onEnd: (_player, _water) => {
        gameState.player.inWater = false;
        gameState.player.waterCurrent = null;
      },
    });

    // Player vs Checkpoint
    this.registerHandler('player', 'checkpoint', {
      onStart: (_player, checkpointSensor) => {
        const checkpoint = gameState.checkpoints.find((c) => c.sensor === checkpointSensor);
        if (checkpoint && !checkpoint.activated) {
          checkpoint.activated = true;
          gameState.setCheckpoint?.(checkpoint.id);
          gameState.audioManager?.playSFX('checkpoint');
        }
      },
    });

    // Player vs Exit
    this.registerHandler('player', 'exit', {
      onStart: (_player, exitSensor) => {
        const exit = gameState.exits.find((e) => e.sensor === exitSensor);
        if (!exit) return;

        if (exit.locked) {
          gameState.showMessage?.('Exit is locked');
          return;
        }

        if (exit.requiresQuest && !gameState.questSystem?.isQuestCompleted(exit.requiresQuest)) {
          gameState.showMessage?.('Quest not completed');
          return;
        }

        // Trigger level transition
        gameState.completeLevel?.(exit.destination);
      },
    });

    // Player vs Interaction
    this.registerHandler('player', 'interaction', {
      onStart: (_player, interactionSensor) => {
        const interaction = gameState.interactions.find((i) => i.sensor === interactionSensor);
        if (interaction) {
          gameState.player.nearbyInteraction = interaction;
        }
      },
      onEnd: (_player, interactionSensor) => {
        const interaction = gameState.interactions.find((i) => i.sensor === interactionSensor);
        if (interaction && gameState.player.nearbyInteraction === interaction) {
          gameState.player.nearbyInteraction = null;
        }
      },
    });

    // Player vs Trigger
    this.registerHandler('player', 'trigger', {
      onStart: (player, triggerSensor) => {
        gameState.triggerSystem?.handleCollision(player, triggerSensor);
      },
      onEnd: (player, triggerSensor) => {
        gameState.triggerSystem?.handleCollisionEnd(player, triggerSensor);
      },
    });

    // Player vs Secret
    this.registerHandler('player', 'secret', {
      onStart: (_player, secretSensor) => {
        const secret = gameState.secrets.find((s) => s.sensor === secretSensor);
        if (secret && !secret.discovered) {
          secret.discovered = true;
          gameState.discoverSecret?.(secret);
          gameState.audioManager?.playSFX('secret_found');
        }
      },
    });

    // Player Attack vs Enemy
    this.registerHandler('player_attack', 'enemy', {
      onStart: (attack, enemy) => {
        const enemyObj = gameState.enemies.find((e) => e.body === enemy);
        if (!enemyObj) return;

        gameState.damageEnemy?.(enemyObj, attack.damage || 10);
        gameState.camera?.shake(5, 100);
        gameState.audioManager?.playSFX('hit');
      },
    });

    // Enemy Attack vs Player
    this.registerHandler('enemy_attack', 'player', {
      onStart: (attack, _player) => {
        gameState.damagePlayer?.(attack.damage || 5);
        gameState.camera?.shake(8, 200);
      },
    });
  }

  /**
   * Check if two bodies are currently colliding
   *
   * @param {Object} bodyA - First body
   * @param {Object} bodyB - Second body
   * @returns {boolean}
   */
  areColliding(bodyA, bodyB) {
    if (!bodyA || !bodyB) return false;

    return Matter.Collision.collides(bodyA, bodyB) !== null;
  }

  /**
   * Get all bodies colliding with a given body
   *
   * @param {Object} body - Body to check
   * @returns {Array} Array of colliding bodies
   */
  getCollidingBodies(body) {
    if (!body) return [];

    const colliding = [];
    const allBodies = Matter.Composite.allBodies(this.engine.world);

    for (const other of allBodies) {
      if (other === body) continue;

      const collision = Matter.Collision.collides(body, other);
      if (collision) {
        colliding.push(other);
      }
    }

    return colliding;
  }

  /**
   * Check if body is grounded (on a platform)
   *
   * @param {Object} body - Body to check
   * @returns {boolean}
   */
  isGrounded(body) {
    if (!body) return false;

    const allBodies = Matter.Composite.allBodies(this.engine.world);
    const groundY = body.bounds.max.y;

    for (const other of allBodies) {
      if (other === body) continue;
      if (!other.isStatic && other.label !== 'platform') continue;

      // Check if body is on top of this platform
      if (
        Math.abs(groundY - other.bounds.min.y) < 5 &&
        body.bounds.max.x > other.bounds.min.x &&
        body.bounds.min.x < other.bounds.max.x
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Cleanup collision system
   */
  cleanup() {
    Events.off(this.engine, 'collisionStart');
    Events.off(this.engine, 'collisionActive');
    Events.off(this.engine, 'collisionEnd');
    this.collisionHandlers.clear();
  }
}
