/**
 * BossAI.js
 * Zephyros boss with multi-phase system, fuzzy logic, attack patterns
 * per AI.md:1052-1182
 */

import { Vector3 } from 'yuka';
import { PerceptiveEntity } from './PerceptionSystem';

/**
 * Fuzzy logic for threat assessment (AI.md:870-953)
 */
export class ThreatAssessment {
  constructor() {
    // Fuzzy sets for distance
    this.distanceSets = {
      close: (d) => this.trapezoid(d, 0, 0, 50, 100),
      medium: (d) => this.trapezoid(d, 50, 100, 150, 200),
      far: (d) => this.trapezoid(d, 150, 200, 300, 300),
    };

    // Fuzzy sets for health
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
   */
  trapezoid(x, a, b, c, d) {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  }

  /**
   * Evaluate aggression level
   */
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

    // Rules
    const rules = [];

    // If close AND player low AND own high -> aggressive
    rules.push({
      strength: Math.min(distClose, playerLow, ownHigh),
      output: this.aggressionSets.aggressive,
    });

    // If far OR own low -> retreat
    rules.push({
      strength: Math.max(distFar, ownLow),
      output: this.aggressionSets.retreat,
    });

    // If medium distance AND medium health -> cautious
    rules.push({
      strength: Math.min(distMedium, ownMed),
      output: this.aggressionSets.cautious,
    });

    // If own high AND player high -> aggressive
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

/**
 * Boss attack pattern base
 */
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

  async execute(boss) {
    this.lastUsed = performance.now();
    // Override in subclasses
  }
}

/**
 * Frost Wave pattern (AI.md:1152-1182)
 */
export class FrostWavePattern extends BossPattern {
  constructor() {
    super('Frost Wave', 1, 4000, 25);
  }

