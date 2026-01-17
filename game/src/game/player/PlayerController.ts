import type * as Matter from 'matter-js';
import { getMatterModules } from '../physics/matter-wrapper';
import type { AudioSystem, InputControls } from '../types/systems';

interface PlayerPhysics {
  maxSpeed: number;
  acceleration: number;
  airControl: number;
  jumpForce: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;
}

const PLAYER_PHYSICS: PlayerPhysics = {
  maxSpeed: 5,
  acceleration: 0.0008,
  airControl: 0.6,
  jumpForce: -12,
  coyoteTimeMs: 100,
  jumpBufferMs: 100,
};

interface AttackDefinition {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  damage: number;
  kb: { x: number; y: number };
}

interface GameState {
  takeDamage(amount: number): void;
}

interface AttackHitbox extends Matter.Body {
  damage: number;
  knockback: { x: number; y: number };
}

/**
 * PlayerController - Handles player movement, combat, and state
 * Migrated from game-monolith.js lines 164-296
 */
export class PlayerController {
  player: Matter.Body;
  engine: Matter.Engine;
  gameState: GameState;
  audioManager: AudioSystem | null;

  isGrounded: boolean = false;
  coyoteTime: number = 0;
  jumpBufferTime: number = 0;
  comboTimer: number = 0;
  comboIndex: number = 0;
  attackCooldown: number = 0;
  parryWindow: number = 0;

  attacks: AttackDefinition[];

  constructor(
    player: Matter.Body,
    engine: Matter.Engine,
    gameState: GameState,
    audioManager: AudioSystem | null = null
  ) {
    this.player = player;
    this.engine = engine;
    this.gameState = gameState;
    this.audioManager = audioManager;

    this.attacks = [
      { offsetX: 25, offsetY: -5, width: 35, height: 30, damage: 15, kb: { x: 5, y: 0 } },
      { offsetX: 30, offsetY: -10, width: 40, height: 35, damage: 20, kb: { x: 7, y: -2 } },
      { offsetX: 35, offsetY: -5, width: 50, height: 40, damage: 30, kb: { x: 10, y: -5 } },
    ];
  }

  update(controls: InputControls, deltaTime: number): void {
    const { Body } = getMatterModules();

    this.isGrounded = this.checkGrounded();
    if (this.isGrounded) {
      (this.player as any).canJump = true;
    }
    (this.player as any).isGrounded = this.isGrounded;

    if (this.isGrounded) {
      this.coyoteTime = PLAYER_PHYSICS.coyoteTimeMs;
    } else {
      this.coyoteTime = Math.max(0, this.coyoteTime - deltaTime);
    }

    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime = Math.max(0, this.jumpBufferTime - deltaTime);
    }

    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - deltaTime);
      if (this.comboTimer === 0) this.comboIndex = 0;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    }

    if (this.parryWindow > 0) {
      this.parryWindow = Math.max(0, this.parryWindow - deltaTime);
    }

    if (controls.moveLeft) {
      this.moveLeft();
    }
    if (controls.moveRight) {
      this.moveRight();
    }

    if (controls.jump) {
      this.jump();
    }

    if (controls.attack) {
      this.attack();
    }

    // Speed limit
    if (Math.abs(this.player.velocity.x) > PLAYER_PHYSICS.maxSpeed) {
      Body.setVelocity(this.player, {
        x: Math.sign(this.player.velocity.x) * PLAYER_PHYSICS.maxSpeed,
        y: this.player.velocity.y,
      });
    }
  }

  moveLeft(): void {
    const { Body } = getMatterModules();
    const force = this.isGrounded
      ? PLAYER_PHYSICS.acceleration
      : PLAYER_PHYSICS.acceleration * PLAYER_PHYSICS.airControl;
    Body.applyForce(this.player, this.player.position, { x: -force, y: 0 });
    (this.player as any).facingDirection = -1;
  }

  moveRight(): void {
    const { Body } = getMatterModules();
    const force = this.isGrounded
      ? PLAYER_PHYSICS.acceleration
      : PLAYER_PHYSICS.acceleration * PLAYER_PHYSICS.airControl;
    Body.applyForce(this.player, this.player.position, { x: force, y: 0 });
    (this.player as any).facingDirection = 1;
  }

  jump(): boolean {
    const { Body } = getMatterModules();

    const canJump = (this.player as any).canJump !== false;

    if (this.coyoteTime > 0 && canJump) {
      Body.setVelocity(this.player, {
        x: this.player.velocity.x,
        y: PLAYER_PHYSICS.jumpForce,
      });
      (this.player as any).canJump = false;
      this.coyoteTime = 0;
      this.audioManager?.playSound?.('jump');
      return true;
    }

    this.jumpBufferTime = PLAYER_PHYSICS.jumpBufferMs;
    return false;
  }

  attack(): AttackHitbox | null {
    if (this.attackCooldown > 0) return null;

    const attackDef = this.attacks[this.comboIndex];
    const hitbox = this.createAttackHitbox(attackDef);

    this.comboIndex = (this.comboIndex + 1) % this.attacks.length;
    this.comboTimer = 800;
    this.attackCooldown = 300;

    this.audioManager?.playSound?.('blade_swing');
    return hitbox;
  }

  createAttackHitbox(attackDef: AttackDefinition): AttackHitbox {
    const { Bodies } = getMatterModules();

    const facing = this.player.velocity.x >= 0 ? 1 : -1;
    const x = this.player.position.x + attackDef.offsetX * facing;
    const y = this.player.position.y + attackDef.offsetY;

    const hitbox = Bodies.rectangle(x, y, attackDef.width, attackDef.height, {
      isSensor: true,
      label: 'attack_hitbox',
    }) as AttackHitbox;

    hitbox.damage = attackDef.damage;
    hitbox.knockback = { x: attackDef.kb.x * facing, y: attackDef.kb.y };

    return hitbox;
  }

  takeDamage(
    amount: number,
    knockback: { x: number; y: number } = { x: 0, y: 0 }
  ): { parried: boolean } {
    const { Body } = getMatterModules();

    if (this.parryWindow > 0) {
      this.audioManager?.playSound?.('parry_success');
      return { parried: true };
    }

    this.gameState.takeDamage(amount);
    Body.applyForce(this.player, this.player.position, {
      x: knockback.x * 0.1,
      y: knockback.y * 0.1,
    });
    this.audioManager?.playSound?.('player_hit');

    return { parried: false };
  }

  private checkGrounded(): boolean {
    const { Query } = getMatterModules();
    const feetSensor = (this.player as any).parts?.find((p: any) => p.label === 'feet_sensor');
    if (!feetSensor) return false;

    const collisions = Query.collides(feetSensor, this.engine.world.bodies);
    return collisions.length > 0;
  }
}
