/**
 * Interaction Factory
 *
 * Creates interactive objects from DDL manifests (hearths, levers, doors, chests, etc.)
 *
 * @module factories/interaction-factory
 */

/**
 * Build interactions for a chapter
 *
 * @param {number} chapterId - Chapter ID
 * @param {Object} manifest - Chapter manifest
 * @param {Object} engine - Matter.js engine
 * @returns {Array} Array of interaction objects
 */
export function buildInteractions(_chapterId, manifest, engine) {
  if (!manifest || !manifest.interactions) {
    return [];
  }

  if (!engine || !engine.world) {
    throw new Error('Invalid Matter.js engine');
  }

  const interactions = [];

  for (const interactionDef of manifest.interactions) {
    const interaction = createInteraction(interactionDef, engine);
    interactions.push(interaction);
  }

  return interactions;
}

/**
 * Create a single interaction from definition
 *
 * @param {Object} interactionDef - Interaction definition from DDL
 * @param {Object} engine - Matter.js engine
 * @returns {Object} Interaction object
 */
export function createInteraction(interactionDef, engine) {
  if (!interactionDef || !interactionDef.type) {
    throw new Error('Invalid interaction definition');
  }

  const interaction = {
    id: interactionDef.id,
    type: interactionDef.type,
    position: {
      x: interactionDef.position?.x || 0,
      y: interactionDef.position?.y || 0,
    },
    state: interactionDef.initialState || 'default',
    interactable: true,
    requiresItem: interactionDef.requiresItem,
    triggerOnInteract: interactionDef.triggerOnInteract,

    // Create sensor for interaction range
    sensor: Bodies.rectangle(
      interactionDef.position?.x || 0,
      interactionDef.position?.y || 0,
      interactionDef.width || 60,
      interactionDef.height || 80,
      {
        isSensor: true,
        label: 'interaction',
        interactionId: interactionDef.id,
      }
    ),
  };

  World.add(engine.world, interaction.sensor);

  // Type-specific initialization
  switch (interaction.type) {
    case 'hearth':
      initializeHearth(interaction, interactionDef);
      break;
    case 'lever':
      initializeLever(interaction, interactionDef);
      break;
    case 'door':
      initializeDoor(interaction, interactionDef);
      break;
    case 'chest':
      initializeChest(interaction, interactionDef);
      break;
    case 'bell':
      initializeBell(interaction, interactionDef);
      break;
    case 'shrine':
      initializeShrine(interaction, interactionDef);
      break;
    case 'ladder':
      initializeLadder(interaction, interactionDef);
      break;
    case 'lantern':
      initializeLantern(interaction, interactionDef);
      break;
    case 'sign':
      initializeSign(interaction, interactionDef);
      break;
    case 'portal':
      initializePortal(interaction, interactionDef);
      break;
  }

  return interaction;
}

/**
 * Initialize hearth interaction
 * @private
 */
function initializeHearth(interaction, def) {
  interaction.heals = def.heals !== false;
  interaction.restoresWarmth = def.restoresWarmth !== false;
  interaction.savesProgress = def.savesProgress !== false;
  interaction.lit = def.initialState === 'lit';
  interaction.fuelRequired = def.fuelRequired || 0;
  interaction.healAmount = def.healAmount || 'full';
}

/**
 * Initialize lever interaction
 * @private
 */
function initializeLever(interaction, def) {
  interaction.pulled = def.initialState === 'pulled';
  interaction.linkedObject = def.linkedObject;
  interaction.resetTime = def.resetTime || 0; // 0 = doesn't reset
  interaction.resettable = def.resettable !== false;
}

/**
 * Initialize door interaction
 * @private
 */
function initializeDoor(interaction, def) {
  interaction.locked = def.initialState === 'locked';
  interaction.keyRequired = def.keyRequired;
  interaction.destination = def.destination;
  interaction.autoClose = def.autoClose !== false;
  interaction.closeDelay = def.closeDelay || 3000;
}

/**
 * Initialize chest interaction
 * @private
 */
function initializeChest(interaction, def) {
  interaction.opened = def.initialState === 'opened';
  interaction.locked = def.locked || false;
  interaction.keyRequired = def.keyRequired;
  interaction.contents = def.contents || [];
  interaction.trapped = def.trapped || false;
  interaction.trapDamage = def.trapDamage || 0;
}

/**
 * Initialize bell interaction
 * @private
 */
function initializeBell(interaction, def) {
  interaction.rung = false;
  interaction.cooldown = 0;
  interaction.cooldownTime = def.cooldownTime || 5000;
  interaction.alertsEnemies = def.alertsEnemies !== false;
  interaction.alertRadius = def.alertRadius || 500;
  interaction.soundId = def.soundId || 'bell_toll';
}

/**
 * Initialize shrine interaction
 * @private
 */
