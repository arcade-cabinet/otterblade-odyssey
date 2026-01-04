/**
 * PerceptionSystem.js
 * Vision cones, memory system, hearing per AI.md:673-780
 */

import { Vector3 } from 'yuka';

/**
 * Vision system with field of view (AI.md:673-724)
 */
export class VisionSystem {
  constructor(owner, fieldOfView = Math.PI * 0.6, range = 300) {
    this.owner = owner;
    this.fieldOfView = fieldOfView; // 108 degrees
    this.range = range;
  }

  canSee(targetPos) {
    const toTarget = new Vector3().subVectors(targetPos, this.owner.position);
    const distance = toTarget.length();

    if (distance > this.range) return false;

    // Check if in field of view
    const forward = this.owner.getForwardVector();
    toTarget.normalize();

    const dotProduct = forward.dot(toTarget);
    const angle = Math.acos(dotProduct);

    return angle <= this.fieldOfView / 2;
  }

  /**
   * Get forward vector based on facing direction
   */
  getForwardVector() {
    const facing = this.owner.facingDirection || 1;
    return new Vector3(facing, 0, 0);
  }

  /**
   * Draw debug visualization
   */
  debugRender(ctx, camera) {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    const pos = this.owner.position;
    ctx.translate(pos.x, pos.y);

    // Vision cone
    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const facing = this.owner.facingDirection || 1;
    const startAngle = -this.fieldOfView / 2;
    const endAngle = this.fieldOfView / 2;

    for (let angle = startAngle; angle <= endAngle; angle += 0.1) {
      const x = Math.cos(angle) * this.range * facing;
      const y = Math.sin(angle) * this.range;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Memory system for tracking entities (AI.md:673-724)
 */
export class MemorySystem {
  constructor(owner, memorySpan = 3) {
    this.owner = owner;
    this.memorySpan = memorySpan; // seconds
    this.records = [];
  }

  /**
   * Get memory record for entity
   */
  getRecord(entity) {
    return this.records.find((r) => r.entity === entity);
  }

  /**
   * Update or create memory record
   */
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

  /**
   * Update memory records (age them)
   */
  update(delta) {
    for (const record of this.records) {
      record.lastSensedTime += delta;
    }

    // Remove expired memories
    this.records = this.records.filter((r) => r.lastSensedTime < this.memorySpan);
  }

  /**
   * Get most threatening remembered entity
   */
  getMostThreatening() {
    if (this.records.length === 0) return null;

    return this.records.reduce((most, current) => {
      const currentScore = current.threat / (1 + current.lastSensedTime);
      const mostScore = most.threat / (1 + most.lastSensedTime);
      return currentScore > mostScore ? current : most;
    });
  }

  /**
   * Forget all memories
   */
  clear() {
    this.records = [];
  }
}

/**
 * Sound event for hearing system (AI.md:729-780)
 */
export class SoundEvent {
  constructor(position, loudness, type, source) {
    this.position = position.clone();
    this.loudness = loudness;
    this.type = type; // 'footstep' | 'attack' | 'item' | 'damage' | 'door' | 'jump'
    this.source = source;
    this.timestamp = performance.now();
  }
}

/**
 * Hearing system for sound propagation
 */
export class HearingSystem {
  constructor() {
    this.sounds = [];
    this.maxSounds = 20;
    this.listeners = [];
  }

  /**
   * Emit a sound event
   */
  emit(position, loudness, type, source) {
    const event = new SoundEvent(position, loudness, type, source);
    this.sounds.push(event);

    // Trim old sounds
    if (this.sounds.length > this.maxSounds) {
      this.sounds.shift();
    }

    // Notify nearby listeners
    const radius = loudness * 150; // Loudness affects range
    for (const listener of this.listeners) {
      const distance = listener.position.distanceTo(position);
      if (distance < radius) {
        listener.onHearSound(event, distance);
      }
    }
  }

  /**
   * Register a listener (enemy/NPC)
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update and clean old sounds
   */
  update() {
    const now = performance.now();
    this.sounds = this.sounds.filter((s) => now - s.timestamp < 2000);
  }
}

/**
 * Perceptive enemy with vision and memory (AI.md:669-724)
 */
export class PerceptiveEntity {
  constructor(config) {
    this.position = new Vector3();
    this.facingDirection = 1;

    this.vision = new VisionSystem(this, config.fieldOfView, config.visionRange);
    this.memory = new MemorySystem(this, config.memorySpan || 3);

    this.alertLevel = 0; // 0 = unaware, 1 = suspicious, 2 = alert
    this.investigatePosition = null;
  }

  /**
   * Update perception
   */
  updatePerception(player, delta) {
    // Check vision
    if (this.vision.canSee(player.position)) {
      // Remember player
      const record = this.memory.remember(player, player.position);
      record.threat = 1.0;

      this.alertLevel = 2; // Full alert
      this.target = player;
    } else {
      // Use memory to track last known position
      const playerMemory = this.memory.getRecord(player);

      if (playerMemory && playerMemory.lastSensedTime < 2) {
        this.investigatePosition = playerMemory.position.clone();
        this.alertLevel = Math.max(1, this.alertLevel); // At least suspicious
      } else if (this.alertLevel > 0) {
        // Gradually lose alert
        this.alertLevel = Math.max(0, this.alertLevel - delta * 0.2);
      }
    }

    // Update memory
    this.memory.update(delta);
  }

  /**
   * Handle hearing sound event
   */
  onHearSound(event, distance) {
    // Closer sounds are more alerting
    const alertIncrease = (1 - distance / 300) * 0.5;
    this.alertLevel = Math.min(2, this.alertLevel + alertIncrease);

    // If idle or patrolling, investigate
    if (this.alertLevel < 2 && event.type !== 'ambient') {
      this.investigatePosition = event.position.clone();
    }
  }

  /**
   * Get forward vector for vision
   */
  getForwardVector() {
    return new Vector3(this.facingDirection, 0, 0);
  }
}

/**
 * Global hearing system instance
 */
export const hearingSystem = new HearingSystem();
