/**
 * NPC Factory
 * 
 * Creates NPCs from DDL manifests with story states, gestures, and interactions.
 * 
 * @module factories/npc-factory
 */

import { getChapterNPCs } from '../data/chapter-loaders';
import { Vector3 } from 'yuka';

/**
 * Build NPCs for a chapter
 * 
 * @param {number} chapterId - Chapter ID
 * @param {Object} gameState - Current game state (for story progression)
 * @returns {Array} Array of NPC objects
 */
export function buildNPCs(chapterId, gameState = {}) {
  if (typeof chapterId !== 'number' || chapterId < 0 || chapterId > 9) {
    throw new Error(`Invalid chapter ID: ${chapterId}`);
  }

  const npcDefs = getChapterNPCs(chapterId);
  const npcs = [];

  for (const npcDef of npcDefs) {
    const npc = createNPC(npcDef, gameState);
    npcs.push(npc);
  }

  return npcs;
}

/**
 * Create a single NPC from definition
 * 
 * @param {Object} npcDef - NPC definition from DDL
 * @param {Object} gameState - Current game state
 * @returns {Object} NPC object
 */
export function createNPC(npcDef, gameState = {}) {
  if (!npcDef || !npcDef.id) {
    throw new Error('Invalid NPC definition');
  }

  // Determine current story state
  const currentState = determineStoryState(npcDef, gameState);
  const stateData = npcDef.storyState?.states[currentState];

  const npc = {
    id: npcDef.id,
    name: npcDef.name,
    species: npcDef.species,
    color: npcDef.color,
    position: {
      x: npcDef.position?.x || 0,
      y: npcDef.position?.y || 0
    },
    
    // Story state
    currentState: currentState,
    storyStates: npcDef.storyState?.states || {},
    
    // Current gesture and expression (from story state)
    currentGesture: stateData?.gesture || 'idle',
    currentExpression: stateData?.expression || 'calm',
    
    // Interactions
    interactions: npcDef.interactions || [],
    hasQuest: false,
    isTalking: false,
    
    // Dialogue (wordless - gestures only)
    dialogueSequence: stateData?.dialogueSequence || [],
    currentDialogueIndex: 0,
    
    // Behavior
    behavior: npcDef.behavior || {
      type: 'stationary',
      wanderRadius: 0,
      facePlayer: true
    },
    facing: 1,
    
    // YUKA AI (for movement)
    yukaEntity: null,
    aiState: 'idle'
  };

  // Check if NPC has available quest
  if (stateData?.availableQuest) {
    npc.hasQuest = !isQuestComplete(stateData.availableQuest, gameState);
  }

  // Initialize YUKA entity for movement
  if (npc.behavior.type !== 'stationary') {
    npc.yukaEntity = new Vector3(npc.position.x, npc.position.y, 0);
  }

  return npc;
}

/**
 * Update NPC (called each frame)
 * 
 * @param {Object} npc - NPC object
 * @param {number} deltaTime - Time since last frame in ms
 * @param {Object} player - Player object
 * @param {Object} gameState - Current game state
 */
export function updateNPC(npc, deltaTime, player, gameState) {
  if (!npc) return;

  // Update facing direction to look at player if configured
  if (npc.behavior.facePlayer && player) {
    const dx = player.position.x - npc.position.x;
    npc.facing = dx > 0 ? 1 : -1;
  }

  // Update behavior
  switch (npc.behavior.type) {
    case 'wander':
      updateWanderBehavior(npc, deltaTime);
      break;
    case 'patrol':
      updatePatrolBehavior(npc, deltaTime);
      break;
    case 'stationary':
      // No movement
      break;
  }

  // Update dialogue animation
  if (npc.isTalking && npc.dialogueSequence.length > 0) {
    updateDialogueAnimation(npc, deltaTime);
  }

  // Check for story state transitions
  checkStateTransitions(npc, gameState);
}

/**
 * Determine current story state based on game progress
 * @private
 */
function determineStoryState(npcDef, gameState) {
  if (!npcDef.storyState) {
    return 'default';
  }

  const states = npcDef.storyState.states;
  const initialState = npcDef.storyState.initialState || 'default';

  // Check each state's conditions
  for (const [stateName, stateData] of Object.entries(states)) {
    if (checkStateConditions(stateData.conditions, gameState)) {
      return stateName;
    }
  }

  return initialState;
}

/**
 * Check if state conditions are met
 * @private
 */
function checkStateConditions(conditions, gameState) {
  if (!conditions) return false;

  // Check quest completion
  if (conditions.questCompleted) {
    if (!isQuestComplete(conditions.questCompleted, gameState)) {
      return false;
    }
  }

  // Check quest active
  if (conditions.questActive) {
    if (!isQuestActive(conditions.questActive, gameState)) {
      return false;
    }
  }

  // Check item possession
  if (conditions.hasItem) {
    if (!hasItem(conditions.hasItem, gameState)) {
      return false;
    }
  }

  // Check chapter progress
  if (conditions.chapterReached !== undefined) {
    if (gameState.currentChapter < conditions.chapterReached) {
      return false;
    }
  }

  return true;
}

/**
 * Check if quest is complete
 * @private
 */
function isQuestComplete(questId, gameState) {
  return gameState.completedQuests?.includes(questId) || false;
}

/**
 * Check if quest is active
 * @private
 */
