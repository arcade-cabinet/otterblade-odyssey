/**
 * PerceptionSystem
 * Vision cones, memory system, hearing per AI.md:673-780
 */

import { Vector3 } from 'yuka';

interface PerceptionOwner {
  position: Vector3;
  facingDirection?: number;
}

interface HeardSoundListener {
  position: Vector3;
  onHearSound: (event: SoundEvent, distance: number) => void;
}

/**
 * Perceptive entity base class for AI that needs vision + memory.
 */
export class PerceptiveEntity {
  position: Vector3;
  facingDirection: number;
  vision: VisionSystem;
  memory: MemorySystem;

  constructor(config: { fieldOfView?: number; visionRange?: number; memorySpan?: number }) {
    this.position = new Vector3();
    this.facingDirection = 1;
    this.vision = new VisionSystem(this, config.fieldOfView, config.visionRange);
    this.memory = new MemorySystem(this, config.memorySpan);
  }

  /**
   * Update perception of a target.
   */
  updatePerception(target: { position: Vector3 }, delta: number): void {
    if (this.vision.canSee(target.position)) {
      this.memory.remember(target, target.position);
    }
    this.memory.update(delta);
  }
}

/**
 * Vision system with field of view (AI.md:673-724)
 */
export class VisionSystem {
  owner: PerceptionOwner;
  fieldOfView: number;
  range: number;

  constructor(owner: PerceptionOwner, fieldOfView: number = Math.PI * 0.6, range: number = 300) {
    this.owner = owner;
    this.fieldOfView = fieldOfView; // 108 degrees
    this.range = range;
  }

  canSee(targetPos: Vector3) {
    const toTarget = new Vector3().subVectors(targetPos, this.owner.position);
    const distance = toTarget.length();

    if (distance > this.range) return false;

    // Check if in field of view
    const forward = this.getForwardVector();
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
  debugRender(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }) {
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
  owner: PerceptionOwner;
  memorySpan: number;
  records: Array<{
    entity: unknown;
    position: Vector3;
    lastSensedTime: number;
    timesSpotted: number;
    threat: number;
  }>;

  constructor(owner: PerceptionOwner, memorySpan: number = 3) {
    this.owner = owner;
    this.memorySpan = memorySpan; // seconds
    this.records = [];
  }

  /**
   * Get memory record for entity
   */
  getRecord(entity: unknown) {
    return this.records.find((r) => r.entity === entity);
  }

  /**
   * Update or create memory record
   */
  remember(entity: unknown, position: Vector3) {
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
  update(delta: number) {
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
  position: Vector3;
  loudness: number;
  type: string;
  source: unknown;
  timestamp: number;

  constructor(position: Vector3, loudness: number, type: string, source: unknown) {
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
  sounds: SoundEvent[];
  maxSounds: number;
  listeners: HeardSoundListener[];

  constructor() {
    this.sounds = [];
    this.maxSounds = 20;
    this.listeners = [];
  }

  /**
   * Emit a sound event
   */
  emit(position: Vector3, loudness: number, type: string, source: unknown) {
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
  addListener(listener: HeardSoundListener) {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: HeardSoundListener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Update sound lifetimes
   */
  update() {
    const now = performance.now();
    this.sounds = this.sounds.filter((sound) => now - sound.timestamp < 1000);
  }
}

// Export singleton instance
export const hearingSystem = new HearingSystem();
