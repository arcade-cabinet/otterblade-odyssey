/**
 * EnvironmentalSystems
 * Lantern lighting, bell ringing, hearth kindling, puzzles per WORLD.md:142-151
 */

import type { AudioSystem } from '../types/systems';

type Position = { x: number; y: number };

type SummonType = 'help' | 'guards' | 'allies';

type Direction = 'left' | 'right' | 'up' | 'down';

interface GameStateActions {
  restoreWarmth?: (amount: number) => void;
  summonAlly?: (pos: Position) => void;
  alertGuards?: (pos: Position) => void;
  rallyAllies?: () => void;
}

interface PlayerContext {
  position: Position;
  gameState?: GameStateActions;
}

/**
 * Lantern system (WORLD.md:142)
 */
export class LanternSystem {
  lanterns: Array<{
    position: Position;
    radius: number;
    lit: boolean;
    fuel: number;
    maxFuel: number;
    weakensEnemies: boolean;
  }>;
  audioManager: AudioSystem | null;

  constructor(audioManager: AudioSystem | null) {
    this.lanterns = [];
    this.audioManager = audioManager;
  }

  addLantern(x: number, y: number, radius: number = 150) {
    const lantern = {
      position: { x, y },
      radius,
      lit: false,
      fuel: 100,
      maxFuel: 100,
      weakensEnemies: true,
    };

    this.lanterns.push(lantern);
    return lantern;
  }

  lightLantern(lantern: { lit: boolean; position: Position }, player: PlayerContext) {
    if (lantern.lit) return false;

    const distance = Math.sqrt(
      (player.position.x - lantern.position.x) ** 2 + (player.position.y - lantern.position.y) ** 2
    );

    if (distance > 60) return false; // Too far

    lantern.lit = true;
    this.audioManager?.playSound?.('lantern_light');

    // Restore warmth as reward
    player.gameState?.restoreWarmth?.(15);

    return true;
  }

  update(delta: number) {
    for (const lantern of this.lanterns) {
      if (lantern.lit) {
        // Drain fuel slowly
        lantern.fuel -= delta * 0.5;

        if (lantern.fuel <= 0) {
          lantern.lit = false;
          lantern.fuel = 0;
        }
      }
    }
  }

  isInLightRadius(position: Position, lantern: { position: Position; radius: number; lit: boolean }) {
    if (!lantern.lit) return false;

    const distance = Math.sqrt(
      (position.x - lantern.position.x) ** 2 + (position.y - lantern.position.y) ** 2
    );

    return distance < lantern.radius;
  }

