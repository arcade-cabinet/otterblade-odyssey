/**
 * Collision System
 * Handles all game collision events with O(1) lookups using Maps
 */

import { World } from 'matter-js';

/**
 * Setup collision handlers for game entities
 * Uses efficient Map-based lookups instead of O(n) array searches
 * @param {Matter.Engine} engine - Physics engine
 * @param {Matter.Body} player - Player physics body
 * @param {Object} collections - Entity collections
 * @param {Object} managers - Game managers (input, audio)
 * @param {Object} setters - State setter functions
 * @param {Object} getters - State getter functions
 * @param {Object} controllers - Player controller
 */
export function setupCollisionHandlers(
  engine,
  player,
  collections,
  managers,
  setters,
  getters,
  controllers
) {
  const { Events } = Matter;
  const { inputManager, audioManager } = managers;
  const {
    collectibles,
    npcBodies,
    interactions,
    enemyBodyMap,
  } = collections;
  const { setHealth, setShards, setQuestObjectives } = setters;
  const { health, maxHealth, questObjectives } = getters;
  const { playerController } = controllers;

  // Create O(1) lookup maps for efficient collision detection
  const collectibleMap = new Map();
  collectibles.forEach((c) => collectibleMap.set(c.body.id, c));

  const interactionMap = new Map();
  interactions.forEach((i) => interactionMap.set(i.body.id, i));

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
            const { Vector3 } = await import('yuka');
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

      // Player interacts with objects - O(1) Map lookup
      if (
        (bodyA === player && bodyB.label.startsWith('interaction_')) ||
        (bodyB === player && bodyA.label.startsWith('interaction_'))
      ) {
        const interactionBody = bodyA === player ? bodyB : bodyA;
        const interaction = interactionMap.get(interactionBody.id);
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
  entities.forEach((entity) => map.set(entity.body.id, entity));
}
