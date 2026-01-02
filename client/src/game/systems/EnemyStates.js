/**
 * Enemy AI State Machine States
 * Finite State Machine (FSM) states for enemy AI behavior
 * Uses YUKA.js State base class for transitions
 */

import {
  State,
  WanderBehavior,
  SeekBehavior,
  FleeBehavior,
} from 'yuka';

/**
 * Base class for typed states with proper lifecycle methods
 * @extends State
 */
class TypedState extends State {
  enter(_owner) {}
  execute(_owner) {}
  exit(_owner) {}
}

/**
 * Idle State - Enemy waits and watches for player
 * Transitions to patrol after random timeout
 * Transitions to chase if player enters aggro range
 */
export class IdleState extends TypedState {
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

/**
 * Patrol State - Enemy wanders within bounds using wander behavior
 * Transitions to chase if player detected
 * Occasionally transitions to idle
 */
export class PatrolState extends TypedState {
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

/**
 * Chase State - Enemy pursues target using seek behavior
 * Transitions to attack when in range
 * Transitions to patrol if target lost
 */
export class ChaseState extends TypedState {
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

/**
 * Attack State - Enemy stops and attacks target
 * Cooldown-based attack execution
 * Transitions to chase if target escapes
 */
export class AttackState extends TypedState {
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

/**
 * Flee State - Enemy runs from threat when low health
 * Uses flee behavior to escape
 * Transitions to patrol when safe or healed
 */
export class FleeState extends TypedState {
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

/**
 * Hurt State - Enemy staggers after taking damage
 * Brief invulnerability period
 * Transitions based on health and context
 */
export class HurtState extends TypedState {
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
 * Create a state map for enemy state machine initialization
 * @returns {Object} Map of state name to state instance
 */
export function createEnemyStateMap() {
  return {
    idle: new IdleState(),
    patrol: new PatrolState(),
    chase: new ChaseState(),
    attack: new AttackState(),
    flee: new FleeState(),
    hurt: new HurtState(),
  };
}
