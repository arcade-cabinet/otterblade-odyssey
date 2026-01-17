/**
 * Collision System
 * Handles all game collision events with O(1) lookups using Maps
 */

import type * as Matter from 'matter-js';
import { World } from 'matter-js';
import { Vector3 } from 'yuka';
import type { AudioSystem, InputSystem, PlayerController } from '../types/systems';

/**
 * Quest objective definition
 */
interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  target: string;
  type: string;
  optional?: boolean;
}

const DEFAULT_RESTORE_WARMTH = 5;

/**
 * Collections interface
 */
interface Collections {
  collectibles: Array<{ body: Matter.Body; collected: boolean }>;
  npcBodies: Map<string, any>;
  interactions: Array<{ body: Matter.Body }>;
  _enemyBodyMap: Map<number, any>;
}

/**
 * Managers interface
 */
interface Managers {
  inputManager: InputSystem;
  audioManager: AudioSystem;
}

/**
 * Setters interface
 */
interface Setters {
  setHealth: (fn: (h: number) => number) => void;
  setShards: (fn: (s: number) => number) => void;
  setQuestObjectives: (objectives: QuestObjective[]) => void;
  setWarmth: (fn: (w: number) => number) => void;
  showToast: (message: string, durationMs?: number) => void;
  setSlowMotion: (durationMs: number) => void;
  spawnParticleBurst: (position: { x: number; y: number }, style?: string) => void;
}

/**
 * Getters interface
 */
interface Getters {
  health: () => number;
  maxHealth: () => number;
  maxWarmth: () => number;
  questObjectives: () => QuestObjective[];
}

/**
 * Controllers interface
 */
interface Controllers {
  _playerController: PlayerController;
}

/**
 * Setup collision handlers for game entities
 * Uses efficient Map-based lookups instead of O(n) array searches
 */