  /**
   * Check if enemy is weakened by light
   */
  checkEnemyWeakness(enemy: { position: Position }) {
    for (const lantern of this.lanterns) {
      if (this.isInLightRadius(enemy.position, lantern)) {
        return true; // Enemy is weakened
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
    for (const lantern of this.lanterns) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const { x, y } = lantern.position;

      // Lantern post
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(x - 4, y, 8, 40);

      // Lantern frame
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x - 12, y - 20, 24, 20);
      ctx.stroke();

      // Light (if lit)
      if (lantern.lit) {
        const intensity = lantern.fuel / lantern.maxFuel;

        // Glow
        const gradient = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, lantern.radius);
        gradient.addColorStop(0, `rgba(255, 220, 150, ${0.3 * intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.1 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          x - lantern.radius,
          y - lantern.radius - 10,
          lantern.radius * 2,
          lantern.radius * 2
        );

        // Flame
        const flicker = Math.sin(performance.now() * 0.01) * 2;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x, y - 15 + flicker);
        ctx.lineTo(x - 5, y - 5);
        ctx.lineTo(x + 5, y - 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

/**
 * Bell ringing system (WORLD.md:143)
 */
export class BellSystem {
  bells: Array<{ position: Position; rung: boolean; cooldown: number; summons: SummonType; timingWindow: number }>;
  audioManager: AudioSystem | null;

  constructor(audioManager: AudioSystem | null) {
    this.bells = [];
    this.audioManager = audioManager;
  }

  addBell(x: number, y: number, summons: SummonType = 'help') {
    const bell = {
      position: { x, y },
      rung: false,
      cooldown: 0,
      summons,
      timingWindow: 500,
    };

    this.bells.push(bell);
    return bell;
  }

  ringBell(bell: { position: Position; cooldown: number; summons: SummonType }, player: PlayerContext) {
    if (bell.cooldown > 0) return false;

    const distance = Math.sqrt(
      (player.position.x - bell.position.x) ** 2 + (player.position.y - bell.position.y) ** 2
    );

    if (distance > 60) return false;

    bell.rung = true;
    bell.cooldown = 3000;

    this.audioManager?.playSound?.('bell_ring');

    // Execute bell effect
    this.executeBellEffect(bell, player);

    return true;
  }

  executeBellEffect(bell: { summons: SummonType; position: Position }, player: PlayerContext) {
    switch (bell.summons) {
      case 'help':
        player.gameState?.summonAlly?.(bell.position);
        break;

      case 'guards':
        player.gameState?.alertGuards?.(bell.position);
        break;

      case 'allies':
        player.gameState?.rallyAllies?.();
        break;
    }
  }

  update(delta: number) {
    for (const bell of this.bells) {
      if (bell.cooldown > 0) {
        bell.cooldown -= delta * 1000;
        if (bell.cooldown < 0) bell.cooldown = 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
    for (const bell of this.bells) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const { x, y } = bell.position;

      // Bell tower
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x - 12, y - 40, 24, 40);

      // Bell
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(x, y - 20, 8, 0, Math.PI * 2);
      ctx.fill();

      // Bell pull
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y + 10);
      ctx.stroke();

      ctx.restore();
    }
  }
}

/**
 * Hearth system (WORLD.md:144)
 */
export class HearthSystem {
  hearths: Array<{ position: Position; lit: boolean; warmth: number; radius: number; cooldown: number }>;
  audioManager: AudioSystem | null;

  constructor(audioManager: AudioSystem | null) {
    this.hearths = [];
    this.audioManager = audioManager;
  }

  addHearth(x: number, y: number, radius: number = 80) {
    const hearth = {
      position: { x, y },
      lit: false,
      warmth: 50,
      radius,
      cooldown: 0,
    };

    this.hearths.push(hearth);
    return hearth;
  }

  kindleHearth(hearth: { lit: boolean; position: Position }, player: PlayerContext) {
    if (hearth.lit) return false;

    const distance = Math.sqrt(
      (player.position.x - hearth.position.x) ** 2 + (player.position.y - hearth.position.y) ** 2
    );

    if (distance > 60) return false;

    hearth.lit = true;
    this.audioManager?.playSound?.('hearth_light');
    player.gameState?.restoreWarmth?.(25);

    return true;
  }

  update(delta: number) {
    for (const hearth of this.hearths) {
      if (hearth.cooldown > 0) {
        hearth.cooldown -= delta * 1000;
        if (hearth.cooldown < 0) hearth.cooldown = 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
    for (const hearth of this.hearths) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const { x, y } = hearth.position;

      // Base
      ctx.fillStyle = '#5C4033';
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Fire (if lit)
      if (hearth.lit) {
        const flicker = Math.sin(performance.now() * 0.02) * 2;
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(x, y - 4 + flicker, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

/**
 * Flow puzzle system
 */
export class FlowPuzzle {
  regions: Array<{ x: number; y: number; width: number; height: number; direction: Direction; strength: number }>;
  valves: Array<{ x: number; y: number; controlsRegionIndex: number; active: boolean }>;

  constructor() {
    this.regions = [];
    this.valves = [];
  }

  addFlowRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    direction: Direction,
    strength: number = 1
  ) {
    this.regions.push({ x, y, width, height, direction, strength });
  }

  addValve(x: number, y: number, controlsRegionIndex: number) {
    this.valves.push({ x, y, controlsRegionIndex, active: true });
  }

  applyFlowToBody(body: { position: Position }) {
    for (const region of this.regions) {
      if (
        body.position.x >= region.x &&
        body.position.x <= region.x + region.width &&
        body.position.y >= region.y &&
        body.position.y <= region.y + region.height
      ) {
        const force = region.strength;
        switch (region.direction) {
          case 'left':
            return { x: -force, y: 0 };
          case 'right':
            return { x: force, y: 0 };
          case 'up':
            return { x: 0, y: -force };
          case 'down':
            return { x: 0, y: force };
        }
      }
    }

    return null;
  }

  update(_delta: number) {}

  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
    for (const region of this.regions) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(region.x, region.y, region.width, region.height);

      ctx.restore();
    }
  }
}

/**
 * Timing sequence system
 */
export class TimingSequence {
  gates: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    openDuration: number;
    closedDuration: number;
    offset: number;
    isOpen: boolean;
    timer: number;
  }>;
  active: boolean;

  constructor() {
    this.gates = [];
    this.active = false;
  }

  addGate(
    x: number,
    y: number,
    width: number,
    height: number,
    openDuration: number = 1000,
    closedDuration: number = 1000,
    offset: number = 0
  ) {
    this.gates.push({
      x,
      y,
      width,
      height,
      openDuration,
      closedDuration,
      offset,
      isOpen: false,
      timer: offset,
    });
  }

  start(): void {
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  update(delta: number) {
    if (!this.active) return;

    for (const gate of this.gates) {
      gate.timer += delta * 1000;
      const cycleDuration = gate.openDuration + gate.closedDuration;
      const cycleTime = gate.timer % cycleDuration;
      gate.isOpen = cycleTime < gate.openDuration;
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
    for (const gate of this.gates) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      ctx.fillStyle = gate.isOpen ? 'rgba(100, 255, 100, 0.4)' : 'rgba(255, 100, 100, 0.6)';
      ctx.fillRect(gate.x, gate.y, gate.width, gate.height);

      ctx.restore();
    }
  }
}
