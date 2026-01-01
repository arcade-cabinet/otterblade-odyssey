# Otterblade Odyssey: AI Implementation Guide

> Comprehensive documentation for Yuka-based game AI, including FSM, steering behaviors, and perception systems.

## Table of Contents

1. [Yuka Overview](#yuka-overview)
2. [Entity Manager](#entity-manager)
3. [State Machines (FSM)](#state-machines-fsm)
4. [Steering Behaviors](#steering-behaviors)
5. [Perception System](#perception-system)
6. [Goal-Driven Agents](#goal-driven-agents)
7. [Fuzzy Logic](#fuzzy-logic)
8. [Path Planning](#path-planning)
9. [Boss AI Patterns](#boss-ai-patterns)
10. [NPC Behaviors](#npc-behaviors)

---

## Yuka Overview

Yuka is a JavaScript library for creating game AI. It provides:

- **Entity Management**: Update loop for AI entities
- **State Machines**: FSM for behavior states
- **Steering Behaviors**: Movement AI (seek, flee, wander, etc.)
- **Perception**: Vision cones, memory, event triggers
- **Goal-Driven AI**: Hierarchical goals for complex behavior
- **Fuzzy Logic**: Smooth decision making
- **Navigation Mesh**: 2D/3D pathfinding

### Installation

```bash
pnpm add yuka
pnpm add -D @types/yuka
```

### Basic Setup

```typescript
import {
  EntityManager,
  Time,
  GameEntity,
  StateMachine,
  State,
  Vehicle,
  SeekBehavior,
  FleeBehavior,
  WanderBehavior,
  ArriveBehavior,
  Vector3,
} from 'yuka';

// Create managers
const entityManager = new EntityManager();
const time = new Time();

// Game loop integration
function updateAI(delta: number): void {
  time.update();
  entityManager.update(time.getDelta());
}
```

---

## Entity Manager

### AI Manager Class

```typescript
class AIManager {
  private entityManager = new EntityManager();
  private time = new Time();
  private enemies: Map<string, EnemyAI> = new Map();
  private npcs: Map<string, NPCAI> = new Map();
  
  constructor() {
    // Set custom time scale for slow-motion effects
    this.time.timescale = 1;
  }
  
  update(delta: number): void {
    this.time.update();
    this.entityManager.update(this.time.getDelta());
  }
  
  addEnemy(id: string, enemy: EnemyAI): void {
    this.enemies.set(id, enemy);
    this.entityManager.add(enemy);
  }
  
  removeEnemy(id: string): void {
    const enemy = this.enemies.get(id);
    if (enemy) {
      this.entityManager.remove(enemy);
      this.enemies.delete(id);
    }
  }
  
  addNPC(id: string, npc: NPCAI): void {
    this.npcs.set(id, npc);
    this.entityManager.add(npc);
  }
  
  setSlowMotion(scale: number): void {
    this.time.timescale = scale;
  }
  
  getEnemy(id: string): EnemyAI | undefined {
    return this.enemies.get(id);
  }
  
  getAllEnemiesInRange(position: Vector3, radius: number): EnemyAI[] {
    const result: EnemyAI[] = [];
    
    for (const enemy of this.enemies.values()) {
      if (enemy.position.distanceTo(position) <= radius) {
        result.push(enemy);
      }
    }
    
    return result;
  }
}

export const aiManager = new AIManager();
```

---

## State Machines (FSM)

### State Base Class

```typescript
import { State, StateMachine } from 'yuka';

/**
 * Base state with typed owner for better TypeScript support.
 */
abstract class TypedState<T extends GameEntity> extends State<T> {
  abstract enter(owner: T): void;
  abstract execute(owner: T): void;
  abstract exit(owner: T): void;
  
  // Optional message handling
  onMessage(owner: T, telegram: any): boolean {
    return false;
  }
}
```

### Enemy States

```typescript
/**
 * IDLE: Standing around, occasionally looking around.
 */
class IdleState extends TypedState<EnemyAI> {
  private idleTime = 0;
  private maxIdleTime = 120; // frames
  
  enter(enemy: EnemyAI): void {
    this.idleTime = 0;
    this.maxIdleTime = 60 + Math.random() * 120;
    
    // Clear steering
    enemy.steering.behaviors.length = 0;
    enemy.velocity.set(0, 0, 0);
  }
  
  execute(enemy: EnemyAI): void {
    this.idleTime++;
    
    // Check for player in aggro range
    const distToPlayer = enemy.position.distanceTo(playerPosition);
    if (distToPlayer < enemy.aggroRadius) {
      enemy.target = player;
      enemy.stateMachine.changeTo('chase');
      return;
    }
    
    // Transition to patrol after idle
    if (this.idleTime > this.maxIdleTime) {
      enemy.stateMachine.changeTo('patrol');
    }
  }
  
  exit(enemy: EnemyAI): void {
    // Optional cleanup
  }
}

/**
 * PATROL: Wander within patrol zone.
 */
class PatrolState extends TypedState<EnemyAI> {
  private wanderBehavior: WanderBehavior;
  
  constructor() {
    super();
    this.wanderBehavior = new WanderBehavior();
    this.wanderBehavior.jitter = 10;
    this.wanderBehavior.radius = 20;
    this.wanderBehavior.distance = 50;
  }
  
  enter(enemy: EnemyAI): void {
    enemy.steering.behaviors.push(this.wanderBehavior);
    enemy.maxSpeed = enemy.patrolSpeed;
  }
  
  execute(enemy: EnemyAI): void {
    // Check for player
    const distToPlayer = enemy.position.distanceTo(playerPosition);
    if (distToPlayer < enemy.aggroRadius) {
      enemy.target = player;
      enemy.stateMachine.changeTo('chase');
      return;
    }
    
    // Check patrol bounds
    if (!enemy.isWithinPatrolZone()) {
      // Turn around
      enemy.velocity.multiplyScalar(-1);
    }
    
    // Occasional return to idle
    if (Math.random() < 0.001) {
      enemy.stateMachine.changeTo('idle');
    }
  }
  
  exit(enemy: EnemyAI): void {
    const index = enemy.steering.behaviors.indexOf(this.wanderBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

/**
 * CHASE: Pursue the player.
 */
class ChaseState extends TypedState<EnemyAI> {
  private seekBehavior: SeekBehavior;
  
  constructor() {
    super();
    this.seekBehavior = new SeekBehavior();
  }
  
  enter(enemy: EnemyAI): void {
    this.seekBehavior.target = enemy.target!.position;
    enemy.steering.behaviors.push(this.seekBehavior);
    enemy.maxSpeed = enemy.chaseSpeed;
    
    // Alert sound
    audioManager.playSFX('enemy_alert');
  }
  
  execute(enemy: EnemyAI): void {
    if (!enemy.target) {
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
  
  exit(enemy: EnemyAI): void {
    const index = enemy.steering.behaviors.indexOf(this.seekBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

/**
 * ATTACK: Execute attacks on target.
 */
class AttackState extends TypedState<EnemyAI> {
  private cooldown = 0;
  private attackCooldown = 60; // frames
  
  enter(enemy: EnemyAI): void {
    this.cooldown = 0;
    enemy.velocity.set(0, 0, 0);
    enemy.steering.behaviors.length = 0;
  }
  
  execute(enemy: EnemyAI): void {
    if (!enemy.target) {
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
      enemy.attack();
      this.cooldown = 0;
    }
  }
  
  exit(enemy: EnemyAI): void {}
}

/**
 * FLEE: Run away when low health.
 */
class FleeState extends TypedState<EnemyAI> {
  private fleeBehavior: FleeBehavior;
  
  constructor() {
    super();
    this.fleeBehavior = new FleeBehavior();
  }
  
  enter(enemy: EnemyAI): void {
    this.fleeBehavior.target = enemy.target?.position ?? playerPosition;
    enemy.steering.behaviors.push(this.fleeBehavior);
    enemy.maxSpeed = enemy.chaseSpeed * 1.2; // Faster when fleeing
  }
  
  execute(enemy: EnemyAI): void {
    const distToThreat = enemy.position.distanceTo(playerPosition);
    
    // Recovered enough distance
    if (distToThreat > enemy.aggroRadius * 2) {
      enemy.stateMachine.changeTo('patrol');
      return;
    }
    
    // Regained health somehow
    if (enemy.hp > enemy.maxHp * 0.5) {
      enemy.stateMachine.changeTo('chase');
    }
  }
  
  exit(enemy: EnemyAI): void {
    const index = enemy.steering.behaviors.indexOf(this.fleeBehavior);
    if (index > -1) {
      enemy.steering.behaviors.splice(index, 1);
    }
  }
}

/**
 * HURT: Stagger when taking damage.
 */
class HurtState extends TypedState<EnemyAI> {
  private staggerTime = 0;
  private maxStagger = 20; // frames
  
  enter(enemy: EnemyAI): void {
    this.staggerTime = 0;
    enemy.velocity.set(0, 0, 0);
    enemy.steering.behaviors.length = 0;
  }
  
  execute(enemy: EnemyAI): void {
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
  
  exit(enemy: EnemyAI): void {}
}
```

### Enemy AI Entity

```typescript
import { Vehicle, StateMachine, SteeringBehavior } from 'yuka';

class EnemyAI extends Vehicle {
  stateMachine: StateMachine<EnemyAI>;
  target: GameEntity | null = null;
  
  // Config
  hp: number;
  maxHp: number;
  damage: number;
  aggroRadius: number;
  attackRange: number;
  patrolSpeed: number;
  chaseSpeed: number;
  patrolZone: { x: number; width: number };
  
  // State
  isAlerted = false;
  facingDirection = 1;
  
  constructor(config: EnemyConfig) {
    super();
    
    this.hp = config.health;
    this.maxHp = config.health;
    this.damage = config.damage;
    this.aggroRadius = config.aggroRadius;
    this.attackRange = config.attackRange ?? 50;
    this.patrolSpeed = config.speed * 0.5;
    this.chaseSpeed = config.speed;
    this.patrolZone = config.patrolZone;
    
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
  
  update(delta: number): this {
    // Update FSM
    this.stateMachine.update();
    
    // Update facing direction
    if (Math.abs(this.velocity.x) > 0.1) {
      this.facingDirection = this.velocity.x > 0 ? 1 : -1;
    }
    
    return super.update(delta);
  }
  
  attack(): void {
    if (!this.target) return;
    
    // Create attack hitbox
    createEnemyAttackHitbox(this, this.damage);
    
    // Animation trigger
    this.playAnimation('attack');
  }
  
  takeDamage(amount: number): void {
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.die();
    } else {
      this.stateMachine.changeTo('hurt');
    }
  }
  
  die(): void {
    // Spawn death particles
    spawnDeathParticles(this.position);
    
    // Drop loot
    dropLoot(this.position, this.enemyType);
    
    // Remove from manager
    aiManager.removeEnemy(this.uuid);
  }
  
  isWithinPatrolZone(): boolean {
    return this.position.x >= this.patrolZone.x &&
           this.position.x <= this.patrolZone.x + this.patrolZone.width;
  }
  
  playAnimation(name: string): void {
    // Interface with animation system
    animationManager.play(this.uuid, name);
  }
}
```

---

## Steering Behaviors

### Available Behaviors

```typescript
import {
  SeekBehavior,
  FleeBehavior,
  ArriveBehavior,
  PursuitBehavior,
  EvadeBehavior,
  WanderBehavior,
  FollowPathBehavior,
  ObstacleAvoidanceBehavior,
  SeparationBehavior,
  AlignmentBehavior,
  CohesionBehavior,
} from 'yuka';

/**
 * Configure common behavior combinations for enemy types.
 */
class SteeringPresets {
  /**
   * Scout: Quick, aggressive pursuit.
   */
  static scout(enemy: EnemyAI, target: GameEntity): void {
    const pursuit = new PursuitBehavior();
    pursuit.target = target;
    pursuit.weight = 1;
    
    enemy.steering.behaviors.push(pursuit);
  }
  
  /**
   * Frostwolf: Pack behavior with separation.
   */
  static frostwolf(enemy: EnemyAI, target: GameEntity, packmates: EnemyAI[]): void {
    const pursuit = new PursuitBehavior();
    pursuit.target = target;
    pursuit.weight = 0.8;
    
    const separation = new SeparationBehavior();
    separation.entities = packmates;
    separation.weight = 0.3;
    
    enemy.steering.behaviors.push(pursuit, separation);
  }
  
  /**
   * Icebat: Erratic flying pattern.
   */
  static icebat(enemy: EnemyAI): void {
    const wander = new WanderBehavior();
    wander.jitter = 50;
    wander.radius = 30;
    wander.distance = 20;
    wander.weight = 0.5;
    
    enemy.steering.behaviors.push(wander);
  }
  
  /**
   * Boss: Strategic movement with obstacle avoidance.
   */
  static boss(enemy: EnemyAI, target: GameEntity, obstacles: GameEntity[]): void {
    const arrive = new ArriveBehavior();
    arrive.target = target.position;
    arrive.deceleration = 1.5;
    arrive.weight = 0.7;
    
    const avoidance = new ObstacleAvoidanceBehavior();
    avoidance.obstacles = obstacles;
    avoidance.weight = 1.5;
    
    enemy.steering.behaviors.push(arrive, avoidance);
  }
}
```

### Custom Steering Behavior

```typescript
import { SteeringBehavior, Vector3 } from 'yuka';

/**
 * Circle around target at a distance.
 */
class CircleBehavior extends SteeringBehavior {
  target: Vector3 = new Vector3();
  radius: number = 100;
  angularSpeed: number = 1;
  clockwise: boolean = true;
  
  private angle: number = 0;
  
  calculate(vehicle: Vehicle, force: Vector3, delta: number): Vector3 {
    // Update angle
    this.angle += this.angularSpeed * delta * (this.clockwise ? 1 : -1);
    
    // Calculate desired position on circle
    const desiredX = this.target.x + Math.cos(this.angle) * this.radius;
    const desiredY = this.target.y + Math.sin(this.angle) * this.radius;
    
    // Seek toward that position
    force.x = desiredX - vehicle.position.x;
    force.y = desiredY - vehicle.position.y;
    force.normalize();
    force.multiplyScalar(vehicle.maxSpeed);
    
    // Subtract current velocity
    force.sub(vehicle.velocity);
    
    return force;
  }
}

/**
 * Strafe side-to-side while facing target.
 */
class StrafeBehavior extends SteeringBehavior {
  target: Vector3 = new Vector3();
  strafeDistance: number = 50;
  strafeSpeed: number = 0.02;
  
  private strafeOffset: number = 0;
  
  calculate(vehicle: Vehicle, force: Vector3, delta: number): Vector3 {
    // Oscillate strafe offset
    this.strafeOffset += this.strafeSpeed * delta;
    
    // Vector to target
    const toTarget = new Vector3().subVectors(this.target, vehicle.position);
    const distance = toTarget.length();
    toTarget.normalize();
    
    // Perpendicular vector for strafing
    const perpendicular = new Vector3(-toTarget.y, toTarget.x, 0);
    
    // Strafe position
    const strafeAmount = Math.sin(this.strafeOffset) * this.strafeDistance;
    
    force.copy(perpendicular).multiplyScalar(strafeAmount);
    
    return force;
  }
}
```

---

## Perception System

### Vision Cone

```typescript
import { GameEntity, MemorySystem, MemoryRecord, Vision } from 'yuka';

class PerceptiveEnemy extends EnemyAI {
  vision: Vision;
  memory: MemorySystem<GameEntity>;
  
  constructor(config: EnemyConfig) {
    super(config);
    
    // Setup vision
    this.vision = new Vision(this);
    this.vision.fieldOfView = Math.PI * 0.6; // 108 degrees
    this.vision.range = config.aggroRadius;
    
    // Setup memory
    this.memory = new MemorySystem(this);
    this.memory.memorySpan = 3; // Remember for 3 seconds
  }
  
  update(delta: number): this {
    // Check vision for player
    if (this.vision.visible(player.position)) {
      // Create or update memory record
      const record = this.memory.getRecord(player);
      
      if (record) {
        record.lastSensedTime = 0;
        record.position.copy(player.position);
      } else {
        const newRecord = new MemoryRecord(player);
        newRecord.position.copy(player.position);
        this.memory.records.push(newRecord);
      }
      
      this.target = player;
    }
    
    // Resolve memories (forget old ones)
    this.memory.update(delta);
    
    // Use last known position if no visual
    if (!this.target) {
      const playerMemory = this.memory.getRecord(player);
      if (playerMemory && playerMemory.lastSensedTime < 2) {
        this.lastKnownPlayerPos = playerMemory.position.clone();
      }
    }
    
    return super.update(delta);
  }
}
```

### Hearing System

```typescript
interface SoundEvent {
  position: Vector3;
  loudness: number;
  type: 'footstep' | 'attack' | 'item' | 'damage';
  timestamp: number;
}

class HearingSystem {
  private sounds: SoundEvent[] = [];
  private maxSounds = 10;
  
  emit(event: SoundEvent): void {
    this.sounds.push(event);
    
    // Trim old sounds
    if (this.sounds.length > this.maxSounds) {
      this.sounds.shift();
    }
    
    // Notify nearby enemies
    const nearbyEnemies = aiManager.getAllEnemiesInRange(
      event.position,
      event.loudness * 100
    );
    
    for (const enemy of nearbyEnemies) {
      if (enemy instanceof PerceptiveEnemy) {
        enemy.onHearSound(event);
      }
    }
  }
  
  update(delta: number): void {
    // Remove old sounds
    const now = performance.now();
    this.sounds = this.sounds.filter(s => now - s.timestamp < 2000);
  }
}

// Extend PerceptiveEnemy
class PerceptiveEnemy extends EnemyAI {
  onHearSound(event: SoundEvent): void {
    // If idle or patrolling, investigate
    const currentState = this.stateMachine.currentState;
    
    if (currentState.name === 'idle' || currentState.name === 'patrol') {
      this.investigatePosition = event.position.clone();
      this.stateMachine.changeTo('investigate');
    }
  }
}
```

---

## Goal-Driven Agents

### Goal System

```typescript
import { Goal, CompositeGoal, GoalEvaluator, Think } from 'yuka';

/**
 * Complex boss with goal-driven behavior.
 */
class BossGoalSystem {
  thinkGoal: Think;
  evaluators: GoalEvaluator[];
  
  constructor(boss: BossAI) {
    this.thinkGoal = new Think(boss);
    
    // Add goal evaluators
    this.thinkGoal.addEvaluator(new AttackEvaluator());
    this.thinkGoal.addEvaluator(new DefendEvaluator());
    this.thinkGoal.addEvaluator(new SummonEvaluator());
    this.thinkGoal.addEvaluator(new HealEvaluator());
    this.thinkGoal.addEvaluator(new SpecialAttackEvaluator());
  }
  
  update(): void {
    this.thinkGoal.execute();
  }
}

/**
 * Evaluate desirability of attacking.
 */
class AttackEvaluator extends GoalEvaluator<BossAI> {
  calculateDesirability(boss: BossAI): number {
    if (!boss.target) return 0;
    
    const distance = boss.position.distanceTo(boss.target.position);
    const healthRatio = boss.hp / boss.maxHp;
    
    // More desirable when close and healthy
    let desirability = 0.5;
    
    if (distance < boss.attackRange) {
      desirability += 0.3;
    }
    
    if (healthRatio > 0.5) {
      desirability += 0.2;
    }
    
    return desirability;
  }
  
  setGoal(boss: BossAI): void {
    boss.brain.addSubgoal(new AttackGoal(boss));
  }
}

/**
 * Composite goal for attack sequence.
 */
class AttackGoal extends CompositeGoal<BossAI> {
  activate(): void {
    this.addSubgoal(new ApproachTargetGoal(this.owner));
    this.addSubgoal(new ExecuteAttackGoal(this.owner));
    this.addSubgoal(new RecoverGoal(this.owner));
  }
  
  execute(): void {
    this.executeSubgoals();
  }
  
  terminate(): void {
    this.clearSubgoals();
  }
}
```

---

## Fuzzy Logic

### Fuzzy Decision Making

```typescript
import { FuzzyModule, FuzzyVariable, FuzzySet, FuzzyRule } from 'yuka';

/**
 * Fuzzy logic for threat assessment.
 */
class ThreatAssessment {
  fuzzyModule: FuzzyModule;
  
  constructor() {
    this.fuzzyModule = new FuzzyModule();
    
    // Input: Distance to player
    const distance = new FuzzyVariable();
    distance.add(new FuzzySet('close', 0, 0, 50, 100));
    distance.add(new FuzzySet('medium', 50, 100, 150, 200));
    distance.add(new FuzzySet('far', 150, 200, 300, 300));
    this.fuzzyModule.addVariable('distance', distance);
    
    // Input: Player health
    const playerHealth = new FuzzyVariable();
    playerHealth.add(new FuzzySet('low', 0, 0, 25, 50));
    playerHealth.add(new FuzzySet('medium', 25, 50, 75, 100));
    playerHealth.add(new FuzzySet('high', 50, 75, 100, 100));
    this.fuzzyModule.addVariable('playerHealth', playerHealth);
    
    // Input: Own health
    const ownHealth = new FuzzyVariable();
    ownHealth.add(new FuzzySet('low', 0, 0, 25, 50));
    ownHealth.add(new FuzzySet('medium', 25, 50, 75, 100));
    ownHealth.add(new FuzzySet('high', 50, 75, 100, 100));
    this.fuzzyModule.addVariable('ownHealth', ownHealth);
    
    // Output: Aggression level
    const aggression = new FuzzyVariable();
    aggression.add(new FuzzySet('retreat', 0, 0, 25, 50));
    aggression.add(new FuzzySet('cautious', 25, 50, 50, 75));
    aggression.add(new FuzzySet('aggressive', 50, 75, 100, 100));
    this.fuzzyModule.addVariable('aggression', aggression);
    
    // Rules
    this.addRules();
  }
  
  private addRules(): void {
    const fm = this.fuzzyModule;
    
    // If close AND player health low AND own health high -> very aggressive
    fm.addRule(new FuzzyRule(
      fm.and(
        fm.getVariable('distance').getSet('close'),
        fm.getVariable('playerHealth').getSet('low'),
        fm.getVariable('ownHealth').getSet('high')
      ),
      fm.getVariable('aggression').getSet('aggressive')
    ));
    
    // If far OR own health low -> retreat
    fm.addRule(new FuzzyRule(
      fm.or(
        fm.getVariable('distance').getSet('far'),
        fm.getVariable('ownHealth').getSet('low')
      ),
      fm.getVariable('aggression').getSet('retreat')
    ));
    
    // If medium distance AND medium health -> cautious
    fm.addRule(new FuzzyRule(
      fm.and(
        fm.getVariable('distance').getSet('medium'),
        fm.getVariable('ownHealth').getSet('medium')
      ),
      fm.getVariable('aggression').getSet('cautious')
    ));
  }
  
  evaluate(distance: number, playerHealth: number, ownHealth: number): number {
    this.fuzzyModule.fuzzify('distance', distance);
    this.fuzzyModule.fuzzify('playerHealth', playerHealth);
    this.fuzzyModule.fuzzify('ownHealth', ownHealth);
    
    return this.fuzzyModule.defuzzify('aggression');
  }
}
```

---

## Path Planning

### 2D Navigation

For side-scrolling, we use a simplified pathfinding:

```typescript
/**
 * Simple 2D pathfinding for platformer.
 */
class PlatformerPathfinder {
  private platforms: Platform[];
  private jumpHeight: number;
  
  constructor(platforms: Platform[], jumpHeight: number) {
    this.platforms = platforms;
    this.jumpHeight = jumpHeight;
  }
  
  findPath(start: Vector3, end: Vector3): Vector3[] {
    const path: Vector3[] = [start.clone()];
    
    // Get platforms between start and end
    const relevantPlatforms = this.getPlatformsBetween(start.x, end.x);
    
    // Simple left-to-right or right-to-left traversal
    const direction = end.x > start.x ? 1 : -1;
    let currentPos = start.clone();
    
    for (const platform of relevantPlatforms) {
      const platformCenter = platform.getCenter();
      
      // Can we reach this platform?
      if (this.canReach(currentPos, platformCenter)) {
        path.push(platformCenter.clone());
        currentPos = platformCenter.clone();
      } else {
        // Need intermediate waypoints
        const waypoints = this.findIntermediateWaypoints(currentPos, platformCenter);
        path.push(...waypoints);
        currentPos = platformCenter.clone();
      }
    }
    
    path.push(end.clone());
    return path;
  }
  
  private canReach(from: Vector3, to: Vector3): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = to.y - from.y;
    
    // Can jump up to this height
    if (dy < 0 && Math.abs(dy) > this.jumpHeight) {
      return false;
    }
    
    // Can fall any distance
    // Horizontal distance is walkable
    return true;
  }
  
  private getPlatformsBetween(x1: number, x2: number): Platform[] {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    
    return this.platforms
      .filter(p => p.x + p.width > minX && p.x < maxX)
      .sort((a, b) => a.x - b.x);
  }
  
  private findIntermediateWaypoints(from: Vector3, to: Vector3): Vector3[] {
    // Simplified: jump if going up, walk off if going down
    const waypoints: Vector3[] = [];
    
    if (to.y < from.y) {
      // Going up - need to jump
      waypoints.push(new Vector3(to.x, from.y, 0));
    } else {
      // Going down - walk off edge
      waypoints.push(new Vector3(to.x, from.y, 0));
    }
    
    return waypoints;
  }
}
```

---

## Boss AI Patterns

### Zephyros Boss AI

```typescript
class ZephyrosAI extends EnemyAI {
  phase: number = 1;
  phaseHealthThresholds = [1.0, 0.6, 0.25];
  specialAttackCooldown: number = 0;
  
  // Attack patterns
  private patterns: BossPattern[] = [
    new IceSlashPattern(),
    new FrostWavePattern(),
    new BlizzardZonePattern(),
    new FrozenGalePattern(),
    new IcePillarSummonPattern(),
    new AbsoluteZeroPattern(),
  ];
  
  constructor() {
    super({
      health: 500,
      damage: 35,
      aggroRadius: 500,
      attackRange: 60,
      speed: 1.2,
    });
    
    // Boss-specific states
    this.stateMachine.add('phase_transition', new PhaseTransitionState());
    this.stateMachine.add('special_attack', new SpecialAttackState());
    
    // Use fuzzy logic for attack selection
    this.threatAssessment = new ThreatAssessment();
  }
  
  update(delta: number): this {
    // Check phase transitions
    const healthRatio = this.hp / this.maxHp;
    const newPhase = this.getPhaseForHealth(healthRatio);
    
    if (newPhase > this.phase) {
      this.phase = newPhase;
      this.stateMachine.changeTo('phase_transition');
    }
    
    // Cooldown management
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown -= delta;
    }
    
    return super.update(delta);
  }
  
  selectAttack(): BossPattern {
    const availablePatterns = this.patterns.filter(p => 
      p.minPhase <= this.phase && p.cooldownReady()
    );
    
    // Use aggression level from fuzzy logic
    const aggression = this.threatAssessment.evaluate(
      this.position.distanceTo(player.position),
      player.hp / player.maxHp * 100,
      this.hp / this.maxHp * 100
    );
    
    // Higher aggression = more powerful attacks
    if (aggression > 75) {
      return this.selectHighPowerAttack(availablePatterns);
    } else if (aggression > 50) {
      return this.selectMediumPowerAttack(availablePatterns);
    } else {
      return this.selectDefensivePattern(availablePatterns);
    }
  }
  
  private getPhaseForHealth(ratio: number): number {
    for (let i = this.phaseHealthThresholds.length - 1; i >= 0; i--) {
      if (ratio <= this.phaseHealthThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }
}

/**
 * Boss attack pattern base.
 */
abstract class BossPattern {
  abstract name: string;
  abstract minPhase: number;
  abstract cooldown: number;
  abstract warmthDrain: number;
  
  protected lastUsed: number = 0;
  
  cooldownReady(): boolean {
    return performance.now() - this.lastUsed > this.cooldown;
  }
  
  abstract execute(boss: ZephyrosAI): Promise<void>;
}

class FrostWavePattern extends BossPattern {
  name = 'Frost Wave';
  minPhase = 1;
  cooldown = 4000;
  warmthDrain = 25;
  
  async execute(boss: ZephyrosAI): Promise<void> {
    this.lastUsed = performance.now();
    
    // Animation
    boss.playAnimation('cast');
    await wait(500);
    
    // Create wave projectile
    const direction = boss.facingDirection;
    const wave = createFrostWaveProjectile(
      boss.position.x + direction * 30,
      boss.position.y,
      direction,
      boss.damage * 0.7,
      this.warmthDrain
    );
    
    // Sound
    audioManager.playSFX('frost_wave');
    
    // Visual
    spawnFrostParticles(boss.position, direction);
  }
}
```

---

## NPC Behaviors

### NPC AI for Non-Combat Characters

```typescript
class NPCAI extends GameEntity {
  behaviorType: 'idle' | 'patrol' | 'follow' | 'scripted';
  patrolPath: Vector3[] = [];
  private currentWaypoint = 0;
  
  // Interaction state
  canInteract = true;
  interactRadius = 60;
  currentAnimation = 'idle';
  
  constructor(config: NPCConfig) {
    super();
    
    this.behaviorType = config.behavior?.type ?? 'idle';
    this.patrolPath = config.behavior?.patrolPath ?? [];
  }
  
  update(delta: number): this {
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
      case 'scripted':
        // Handled by sequence system
        break;
    }
    
    return this;
  }
  
  private updateIdle(delta: number): void {
    // Occasional idle animations
    if (Math.random() < 0.001) {
      this.currentAnimation = 'look_around';
      setTimeout(() => {
        this.currentAnimation = 'idle';
      }, 2000);
    }
  }
  
  private updatePatrol(delta: number): void {
    if (this.patrolPath.length === 0) return;
    
    const target = this.patrolPath[this.currentWaypoint];
    const dist = this.position.distanceTo(target);
    
    if (dist < 5) {
      // Reached waypoint
      this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
    } else {
      // Move toward waypoint
      const direction = new Vector3().subVectors(target, this.position).normalize();
      this.position.add(direction.multiplyScalar(delta * 0.5));
      
      this.currentAnimation = 'walk';
    }
  }
  
  private updateFollow(delta: number): void {
    const dist = this.position.distanceTo(player.position);
    
    if (dist > 100) {
      // Move toward player
      const direction = new Vector3().subVectors(player.position, this.position).normalize();
      this.position.add(direction.multiplyScalar(delta * 0.8));
      this.currentAnimation = 'walk';
    } else if (dist < 60) {
      // Too close, back off
      const direction = new Vector3().subVectors(this.position, player.position).normalize();
      this.position.add(direction.multiplyScalar(delta * 0.3));
      this.currentAnimation = 'walk';
    } else {
      this.currentAnimation = 'idle';
    }
  }
  
  /**
   * Called when player interacts.
   */
  interact(): void {
    if (!this.canInteract) return;
    
    // Face player
    this.facingDirection = player.position.x > this.position.x ? 1 : -1;
    
    // Trigger gesture
    this.playGesture(this.interaction?.gesture ?? 'wave');
    
    // Execute actions
    for (const action of this.interaction?.actions ?? []) {
      executeAction(action);
    }
  }
  
  playGesture(gesture: string): void {
    this.currentAnimation = gesture;
    
    // Return to idle after gesture
    setTimeout(() => {
      this.currentAnimation = 'idle';
    }, 1500);
  }
  
  /**
   * Move along scripted path with Yuka pathfinding.
   */
  async moveAlongPath(waypoints: Vector3[], speed: number): Promise<void> {
    for (const waypoint of waypoints) {
      await this.moveToPoint(waypoint, speed);
    }
  }
  
  private async moveToPoint(target: Vector3, speed: number): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const dist = this.position.distanceTo(target);
        
        if (dist < 5) {
          clearInterval(interval);
          resolve();
          return;
        }
        
        const direction = new Vector3().subVectors(target, this.position).normalize();
        this.position.add(direction.multiplyScalar(speed / 60));
        this.currentAnimation = 'walk';
      }, 1000 / 60);
    });
  }
}
```

---

## Integration with Game Loop

```typescript
// In main game loop
function gameLoop(): void {
  const delta = clock.getDelta();
  
  // 1. Process input
  const input = inputManager.getState();
  
  // 2. Update player physics
  updatePlayerPhysics(player, input, delta);
  
  // 3. Update AI
  aiManager.update(delta);
  
  // 4. Update physics engine
  Engine.update(engine, delta * 1000);
  
  // 5. Sync AI positions with physics bodies
  syncAIWithPhysics();
  
  // 6. Update triggers
  triggerSystem.update(player.position, gameState);
  
  // 7. Render
  render();
  
  requestAnimationFrame(gameLoop);
}

function syncAIWithPhysics(): void {
  for (const [id, enemy] of aiManager.enemies) {
    const body = physicsManager.getBody(id);
    if (body) {
      // Copy AI position to physics body
      Body.setPosition(body, {
        x: enemy.position.x,
        y: enemy.position.y,
      });
      
      // Copy physics velocity back to AI
      enemy.velocity.set(body.velocity.x, body.velocity.y, 0);
    }
  }
}
```

---

*"AI is the soul of the Galeborn. Make them feel alive, and the player will feel alive too."*
