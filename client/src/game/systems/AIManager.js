/**
 * AIManager.js
 * YUKA-based AI system for enemies and NPCs
 * Implements proper AI system per CLAUDE.md line 61 and docs/AI.md
 */

import {
  EntityManager,
  FleeBehavior,
  FollowPathBehavior,
  NavMesh,
  SeekBehavior,
  State,
  StateMachine,
  Time,
  Vector3,
  Vehicle,
  WanderBehavior,
} from 'yuka';

/**
 * Base class for typed states with better TypeScript-like behavior
 */
class TypedState extends State {
  enter(_owner) {}
  execute(_owner) {}
  exit(_owner) {}
}

/**
 * Enemy AI States
 */

class IdleState extends TypedState {
  constructor() {
    super();
    this.idleTime = 0;
    this.maxIdleTime = 120;
  }

  enter(enemy) {
    this.idleTime = 0;
    this.maxIdleTime = 60 + Math.random() * 120;
    enemy.steering.behaviors.length = 0;
    enemy.velocity.set(0, 0, 0);
  }

  execute(enemy) {
    this.idleTime++;

    // Check for player in aggro range
    if (enemy.playerTarget?.position) {
      const distToPlayer = enemy.position.distanceTo(enemy.playerTarget.position);
      if (distToPlayer < enemy.aggroRadius) {
        enemy.target = enemy.playerTarget;
        enemy.stateMachine.changeTo('chase');
        return;
      }
    }

    // Transition to patrol after idle
    if (this.idleTime > this.maxIdleTime) {
      enemy.stateMachine.changeTo('patrol');
    }
  }

  exit(_enemy) {}
}

class PatrolState extends TypedState {
  constructor() {
    super();
    this.wanderBehavior = new WanderBehavior();
    this.wanderBehavior.jitter = 10;
    this.wanderBehavior.radius = 20;
    this.wanderBehavior.distance = 50;
  }

  enter(enemy) {
    enemy.steering.behaviors.push(this.wanderBehavior);
    enemy.maxSpeed = enemy.patrolSpeed;
  }

  execute(enemy) {
    // Check for player
    if (enemy.playerTarget?.position) {
      const distToPlayer = enemy.position.distanceTo(enemy.playerTarget.position);
      if (distToPlayer < enemy.aggroRadius) {
        enemy.target = enemy.playerTarget;
        enemy.stateMachine.changeTo('chase');
        return;
      }
    }

    // Check patrol bounds
    if (enemy.patrolZone) {
      if (!enemy.isWithinPatrolZone()) {
        enemy.velocity.multiplyScalar(-1);
      }
    }

    // Occasional return to idle
    if (Math.random() < 0.001) {
      enemy.stateMachine.changeTo('idle');
    }
  }

