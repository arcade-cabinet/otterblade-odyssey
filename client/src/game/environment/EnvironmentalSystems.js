/**
 * EnvironmentalSystems.js
 * Lantern lighting, bell ringing, hearth kindling, puzzles per WORLD.md:142-151
 */

import { Vector3 } from 'yuka';

/**
 * Lantern system (WORLD.md:142)
 */
export class LanternSystem {
  constructor(audioManager) {
    this.lanterns = [];
    this.audioManager = audioManager;
  }

  addLantern(x, y, radius = 150) {
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

  lightLantern(lantern, player) {
    if (lantern.lit) return false;

    const distance = Math.sqrt(
      Math.pow(player.position.x - lantern.position.x, 2) +
      Math.pow(player.position.y - lantern.position.y, 2)
    );

    if (distance > 60) return false; // Too far

    lantern.lit = true;
    this.audioManager?.playSFX('lantern_light');

    // Restore warmth as reward
    player.gameState?.restoreWarmth(15);

    return true;
  }

  update(delta) {
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

  isInLightRadius(position, lantern) {
    if (!lantern.lit) return false;

    const distance = Math.sqrt(
      Math.pow(position.x - lantern.position.x, 2) + Math.pow(position.y - lantern.position.y, 2)
    );

    return distance < lantern.radius;
  }

  /**
   * Check if enemy is weakened by light
   */
  checkEnemyWeakness(enemy) {
    for (const lantern of this.lanterns) {
      if (this.isInLightRadius(enemy.position, lantern)) {
        return true; // Enemy is weakened
      }
    }
    return false;
  }

  render(ctx, camera) {
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
  constructor(audioManager) {
    this.bells = [];
    this.audioManager = audioManager;
  }

  addBell(x, y, summons = 'help') {
    const bell = {
      position: { x, y },
      rung: false,
      cooldown: 0,
      summons, // 'help' | 'guards' | 'allies'
      timingWindow: 500, // ms for rhythm games
    };

    this.bells.push(bell);
    return bell;
  }

  ringBell(bell, player) {
    if (bell.cooldown > 0) return false;

    const distance = Math.sqrt(
      Math.pow(player.position.x - bell.position.x, 2) +
      Math.pow(player.position.y - bell.position.y, 2)
    );

    if (distance > 60) return false;

    bell.rung = true;
    bell.cooldown = 3000; // 3 second cooldown

    this.audioManager?.playSFX('bell_ring');

    // Execute bell effect
    this.executeBellEffect(bell, player);

    return true;
  }

  executeBellEffect(bell, player) {
    switch (bell.summons) {
      case 'help':
        // Summon NPC ally
        console.log('Help summoned!');
        player.gameState?.summonAlly(bell.position);
        break;

      case 'guards':
        // Alert nearby guards
        console.log('Guards alerted!');
        player.gameState?.alertGuards(bell.position);
        break;

      case 'allies':
        // Rally allies
        console.log('Allies rallied!');
        player.gameState?.rallyAllies();
        break;
    }
  }

  update(delta) {
    for (const bell of this.bells) {
      if (bell.cooldown > 0) {
        bell.cooldown -= delta;
      }
    }
  }

  render(ctx, camera) {
    for (const bell of this.bells) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const { x, y } = bell.position;

      // Bell tower/mount
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x - 6, y, 12, 30);

      // Bell
      ctx.fillStyle = '#CD7F32';
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(x, y - 15, 10, 0, Math.PI, true);
      ctx.lineTo(x - 8, y - 15);
      ctx.arc(x, y - 15, 8, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bell clapper
      ctx.strokeStyle = '#5C4033';
      ctx.beginPath();
      ctx.moveTo(x, y - 15);
      ctx.lineTo(x, y - 5);
      ctx.stroke();

      // Cooldown indicator
      if (bell.cooldown > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(x - 12, y - 30, 24, 3);

        const progress = 1 - bell.cooldown / 3000;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.fillRect(x - 12, y - 30, 24 * progress, 3);
      }

      ctx.restore();
    }
  }
}

/**
 * Hearth/checkpoint system (WORLD.md:144)
 */
export class HearthSystem {
  constructor(audioManager) {
    this.hearths = [];
    this.audioManager = audioManager;
  }

  addHearth(x, y) {
    const hearth = {
      position: { x, y },
      lit: false,
      warmth: 0,
      maxWarmth: 100,
    };

    this.hearths.push(hearth);
    return hearth;
  }

  kindleHearth(hearth, player) {
    if (hearth.lit) return false;

    const distance = Math.sqrt(
      Math.pow(player.position.x - hearth.position.x, 2) +
      Math.pow(player.position.y - hearth.position.y, 2)
    );

    if (distance > 60) return false;

    hearth.lit = true;
    hearth.warmth = hearth.maxWarmth;

    this.audioManager?.playSFX('hearth_kindle');

    // Full heal and warmth restore
    player.gameState?.restoreHealth(player.gameState.maxHealth);
    player.gameState?.restoreWarmth(100);

    // Save checkpoint
    player.gameState?.setCheckpoint(hearth.position);

    return true;
  }

  update(delta) {
    for (const hearth of this.hearths) {
      if (hearth.lit && hearth.warmth > 0) {
        hearth.warmth -= delta * 0.1; // Slowly loses warmth
      }
    }
  }

  render(ctx, camera) {
    for (const hearth of this.hearths) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const { x, y } = hearth.position;

      // Stone hearth base
      ctx.fillStyle = '#A0A0A0';
      ctx.fillRect(x - 30, y, 60, 20);

      if (hearth.lit) {
        // Fire
        const time = performance.now() * 0.005;
        const flameHeight = 25 + Math.sin(time) * 5;

        for (let i = 0; i < 5; i++) {
          const offsetX = (i - 2) * 10;
          const flicker = Math.sin(time + i) * 3;

          ctx.fillStyle = i % 2 === 0 ? '#FF6B35' : '#FFA500';
          ctx.beginPath();
          ctx.moveTo(x + offsetX, y - flameHeight + flicker);
          ctx.lineTo(x + offsetX - 6, y);
          ctx.lineTo(x + offsetX + 6, y);
          ctx.closePath();
          ctx.fill();
        }

        // Glow
        const gradient = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 80);
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 80, y - 80, 160, 160);
      } else {
        // Unlit - show logs
        ctx.fillStyle = '#5C4033';
        for (let i = 0; i < 3; i++) {
          const offsetX = (i - 1) * 12;
          ctx.fillRect(x + offsetX - 8, y - 5, 16, 8);
        }
      }

      ctx.restore();
    }
  }
}