  async execute(boss) {
    super.execute(boss);

    // Animation
    boss.currentAnimation = 'cast';
    await this.wait(500);

    // Create wave projectile
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

    // Sound and visual
    boss.audioManager?.playSFX('frost_wave');
    boss.spawnFrostParticles(boss.position, direction);

    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Ice Slash pattern (quick melee)
 */
export class IceSlashPattern extends BossPattern {
  constructor() {
    super('Ice Slash', 1, 2000, 10);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'slash';
    await this.wait(200);

    // Create hitbox
    boss.createAttackHitbox(50, 0, 60, 40, boss.damage, { x: 10, y: -3 });

    boss.audioManager?.playSFX('ice_slash');
    await this.wait(300);

    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Blizzard Zone pattern (area denial)
 */
export class BlizzardZonePattern extends BossPattern {
  constructor() {
    super('Blizzard Zone', 2, 8000, 50);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'summon';
    await this.wait(1000);

    // Create blizzard zone
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Ice Pillar Summon (Phase 2+)
 */
export class IcePillarPattern extends BossPattern {
  constructor() {
    super('Ice Pillar', 2, 6000, 30);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'summon';
    await this.wait(800);

    // Spawn ice pillars
    const playerX = boss.target.position.x;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 80;
      boss.spawnIcePillar(playerX + offset, boss.target.position.y + 50);
    }

    boss.audioManager?.playSFX('ice_pillar');
    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Absolute Zero (Ultimate, Phase 3)
 */
export class AbsoluteZeroPattern extends BossPattern {
  constructor() {
    super('Absolute Zero', 3, 15000, 80);
  }

  async execute(boss) {
    super.execute(boss);

    boss.currentAnimation = 'ultimate';

    // Screen freeze effect
    boss.gameState?.setSlowMotion(0.3);

    await this.wait(2000);

    // Massive AOE
    const distance = boss.position.distanceTo(boss.target.position);

    if (distance < 400) {
      // Player caught in AOE
      boss.gameState?.takeDamage(40);
      boss.gameState?.drainWarmth(this.warmthDrain);
      boss.gameState?.applyFreeze(3000); // 3 second freeze
    }

    // End slow motion
    boss.gameState?.setSlowMotion(1.0);

    boss.audioManager?.playSFX('absolute_zero');
    boss.currentAnimation = 'idle';
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Zephyros Boss AI (AI.md:1052-1182)
 */
export class ZephyrosAI extends PerceptiveEntity {
  constructor(config, gameState, audioManager) {
    super({
      fieldOfView: Math.PI, // Can see everything in front
      visionRange: 500,
      memorySpan: 5,
    });

    this.hp = config.health || 500;
    this.maxHp = this.hp;
    this.damage = config.damage || 35;
    this.speed = config.speed || 1.2;

    this.phase = 1;
    this.phaseHealthThresholds = [1.0, 0.6, 0.25];

    this.target = null;
    this.currentAnimation = 'idle';
    this.facingDirection = 1;

    this.gameState = gameState;
    this.audioManager = audioManager;

    // Projectiles and hazards
    this.projectiles = [];
    this.hazardZones = [];

    // Attack patterns
    this.patterns = [
      new IceSlashPattern(),
      new FrostWavePattern(),
      new BlizzardZonePattern(),
      new IcePillarPattern(),
      new AbsoluteZeroPattern(),
    ];

    this.threatAssessment = new ThreatAssessment();
    this.specialAttackCooldown = 0;

    this.position = new Vector3(config.x || 0, config.y || 0, 0);
  }

  update(delta) {
    // Check phase transitions
    const healthRatio = this.hp / this.maxHp;
    const newPhase = this.getPhaseForHealth(healthRatio);

    if (newPhase > this.phase) {
      this.phase = newPhase;
      this.onPhaseTransition();
    }

    // Update perception
    if (this.target) {
      this.updatePerception(this.target, delta);
    }

    // Cooldown
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown -= delta;
    }

    // Update projectiles
    this.updateProjectiles(delta);

    // Update hazard zones
    this.updateHazardZones();

    // Face target
    if (this.target) {
      this.facingDirection = this.target.position.x > this.position.x ? 1 : -1;
    }
  }

  getPhaseForHealth(ratio) {
    for (let i = this.phaseHealthThresholds.length - 1; i >= 0; i--) {
      if (ratio <= this.phaseHealthThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  onPhaseTransition() {
    console.log(`Zephyros Phase ${this.phase}!`);

    // Heal slightly
    this.hp = Math.min(this.maxHp, this.hp + 50);

    // Invulnerability during transition
    this.isInvulnerable = true;
    setTimeout(() => {
      this.isInvulnerable = false;
    }, 2000);

    // Visual effect
    this.phaseTransitionEffect = 60; // frames

    this.audioManager?.playSFX('boss_phase_change');
  }

  async selectAndExecuteAttack() {
    if (this.specialAttackCooldown > 0) return;
    if (!this.target) return;

    // Get available patterns for current phase
    const availablePatterns = this.patterns.filter(
      (p) => p.minPhase <= this.phase && p.cooldownReady()
    );

    if (availablePatterns.length === 0) return;

    // Use fuzzy logic to determine aggression
    const distance = this.position.distanceTo(this.target.position);
    const playerHealthPercent = (this.target.hp / this.target.maxHp) * 100;
    const ownHealthPercent = (this.hp / this.maxHp) * 100;

    const aggression = this.threatAssessment.evaluate(distance, playerHealthPercent, ownHealthPercent);

    // Select pattern based on aggression
    let selectedPattern;

    if (aggression > 0.75) {
      // High aggression - powerful attacks
      selectedPattern = this.selectHighPowerAttack(availablePatterns);
    } else if (aggression > 0.5) {
      // Medium - balanced
      selectedPattern = this.selectMediumPowerAttack(availablePatterns);
    } else {
      // Low - defensive
      selectedPattern = this.selectDefensivePattern(availablePatterns);
    }

    if (selectedPattern) {
      await selectedPattern.execute(this);
      this.specialAttackCooldown = 1.0; // 1 second between attacks
    }
  }

  selectHighPowerAttack(patterns) {
    const powerful = patterns.filter((p) => p.warmthDrain > 40);
    return powerful.length > 0 ? powerful[Math.floor(Math.random() * powerful.length)] : patterns[0];
  }

  selectMediumPowerAttack(patterns) {
    const medium = patterns.filter((p) => p.warmthDrain >= 20 && p.warmthDrain <= 40);
    return medium.length > 0 ? medium[Math.floor(Math.random() * medium.length)] : patterns[0];
  }

  selectDefensivePattern(patterns) {
    const defensive = patterns.filter((p) => p.name.includes('Zone') || p.name.includes('Pillar'));
    return defensive.length > 0 ? defensive[Math.floor(Math.random() * defensive.length)] : patterns[0];
  }

  updateProjectiles(delta) {
    const now = performance.now();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Update position
      proj.x += proj.vx * delta;
      proj.y += proj.vy * delta;

      // Check lifetime
      if (now - proj.createdAt > proj.lifetime) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateHazardZones() {
    const now = performance.now();

    for (let i = this.hazardZones.length - 1; i >= 0; i--) {
      const zone = this.hazardZones[i];

      if (now - zone.createdAt > zone.duration) {
        this.hazardZones.splice(i, 1);
      }
    }
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return;

    this.hp -= amount;
    this.damageFlashTimer = 10;

    if (this.hp <= 0) {
      this.onDeath();
    }

    this.audioManager?.playSFX('boss_hurt');
  }

  onDeath() {
    console.log('Zephyros defeated!');
    this.isDead = true;
    this.gameState?.onBossDefeated();

    // Death animation and effects
    this.currentAnimation = 'death';
    this.audioManager?.playSFX('boss_death');
  }

  createAttackHitbox(offsetX, offsetY, width, height, damage, knockback) {
    // Create temporary hitbox (handled by physics manager)
    return {
      x: this.position.x + offsetX * this.facingDirection,
      y: this.position.y + offsetY,
      width,
      height,
      damage,
      knockback,
      source: this,
      lifetime: 100,
      createdAt: performance.now(),
    };
  }

  spawnFrostParticles(position, direction) {
    // Particle spawning (handled by particle system)
  }

  spawnIcePillar(x, y) {
    // Spawn ice pillar hazard
    const pillar = {
      x: x - 20,
      y: y - 100,
      width: 40,
      height: 100,
      damage: 25,
      lifetime: 3000,
      createdAt: performance.now(),
    };

    this.hazardZones.push(pillar);
  }
}