  exit(enemy) {
    const index = enemy.steering.behaviors.indexOf(this.wanderBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

class ChaseState extends TypedState {
  constructor() {
    super();
    this.seekBehavior = new SeekBehavior();
  }

  enter(enemy) {
    if (enemy.target?.position) {
      this.seekBehavior.target = enemy.target.position;
      enemy.steering.behaviors.push(this.seekBehavior);
      enemy.maxSpeed = enemy.chaseSpeed;

      // Play alert sound
      if (enemy.onAlert) {
        enemy.onAlert();
      }
    }
  }

  execute(enemy) {
    if (!enemy.target || !enemy.target.position) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    // Update seek target
    this.seekBehavior.target = enemy.target.position;

    const distToTarget = enemy.position.distanceTo(enemy.target.position);

    // Lost target
    if (distToTarget > enemy.aggroRadius * 1.5) {
      enemy.target = null;
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    // In attack range
    if (distToTarget < enemy.attackRange) {
      enemy.stateMachine.changeTo('attack');
      return;
    }
  }

  exit(enemy) {
    const index = enemy.steering.behaviors.indexOf(this.seekBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

class AttackState extends TypedState {
  constructor() {
    super();
    this.cooldown = 0;
    this.attackCooldown = 60; // frames
  }

  enter(enemy) {
    this.cooldown = 0;
    enemy.velocity.set(0, 0, 0);
    enemy.steering.behaviors.length = 0;
  }

  execute(enemy) {
    if (!enemy.target || !enemy.target.position) {
      enemy.stateMachine.changeTo('idle');
      return;
    }

    const distToTarget = enemy.position.distanceTo(enemy.target.position);

    // Target escaped
    if (distToTarget > enemy.attackRange * 1.5) {
      enemy.stateMachine.changeTo('chase');
      return;
    }

    this.cooldown++;

    if (this.cooldown >= this.attackCooldown) {
      // Execute attack
      if (enemy.onAttack) {
        enemy.onAttack();
      }
      this.cooldown = 0;
    }
  }

  exit(_enemy) {}
}

class FleeState extends TypedState {
  constructor() {
    super();
    this.fleeBehavior = new FleeBehavior();
  }

  enter(enemy) {
    if (enemy.target?.position) {
      this.fleeBehavior.target = enemy.target.position;
      enemy.steering.behaviors.push(this.fleeBehavior);
      enemy.maxSpeed = enemy.chaseSpeed * 1.2;
    }
  }

  execute(enemy) {
    if (!enemy.playerTarget || !enemy.playerTarget.position) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    const distToThreat = enemy.position.distanceTo(enemy.playerTarget.position);

    // Recovered enough distance
    if (distToThreat > enemy.aggroRadius * 2) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    // Regained health
    if (enemy.hp > enemy.maxHp * 0.5) {
      enemy.stateMachine.changeTo('chase');
    }
  }

  exit(enemy) {
    const index = enemy.steering.behaviors.indexOf(this.fleeBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

class HurtState extends TypedState {
  constructor() {
    super();
    this.staggerTime = 0;
    this.maxStagger = 20; // frames
  }

  enter(enemy) {
    this.staggerTime = 0;
    enemy.velocity.set(0, 0, 0);
    enemy.steering.behaviors.length = 0;
  }

  execute(enemy) {
    this.staggerTime++;

    if (this.staggerTime >= this.maxStagger) {
      // Decide next state based on health
      if (enemy.hp < enemy.maxHp * 0.25) {
        enemy.stateMachine.changeTo('flee');
      } else if (enemy.target) {
        enemy.stateMachine.changeTo('chase');
      } else {
        enemy.stateMachine.changeTo('patrol');
      }
    }
  }

  exit(_enemy) {}
}

/**
 * Enemy AI entity
 */
class EnemyAI extends Vehicle {
  constructor(config) {
    super();

    this.uuid = config.id;
    this.enemyType = config.type;
    this.hp = config.health;
    this.maxHp = config.health;
    this.damage = config.damage || 10;
    this.aggroRadius = config.aggroRadius || 200;
    this.attackRange = config.attackRange || 50;
    this.patrolSpeed = config.speed * 0.5;
    this.chaseSpeed = config.speed;
    this.patrolZone = config.patrolZone;

    this.target = null;
    this.playerTarget = null;
    this.facingDirection = 1;

    // Callbacks
    this.onAlert = config.onAlert || null;
    this.onAttack = config.onAttack || null;
    this.onDeath = config.onDeath || null;

    // Setup FSM
    this.stateMachine = new StateMachine(this);
    this.stateMachine.add('idle', new IdleState());
    this.stateMachine.add('patrol', new PatrolState());
    this.stateMachine.add('chase', new ChaseState());
    this.stateMachine.add('attack', new AttackState());
    this.stateMachine.add('flee', new FleeState());
    this.stateMachine.add('hurt', new HurtState());

    this.stateMachine.changeTo('idle');

    // Physics
    this.maxSpeed = this.patrolSpeed;
    this.maxForce = 10;
  }

  update(delta) {
    // Update FSM
    this.stateMachine.update();

    // Update facing direction
    if (Math.abs(this.velocity.x) > 0.1) {
      this.facingDirection = this.velocity.x > 0 ? 1 : -1;
    }

    return super.update(delta);
  }

  takeDamage(amount) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.die();
    } else {
      this.stateMachine.changeTo('hurt');
    }
  }

  die() {
    if (this.onDeath) {
      this.onDeath(this);
    }
  }

  isWithinPatrolZone() {
    if (!this.patrolZone) return true;
    return (
      this.position.x >= this.patrolZone.x &&
      this.position.x <= this.patrolZone.x + this.patrolZone.width
    );
  }

  getCurrentState() {
    return this.stateMachine.currentState?.constructor.name || 'unknown';
  }
}

/**
 * NPC AI entity
 */
class NPCAI {
  constructor(config) {
    this.uuid = config.id;
    this.npcType = config.type;
    this.position = new Vector3(config.position.x, config.position.y, 0);
    this.behaviorType = config.behavior?.type || 'idle';
    this.patrolPath = config.behavior?.patrolPath || [];
    this.currentWaypoint = 0;
    this.currentAnimation = 'idle';
    this.facingDirection = 1;
    this.canInteract = true;
    this.interactRadius = 60;

    // Story state
    this.storyState = config.storyState?.initialState || 'idle';
    this.storyStates = config.storyState?.states || {};

    // Interaction data
    this.interaction = config.interaction;

    // Follow behavior config
    this.followTarget = null;
    this.followDistance = config.behavior?.followDistance || 80;
    this.followSpeed = config.behavior?.followSpeed || 1.5;
    this.stoppingDistance = config.behavior?.stoppingDistance || 50;
  }

  update(delta) {
    switch (this.behaviorType) {
      case 'idle':
        this.updateIdle(delta);
        break;
      case 'patrol':
        this.updatePatrol(delta);
        break;
      case 'follow':
        this.updateFollow(delta);
        break;
    }
  }

  updateIdle(_delta) {
    // Occasional idle animations
    if (Math.random() < 0.001) {
      this.currentAnimation = 'look_around';
      setTimeout(() => {
        this.currentAnimation = 'idle';
      }, 2000);
    }
  }

  updatePatrol(delta) {
    if (this.patrolPath.length === 0) return;

    const target = this.patrolPath[this.currentWaypoint];
    const dist = this.position.distanceTo(target);

    if (dist < 5) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
    } else {
      const direction = new Vector3().subVectors(target, this.position).normalize();
      this.position.add(direction.multiplyScalar(delta * 0.5));
      this.currentAnimation = 'walk';
    }
  }

  updateFollow(delta) {
    if (!this.followTarget || !this.followTarget.position) {
      this.currentAnimation = 'idle';
      return;
    }

    // Get player position (followTarget should have Matter.js body or position)
    const targetPos =
      this.followTarget.position instanceof Vector3
        ? this.followTarget.position
        : new Vector3(this.followTarget.position.x, this.followTarget.position.y, 0);

    // Calculate distance to player
    const distanceToPlayer = this.position.distanceTo(targetPos);

    // If too far, move towards player
    if (distanceToPlayer > this.followDistance) {
      // Calculate direction to player
      const direction = new Vector3().subVectors(targetPos, this.position).normalize();

      // Move towards player
      const moveSpeed = this.followSpeed * delta;
      this.position.add(direction.multiplyScalar(moveSpeed));

      // Update facing direction
      this.facingDirection = direction.x > 0 ? 1 : -1;

      // Set animation to walk
      this.currentAnimation = 'walk';
    } else if (distanceToPlayer > this.stoppingDistance) {
      // Within follow range but not at stopping distance - slow approach
      const direction = new Vector3().subVectors(targetPos, this.position).normalize();

      // Slower movement when close
      const moveSpeed = this.followSpeed * delta * 0.5;
      this.position.add(direction.multiplyScalar(moveSpeed));

      // Update facing direction
      this.facingDirection = direction.x > 0 ? 1 : -1;

      // Set animation to walk
      this.currentAnimation = 'walk';
    } else {
      // Close enough, stop and face player
      this.facingDirection = targetPos.x > this.position.x ? 1 : -1;
      this.currentAnimation = 'idle';
    }
  }

  /**
   * Set the target to follow (usually the player)
   * @param {Object} target - Target with position property (Matter.js body or Vector3)
   */
  setFollowTarget(target) {
    this.followTarget = target;
    this.behaviorType = 'follow';
  }

  /**
   * Stop following and return to idle
   */
  stopFollowing() {
    this.followTarget = null;
    this.behaviorType = 'idle';
    this.currentAnimation = 'idle';
  }

  interact(playerPos) {
    if (!this.canInteract) return;

    // Face player
    this.facingDirection = playerPos.x > this.position.x ? 1 : -1;

    return this.interaction;
  }

  setState(newState) {
    if (this.storyStates[newState]) {
      this.storyState = newState;
    }
  }
}

/**
 * Main AI Manager
 */
class AIManager {
  constructor() {
    this.entityManager = new EntityManager();
    this.time = new Time();
    this.enemies = new Map();
    this.npcs = new Map();
    this.navMesh = null;
  }

  /**
   * Build navigation mesh from level geometry
   * @param {Array} platforms - Array of platform bodies from Matter.js
   */
  buildNavMesh(platforms) {
    this.navMesh = new NavMesh();
    const polygons = [];

    // Generate navigation polygons from platforms
    // For each platform, create a walkable region
    for (const platform of platforms) {
      const bounds = platform.body.bounds;

      // Create polygon vertices for top surface of platform (walkable area)
      // Directly push to polygons array to avoid unused variable
      polygons.push([
        new Vector3(bounds.min.x, bounds.min.y - 5, 0),
        new Vector3(bounds.max.x, bounds.min.y - 5, 0),
        new Vector3(bounds.max.x, bounds.min.y, 0),
        new Vector3(bounds.min.x, bounds.min.y, 0),
      ]);
    }

    // Build nav mesh from polygons
    // Note: YUKA's fromPolygons expects specific format
    // This creates a simplified nav mesh for 2D platformer pathfinding
    if (polygons.length > 0) {
      try {
        this.navMesh.fromPolygons(polygons);
      } catch (e) {
        console.warn('NavMesh generation failed, using simplified pathfinding:', e.message);
      }
    }

    return this.navMesh;
  }

  /**
   * Find path between two points using navigation mesh
   * @param {Vector3} from - Start position
   * @param {Vector3} to - End position
   * @returns {Array<Vector3>} - Path waypoints
   */
  findPath(from, to) {
    if (!this.navMesh) {
      console.warn('NavMesh not initialized');
      return [to]; // Return direct path as fallback
    }

    try {
      // Use YUKA's native findPath method with A* algorithm
      const path = [];
      this.navMesh.findPath(from, to, path);

      // If YUKA pathfinding succeeds, return the path
      if (path.length > 0) {
        return path;
      }

      // Fallback: try A* implementation
      return this.aStarPathfinding(from, to);
    } catch (error) {
      console.warn('Pathfinding failed, using direct path:', error);
      return [from.clone(), to.clone()];
    }
  }

  /**
   * A* pathfinding implementation for 2D platformer
   * @param {Vector3} start - Start position
   * @param {Vector3} goal - Goal position
   * @returns {Array<Vector3>} - Path waypoints
   */
  aStarPathfinding(start, goal) {
    // Get navmesh regions
    const regions = this.navMesh.regions || [];

    if (regions.length === 0) {
      return [start.clone(), goal.clone()];
    }

    // Find start and goal regions
    const startRegion = this.findNearestRegion(start, regions);
    const goalRegion = this.findNearestRegion(goal, regions);

    if (!startRegion || !goalRegion) {
      return [start.clone(), goal.clone()];
    }

    // If same region, direct path
    if (startRegion === goalRegion) {
      return [start.clone(), goal.clone()];
    }

    // A* algorithm
    const openSet = new Set([startRegion]);
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map([[startRegion, 0]]);
    const fScore = new Map([[startRegion, this.heuristic(startRegion.centroid, goal)]]);

    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current = null;
      let lowestF = Infinity;
      for (const region of openSet) {
        const f = fScore.get(region) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = region;
        }
      }

      // Reached goal
      if (current === goalRegion) {
        return this.reconstructPath(cameFrom, current, start, goal);
      }

      openSet.delete(current);
      closedSet.add(current);

      // Check neighbors
      const neighbors = this.getRegionNeighbors(current, regions);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor)) continue;

        const tentativeG =
          (gScore.get(current) || Infinity) + current.centroid.distanceTo(neighbor.centroid);

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeG >= (gScore.get(neighbor) || Infinity)) {
          continue;
        }

        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + this.heuristic(neighbor.centroid, goal));
      }
    }

    // No path found, return direct
    return [start.clone(), goal.clone()];
  }

