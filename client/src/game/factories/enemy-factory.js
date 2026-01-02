/**
 * Enemy Factory
 * 
 * Creates enemies from DDL manifests with AI behaviors.
 * 
 * @module factories/enemy-factory
 */

import Matter from 'matter-js';
import { Vector3 } from 'yuka';
import { getChapterEncounters } from '../data/chapter-loaders';

const { Bodies, World } = Matter;

/**
 * Build enemies for a chapter
 * 
 * @param {number} chapterId - Chapter ID
 * @param {Object} engine - Matter.js engine
 * @returns {Array} Array of enemy objects
 */
export function buildEnemies(chapterId, engine) {
  if (typeof chapterId !== 'number' || chapterId < 0 || chapterId > 9) {
    throw new Error(`Invalid chapter ID: ${chapterId}`);
  }

  if (!engine || !engine.world) {
    throw new Error('Invalid Matter.js engine');
  }

  const encounterDefs = getChapterEncounters(chapterId);
  const enemies = [];

  for (const encounterDef of encounterDefs) {
    const enemy = createEnemy(encounterDef, engine);
    enemies.push(enemy);
  }

  return enemies;
}

/**
 * Create a single enemy from definition
 * 
 * @param {Object} enemyDef - Enemy definition from DDL
 * @param {Object} engine - Matter.js engine
 * @returns {Object} Enemy object
 */
export function createEnemy(enemyDef, engine) {
  if (!enemyDef || !enemyDef.enemyType) {
    throw new Error('Invalid enemy definition');
  }

  if (!engine || !engine.world) {
    throw new Error('Invalid Matter.js engine');
  }

  // Get enemy stats from type
  const stats = getEnemyStats(enemyDef.enemyType);

  // Create physics body
  const body = Bodies.rectangle(
    enemyDef.position?.x || 0,
    enemyDef.position?.y || 0,
    stats.width,
    stats.height,
    {
      label: 'enemy',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      inertia: Infinity
    }
  );

  World.add(engine.world, body);

  const enemy = {
    id: enemyDef.id || `enemy_${Math.random()}`,
    type: enemyDef.enemyType,
    body: body,
    position: body.position,
    
    // Stats
    health: enemyDef.health || stats.health,
    maxHealth: enemyDef.health || stats.health,
    damage: enemyDef.damage || stats.damage,
    speed: enemyDef.speed || stats.speed,
    
    // AI behavior
    behavior: enemyDef.behavior || stats.defaultBehavior,
    aiState: 'idle',
    target: null,
    patrolPoints: enemyDef.patrolPoints || [],
    currentPatrolIndex: 0,
    alertRadius: enemyDef.alertRadius || stats.alertRadius,
    attackRange: enemyDef.attackRange || stats.attackRange,
    
    // Animation
    facing: 1,
    animFrame: 0,
    attacking: false,
    alerted: false,
    damaged: false,
    damageTimer: 0,
    
    // YUKA AI
    yukaEntity: new Vector3(body.position.x, body.position.y, 0),
    yukaVelocity: new Vector3(0, 0, 0),
    
    // Loot
    lootTable: enemyDef.loot || stats.defaultLoot,
    
    // Special abilities
    abilities: enemyDef.abilities || []
  };

  return enemy;
}

/**
 * Get enemy stats by type
 * @private
 */
