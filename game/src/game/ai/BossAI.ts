/**
 * BossAI.ts
 * Zephyros boss with multi-phase system, fuzzy logic, attack patterns.
 */

import { Vector3 } from 'yuka';
import { PerceptiveEntity } from './PerceptionSystem';
import type { AudioSystem } from '../types/systems';

interface BossTarget {
  position: Vector3;
  hp: number;
  maxHp: number;
}

interface BossConfig {
  x?: number;
  y?: number;
  health?: number;
  damage?: number;
  speed?: number;
}

interface BossProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  warmthDrain?: number;
  lifetime: number;
  createdAt: number;
}

interface HazardZone {
  x: number;
  y: number;
  width: number;
  height: number;
  duration?: number;
  damage: number;
  warmthDrain: number;
  createdAt: number;
}

interface GameStateHandlers {
  takeDamage(amount: number): void;
  drainWarmth(amount: number): void;
  setSlowMotion?(durationMs: number): void;
  onBossDefeated?(): void;
  applyFreeze?(durationMs: number): void;
}

/**
 * Fuzzy logic for threat assessment.
 */
export class ThreatAssessment {
  private distanceSets: Record<string, (d: number) => number>;
  private healthSets: Record<string, (h: number) => number>;
  private aggressionSets: Record<string, number>;

  constructor() {
    this.distanceSets = {
      close: (d) => this.trapezoid(d, 0, 0, 50, 100),
      medium: (d) => this.trapezoid(d, 50, 100, 150, 200),
      far: (d) => this.trapezoid(d, 150, 200, 300, 300),
    };

    this.healthSets = {
      low: (h) => this.trapezoid(h, 0, 0, 25, 50),
      medium: (h) => this.trapezoid(h, 25, 50, 75, 100),
      high: (h) => this.trapezoid(h, 50, 75, 100, 100),
    };

    this.aggressionSets = {
      retreat: 0,
      cautious: 0.5,
      aggressive: 1.0,
    };
  }