  /**
   * Find nearest navigable region to a point
   */
  findNearestRegion(point, regions) {
    let nearest = null;
    let minDist = Infinity;

    for (const region of regions) {
      const dist = region.centroid.distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        nearest = region;
      }
    }

    return nearest;
  }

  /**
   * Get neighboring regions
   */
  getRegionNeighbors(region, regions) {
    const neighbors = [];
    const threshold = 100; // Max distance for adjacent regions

    for (const other of regions) {
      if (other === region) continue;

      const dist = region.centroid.distanceTo(other.centroid);
      if (dist < threshold) {
        neighbors.push(other);
      }
    }

    return neighbors;
  }

  /**
   * Heuristic for A* (Euclidean distance)
   */
  heuristic(from, to) {
    return from.distanceTo(to);
  }

  /**
   * Reconstruct path from A* cameFrom map
   */
  reconstructPath(cameFrom, current, start, goal) {
    const path = [goal.clone()];

    while (cameFrom.has(current)) {
      path.unshift(current.centroid.clone());
      current = cameFrom.get(current);
    }

    path.unshift(start.clone());
    return path;
  }

  /**
   * Set entity to follow a path
   * @param {string} entityId - Entity ID
   * @param {Vector3} targetPosition - Destination
   */
  setEntityPath(entityId, targetPosition) {
    const enemy = this.enemies.get(entityId);
    if (!enemy) return;

    // Find path
    const path = this.findPath(enemy.position, targetPosition);

    // Apply path following behavior
    if (path.length > 1) {
      const followPathBehavior = new FollowPathBehavior(path, 5);

      // Remove existing path behaviors
      enemy.steering.behaviors = enemy.steering.behaviors.filter(
        (b) => !(b instanceof FollowPathBehavior)
      );

      // Add new path behavior
      enemy.steering.behaviors.push(followPathBehavior);
    }
  }

  update(_delta) {
    this.time.update();
    this.entityManager.update(this.time.getDelta());
  }

  addEnemy(id, config) {
    const enemy = new EnemyAI(config);
    this.enemies.set(id, enemy);
    this.entityManager.add(enemy);

    return enemy;
  }

  removeEnemy(id) {
    const enemy = this.enemies.get(id);
    if (enemy) {
      this.entityManager.remove(enemy);
      this.enemies.delete(id);
    }
  }

  addNPC(id, config) {
    const npc = new NPCAI(config);
    this.npcs.set(id, npc);
    return npc;
  }

  getEnemy(id) {
    return this.enemies.get(id);
  }

  getNPC(id) {
    return this.npcs.get(id);
  }

  getAllEnemiesInRange(position, radius) {
    const result = [];
    for (const enemy of this.enemies.values()) {
      if (enemy.position.distanceTo(position) <= radius) {
        result.push(enemy);
      }
    }
    return result;
  }

  setSlowMotion(scale) {
    this.time.timescale = scale;
  }

  destroy() {
    this.entityManager.clear();
    this.enemies.clear();
    this.npcs.clear();
    this.navMesh = null;
  }
}

// Export singleton instance
export const aiManager = new AIManager();
export { EnemyAI, NPCAI };
