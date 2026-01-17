/**
 * Trigger System
 *
 * Handles DDL trigger definitions (enter_region, exit_region, quest_complete, etc.)
 * and dispatches actions through injected handlers.
 */

import type * as Matter from 'matter-js';
import { getMatterModules } from '../physics/matter-wrapper';

/**
 * Type guard to check if a body has a triggerId
 */
function hasTriggerId(body: Matter.Body): body is Matter.Body & { triggerId: string } {
  return (
    'triggerId' in body &&
    typeof (body as Matter.Body & { triggerId?: string }).triggerId === 'string'
  );
}

export interface TriggerAction {
  type: string;
  target?: string;
  targetId?: string;
  value?: unknown;
  delay?: number;
}

export interface TriggerDefinition {
  id: string;
  type: string;
  region?: { x: number; y: number; width: number; height: number };
  condition?: Record<string, unknown>;
  actions?: TriggerAction[];
  once?: boolean;
  requires?: string[];
  targetId?: string;
}

export interface TriggerActionHandlers {
  showToast: (message: string, durationMs?: number) => void;
  playSound: (soundId: string) => void;
  changeMusic: (trackId: string) => void;
  slowMotion: (durationMs: number) => void;
  particleBurst: (position: { x: number; y: number }, style?: string) => void;
  completeQuest: (questId: string) => void;
  completeChapter: () => void;
  unlockAchievement: (achievementId: string) => void;
  npcAction: (npcId: string, state: string) => void;
  setInteractionState: (interactionId: string, state: string) => void;
  cameraPan: (position: { x: number; y: number }, durationMs: number) => void;
  playCinematic: (cinematicId: string) => void;
  resolveTargetPosition?: (targetId: string) => { x: number; y: number } | null;
}

interface TriggerEntry {
  id: string;
  type: string;
  condition?: Record<string, unknown>;
  requires?: string[];
  actions: TriggerAction[];
  once: boolean;
  triggered: boolean;
  enabled: boolean;
  sensor?: Matter.Body & { triggerId?: string };
  wasActive?: boolean;
}

/**
 * TriggerSystem class
 */
export class TriggerSystem {
  private engine: Matter.Engine;
  private player: Matter.Body;
  private handlers: TriggerActionHandlers;
  private triggers: TriggerEntry[] = [];
  private activeTriggers = new Set<string>();