  private trapezoid(x: number, a: number, b: number, c: number, d: number): number {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x < b) return (x - a) / (b - a);
    return (d - x) / (d - c);
  }

  evaluate(distance: number, playerHealth: number, ownHealth: number): number {
    const distClose = this.distanceSets.close(distance);
    const distMedium = this.distanceSets.medium(distance);
    const distFar = this.distanceSets.far(distance);

    const playerLow = this.healthSets.low(playerHealth);
    const playerHigh = this.healthSets.high(playerHealth);

    const ownLow = this.healthSets.low(ownHealth);
    const ownMed = this.healthSets.medium(ownHealth);
    const ownHigh = this.healthSets.high(ownHealth);

    const rules = [];

    rules.push({
      strength: Math.min(distClose, playerLow, ownHigh),
      output: this.aggressionSets.aggressive,
    });

    rules.push({
      strength: Math.max(distFar, ownLow),
      output: this.aggressionSets.retreat,
    });

    rules.push({
      strength: Math.min(distMedium, ownMed),
      output: this.aggressionSets.cautious,
    });

    rules.push({
      strength: Math.min(ownHigh, playerHigh),
      output: this.aggressionSets.aggressive,
    });

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
 * Boss attack pattern base.
 */
export class BossPattern {
  name: string;
  minPhase: number;
  cooldown: number;
  warmthDrain: number;
  lastUsed: number;

  constructor(name: string, minPhase: number, cooldown: number, warmthDrain: number) {
    this.name = name;
    this.minPhase = minPhase;
    this.cooldown = cooldown;
    this.warmthDrain = warmthDrain;
    this.lastUsed = 0;
  }

  cooldownReady(): boolean {
    return performance.now() - this.lastUsed > this.cooldown;
  }

  async execute(_boss: ZephyrosAI): Promise<void> {
    this.lastUsed = performance.now();
  }
}

export class FrostWavePattern extends BossPattern {
  constructor() {
    super('Frost Wave', 1, 4000, 25);
  }

  async execute(boss: ZephyrosAI): Promise<void> {
    super.execute(boss);

    boss.currentAnimation = 'cast';
    await this.wait(500);

    const direction = boss.facingDirection;
    const wave: BossProjectile = {
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

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class IceSlashPattern extends BossPattern {
  constructor() {
    super('Ice Slash', 1, 2000, 10);
  }

  async execute(boss: ZephyrosAI): Promise<void> {
    super.execute(boss);

    boss.currentAnimation = 'slash';
    await this.wait(200);

    boss.createAttackHitbox(50, 0, 60, 40, boss.damage, { x: 10, y: -3 });
    boss.audioManager?.playSFX('ice_slash');
    await this.wait(300);

    boss.currentAnimation = 'idle';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class BlizzardZonePattern extends BossPattern {
  constructor() {
    super('Blizzard Zone', 2, 8000, 50);
  }

  async execute(boss: ZephyrosAI): Promise<void> {
    super.execute(boss);

    boss.currentAnimation = 'summon';
    await this.wait(1000);

    if (!boss.target) return;
    const zone: HazardZone = {
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

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class IcePillarPattern extends BossPattern {
  constructor() {
    super('Ice Pillar', 2, 6000, 30);
  }

  async execute(boss: ZephyrosAI): Promise<void> {
    super.execute(boss);

    boss.currentAnimation = 'summon';
    await this.wait(800);

    if (!boss.target) return;
    const playerX = boss.target.position.x;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 80;
      boss.spawnIcePillar(playerX + offset, boss.target.position.y + 50);
    }

    boss.audioManager?.playSFX('ice_pillar');
    boss.currentAnimation = 'idle';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class AbsoluteZeroPattern extends BossPattern {
  constructor() {
    super('Absolute Zero', 3, 15000, 80);
  }

  async execute(boss: ZephyrosAI): Promise<void> {
    super.execute(boss);

    boss.currentAnimation = 'ultimate';

    boss.gameState?.setSlowMotion?.(2000);

    await this.wait(2000);

    if (!boss.target) return;
    const distance = boss.position.distanceTo(boss.target.position);

    if (distance < 400) {
      boss.gameState?.takeDamage(40);
      boss.gameState?.drainWarmth(this.warmthDrain);
      boss.gameState?.applyFreeze?.(3000);
    }

    boss.audioManager?.playSFX('absolute_zero');
    boss.currentAnimation = 'idle';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Zephyros Boss AI.
 */
export class ZephyrosAI extends PerceptiveEntity {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  phase: number;
  phaseHealthThresholds: number[];
  target: BossTarget | null;
  currentAnimation: string;
  facingDirection: number;
  gameState: GameStateHandlers | null;
  audioManager: AudioSystem | null;
  projectiles: BossProjectile[];
  hazardZones: HazardZone[];
  patterns: BossPattern[];
  threatAssessment: ThreatAssessment;
  specialAttackCooldown: number;
  isInvulnerable?: boolean;
  isDead?: boolean;
  damageFlashTimer?: number;
  phaseTransitionEffect?: number;
  frostParticles?: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    lifetime: number;
    age: number;
    createdAt: number;
    color: string;
  }>;

  constructor(config: BossConfig, gameState: GameStateHandlers | null, audioManager: AudioSystem | null) {
    super({
      fieldOfView: Math.PI,
      visionRange: 500,
      memorySpan: 5,
    });

    this.hp = config.health ?? 500;
    this.maxHp = this.hp;
    this.damage = config.damage ?? 35;
    this.speed = config.speed ?? 1.2;

    this.phase = 1;
    this.phaseHealthThresholds = [1.0, 0.6, 0.25];

    this.target = null;
    this.currentAnimation = 'idle';
    this.facingDirection = 1;

    this.gameState = gameState;
    this.audioManager = audioManager;

    this.projectiles = [];
    this.hazardZones = [];

    this.patterns = [
      new IceSlashPattern(),
      new FrostWavePattern(),
      new BlizzardZonePattern(),
      new IcePillarPattern(),
      new AbsoluteZeroPattern(),
    ];

    this.threatAssessment = new ThreatAssessment();
    this.specialAttackCooldown = 0;

    this.position = new Vector3(config.x ?? 0, config.y ?? 0, 0);
  }

  setTarget(target: BossTarget): void {
    this.target = target;
  }

  updateTarget(position: { x: number; y: number }, hp: number, maxHp: number): void {
    if (!this.target) {
      this.target = { position: new Vector3(position.x, position.y, 0), hp, maxHp };
      return;
    }
    this.target.position.x = position.x;
    this.target.position.y = position.y;
    this.target.hp = hp;
    this.target.maxHp = maxHp;
  }

  update(delta: number): void {
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
      this.specialAttackCooldown = Math.max(0, this.specialAttackCooldown - delta);
    }

    this.updateProjectiles(delta);
    this.updateHazardZones();
    this.updateFrostParticles(delta);

    if (this.target) {
      this.facingDirection = this.target.position.x > this.position.x ? 1 : -1;
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

  private onPhaseTransition(): void {
    this.hp = Math.min(this.maxHp, this.hp + 50);
    this.isInvulnerable = true;
    window.setTimeout(() => {
      this.isInvulnerable = false;
    }, 2000);

    this.phaseTransitionEffect = 60;
    this.audioManager?.playSFX('boss_phase_change');
  }

  async selectAndExecuteAttack(): Promise<void> {
    if (this.specialAttackCooldown > 0 || !this.target) return;

    const availablePatterns = this.patterns.filter(
      (pattern) => pattern.minPhase <= this.phase && pattern.cooldownReady()
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

    let selectedPattern: BossPattern | undefined;

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

  private selectHighPowerAttack(patterns: BossPattern[]): BossPattern {
    const powerful = patterns.filter((pattern) => pattern.warmthDrain > 40);
    return powerful.length > 0
      ? powerful[Math.floor(Math.random() * powerful.length)]
      : patterns[0];
  }

  private selectMediumPowerAttack(patterns: BossPattern[]): BossPattern {
    const medium = patterns.filter(
      (pattern) => pattern.warmthDrain >= 20 && pattern.warmthDrain <= 40
    );
    return medium.length > 0 ? medium[Math.floor(Math.random() * medium.length)] : patterns[0];
  }

  private selectDefensivePattern(patterns: BossPattern[]): BossPattern {
    const defensive = patterns.filter(
      (pattern) => pattern.name.includes('Zone') || pattern.name.includes('Pillar')
    );
    return defensive.length > 0 ? defensive[Math.floor(Math.random() * defensive.length)] : patterns[0];
  }

  private updateProjectiles(delta: number): void {
    const now = performance.now();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;

      if (now - projectile.createdAt > projectile.lifetime) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateHazardZones(): void {
    const now = performance.now();

    for (let i = this.hazardZones.length - 1; i >= 0; i--) {
      const zone = this.hazardZones[i];
      if (zone.duration && now - zone.createdAt > zone.duration) {
        this.hazardZones.splice(i, 1);
      }
    }
  }

  takeDamage(amount: number): void {
    if (this.isInvulnerable) return;

    this.hp -= amount;
    this.damageFlashTimer = 10;

    if (this.hp <= 0) {
      this.onDeath();
    }

    this.audioManager?.playSFX('boss_hurt');
  }

  private onDeath(): void {
    this.isDead = true;
    this.gameState?.onBossDefeated?.();
    this.currentAnimation = 'death';
    this.audioManager?.playSFX('boss_death');
  }

  createAttackHitbox(
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
    damage: number,
    knockback: { x: number; y: number }
  ) {
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

  spawnFrostParticles(position: Vector3, direction: number): void {
    if (!this.frostParticles) {
      this.frostParticles = [];
    }

    const particleCount = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2;
      const speed = 2 + Math.random() * 4;
      const size = 3 + Math.random() * 5;
      const lifetime = 500 + Math.random() * 1000;

      const particle = {
        x: position.x + (Math.random() - 0.5) * 20,
        y: position.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed * direction,
        vy: Math.sin(angle) * speed,
        size,
        opacity: 1.0,
        lifetime,
        age: 0,
        createdAt: performance.now(),
        color: this.getFrostParticleColor(),
      };

      this.frostParticles.push(particle);
    }
  }

  private getFrostParticleColor(): string {
    const colors = [
      'rgba(173, 216, 230, ',
      'rgba(135, 206, 250, ',
      'rgba(176, 224, 230, ',
      'rgba(240, 248, 255, ',
      'rgba(255, 255, 255, ',
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  private updateFrostParticles(delta: number): void {
    if (!this.frostParticles) return;

    const now = performance.now();

    for (let i = this.frostParticles.length - 1; i >= 0; i--) {
      const particle = this.frostParticles[i];

      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      particle.vy += 0.1 * delta;

      particle.age = now - particle.createdAt;
      particle.opacity = 1.0 - particle.age / particle.lifetime;

      particle.size *= 0.98;

      if (particle.age >= particle.lifetime || particle.opacity <= 0) {
        this.frostParticles.splice(i, 1);
      }
    }
  }

  renderFrostParticles(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }): void {
    if (!this.frostParticles) return;

    ctx.save();

    for (const particle of this.frostParticles) {
      const screenX = particle.x - (camera?.x || 0);
      const screenY = particle.y - (camera?.y || 0);

      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = `${particle.color}${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, particle.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  spawnIcePillar(x: number, y: number): void {
    const pillar: HazardZone = {
      x: x - 20,
      y: y - 100,
      width: 40,
      height: 100,
      damage: 25,
      warmthDrain: 0,
      createdAt: performance.now(),
      duration: 3000,
    };

    this.hazardZones.push(pillar);
  }
}
