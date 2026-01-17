# Otterblade Odyssey: Complete AI Implementation Reference

> Comprehensive YUKA-based AI patterns with concrete code examples from `game/src/game/ai/` and `game/src/game/systems/`

## Table of Contents

1. [Quick Context](#quick-context)
2. [Wiring YUKA into Game Loop](#wiring-yuka-into-the-game-loop)
3. [FSM State Machines](#fsm-state-machines)
4. [Steering Behaviors](#steering-behaviors)
5. [Perception Systems](#perception-systems)
6. [Fuzzy Logic](#fuzzy-logic-for-nuanced-behavior)
7. [Boss AI: Multi-Phase System](#boss-ai-multi-phase-system)
8. [Goal-Driven Agents](#goal-driven-agents)
9. [Path Planning & Navigation](#path-planning--navigation)
10. [Testing AI Systems](#testing-ai-systems)

## Quick Context

- **Runtime**: Astro + Solid islands with Matter.js physics and Canvas 2D rendering
- **Data**: All behavior parameters in `client/src/data/manifests/` (enemies.json, chapter manifests)
- **Language**: TypeScript (ES2022 target); small, composable functions
- **Implementation**: Reference code in `game/src/game/ai/` and `game/src/game/systems/AIManager.js`

## Wiring YUKA into the Game Loop

```javascript
import { EntityManager, Time } from 'yuka';
import { loadEnemyDefinitions } from '../ddl/loader.js';

const entityManager = new EntityManager();
const time = new Time();

/**
 * Updates all AI entities; call from main game loop after physics
 */
export function updateAI(deltaMs) {
  time.update();
  entityManager.update(time.getDelta());
}

export async function initializeAI() {
  const enemies = await loadEnemyDefinitions();
  enemies.forEach((definition) => {
    const enemy = createEnemyFromDefinition(definition);
    entityManager.add(enemy);
  });
}
```

**Best Practices:**
- Keep YUKA updates deterministic (same delta as Matter.js step)
- Store YUKA entity references alongside physics bodies for cleanup
- Use async loaders for manifest data


## FSM State Machines

Complete enemy AI state machine implementation. Reference: `game/src/game/systems/EnemyStates.js`

### State Architecture

```javascript
import { State, StateMachine, WanderBehavior, SeekBehavior, FleeBehavior } from 'yuka';

/**
 * Base class for typed states with proper lifecycle
 */
class TypedState extends State {
  enter(_owner) {}
  execute(_owner) {}
  exit(_owner) {}
}
```

### All Enemy States

**State Diagram:** `idle ↔ patrol ↔ chase ↔ attack` with `flee/hurt` as interrupts

#### 1. Idle State

Waits and watches. Transitions: `patrol` (timeout) | `chase` (player detected)

```javascript
class IdleState extends TypedState {
  constructor() {
    super();
    this.idleTime = 0;
    this.maxIdleTime = 120;
  }

  enter(enemy) {
    this.idleTime = 0;
    this.maxIdleTime = 60 + Math.random() * 120; // Random 1-3 seconds
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

    if (this.idleTime > this.maxIdleTime) {
      enemy.stateMachine.changeTo('patrol');
    }
  }
}
```

#### 2. Patrol State

Wanders using YUKA `WanderBehavior`. Transitions: `chase` (player) | `idle` (random)

```javascript
class PatrolState extends TypedState {
  constructor() {
    super();
    this.wanderBehavior = new WanderBehavior();
    this.wanderBehavior.jitter = 10;   // Randomness
    this.wanderBehavior.radius = 20;   // Circle radius
    this.wanderBehavior.distance = 50; // Distance ahead
  }

  enter(enemy) {
    enemy.steering.behaviors.push(this.wanderBehavior);
    enemy.maxSpeed = enemy.patrolSpeed;
  }

  execute(enemy) {
    if (enemy.playerTarget?.position) {
      const distToPlayer = enemy.position.distanceTo(enemy.playerTarget.position);
      if (distToPlayer < enemy.aggroRadius) {
        enemy.target = enemy.playerTarget;
        enemy.stateMachine.changeTo('chase');
        return;
      }
    }

    // Keep within patrol bounds
    if (enemy.patrolZone && !enemy.isWithinPatrolZone()) {
      enemy.velocity.multiplyScalar(-1);
    }

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
```

#### 3. Chase State

Pursues target using `SeekBehavior`. Transitions: `attack` (in range) | `patrol` (lost)

```javascript
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

      if (enemy.onAlert) {
        enemy.onAlert(); // Trigger alert sound/animation
      }
    }
  }

  execute(enemy) {
    if (!enemy.target?.position) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    this.seekBehavior.target = enemy.target.position; // Update each frame

    const distToTarget = enemy.position.distanceTo(enemy.target.position);

    if (distToTarget > enemy.aggroRadius * 1.5) {
      enemy.target = null;
      enemy.stateMachine.changeTo('patrol');
    } else if (distToTarget < enemy.attackRange) {
      enemy.stateMachine.changeTo('attack');
    }
  }

  exit(enemy) {
    const index = enemy.steering.behaviors.indexOf(this.seekBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}
```

#### 4. Attack State

Stops and executes attacks on cooldown. Transitions: `chase` (escape) | `idle` (lost)

```javascript
class AttackState extends TypedState {
  constructor() {
    super();
    this.cooldown = 0;
    this.attackCooldown = 60; // 1 second at 60fps
  }

  enter(enemy) {
    this.cooldown = 0;
    enemy.velocity.set(0, 0, 0);
    enemy.steering.behaviors.length = 0;
  }

  execute(enemy) {
    if (!enemy.target?.position) {
      enemy.stateMachine.changeTo('idle');
      return;
    }

    const distToTarget = enemy.position.distanceTo(enemy.target.position);

    if (distToTarget > enemy.attackRange * 1.5) {
      enemy.stateMachine.changeTo('chase');
      return;
    }

    this.cooldown++;

    if (this.cooldown >= this.attackCooldown) {
      if (enemy.onAttack) {
        enemy.onAttack();
      }
      this.cooldown = 0;
    }
  }
}
```

#### 5. Flee State

Runs from threat when low health. Transitions: `patrol` (safe) | `chase` (healed)

```javascript
class FleeState extends TypedState {
  constructor() {
    super();
    this.fleeBehavior = new FleeBehavior();
  }

  enter(enemy) {
    if (enemy.target?.position) {
      this.fleeBehavior.target = enemy.target.position;
      enemy.steering.behaviors.push(this.fleeBehavior);
      enemy.maxSpeed = enemy.chaseSpeed * 1.2; // Faster when fleeing
    }
  }

  execute(enemy) {
    if (!enemy.playerTarget?.position) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }

    const distToThreat = enemy.position.distanceTo(enemy.playerTarget.position);

    if (distToThreat > enemy.aggroRadius * 2) {
      enemy.stateMachine.changeTo('patrol');
    } else if (enemy.hp > enemy.maxHp * 0.5) {
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
```

#### 6. Hurt State

Staggers briefly after damage. Transitions based on health and context.

```javascript
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
      if (enemy.hp < enemy.maxHp * 0.25) {
        enemy.stateMachine.changeTo('flee');
      } else if (enemy.target) {
        enemy.stateMachine.changeTo('chase');
      } else {
        enemy.stateMachine.changeTo('patrol');
      }
    }
  }
}
```

### FSM Setup

```javascript
export function setupEnemyFSM(enemy) {
  const fsm = new StateMachine(enemy);
  
  fsm.add('idle', new IdleState());
  fsm.add('patrol', new PatrolState());
  fsm.add('chase', new ChaseState());
  fsm.add('attack', new AttackState());
  fsm.add('flee', new FleeState());
  fsm.add('hurt', new HurtState());
  
  fsm.changeTo('idle');
  
  return fsm;
}
```

### FSM Best Practices

✅ **DO:**
- Load behavior params from manifests (`aggroRadius`, `attackRange`, `patrolSpeed`)
- Keep 2-6 states per enemy type
- Clean up behaviors in `exit()`
- Use data for variations, not branching logic

❌ **DON'T:**
- Hardcode behavior numbers in state classes
- Create "god states" with 500+ lines
- Forget to remove behaviors on state exit (memory leak)


## Steering Behaviors

YUKA steering behaviors control enemy movement. Apply only needed behaviors per state.

Reference: `game/src/game/systems/AIManager.js` lines 66-114

### Core Behaviors

**WanderBehavior** - Random patrol

```javascript
import { WanderBehavior } from 'yuka';

const wander = new WanderBehavior();
wander.jitter = 10;   // Randomness factor
wander.radius = 20;   // Circle radius
wander.distance = 50; // Distance ahead of agent

enemy.steering.add(wander);
```

**SeekBehavior** - Move directly toward target

```javascript
import { SeekBehavior, Vector3 } from 'yuka';

const seek = new SeekBehavior(new Vector3(target.x, target.y, 0));
enemy.steering.add(seek);

// Update target position each frame
seek.target = new Vector3(target.x, target.y, 0);
```

**FleeBehavior** - Move away from threat

```javascript
import { FleeBehavior } from 'yuka';

const flee = new FleeBehavior(threatPosition);
enemy.steering.add(flee);
enemy.maxSpeed = enemy.chaseSpeed * 1.2; // Faster when fleeing
```

**ArriveBehavior** - Approach target and slow down

```javascript
import { ArriveBehavior } from 'yuka';

const arrive = new ArriveBehavior(destination, 3); // Deceleration radius = 3
enemy.steering.add(arrive);
```

### Steering Configuration from Manifest

```javascript
export function attachSteering(enemy, behaviorConfig) {
  const seek = new SeekBehavior(new Vector3());
  const arrive = new ArriveBehavior(new Vector3(), behaviorConfig.arriveDeceleration);

  enemy.steering.behaviors = [];
  enemy.seekBehavior = seek;
  enemy.arriveBehavior = arrive;

  // Weighted behaviors
  enemy.steering.add(seek, behaviorConfig.seekWeight || 1.0);
  enemy.steering.add(arrive, behaviorConfig.arriveWeight || 0.5);
}
```

### Best Practices

- **Seek**: Chase behaviors, high aggression
- **Arrive**: Patrol endpoints, NPC destinations
- **Wander**: Ambient patrol, low alert
- **Flee**: Low health, retreat behaviors
- **Turn down weights while airborne**: Keep physics authoritative

## Perception Systems

Comprehensive vision, memory, and hearing. Reference: `game/src/game/ai/PerceptionSystem.js`

### Vision System

Field-of-view cone with range and angle checks.

```javascript
import { Vector3 } from 'yuka';

export class VisionSystem {
  constructor(owner, fieldOfView = Math.PI * 0.6, range = 300) {
    this.owner = owner;
    this.fieldOfView = fieldOfView; // ~108 degrees
    this.range = range;
  }

  canSee(targetPos) {
    const toTarget = new Vector3().subVectors(targetPos, this.owner.position);
    const distance = toTarget.length();

    if (distance > this.range) return false;

    const forward = this.owner.getForwardVector();
    toTarget.normalize();

    const dotProduct = forward.dot(toTarget);
    const angle = Math.acos(dotProduct);

    return angle <= this.fieldOfView / 2;
  }

  getForwardVector() {
    const facing = this.owner.facingDirection || 1;
    return new Vector3(facing, 0, 0);
  }
}
```

### Memory System

Prevents instant forgetting when losing line of sight.

```javascript
export class MemorySystem {
  constructor(owner, memorySpan = 3) {
    this.owner = owner;
    this.memorySpan = memorySpan; // seconds
    this.records = [];
  }

  remember(entity, position) {
    let record = this.getRecord(entity);

    if (record) {
      record.lastSensedTime = 0;
      record.position.copy(position);
      record.timesSpotted++;
    } else {
      record = {
        entity,
        position: position.clone(),
        lastSensedTime: 0,
        timesSpotted: 1,
        threat: 0.5,
      };
      this.records.push(record);
    }

    return record;
  }

  update(delta) {
    for (const record of this.records) {
      record.lastSensedTime += delta;
    }

    this.records = this.records.filter(r => r.lastSensedTime < this.memorySpan);
  }

  getMostThreatening() {
    if (this.records.length === 0) return null;

    return this.records.reduce((most, current) => {
      const currentScore = current.threat / (1 + current.lastSensedTime);
      const mostScore = most.threat / (1 + most.lastSensedTime);
      return currentScore > mostScore ? current : most;
    });
  }
}
```

### Hearing System

Sound propagation for stealth mechanics.

```javascript
export class SoundEvent {
  constructor(position, loudness, type, source) {
    this.position = position.clone();
    this.loudness = loudness; // 0.0-1.0
    this.type = type; // 'footstep' | 'attack' | 'item' | 'damage' | 'door'
    this.source = source;
    this.timestamp = performance.now();
  }
}

export class HearingSystem {
  constructor() {
    this.sounds = [];
    this.maxSounds = 20;
    this.listeners = [];
  }

  emit(position, loudness, type, source) {
    const event = new SoundEvent(position, loudness, type, source);
    this.sounds.push(event);

    if (this.sounds.length > this.maxSounds) {
      this.sounds.shift();
    }

    const radius = loudness * 150; // Loudness affects range
    for (const listener of this.listeners) {
      const distance = listener.position.distanceTo(position);
      if (distance < radius) {
        listener.onHearSound(event, distance);
      }
    }
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  update() {
    const now = performance.now();
    this.sounds = this.sounds.filter(s => now - s.timestamp < 2000);
  }
}

export const hearingSystem = new HearingSystem();
```

### Perceptive Entity Pattern

Combine all perception systems.

```javascript
export class PerceptiveEntity {
  constructor(config) {
    this.position = new Vector3();
    this.facingDirection = 1;

    this.vision = new VisionSystem(this, config.fieldOfView, config.visionRange);
    this.memory = new MemorySystem(this, config.memorySpan || 3);

    this.alertLevel = 0; // 0=unaware, 1=suspicious, 2=alert
    this.investigatePosition = null;
  }

  updatePerception(player, delta) {
    if (this.vision.canSee(player.position)) {
      const record = this.memory.remember(player, player.position);
      record.threat = 1.0;
      this.alertLevel = 2;
      this.target = player;
    } else {
      const playerMemory = this.memory.getRecord(player);

      if (playerMemory && playerMemory.lastSensedTime < 2) {
        this.investigatePosition = playerMemory.position.clone();
        this.alertLevel = Math.max(1, this.alertLevel);
      } else if (this.alertLevel > 0) {
        this.alertLevel = Math.max(0, this.alertLevel - delta * 0.2);
      }
    }

    this.memory.update(delta);
  }

  onHearSound(event, distance) {
    const alertIncrease = (1 - distance / 300) * 0.5;
    this.alertLevel = Math.min(2, this.alertLevel + alertIncrease);

    if (this.alertLevel < 2 && event.type !== 'ambient') {
      this.investigatePosition = event.position.clone();
    }
  }
}
```

### Perception Best Practices

- **Vision**: Angle + distance, use Matter.js for line-of-sight
- **Memory span**: 3-5 seconds
- **Hearing**: Loudness 0.0-1.0, radius = loudness × 150
- **Alert levels**: 0 → 1 → 2 transitions
- **Investigation**: Use last known position from memory

## Fuzzy Logic for Nuanced Behavior

Smooth decision-making for boss AI. Reference: `game/src/game/ai/BossAI.ts` lines 10-101

### Threat Assessment System

```javascript
export class ThreatAssessment {
  constructor() {
    // Fuzzy sets for distance
    this.distanceSets = {
      close: (d) => this.trapezoid(d, 0, 0, 50, 100),
      medium: (d) => this.trapezoid(d, 50, 100, 150, 200),
      far: (d) => this.trapezoid(d, 150, 200, 300, 300),
    };

    // Fuzzy sets for health percentage
    this.healthSets = {
      low: (h) => this.trapezoid(h, 0, 0, 25, 50),
      medium: (h) => this.trapezoid(h, 25, 50, 75, 100),
      high: (h) => this.trapezoid(h, 50, 75, 100, 100),
    };

    // Output: aggression level
    this.aggressionSets = {
      retreat: 0,
      cautious: 0.5,
      aggressive: 1.0,
    };
  }

  /**
   * Trapezoidal membership function
   *        b____c
   *       /      \
   *      /        \
   *  ___/          \___
   *     a          d
   */
  trapezoid(x, a, b, c, d) {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  }

  evaluate(distance, playerHealth, ownHealth) {
    // Fuzzify inputs
    const distClose = this.distanceSets.close(distance);
    const distMedium = this.distanceSets.medium(distance);
    const distFar = this.distanceSets.far(distance);

    const playerLow = this.healthSets.low(playerHealth);
    const playerHigh = this.healthSets.high(playerHealth);

    const ownLow = this.healthSets.low(ownHealth);
    const ownMed = this.healthSets.medium(ownHealth);
    const ownHigh = this.healthSets.high(ownHealth);

    // Fuzzy rules
    const rules = [];

    // IF close AND player low AND own high THEN aggressive
    rules.push({
      strength: Math.min(distClose, playerLow, ownHigh),
      output: this.aggressionSets.aggressive,
    });

    // IF far OR own low THEN retreat
    rules.push({
      strength: Math.max(distFar, ownLow),
      output: this.aggressionSets.retreat,
    });

    // IF medium AND medium health THEN cautious
    rules.push({
      strength: Math.min(distMedium, ownMed),
      output: this.aggressionSets.cautious,
    });

    // IF own high AND player high THEN aggressive
    rules.push({
      strength: Math.min(ownHigh, playerHigh),
      output: this.aggressionSets.aggressive,
    });

    // Defuzzify (centroid method)
    let numerator = 0;
    let denominator = 0;

    for (const rule of rules) {
      numerator += rule.strength * rule.output;
      denominator += rule.strength;
    }

    return denominator > 0 ? numerator / denominator : 0.5;
  }
}
```

### Using Fuzzy Logic

```javascript
const aggression = this.threatAssessment.evaluate(distance, playerHP, ownHP);

if (aggression > 0.75) {
  this.selectHighPowerAttack();
} else if (aggression > 0.5) {
  this.selectMediumPowerAttack();
} else {
  this.selectDefensivePattern();
}
```

### Benefits

- **Smooth transitions**: No sudden behavior changes
- **Context-aware**: Multiple inputs weighted together
- **Designer-friendly**: Adjust membership functions easily
- **Intelligent feel**: Boss doesn't feel robotic

## Boss AI: Multi-Phase System

Complete boss implementation with attack patterns. Reference: `game/src/game/ai/BossAI.ts`

### Attack Pattern Architecture

```javascript
export class BossPattern {
  constructor(name, minPhase, cooldown, warmthDrain) {
    this.name = name;
    this.minPhase = minPhase;
    this.cooldown = cooldown;
    this.warmthDrain = warmthDrain;
    this.lastUsed = 0;
  }

  cooldownReady() {
    return performance.now() - this.lastUsed > this.cooldown;
  }

  async execute(_boss) {
    this.lastUsed = performance.now();
    // Override in subclasses
  }
}
```

### Example Patterns

**Frost Wave** (Phase 1+)

```javascript
export class FrostWavePattern extends BossPattern {
  constructor() {
    super('Frost Wave', 1, 4000, 25);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'cast';
    await this.wait(500);

    const direction = boss.facingDirection;
    const wave = {
      x: boss.position.x + direction * 30,
      y: boss.position.y,
      vx: direction * 8,
      vy: 0,
      width: 40,
      height: 30,
      damage: boss.damage * 0.7,
      warmthDrain: this.warmthDrain,
      lifetime: 2000,
      createdAt: performance.now(),
    };

    boss.projectiles.push(wave);
    boss.audioManager?.playSFX('frost_wave');
    boss.spawnFrostParticles(boss.position, direction);
    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Blizzard Zone** (Phase 2+)

```javascript
export class BlizzardZonePattern extends BossPattern {
  constructor() {
    super('Blizzard Zone', 2, 8000, 50);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'summon';
    await this.wait(1000);

    const zone = {
      x: boss.target.position.x - 100,
      y: boss.target.position.y - 50,
      width: 200,
      height: 100,
      duration: 4000,
      damage: 5,
      warmthDrain: 10,
      createdAt: performance.now(),
    };

    boss.hazardZones.push(zone);
    boss.audioManager?.playSFX('blizzard');
    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Zephyros Boss Implementation

```javascript
export class ZephyrosAI extends PerceptiveEntity {
  constructor(config, gameState, audioManager) {
    super({
      fieldOfView: Math.PI,
      visionRange: 500,
      memorySpan: 5,
    });

    this.hp = config.health || 500;
    this.maxHp = this.hp;
    this.damage = config.damage || 35;

    this.phase = 1;
    this.phaseHealthThresholds = [1.0, 0.6, 0.25];

    this.patterns = [
      new IceSlashPattern(),
      new FrostWavePattern(),
      new BlizzardZonePattern(),
      new IcePillarPattern(),
      new AbsoluteZeroPattern(),
    ];

    this.threatAssessment = new ThreatAssessment();
    this.specialAttackCooldown = 0;
  }

  update(delta) {
    const healthRatio = this.hp / this.maxHp;
    const newPhase = this.getPhaseForHealth(healthRatio);

    if (newPhase > this.phase) {
      this.phase = newPhase;
      this.onPhaseTransition();
    }

    if (this.target) {
      this.updatePerception(this.target, delta);
    }

    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown -= delta;
    }

    this.updateProjectiles(delta);
    this.updateHazardZones();

    if (this.target) {
      this.facingDirection = this.target.position.x > this.position.x ? 1 : -1;
    }
  }

  onPhaseTransition() {
    console.log(`Zephyros Phase ${this.phase}!`);
    this.hp = Math.min(this.maxHp, this.hp + 50);
    
    this.isInvulnerable = true;
    setTimeout(() => { this.isInvulnerable = false; }, 2000);

    this.audioManager?.playSFX('boss_phase_change');
  }

  async selectAndExecuteAttack() {
    if (this.specialAttackCooldown > 0 || !this.target) return;

    const availablePatterns = this.patterns.filter(
      p => p.minPhase <= this.phase && p.cooldownReady()
    );

    if (availablePatterns.length === 0) return;

    const distance = this.position.distanceTo(this.target.position);
    const playerHealthPercent = (this.target.hp / this.target.maxHp) * 100;
    const ownHealthPercent = (this.hp / this.maxHp) * 100;

    const aggression = this.threatAssessment.evaluate(
      distance,
      playerHealthPercent,
      ownHealthPercent
    );

    let selectedPattern;

    if (aggression > 0.75) {
      selectedPattern = this.selectHighPowerAttack(availablePatterns);
    } else if (aggression > 0.5) {
      selectedPattern = this.selectMediumPowerAttack(availablePatterns);
    } else {
      selectedPattern = this.selectDefensivePattern(availablePatterns);
    }

    if (selectedPattern) {
      await selectedPattern.execute(this);
      this.specialAttackCooldown = 1.0;
    }
  }
}
```

### Boss Design Patterns

- **Phase system**: Health thresholds unlock attacks
- **Pattern library**: Composable attack objects
- **Cooldown management**: Per-pattern + global
- **Fuzzy decisions**: Context-aware selection
- **Invulnerability**: During phase transitions
- **Async/await**: For timing and animations

## Goal-Driven Agents

Multi-objective AI systems with priority-based goal selection.

### Goal System Architecture

```javascript
export class Goal {
  constructor(name, priority, condition, action) {
    this.name = name;
    this.priority = priority; // 0-10, higher = more important
    this.condition = condition; // () => boolean
    this.action = action; // () => void
    this.isActive = false;
  }

  evaluate(agent) {
    return this.condition(agent) ? this.priority : 0;
  }
}

export class GoalDrivenAgent {
  constructor() {
    this.goals = [];
    this.currentGoal = null;
  }

  addGoal(goal) {
    this.goals.push(goal);
  }

  update(delta) {
    // Evaluate all goals
    let bestGoal = null;
    let bestScore = -1;

    for (const goal of this.goals) {
      const score = goal.evaluate(this);
      if (score > bestScore) {
        bestScore = score;
        bestGoal = goal;
      }
    }

    // Switch goal if better one found
    if (bestGoal !== this.currentGoal) {
      if (this.currentGoal) {
        this.currentGoal.isActive = false;
      }
      this.currentGoal = bestGoal;
      if (bestGoal) {
        bestGoal.isActive = true;
      }
    }

    // Execute current goal
    if (this.currentGoal) {
      this.currentGoal.action(this, delta);
    }
  }
}
```

### Example NPC with Goals

```javascript
const npc = new GoalDrivenAgent();

// Goal 1: Flee when low health (high priority)
npc.addGoal(new Goal(
  'flee',
  10,
  (agent) => agent.hp < agent.maxHp * 0.25,
  (agent) => {
    agent.stateMachine.changeTo('flee');
  }
));

// Goal 2: Attack when close to player (medium priority)
npc.addGoal(new Goal(
  'attack',
  7,
  (agent) => agent.target && agent.position.distanceTo(agent.target.position) < 60,
  (agent) => {
    agent.stateMachine.changeTo('attack');
  }
));

// Goal 3: Chase when player visible (medium priority)
npc.addGoal(new Goal(
  'chase',
  5,
  (agent) => agent.vision.canSee(agent.playerTarget?.position),
  (agent) => {
    agent.stateMachine.changeTo('chase');
  }
));

// Goal 4: Patrol (low priority, default)
npc.addGoal(new Goal(
  'patrol',
  1,
  () => true, // Always valid
  (agent) => {
    agent.stateMachine.changeTo('patrol');
  }
));
```

### Benefits

- **Dynamic priorities**: Goals compete for execution
- **Context-aware**: Priorities change with game state
- **Composable**: Easy to add/remove goals
- **Debuggable**: Current goal name visible

## Path Planning & Navigation

Navigation mesh with A* pathfinding. Reference: `game/src/game/systems/AIManager.js` lines 534-732

### Build Navigation Mesh

```javascript
import { NavMesh, Vector3 } from 'yuka';

export function buildNavMesh(platforms) {
  const navMesh = new NavMesh();
  const polygons = [];

  for (const platform of platforms) {
    const bounds = platform.body.bounds;

    polygons.push([
      new Vector3(bounds.min.x, bounds.min.y - 5, 0),
      new Vector3(bounds.max.x, bounds.min.y - 5, 0),
      new Vector3(bounds.max.x, bounds.min.y, 0),
      new Vector3(bounds.min.x, bounds.min.y, 0),
    ]);
  }

  if (polygons.length > 0) {
    try {
      navMesh.fromPolygons(polygons);
    } catch (e) {
      console.warn('NavMesh generation failed:', e.message);
    }
  }

  return navMesh;
}
```

### A* Pathfinding

```javascript
export function findPath(navMesh, from, to) {
  const path = [];
  
  try {
    navMesh.findPath(from, to, path);
    
    if (path.length > 0) {
      return path;
    }

    // Fallback: A* on regions
    return aStarPathfinding(navMesh, from, to);
  } catch (error) {
    console.warn('Pathfinding failed:', error);
    return [from.clone(), to.clone()];
  }
}

function aStarPathfinding(navMesh, start, goal) {
  const regions = navMesh.regions || [];

  if (regions.length === 0) {
    return [start.clone(), goal.clone()];
  }

  const startRegion = findNearestRegion(start, regions);
  const goalRegion = findNearestRegion(goal, regions);

  if (!startRegion || !goalRegion) {
    return [start.clone(), goal.clone()];
  }

  if (startRegion === goalRegion) {
    return [start.clone(), goal.clone()];
  }

  // A* algorithm
  const openSet = new Set([startRegion]);
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map([[startRegion, 0]]);
  const fScore = new Map([[startRegion, heuristic(startRegion.centroid, goal)]]);

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    
    for (const region of openSet) {
      const f = fScore.get(region) || Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = region;
      }
    }

    if (current === goalRegion) {
      return reconstructPath(cameFrom, current, start, goal);
    }

    openSet.delete(current);
    closedSet.add(current);

    const neighbors = getRegionNeighbors(current, regions);
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;

      const tentativeG = (gScore.get(current) || Infinity) +
        current.centroid.distanceTo(neighbor.centroid);

      if (!openSet.has(neighbor)) {
        openSet.add(neighbor);
      } else if (tentativeG >= (gScore.get(neighbor) || Infinity)) {
        continue;
      }

      cameFrom.set(neighbor, current);
      gScore.set(neighbor, tentativeG);
      fScore.set(neighbor, tentativeG + heuristic(neighbor.centroid, goal));
    }
  }

  return [start.clone(), goal.clone()];
}
```

### Using Pathfinding

```javascript
import { FollowPathBehavior } from 'yuka';

function setEntityPath(enemy, targetPosition, navMesh) {
  const path = findPath(navMesh, enemy.position, targetPosition);

  if (path.length > 1) {
    const followPath = new FollowPathBehavior(path, 5);

    enemy.steering.behaviors = enemy.steering.behaviors.filter(
      b => !(b instanceof FollowPathBehavior)
    );

    enemy.steering.behaviors.push(followPath);
  }
}
```

### Best Practices

- **Build once**: Generate navmesh on chapter load, cache it
- **Share with tests**: Same navmesh for gameplay and Playwright AI
- **Fallback paths**: Always return a path (even direct line)
- **Validate regions**: Check for disconnected areas

## Testing AI Systems

### Unit Tests

```javascript
import { describe, it, expect } from 'vitest';
import { ThreatAssessment } from '../game/ai/BossAI.ts';

describe('ThreatAssessment', () => {
  it('should return high aggression for close low-health player', () => {
    const assessment = new ThreatAssessment();
    const aggression = assessment.evaluate(50, 10, 100);
    expect(aggression).toBeGreaterThan(0.7);
  });

  it('should return low aggression when far away', () => {
    const assessment = new ThreatAssessment();
    const aggression = assessment.evaluate(250, 50, 50);
    expect(aggression).toBeLessThan(0.3);
  });
});
```

### E2E Tests with AI Player

```javascript
import { test, expect } from '@playwright/test';

test('AI player completes chapter 1', async ({ page }) => {
  await page.goto('/game');
  
  // Initialize AI player
  await page.evaluate(() => {
    window.game.spawnAIPlayer();
  });

  // AI navigates to goal
  await page.waitForFunction(() => {
    return window.game.aiPlayer.reachedGoal;
  }, { timeout: 60000 });

  expect(await page.locator('.chapter-complete').isVisible()).toBe(true);
});
```

### Best Practices

- **Deterministic**: Use fixed seeds for randomness
- **Visual validation**: Capture videos of complex behaviors
- **Shared navmesh**: Same navigation for gameplay and tests
- **Fast feedback**: Unit test helper functions separately

## Maintenance Rules

✅ **DO:**
- Load behavior params from manifests
- Keep files <200 lines (split by responsibility)
- Use JSDoc for complex functions
- Test AI helpers with deterministic inputs

❌ **DON'T:**
- Hardcode magic numbers (use manifests)
- Create TypeScript-only patterns (ES modules only)
- Forget to clean up behaviors on state exit
- Build giant monolithic AI classes

## Summary

This reference provides production-ready AI patterns from Otterblade Odyssey:

- **FSM**: 6-state enemy behavior (idle, patrol, chase, attack, flee, hurt)
- **Steering**: YUKA behaviors (seek, flee, wander, arrive)
- **Perception**: Vision cones, memory system, hearing propagation
- **Fuzzy Logic**: Smooth threat assessment for bosses
- **Boss AI**: Multi-phase pattern system (Zephyros)
- **Goal-Driven**: Priority-based multi-objective agents
- **Pathfinding**: NavMesh + A* for complex navigation
- **Testing**: Unit tests + E2E with AI player

All examples are working code from `game/src/game/ai/` and `game/src/game/systems/AIManager.js`.

For implementation guidance, see:
- `docs/AI.md` - High-level concepts and integration
- `IMPLEMENTATION.md` - Game architecture
- `WORLD.md` - Lore and narrative context