function isQuestActive(questId, gameState) {
  return gameState.activeQuests?.includes(questId) || false;
}

/**
 * Check if player has item
 * @private
 */
function hasItem(itemId, gameState) {
  return gameState.inventory?.includes(itemId) || false;
}

/**
 * Update wander behavior
 * @private
 */
function updateWanderBehavior(npc, deltaTime) {
  // Simple wander AI - move randomly within radius
  if (!npc.wanderTarget || Math.random() < 0.01) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * npc.behavior.wanderRadius;
    npc.wanderTarget = {
      x: npc.position.x + Math.cos(angle) * radius,
      y: npc.position.y + Math.sin(angle) * radius
    };
  }

  // Move toward wander target
  const dx = npc.wanderTarget.x - npc.position.x;
  const dy = npc.wanderTarget.y - npc.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    const speed = 0.5;
    npc.position.x += (dx / dist) * speed * (deltaTime / 16);
    npc.position.y += (dy / dist) * speed * (deltaTime / 16);
    npc.facing = dx > 0 ? 1 : -1;
  }
}

/**
 * Update patrol behavior
 * @private
 */
function updatePatrolBehavior(npc, deltaTime) {
  if (!npc.behavior.patrolPoints || npc.behavior.patrolPoints.length === 0) {
    return;
  }

  if (!npc.currentPatrolIndex) {
    npc.currentPatrolIndex = 0;
  }

  const target = npc.behavior.patrolPoints[npc.currentPatrolIndex];
  const dx = target.x - npc.position.x;
  const dy = target.y - npc.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 10) {
    // Reached patrol point, move to next
    npc.currentPatrolIndex = (npc.currentPatrolIndex + 1) % npc.behavior.patrolPoints.length;
  } else {
    // Move toward patrol point
    const speed = npc.behavior.patrolSpeed || 1;
    npc.position.x += (dx / dist) * speed * (deltaTime / 16);
    npc.position.y += (dy / dist) * speed * (deltaTime / 16);
    npc.facing = dx > 0 ? 1 : -1;
  }
}

/**
 * Update dialogue animation (gesture sequence)
 * @private
 */
function updateDialogueAnimation(npc, deltaTime) {
  if (!npc.dialogueTimer) {
    npc.dialogueTimer = 0;
  }

  npc.dialogueTimer += deltaTime;

  // Each gesture lasts 2 seconds
  if (npc.dialogueTimer > 2000) {
    npc.dialogueTimer = 0;
    npc.currentDialogueIndex++;

    if (npc.currentDialogueIndex >= npc.dialogueSequence.length) {
      // Dialogue complete
      npc.isTalking = false;
      npc.currentDialogueIndex = 0;
      npc.currentGesture = 'idle';
    } else {
      // Next gesture in sequence
      const gesture = npc.dialogueSequence[npc.currentDialogueIndex];
      npc.currentGesture = gesture.gesture || 'idle';
      npc.currentExpression = gesture.expression || npc.currentExpression;
    }
  }
}

/**
 * Check for story state transitions
 * @private
 */
function checkStateTransitions(npc, gameState) {
  const currentStateData = npc.storyStates[npc.currentState];
  
  if (!currentStateData?.transitions) return;

  for (const transition of currentStateData.transitions) {
    if (checkStateConditions(transition.conditions, gameState)) {
      transitionToState(npc, transition.targetState);
      break;
    }
  }
}

/**
 * Transition NPC to new story state
 * @private
 */
function transitionToState(npc, newState) {
  if (!npc.storyStates[newState]) {
    console.warn(`Invalid story state: ${newState} for NPC ${npc.id}`);
    return;
  }

  npc.currentState = newState;
  const stateData = npc.storyStates[newState];

  npc.currentGesture = stateData.gesture || 'idle';
  npc.currentExpression = stateData.expression || 'calm';
  npc.dialogueSequence = stateData.dialogueSequence || [];
  npc.currentDialogueIndex = 0;

  // Update quest availability
  if (stateData.availableQuest) {
    npc.hasQuest = true;
  } else {
    npc.hasQuest = false;
  }
}

/**
 * Interact with NPC
 * 
 * @param {Object} npc - NPC object
 * @param {Object} player - Player object
 * @param {Object} gameState - Current game state
 * @returns {Object} Interaction result
 */
export function interactWithNPC(npc, player, gameState) {
  if (!npc || !player) return null;

  const stateData = npc.storyStates[npc.currentState];
  
  // Start dialogue sequence (wordless gestures)
  if (stateData?.dialogueSequence && stateData.dialogueSequence.length > 0) {
    npc.isTalking = true;
    npc.currentDialogueIndex = 0;
    npc.dialogueTimer = 0;
    
    const firstGesture = stateData.dialogueSequence[0];
    npc.currentGesture = firstGesture.gesture || 'idle';
    npc.currentExpression = firstGesture.expression || npc.currentExpression;
  }

  // Return available quest or interaction
  if (stateData?.availableQuest) {
    return {
      type: 'quest',
      questId: stateData.availableQuest,
      npcId: npc.id,
      npcName: npc.name
    };
  }

  if (stateData?.interaction) {
    return {
      type: 'interaction',
      interactionId: stateData.interaction,
      npcId: npc.id,
      npcName: npc.name
    };
  }

  return {
    type: 'dialogue',
    npcId: npc.id,
    npcName: npc.name
  };
}