function initializeShrine(interaction, def) {
  interaction.activated = def.initialState === 'activated';
  interaction.blessing = def.blessing;
  interaction.blessingDuration = def.blessingDuration || 60000;
  interaction.offeringRequired = def.offeringRequired;
  interaction.oneTime = def.oneTime !== false;
}

/**
 * Initialize ladder interaction
 * @private
 */
function initializeLadder(interaction, def) {
  interaction.topY = def.topY;
  interaction.bottomY = def.bottomY;
  interaction.climbSpeed = def.climbSpeed || 2;
}

/**
 * Initialize lantern interaction
 * @private
 */
function initializeLantern(interaction, def) {
  interaction.lit = def.initialState === 'lit';
  interaction.lightRadius = def.lightRadius || 150;
  interaction.fuelRemaining = def.fuelRemaining || 100;
  interaction.fuelConsumption = def.fuelConsumption || 0.1; // per second
  interaction.refillable = def.refillable !== false;
}

/**
 * Initialize sign interaction
 * @private
 */
function initializeSign(interaction, def) {
  interaction.message = def.message || '';
  interaction.iconType = def.iconType || 'info';
}

/**
 * Initialize portal interaction
 * @private
 */
function initializePortal(interaction, def) {
  interaction.destination = def.destination;
  interaction.active = def.initialState !== 'inactive';
  interaction.requiresQuest = def.requiresQuest;
  interaction.visual = def.visual || 'swirling';
}

/**
 * Interact with an object
 *
 * @param {Object} interaction - Interaction object
 * @param {Object} player - Player object
 * @param {Object} gameState - Current game state
 * @returns {Object} Interaction result
 */
export function interact(interaction, player, gameState) {
  if (!interaction || !interaction.interactable) {
    return { success: false, message: 'Cannot interact' };
  }

  // Check if player has required item
  if (interaction.requiresItem && !hasItem(player, interaction.requiresItem, gameState)) {
    return {
      success: false,
      message: `Requires ${interaction.requiresItem}`,
    };
  }

  // Handle interaction by type
  switch (interaction.type) {
    case 'hearth':
      return interactHearth(interaction, player, gameState);
    case 'lever':
      return interactLever(interaction, player, gameState);
    case 'door':
      return interactDoor(interaction, player, gameState);
    case 'chest':
      return interactChest(interaction, player, gameState);
    case 'bell':
      return interactBell(interaction, player, gameState);
    case 'shrine':
      return interactShrine(interaction, player, gameState);
    case 'ladder':
      return interactLadder(interaction, player, gameState);
    case 'lantern':
      return interactLantern(interaction, player, gameState);
    case 'sign':
      return interactSign(interaction, player, gameState);
    case 'portal':
      return interactPortal(interaction, player, gameState);
    default:
      return { success: false, message: 'Unknown interaction type' };
  }
}

/**
 * Interact with hearth
 * @private
 */
function interactHearth(interaction, player, gameState) {
  if (!interaction.lit) {
    return { success: false, message: 'Hearth is not lit' };
  }

  const results = {
    success: true,
    effects: [],
  };

  if (interaction.heals && player.health < player.maxHealth) {
    const healAmount =
      interaction.healAmount === 'full' ? player.maxHealth : interaction.healAmount;
    player.health = Math.min(player.maxHealth, player.health + healAmount);
    results.effects.push('healed');
  }

  if (interaction.restoresWarmth && player.warmth < player.maxWarmth) {
    player.warmth = player.maxWarmth;
    results.effects.push('warmth_restored');
  }

  if (interaction.savesProgress) {
    gameState.saveProgress?.();
    results.effects.push('progress_saved');
  }

  return results;
}

/**
 * Interact with lever
 * @private
 */
function interactLever(interaction, _player, gameState) {
  interaction.pulled = !interaction.pulled;
  interaction.state = interaction.pulled ? 'pulled' : 'default';

  // Trigger linked object
  if (interaction.linkedObject) {
    gameState.triggerSystem?.manualTrigger(interaction.linkedObject, gameState);
  }

  // Start reset timer if configured
  if (interaction.resetTime > 0 && interaction.resettable) {
    setTimeout(() => {
      interaction.pulled = false;
      interaction.state = 'default';
    }, interaction.resetTime);
  }

  return {
    success: true,
    state: interaction.pulled ? 'pulled' : 'released',
  };
}

/**
 * Interact with door
 * @private
 */
function interactDoor(interaction, player, gameState) {
  if (interaction.locked) {
    if (interaction.keyRequired && hasItem(player, interaction.keyRequired, gameState)) {
      interaction.locked = false;
      // Consume key
      consumeItem(player, interaction.keyRequired, gameState);
    } else {
      return { success: false, message: 'Locked' };
    }
  }

  interaction.state = 'open';

  // Auto-close after delay
  if (interaction.autoClose) {
    setTimeout(() => {
      interaction.state = 'default';
    }, interaction.closeDelay);
  }

  // Teleport player if destination set
  if (interaction.destination) {
    return {
      success: true,
      teleport: interaction.destination,
    };
  }

  return { success: true };
}