/**
 * Flow puzzle (water/air currents) (WORLD.md:146)
 */
export class FlowPuzzle {
  constructor() {
    this.flowRegions = [];
    this.valves = [];
  }

  addFlowRegion(x, y, width, height, direction, strength) {
    const region = {
      x,
      y,
      width,
      height,
      direction, // 'up' | 'down' | 'left' | 'right'
      strength,
      active: true,
    };

    this.flowRegions.push(region);
    return region;
  }

  addValve(x, y, controlsRegionIndex) {
    const valve = {
      position: { x, y },
      controlsRegion: controlsRegionIndex,
      open: false,
    };

    this.valves.push(valve);
    return valve;
  }

  toggleValve(valve) {
    valve.open = !valve.open;

    const region = this.flowRegions[valve.controlsRegion];
    if (region) {
      region.active = valve.open;
    }
  }

  applyFlowToBody(body) {
    for (const region of this.flowRegions) {
      if (!region.active) continue;

      const { x, y } = body.position;

      if (x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height) {
        // Apply force based on direction
        const force = { x: 0, y: 0 };

        switch (region.direction) {
          case 'up':
            force.y = -region.strength;
            break;
          case 'down':
            force.y = region.strength;
            break;
          case 'left':
            force.x = -region.strength;
            break;
          case 'right':
            force.x = region.strength;
            break;
        }

        return force;
      }
    }

    return null;
  }

  render(ctx, camera) {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw flow regions
    for (const region of this.flowRegions) {
      if (!region.active) continue;

      ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.fillRect(region.x, region.y, region.width, region.height);

      // Draw arrows
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 2;

      const arrowCount = 3;
      for (let i = 0; i < arrowCount; i++) {
        const t = (performance.now() * 0.002 + i / arrowCount) % 1;
        let x, y;

        switch (region.direction) {
          case 'up':
            x = region.x + region.width / 2;
            y = region.y + region.height * (1 - t);
            this.drawArrow(ctx, x, y, 0, -1);
            break;
          case 'down':
            x = region.x + region.width / 2;
            y = region.y + region.height * t;
            this.drawArrow(ctx, x, y, 0, 1);
            break;
          case 'left':
            x = region.x + region.width * (1 - t);
            y = region.y + region.height / 2;
            this.drawArrow(ctx, x, y, -1, 0);
            break;
          case 'right':
            x = region.x + region.width * t;
            y = region.y + region.height / 2;
            this.drawArrow(ctx, x, y, 1, 0);
            break;
        }
      }
    }

    // Draw valves
    for (const valve of this.valves) {
      const { x, y } = valve.position;

      ctx.fillStyle = valve.open ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawArrow(ctx, x, y, dx, dy) {
    const size = 10;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * size, y + dy * size);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x + dx * size, y + dy * size);
    ctx.lineTo(x + dx * size - dy * 5, y + dy * size + dx * 5);
    ctx.moveTo(x + dx * size, y + dy * size);
    ctx.lineTo(x + dx * size + dy * 5, y + dy * size - dx * 5);
    ctx.stroke();
  }
}

/**
 * Timing sequence (gates, moving platforms) (WORLD.md:148)
 */
export class TimingSequence {
  constructor() {
    this.gates = [];
    this.sequenceActive = false;
  }

  addGate(x, y, width, height, openDuration, closedDuration, offset = 0) {
    const gate = {
      position: { x, y },
      width,
      height,
      openDuration,
      closedDuration,
      cycle: openDuration + closedDuration,
      offset, // Starting offset in cycle
      open: false,
    };

    this.gates.push(gate);
    return gate;
  }

  update(delta) {
    if (!this.sequenceActive) return;

    const time = (performance.now() / 1000) % 1000; // Wrap at 1000 seconds

    for (const gate of this.gates) {
      const cyclePos = (time + gate.offset) % (gate.cycle / 1000);
      gate.open = cyclePos < gate.openDuration / 1000;
    }
  }

  start() {
    this.sequenceActive = true;
  }

  stop() {
    this.sequenceActive = false;
  }

  render(ctx, camera) {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    for (const gate of this.gates) {
      const { x, y } = gate.position;

      if (!gate.open) {
        // Draw closed gate
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, gate.width, gate.height);

        ctx.strokeStyle = '#5C2E0E';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, gate.width, gate.height);
      } else {
        // Draw open gate (retracted)
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.fillRect(x, y + gate.height - 10, gate.width, 10);
      }
    }

    ctx.restore();
  }
}