function getEnemyStats(enemyType) {
  const stats = {
    galeborn: {
      width: 28,
      height: 40,
      health: 15,
      damage: 5,
      speed: 1.5,
      alertRadius: 200,
      attackRange: 30,
      defaultBehavior: 'patrol',
      defaultLoot: [
        { item: 'shard', chance: 0.5, amount: 1 }
      ]
    },
    stormcrow: {
      width: 32,
      height: 32,
      health: 10,
      damage: 4,
      speed: 2.0,
      alertRadius: 250,
      attackRange: 40,
      defaultBehavior: 'fly_patrol',
      defaultLoot: [
        { item: 'shard', chance: 0.4, amount: 1 },
        { item: 'feather', chance: 0.3, amount: 1 }
      ]
    },
    thornguard: {
      width: 35,
      height: 50,
      health: 30,
      damage: 8,
      speed: 0.8,
      alertRadius: 150,
      attackRange: 50,
      defaultBehavior: 'guard',
      defaultLoot: [
        { item: 'shard', chance: 0.6, amount: 2 },
        { item: 'iron_scrap', chance: 0.5, amount: 1 }
      ]
    },
    iceshard: {
      width: 30,
      height: 45,
      health: 20,
      damage: 6,
      speed: 1.2,
      alertRadius: 180,
      attackRange: 60,
      defaultBehavior: 'wander',
      defaultLoot: [
        { item: 'shard', chance: 0.5, amount: 1 },
        { item: 'ice_crystal', chance: 0.4, amount: 1 }
      ]
    },
    shadowling: {
      width: 25,
      height: 35,
      health: 8,
      damage: 3,
      speed: 2.5,
      alertRadius: 220,
      attackRange: 25,
      defaultBehavior: 'ambush',
      defaultLoot: [
        { item: 'shard', chance: 0.3, amount: 1 }
      ]
    }
  };

  return stats[enemyType.toLowerCase()] || stats.galeborn;
}

/**
 * Update enemy (called each frame)
 * 
 * @param {Object} enemy - Enemy object
 * @param {number} deltaTime - Time since last frame in ms
 * @param {Object} player - Player object
 * @param {Object} level - Current level
 */
export function updateEnemy(enemy, deltaTime, player, level) {
  if (!enemy || enemy.health <= 0) return;

  // Update animation frame
  enemy.animFrame += 1;

  // Update damage flash
  if (enemy.damaged) {
    enemy.damageTimer += deltaTime;
    if (enemy.damageTimer > 300) {
      enemy.damaged = false;
      enemy.damageTimer = 0;
    }
  }

  // Update AI behavior
  updateEnemyAI(enemy, deltaTime, player, level);

  // Sync position from physics body
  enemy.position = enemy.body.position;
  enemy.yukaEntity.x = enemy.position.x;
  enemy.yukaEntity.y = enemy.position.y;
}

/**
 * Update enemy AI
 * @private
 */
function updateEnemyAI(enemy, deltaTime, player, level) {
  // Check if player is in alert radius
  if (player && !enemy.alerted) {
    const dx = player.position.x - enemy.position.x;
    const dy = player.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < enemy.alertRadius) {
      enemy.alerted = true;
      enemy.target = player;
      enemy.aiState = 'chase';
    }
  }

  // Execute behavior based on AI state
  switch (enemy.aiState) {
    case 'idle':
      executeIdleBehavior(enemy, deltaTime);
      break;
    case 'patrol':
      executePatrolBehavior(enemy, deltaTime);
      break;
    case 'chase':
      executeChaseBehavior(enemy, deltaTime, player);
      break;
    case 'attack':
      executeAttackBehavior(enemy, deltaTime);
      break;
    case 'retreat':
      executeRetreatBehavior(enemy, deltaTime);
      break;
  }
}

/**
 * Execute idle behavior
 * @private
 */
function executeIdleBehavior(enemy, deltaTime) {
  // Reduce velocity
  Matter.Body.setVelocity(enemy.body, {
    x: enemy.body.velocity.x * 0.9,
    y: enemy.body.velocity.y
  });

  // Return to patrol after idle time
  if (!enemy.idleTimer) {
    enemy.idleTimer = 0;
  }

  enemy.idleTimer += deltaTime;
  if (enemy.idleTimer > 2000) {
    enemy.idleTimer = 0;
    if (enemy.behavior === 'patrol' && enemy.patrolPoints.length > 0) {
      enemy.aiState = 'patrol';
    }
  }
}

/**
 * Execute patrol behavior
 * @private
 */