/**
 * Interact with chest
 * @private
 */
function interactChest(interaction, player, gameState) {
  if (interaction.opened) {
    return { success: false, message: 'Already opened' };
  }

  if (interaction.locked) {
    if (interaction.keyRequired && hasItem(player, interaction.keyRequired, gameState)) {
      interaction.locked = false;
      consumeItem(player, interaction.keyRequired, gameState);
    } else {
      return { success: false, message: 'Locked' };
    }
  }

  // Check for trap
  if (interaction.trapped && !interaction.trapTriggered) {
    interaction.trapTriggered = true;
    player.health -= interaction.trapDamage;
    return {
      success: true,
      trapped: true,
      damage: interaction.trapDamage,
      contents: interaction.contents,
    };
  }

  interaction.opened = true;
  interaction.state = 'opened';

  return {
    success: true,
    contents: interaction.contents,
  };
}

/**
 * Interact with bell
 * @private
 */
function interactBell(interaction, _player, gameState) {
  if (interaction.cooldown > 0) {
    return { success: false, message: 'Bell cooling down' };
  }

  interaction.rung = true;
  interaction.cooldown = interaction.cooldownTime;

  // Play sound
  gameState.audioManager?.playSFX(interaction.soundId);

  // Alert enemies
  if (interaction.alertsEnemies) {
    return {
      success: true,
      alertEnemies: true,
      radius: interaction.alertRadius,
    };
  }

  return { success: true };
}

/**
 * Interact with shrine
 * @private
 */
function interactShrine(interaction, player, gameState) {
  if (interaction.oneTime && interaction.activated) {
    return { success: false, message: 'Already activated' };
  }

  if (interaction.offeringRequired && !hasItem(player, interaction.offeringRequired, gameState)) {
    return { success: false, message: 'Offering required' };
  }

  if (interaction.offeringRequired) {
    consumeItem(player, interaction.offeringRequired, gameState);
  }

  interaction.activated = true;
  interaction.state = 'activated';

  return {
    success: true,
    blessing: interaction.blessing,
    duration: interaction.blessingDuration,
  };
}

/**
 * Interact with ladder
 * @private
 */
function interactLadder(interaction, _player, _gameState) {
  return {
    success: true,
    type: 'ladder',
    topY: interaction.topY,
    bottomY: interaction.bottomY,
    climbSpeed: interaction.climbSpeed,
  };
}

/**
 * Interact with lantern
 * @private
 */
function interactLantern(interaction, _player, _gameState) {
  interaction.lit = !interaction.lit;
  interaction.state = interaction.lit ? 'lit' : 'default';

  return {
    success: true,
    lit: interaction.lit,
  };
}

/**
 * Interact with sign
 * @private
 */
function interactSign(interaction, _player, _gameState) {
  return {
    success: true,
    message: interaction.message,
    iconType: interaction.iconType,
  };
}

/**
 * Interact with portal
 * @private
 */
function interactPortal(interaction, _player, _gameState) {
  if (!interaction.active) {
    return { success: false, message: 'Portal inactive' };
  }

  if (
    interaction.requiresQuest &&
    !_gameState.questSystem?.isQuestCompleted(interaction.requiresQuest)
  ) {
    return { success: false, message: 'Quest not completed' };
  }

  return {
    success: true,
    teleport: interaction.destination,
  };
}

/**
 * Check if player has item
 * @private
 */
function hasItem(_player, itemId, gameState) {
  return gameState.inventory?.includes(itemId) || false;
}

/**
 * Consume item from inventory
 * @private
 */
function consumeItem(_player, itemId, gameState) {
  if (!gameState.inventory) return;
  const index = gameState.inventory.indexOf(itemId);
  if (index > -1) {
    gameState.inventory.splice(index, 1);
  }
}

/**
 * Update interaction (called each frame)
 *
 * @param {Object} interaction - Interaction object
 * @param {number} deltaTime - Time since last frame in ms
 */
export function updateInteraction(interaction, deltaTime) {
  // Update cooldowns
  if (interaction.cooldown > 0) {
    interaction.cooldown = Math.max(0, interaction.cooldown - deltaTime);
  }

  // Update fuel for lanterns
  if (interaction.type === 'lantern' && interaction.lit) {
    interaction.fuelRemaining -= interaction.fuelConsumption * (deltaTime / 1000);
    if (interaction.fuelRemaining <= 0) {
      interaction.lit = false;
      interaction.state = 'default';
      interaction.fuelRemaining = 0;
    }
  }
}

/**
 * Cleanup interaction (remove from world)
 *
 * @param {Object} interaction - Interaction object
 * @param {Object} engine - Matter.js engine
 */
export function cleanupInteraction(interaction, engine) {
  if (!interaction || !engine) return;

  if (interaction.sensor) {
    World.remove(engine.world, interaction.sensor);
  }
}