  constructor(engine: Matter.Engine, player: Matter.Body, handlers: TriggerActionHandlers) {
    this.engine = engine;
    this.player = player;
    this.handlers = handlers;

    const { Events } = getMatterModules();
    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if (bodyA === this.player && bodyB.label === 'trigger') {
          if (hasTriggerId(bodyB)) {
            this.activeTriggers.add(bodyB.triggerId);
          }
        } else if (bodyB === this.player && bodyA.label === 'trigger') {
          if (hasTriggerId(bodyA)) {
            this.activeTriggers.add(bodyA.triggerId);
          }
        }
      }
    });

    Events.on(this.engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if (bodyA === this.player && bodyB.label === 'trigger') {
          if (hasTriggerId(bodyB)) {
            this.activeTriggers.delete(bodyB.triggerId);
          }
        } else if (bodyB === this.player && bodyA.label === 'trigger') {
          if (hasTriggerId(bodyA)) {
            this.activeTriggers.delete(bodyA.triggerId);
          }
        }
      }
    });
  }

  /**
   * Register triggers from chapter manifest
   */
  registerTriggers(manifest: { triggers?: TriggerDefinition[] }): void {
    if (!manifest?.triggers) return;

    const { Bodies, World } = getMatterModules();

    for (const triggerDef of manifest.triggers) {
      const trigger: TriggerEntry = {
        id: triggerDef.id,
        type: triggerDef.type,
        condition: triggerDef.condition,
        requires: triggerDef.requires ?? [],
        actions: triggerDef.actions || [],
        once: triggerDef.once !== false,
        triggered: false,
        enabled: true,
      };

      if (trigger.type === 'enter_region' || trigger.type === 'exit_region') {
        if (triggerDef.region) {
          trigger.sensor = Bodies.rectangle(
            triggerDef.region.x,
            triggerDef.region.y,
            triggerDef.region.width,
            triggerDef.region.height,
            {
              isSensor: true,
              label: 'trigger',
              triggerId: trigger.id,
              isStatic: true,
            }
          ) as Matter.Body & { triggerId?: string };
          trigger.sensor.triggerId = trigger.id;
          World.add(this.engine.world, trigger.sensor);
        }
      }

      this.triggers.push(trigger);
    }
  }

  /**
   * Update triggers (called each frame)
   */
  update(gameState: { gameTime?: number; completedQuests?: string[]; inventory?: string[] }): void {
    for (const trigger of this.triggers) {
      if (!trigger.enabled || (trigger.once && trigger.triggered)) {
        continue;
      }

      if (trigger.requires && trigger.requires.length > 0) {
        const unmet = trigger.requires.some(
          (requiredId) => !this.triggers.find((t) => t.id === requiredId && t.triggered)
        );
        if (unmet) {
          continue;
        }
      }

      if (this.checkTriggerCondition(trigger, gameState)) {
        this.executeTrigger(trigger);
      }
    }
  }

  private checkTriggerCondition(
    trigger: TriggerEntry,
    gameState: { gameTime?: number; completedQuests?: string[]; inventory?: string[] }
  ): boolean {
    switch (trigger.type) {
      case 'enter_region':
        trigger.wasActive = this.activeTriggers.has(trigger.id);
        return this.activeTriggers.has(trigger.id);
      case 'exit_region': {
        const wasActive = !!trigger.wasActive;
        const isActive = this.activeTriggers.has(trigger.id);
        trigger.wasActive = isActive;
        return wasActive && !isActive;
      }
      case 'timer':
        return this.checkTimerCondition(trigger, gameState);
      case 'quest_complete':
        return this.checkQuestCompleteCondition(trigger, gameState);
      case 'collect_item':
        return this.checkCollectItemCondition(trigger, gameState);
      default:
        return false;
    }
  }

  private checkTimerCondition(trigger: TriggerEntry, gameState: { gameTime?: number }): boolean {
    const duration =
      typeof trigger.condition?.duration === 'number' ? trigger.condition.duration : 0;
    if (!trigger.wasActive) {
      trigger.wasActive = true;
      (trigger as any).timerStart = gameState.gameTime || performance.now();
    }
    const elapsed = (gameState.gameTime || performance.now()) - ((trigger as any).timerStart || 0);
    return elapsed >= duration;
  }

  private checkQuestCompleteCondition(
    trigger: TriggerEntry,
    gameState: { completedQuests?: string[] }
  ): boolean {
    const questId = typeof trigger.condition?.questId === 'string' ? trigger.condition.questId : '';
    if (!questId) return false;
    return gameState.completedQuests?.includes(questId) ?? false;
  }

  private checkCollectItemCondition(
    trigger: TriggerEntry,
    gameState: { inventory?: string[] }
  ): boolean {
    const itemId = typeof trigger.condition?.itemId === 'string' ? trigger.condition.itemId : '';
    if (!itemId) return false;
    return gameState.inventory?.includes(itemId) ?? false;
  }

  private executeTrigger(trigger: TriggerEntry): void {
    trigger.triggered = true;
    for (const action of trigger.actions) {
      if (typeof action.delay === 'number' && action.delay > 0) {
        window.setTimeout(() => {
          this.executeAction({ ...action, delay: 0 });
        }, action.delay);
      } else {
        this.executeAction(action);
      }
    }
  }

  private executeAction(action: TriggerAction): void {
    const type = action.type;
    const target = action.target ?? action.targetId;

    if (type === 'show_toast' && typeof action.value === 'string') {
      this.handlers.showToast(action.value);
      return;
    }

    if (type === 'play_sound' && typeof target === 'string') {
      this.handlers.playSound(target);
      return;
    }

    if (type === 'change_music' && typeof target === 'string') {
      this.handlers.changeMusic(target);
      return;
    }

    if (type === 'slow_motion' && typeof action.value === 'number') {
      this.handlers.slowMotion(action.value);
      return;
    }

    if (type === 'particle_burst' && typeof action.value === 'string') {
      this.handlers.particleBurst(this.player.position, action.value);
      return;
    }

    if (type === 'unlock_achievement' && typeof target === 'string') {
      this.handlers.unlockAchievement(target);
      return;
    }

    if (type === 'complete_quest' && typeof target === 'string') {
      this.handlers.completeQuest(target);
      return;
    }

    if (type === 'complete_chapter') {
      this.handlers.completeChapter();
      return;
    }

    if (type === 'npc_action' && typeof target === 'string' && typeof action.value === 'string') {
      this.handlers.npcAction(target, action.value);
      return;
    }

    if (
      type === 'interaction_state' &&
      typeof target === 'string' &&
      typeof action.value === 'string'
    ) {
      this.handlers.setInteractionState(target, action.value);
      return;
    }

    if (type === 'camera_pan' && typeof target === 'string' && typeof action.value === 'number') {
      const targetPos = this.handlers.resolveTargetPosition?.(target) ?? null;
      this.handlers.cameraPan(targetPos ?? this.player.position, action.value);
      return;
    }

    if (type === 'play_cinematic' && typeof target === 'string') {
      this.handlers.playCinematic(target);
    }
  }

  private resolveTargetPosition(_targetId: string): { x: number; y: number } {
    return { x: this.player.position.x, y: this.player.position.y };
  }
}