function executePatrolBehavior(enemy, deltaTime) {
  if (!enemy.patrolPoints || enemy.patrolPoints.length === 0) {
    enemy.aiState = 'idle';
    return;
  }

  const target = enemy.patrolPoints[enemy.currentPatrolIndex];
  const dx = target.x - enemy.position.x;
  const dy = target.y - enemy.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 20) {
    // Reached patrol point
    enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
    enemy.aiState = 'idle';
  } else {
    // Move toward patrol point
    const moveForce = enemy.speed * 0.001;
    Matter.Body.applyForce(enemy.body, enemy.position, {
      x: (dx / dist) * moveForce,
      y: 0 // Don't move vertically for ground enemies
    });
    enemy.facing = dx > 0 ? 1 : -1;
  }
}

/**
 * Execute chase behavior
 * @private
 */
function executeChaseBehavior(enemy, deltaTime, player) {
  if (!player || !enemy.target) {
    enemy.aiState = 'patrol';
    enemy.alerted = false;
    return;
  }

  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Check if out of range
  if (dist > enemy.alertRadius * 1.5) {
    enemy.alerted = false;
    enemy.target = null;
    enemy.aiState = 'patrol';
    return;
  }

  // Check if in attack range
  if (dist < enemy.attackRange) {
    enemy.aiState = 'attack';
    return;
  }

  // Chase player
  const moveForce = enemy.speed * 0.0015; // Faster when chasing
  Matter.Body.applyForce(enemy.body, enemy.position, {
    x: (dx / dist) * moveForce,
    y: 0
  });
  enemy.facing = dx > 0 ? 1 : -1;
}

/**
 * Execute attack behavior
 * @private
 */
function executeAttackBehavior(enemy, deltaTime) {
  if (!enemy.attackTimer) {
    enemy.attackTimer = 0;
  }

  enemy.attacking = true;
  enemy.attackTimer += deltaTime;

  // Attack lasts 500ms
  if (enemy.attackTimer > 500) {
    enemy.attacking = false;
    enemy.attackTimer = 0;
    enemy.aiState = 'chase';
  }

  // Reduce velocity during attack
  Matter.Body.setVelocity(enemy.body, {
    x: enemy.body.velocity.x * 0.5,
    y: enemy.body.velocity.y
  });
}

/**
 * Execute retreat behavior
 * @private
 */
function executeRetreatBehavior(enemy, deltaTime) {
  // Move away from player
  if (enemy.target) {
    const dx = enemy.position.x - enemy.target.position.x;
    const dy = enemy.position.y - enemy.target.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > enemy.alertRadius) {
      enemy.aiState = 'patrol';
      enemy.alerted = false;
      return;
    }

    const moveForce = enemy.speed * 0.001;
    Matter.Body.applyForce(enemy.body, enemy.position, {
      x: (dx / dist) * moveForce,
      y: 0
    });
    enemy.facing = dx > 0 ? 1 : -1;
  }
}

/**
 * Damage enemy
 * 
 * @param {Object} enemy - Enemy object
 * @param {number} amount - Damage amount
 * @returns {boolean} True if enemy died
 */
export function damageEnemy(enemy, amount) {
  if (!enemy || enemy.health <= 0) return false;

  enemy.health -= amount;
  enemy.damaged = true;
  enemy.damageTimer = 0;

  if (enemy.health <= 0) {
    enemy.health = 0;
    return true; // Enemy died
  }

  // Become alerted when damaged
  if (!enemy.alerted) {
    enemy.alerted = true;
    enemy.aiState = 'chase';
  }

  return false;
}

/**
 * Get enemy loot drop
 * 
 * @param {Object} enemy - Enemy object
 * @returns {Array} Array of loot items
 */
export function getEnemyLoot(enemy) {
  if (!enemy || !enemy.lootTable) return [];

  const loot = [];

  for (const lootItem of enemy.lootTable) {
    if (Math.random() < lootItem.chance) {
      loot.push({
        item: lootItem.item,
        amount: lootItem.amount || 1
      });
    }
  }

  return loot;
}

/**
 * Cleanup enemy (remove from world)
 * 
 * @param {Object} enemy - Enemy object
 * @param {Object} engine - Matter.js engine
 */
export function cleanupEnemy(enemy, engine) {
  if (!enemy || !engine) return;

  if (enemy.body) {
    World.remove(engine.world, enemy.body);
  }
}