export function setupCollisionHandlers(
  engine: Matter.Engine,
  player: Matter.Body,
  collections: Collections,
  managers: Managers,
  setters: Setters,
  getters: Getters,
  controllers: Controllers
): void {
  const { Events } = Matter;
  const { inputManager, audioManager } = managers;
  const { collectibles, npcBodies, interactions, _enemyBodyMap } = collections;
  const {
    setHealth,
    setShards,
    setQuestObjectives,
    setWarmth,
    showToast,
    setSlowMotion,
    spawnParticleBurst,
  } = setters;
  const { health, maxHealth, maxWarmth, questObjectives } = getters;
  const { _playerController } = controllers;

  // Create O(1) lookup maps for efficient collision detection
  const collectibleMap = new Map();
  for (const c of collectibles) {
    collectibleMap.set(c.body.id, c);
  }

  const interactionMap = new Map();
  for (const i of interactions) {
    interactionMap.set(i.body.id, i);
  }

  const completeObjectiveByTarget = (targetId: string) => {
    const objectives = questObjectives();
    if (!objectives?.length) return;
    const updated = objectives.map((objective) =>
      objective.target === targetId ? { ...objective, completed: true } : objective
    );
    setQuestObjectives(updated);
  };

  Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      // Player collects shard - O(1) Map lookup
      if (
        (bodyA === player && bodyB.label === 'collectible') ||
        (bodyB === player && bodyA.label === 'collectible')
      ) {
        const collectibleBody = bodyA === player ? bodyB : bodyA;
        const collectible = collectibleMap.get(collectibleBody.id);
        if (collectible && !collectible.collected) {
          collectible.collected = true;
          World.remove(engine.world, collectibleBody);
          collectibleMap.delete(collectibleBody.id);
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

        // Find NPC by body - using Map for O(1) lookup
        for (const [npcId, npcData] of npcBodies) {
          if (npcData.body === npcBody && inputManager.isPressed('interact')) {
            const npc = npcData.npc;
            const playerPos = new Vector3(player.position.x, player.position.y, 0);

            // Trigger NPC interaction
            const interactionData = npc.interact(playerPos);
            if (interactionData) {
              audioManager.playSFX('menu_select');

              // Handle dialogue or quest progression
              if (interactionData.type === 'dialogue') {
                void interactionData.dialogue;
              }

              // Execute interaction actions
              if (interactionData.actions) {
                for (const action of interactionData.actions) {
                  if (action.type === 'restore_health') {
                    setHealth(maxHealth());
                    audioManager.playSFX('bell_ring', { volume: 0.5 });
                  }
                  if (action.type === 'restore_warmth') {
                    const amount =
                      typeof action.value === 'number' ? action.value : DEFAULT_RESTORE_WARMTH;
                    setWarmth((w) => Math.min(maxWarmth(), w + amount));
                  }
                  if (action.type === 'play_sound') {
                    if (typeof action.target === 'string') {
                      audioManager.playSFX(action.target);
                    }
                  }
                  if (action.type === 'show_toast') {
                    if (typeof action.value === 'string') {
                      showToast(action.value);
                    }
                  }
                  if (action.type === 'particle_burst') {
                    const style = typeof action.value === 'string' ? action.value : undefined;
                    spawnParticleBurst({ x: npcBody.position.x, y: npcBody.position.y }, style);
                  }
                  if (action.type === 'slow_motion') {
                    if (typeof action.value === 'number') {
                      setSlowMotion(action.value);
                    }
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
              completeObjectiveByTarget(npcId);
            }
          }
        }
      }

      // Player interacts with objects - O(1) Map lookup
      if (
        (bodyA === player && bodyB.label.startsWith('interaction_')) ||
        (bodyB === player && bodyA.label.startsWith('interaction_'))
      ) {
        const interactionBody = bodyA === player ? bodyB : bodyA;
        const interaction = interactionMap.get(interactionBody.id);
        if (interaction && inputManager.isPressed('interact')) {
          audioManager.playSFX('door_open');
          void interaction.def.id;

          // Execute DDL actions
          if (interaction.def.states?.[interaction.state]) {
            const stateData = interaction.def.states[interaction.state];
            if (stateData.actions) {
              for (const action of stateData.actions) {
                if (action.type === 'restore_health') {
                  setHealth(maxHealth());
                }
                if (action.type === 'restore_warmth') {
                  const amount =
                    typeof action.value === 'number' ? action.value : DEFAULT_RESTORE_WARMTH;
                  setWarmth((w) => Math.min(maxWarmth(), w + amount));
                }
                if (action.type === 'play_sound') {
                  if (typeof action.target === 'string') {
                    audioManager.playSFX(action.target);
                  }
                }
                if (action.type === 'show_toast') {
                  if (typeof action.value === 'string') {
                    showToast(action.value);
                  }
                }
                if (action.type === 'slow_motion') {
                  if (typeof action.value === 'number') {
                    setSlowMotion(action.value);
                  }
                }
                if (action.type === 'particle_burst') {
                  const style = typeof action.value === 'string' ? action.value : undefined;
                  spawnParticleBurst(
                    { x: interaction.body.position.x, y: interaction.body.position.y },
                    style
                  );
                }
                if (action.type === 'change_music') {
                  if (typeof action.target === 'string') {
                    audioManager.playMusic(action.target);
                  }
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
            const states = Object.keys(interaction.def.states);
            const currentIndex = interaction.state ? states.indexOf(interaction.state) : -1;
            const nextState = states[currentIndex + 1];
            if (nextState) {
              interaction.state = nextState;
            }
            completeObjectiveByTarget(interaction.def.id);
          }
        }
      }
    }
  });

  return {
    collectibleMap,
    interactionMap,
  };
}

/**
 * Update lookup maps when entities are added/removed
 * @param {Map} map - The lookup map to update
 * @param {Array} entities - Entity array
 */
export function updateCollisionMaps(map, entities) {
  map.clear();
  for (const entity of entities) {
    map.set(entity.body.id, entity);
  }
}
