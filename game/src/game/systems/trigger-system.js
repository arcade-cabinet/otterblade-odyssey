/**
 * Trigger System
 *
 * Handles event triggers from DDL manifests (enter_region, interact, defeat_enemies, etc.)
 *
 * @module systems/trigger-system
 */

import Matter from 'matter-js';

const { Bodies, World } = Matter;

/**
 * Trigger System class
 */
export class TriggerSystem {
  constructor(engine) {
    this.engine = engine;
    this.triggers = [];
    this.activeTriggers = new Set();
  }

  /**
   * Register triggers from chapter manifest
   *
   * @param {Object} manifest - Chapter manifest
   */
  registerTriggers(manifest) {
    if (!manifest || !manifest.triggers) return;

    for (const triggerDef of manifest.triggers) {
      const trigger = this.createTrigger(triggerDef);
      this.triggers.push(trigger);
    }
  }

  /**
   * Create a trigger from definition
   * @private
   */
  createTrigger(triggerDef) {
    const trigger = {
      id: triggerDef.id,
      type: triggerDef.type,
      condition: triggerDef.condition,
      actions: triggerDef.actions || [],
      once: triggerDef.once !== false, // Default true
      triggered: false,
      enabled: true,
    };

    // Create sensor for spatial triggers
    if (trigger.type === 'enter_region' || trigger.type === 'exit_region') {
      trigger.sensor = Bodies.rectangle(
        triggerDef.region.x,
        triggerDef.region.y,
        triggerDef.region.width,
        triggerDef.region.height,
        {
          isSensor: true,
          label: 'trigger',
          triggerId: trigger.id,
        }
      );
      World.add(this.engine.world, trigger.sensor);
    }

    return trigger;
  }

  /**
   * Update triggers (called each frame)
   *
   * @param {number} deltaTime - Time since last frame
   * @param {Object} gameState - Current game state
   */
  update(_deltaTime, gameState) {
    for (const trigger of this.triggers) {
      if (!trigger.enabled || (trigger.once && trigger.triggered)) {
        continue;
      }

      if (this.checkTriggerCondition(trigger, gameState)) {
        this.executeTrigger(trigger, gameState);
      }
    }
  }

  /**
   * Check if trigger condition is met
   * @private
   */
  checkTriggerCondition(trigger, gameState) {
    switch (trigger.type) {
      case 'enter_region':
        return this.activeTriggers.has(trigger.id);

      case 'exit_region':
        return !this.activeTriggers.has(trigger.id) && trigger.wasActive;

      case 'interact':
        // Handled by interaction system
        return false;

      case 'defeat_enemies':
        return this.checkDefeatEnemiesCondition(trigger, gameState);

      case 'collect_item':
        return this.checkCollectItemCondition(trigger, gameState);

      case 'quest_complete':
        return this.checkQuestCompleteCondition(trigger, gameState);

      case 'health_threshold':
        return this.checkHealthThresholdCondition(trigger, gameState);

      case 'timer':
        return this.checkTimerCondition(trigger, gameState);

      case 'npc_dialogue':
        // Handled by NPC system
        return false;

      default:
        console.warn(`Unknown trigger type: ${trigger.type}`);
        return false;
    }
  }

  /**
   * Check defeat enemies condition
   * @private
   */
  checkDefeatEnemiesCondition(trigger, gameState) {
    const condition = trigger.condition;

    if (condition.enemyGroup) {
      const group = gameState.enemyGroups?.[condition.enemyGroup];
      return group?.defeated === true;
    }

    if (condition.enemyIds) {
      return condition.enemyIds.every((id) => gameState.defeatedEnemies?.includes(id));
    }

    if (condition.enemyType && condition.count) {
      const defeatedOfType = gameState.defeatedEnemiesByType?.[condition.enemyType] || 0;
      return defeatedOfType >= condition.count;
    }

    return false;
  }

  /**
   * Check collect item condition
   * @private
   */
  checkCollectItemCondition(trigger, gameState) {
    const condition = trigger.condition;

    if (condition.itemId) {
      return gameState.inventory?.includes(condition.itemId);
    }

    if (condition.itemType && condition.count) {
      const count =
        gameState.inventory?.filter((item) => item.type === condition.itemType).length || 0;
      return count >= condition.count;
    }

    return false;
  }

  /**
   * Check quest complete condition
   * @private
   */
  checkQuestCompleteCondition(trigger, gameState) {
    const questId = trigger.condition.questId;
    return gameState.completedQuests?.includes(questId);
  }

  /**
   * Check health threshold condition
   * @private
   */
  checkHealthThresholdCondition(trigger, gameState) {
    const threshold = trigger.condition.threshold;
    const comparison = trigger.condition.comparison || 'less_than';
    const healthPercent = (gameState.health / gameState.maxHealth) * 100;

    switch (comparison) {
      case 'less_than':
        return healthPercent < threshold;
      case 'greater_than':
        return healthPercent > threshold;
      case 'equal_to':
        return Math.abs(healthPercent - threshold) < 1;
      default:
        return false;
    }
  }

  /**
   * Check timer condition
   * @private
   */
  checkTimerCondition(trigger, gameState) {
    if (!trigger.timerStarted) {
      trigger.timerStarted = true;
      trigger.timerStart = gameState.gameTime || 0;
    }

    const elapsed = (gameState.gameTime || 0) - trigger.timerStart;
    return elapsed >= trigger.condition.duration;
  }

  /**
   * Execute trigger actions
   * @private
   */
  executeTrigger(trigger, gameState) {
    trigger.triggered = true;

    for (const action of trigger.actions) {
      this.executeAction(action, gameState);
    }
  }

  /**
   * Execute a single action
   * @private
   */
  executeAction(action, gameState) {
    switch (action.type) {
      case 'start_quest':
        gameState.questSystem?.startQuest(action.questId);
        break;

      case 'complete_quest':
        gameState.questSystem?.completeQuest(action.questId);
        break;

      case 'spawn_enemies':
        gameState.spawnEnemies?.(action.enemyGroup);
        break;

      case 'unlock_door':
        gameState.unlockDoor?.(action.doorId);
        break;

      case 'play_cutscene':
        gameState.playCutscene?.(action.cutsceneId);
        break;

      case 'change_music':
        gameState.audioManager?.playMusic(action.musicId, action.fadeTime);
        break;

      case 'play_sfx':
        gameState.audioManager?.playSFX(action.soundId);
        break;

      case 'show_message':
        gameState.showMessage?.(action.message, action.duration);
        break;

      case 'teleport_player':
        gameState.teleportPlayer?.(action.x, action.y);
        break;

      case 'give_item':
        gameState.giveItem?.(action.itemId, action.amount || 1);
        break;

      case 'set_checkpoint':
        gameState.setCheckpoint?.(action.checkpointId);
        break;

      case 'enable_trigger':
        this.enableTrigger(action.triggerId);
        break;

      case 'disable_trigger':
        this.disableTrigger(action.triggerId);
        break;

      case 'camera_shake':
        gameState.camera?.shake(action.intensity, action.duration);
        break;

      case 'environmental_effect':
        gameState.environmentalSystem?.triggerEffect(action.effectId);
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Handle collision with trigger sensor
   *
   * @param {Object} body - Physics body that collided
   * @param {Object} sensor - Trigger sensor
   */
  handleCollision(body, sensor) {
    if (body.label !== 'player') return;

    const triggerId = sensor.triggerId;
    const trigger = this.triggers.find((t) => t.id === triggerId);

    if (!trigger) return;

    if (trigger.type === 'enter_region') {
      this.activeTriggers.add(triggerId);
      trigger.wasActive = true;
    }
  }

  /**
   * Handle collision end with trigger sensor
   *
   * @param {Object} body - Physics body
   * @param {Object} sensor - Trigger sensor
   */
  handleCollisionEnd(body, sensor) {
    if (body.label !== 'player') return;

    const triggerId = sensor.triggerId;
    const trigger = this.triggers.find((t) => t.id === triggerId);

    if (!trigger) return;

    if (trigger.type === 'enter_region') {
      this.activeTriggers.delete(triggerId);
    }
  }

  /**
   * Manually trigger by ID
   *
   * @param {string} triggerId - Trigger ID
   * @param {Object} gameState - Current game state
   */
  manualTrigger(triggerId, gameState) {
    const trigger = this.triggers.find((t) => t.id === triggerId);
    if (!trigger) {
      console.warn(`Trigger not found: ${triggerId}`);
      return;
    }

    if (!trigger.enabled) {
      console.warn(`Trigger disabled: ${triggerId}`);
      return;
    }

    if (trigger.once && trigger.triggered) {
      console.warn(`Trigger already triggered: ${triggerId}`);
      return;
    }

    this.executeTrigger(trigger, gameState);
  }

  /**
   * Enable a trigger
   *
   * @param {string} triggerId - Trigger ID
   */
  enableTrigger(triggerId) {
    const trigger = this.triggers.find((t) => t.id === triggerId);
    if (trigger) {
      trigger.enabled = true;
    }
  }

  /**
   * Disable a trigger
   *
   * @param {string} triggerId - Trigger ID
   */
  disableTrigger(triggerId) {
    const trigger = this.triggers.find((t) => t.id === triggerId);
    if (trigger) {
      trigger.enabled = false;
    }
  }

  /**
   * Reset a trigger (allow it to trigger again)
   *
   * @param {string} triggerId - Trigger ID
   */
  resetTrigger(triggerId) {
    const trigger = this.triggers.find((t) => t.id === triggerId);
    if (trigger) {
      trigger.triggered = false;
      trigger.timerStarted = false;
      trigger.wasActive = false;
    }
  }

  /**
   * Clear all triggers
   */
  clear() {
    // Remove sensors from world
    for (const trigger of this.triggers) {
      if (trigger.sensor) {
        World.remove(this.engine.world, trigger.sensor);
      }
    }

    this.triggers = [];
    this.activeTriggers.clear();
  }
}
