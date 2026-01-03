/**
 * PlayerController.js
 * Advanced player movement mechanics including wall climbing, water swimming,
 * parry/riposte, combat system per WORLD.md and PHYSICS.md
 */

import Matter from 'matter-js';
import { checkGrounded, createAttackHitbox, PLAYER_PHYSICS } from './PhysicsManager';

const { Body } = Matter;

/**
 * Player movement and combat controller
 */
export class PlayerController {
  constructor(player, engine, gameState, audioManager) {
    this.player = player;
    this.engine = engine;
    this.gameState = gameState;
    this.audioManager = audioManager;

    // Movement state
    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBufferTime = 0;

    // Combat state
    this.comboTimer = 0;
    this.comboIndex = 0;
    this.attackCooldown = 0;
    this.parryWindow = 0;
    this.chargeAttackTime = 0;
    this.isCharging = false;

    // Wall mechanics
    this.touchingWall = null;
    this.wallSlideTimer = 0;

    // Attack patterns (PHYSICS.md:722-742)
    this.attacks = [
      { offsetX: 25, offsetY: -5, width: 35, height: 30, damage: 15, kb: { x: 5, y: 0 } },
      { offsetX: 30, offsetY: -10, width: 40, height: 35, damage: 20, kb: { x: 7, y: -2 } },
      { offsetX: 35, offsetY: -5, width: 50, height: 40, damage: 30, kb: { x: 10, y: -5 } },
    ];

    // Hearth Strike (charged attack)
    this.hearthStrike = {
      offsetX: 40,
      offsetY: 0,
      width: 60,
      height: 50,
      damage: 50,
      kb: { x: 15, y: -8 },
      chargeTime: 1000, // 1 second charge
    };

    // Track active timeouts for cleanup
    this.activeTimeouts = [];
  }

  update(controls, delta) {
    this.isGrounded = checkGrounded(this.player, this.engine);

    // Update timers
    if (this.coyoteTime > 0) this.coyoteTime -= delta;
    if (this.jumpBufferTime > 0) this.jumpBufferTime -= delta;
    if (this.comboTimer > 0) this.comboTimer -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.parryWindow > 0) this.parryWindow -= delta;
    if (this.wallSlideTimer > 0) this.wallSlideTimer -= delta;

    // Reset combo if timer expires
    if (this.comboTimer <= 0) {
      this.comboIndex = 0;
    }

    // Coyote time
    if (this.isGrounded) {
      this.coyoteTime = 0.15; // 150ms grace period
    }

    // Check wall touch
    this.checkWallTouch();

    // Movement
    this.handleMovement(controls, delta);

    // Combat
    this.handleCombat(controls, delta);

    // Clamp velocity
    const maxVelX = 12;
    const maxVelY = 20;
    Body.setVelocity(this.player, {
      x: Math.max(-maxVelX, Math.min(maxVelX, this.player.velocity.x)),
      y: Math.max(-maxVelY, Math.min(maxVelY, this.player.velocity.y)),
    });
  }

  handleMovement(controls, _delta) {
    const isSLinking = controls.slink;
    const isInWater = this.player.isInWater;

    // Horizontal movement
    let moveMultiplier = this.isGrounded ? 1 : PLAYER_PHYSICS.airControl;
    if (isSLinking) moveMultiplier *= 0.5;

    const targetVelX = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);

    if (targetVelX !== 0) {
      let speed = isSLinking ? PLAYER_PHYSICS.slinkSpeed : PLAYER_PHYSICS.moveSpeed;

      // Water swimming (WORLD.md:128)
      if (isInWater) {
        speed = PLAYER_PHYSICS.swimSpeed;
        moveMultiplier = 0.8;
      }

      Body.setVelocity(this.player, {
        x: targetVelX * speed * moveMultiplier,
        y: this.player.velocity.y,
      });

      this.player.facingDirection = targetVelX;

      // Footstep sounds
      if (this.isGrounded && Math.abs(this.player.velocity.x) > 1) {
        if (Math.random() < 0.02) {
          this.audioManager.playSFX('footstep', { pitch: 0.9 + Math.random() * 0.2 });
        }
      }
    } else {
      // Apply friction when not moving
      Body.setVelocity(this.player, {
        x: this.player.velocity.x * 0.85,
        y: this.player.velocity.y,
      });
    }

    // Jump (with coyote time and jump buffering)
    if (controls.jump && !this.player.lastJumpPressed) {
      this.jumpBufferTime = 0.1; // 100ms buffer
    }
    this.player.lastJumpPressed = controls.jump;

    if (this.jumpBufferTime > 0 && this.coyoteTime > 0 && this.player.canJump) {
      this.performJump();
      this.jumpBufferTime = 0;
      this.coyoteTime = 0;
    }

    // Variable jump height
    if (!controls.jump && this.player.velocity.y < -3) {
      Body.setVelocity(this.player, {
        x: this.player.velocity.x,
        y: this.player.velocity.y * 0.5,
      });
    }

    if (!controls.jump) {
      this.player.canJump = true;
    }

    // Wall mechanics (WORLD.md:128-132)
    if (this.touchingWall && !this.isGrounded && Math.abs(this.player.velocity.y) > 0.5) {
      this.handleWallSlide(controls);
    } else {
      this.wallSlideTimer = 0;
    }

    // Roll (PHYSICS.md:618-641)
    if (controls.roll && this.isGrounded && !this.player.isRolling && this.attackCooldown <= 0) {
      this.startRoll();
    }

    // Drop through semi-solid platforms
    if (controls.slink && controls.jump && this.isGrounded) {
      this.dropThroughPlatform();
    }
  }

  handleCombat(controls, delta) {
    // Parry window activation (WORLD.md:136)
    if (controls.parry && this.parryWindow <= 0 && this.attackCooldown <= 0) {
      this.startParry();
    }

    // Attack
    if (controls.attack && !this.player.lastAttackPressed && this.attackCooldown <= 0) {
      // Check if charging for Hearth Strike
      if (!this.isCharging) {
        this.performAttack();
      }
    }

    // Hearth Strike charging (WORLD.md:139)
    if (controls.attack && this.isGrounded && this.comboIndex === 0) {
      this.chargeAttackTime += delta;
      this.isCharging = true;

      if (this.chargeAttackTime >= this.hearthStrike.chargeTime) {
        // Visual feedback (golden glow)
        this.player.chargedAttack = true;
      }
    } else if (this.isCharging && !controls.attack) {
      // Release charged attack
      if (this.chargeAttackTime >= this.hearthStrike.chargeTime) {
        this.performHearthStrike();
      }
      this.chargeAttackTime = 0;
      this.isCharging = false;
      this.player.chargedAttack = false;
    }

    this.player.lastAttackPressed = controls.attack;
  }

  performJump() {
    Body.setVelocity(this.player, {
      x: this.player.velocity.x,
      y: PLAYER_PHYSICS.jumpForce,
    });

    this.player.canJump = false;
    this.audioManager.playSFX('jump');
  }

  checkWallTouch() {
    // Simple wall detection - check for collision on sides
    const touching = this.player.velocity.x !== 0 && !this.isGrounded;
    this.touchingWall = touching ? this.player.facingDirection : null;
  }

  handleWallSlide(controls) {
    // Wall slide (reduced fall speed)
    if (this.player.velocity.y > PLAYER_PHYSICS.wallSlideSpeed) {
      Body.setVelocity(this.player, {
        x: this.player.velocity.x,
        y: PLAYER_PHYSICS.wallSlideSpeed,
      });
    }

    this.wallSlideTimer = 0.5; // Track wall slide duration

    // Wall jump
    if (controls.jump && this.player.canJump) {
      const jumpDir = -this.touchingWall; // Jump away from wall
      Body.setVelocity(this.player, {
        x: jumpDir * PLAYER_PHYSICS.wallJumpForce.x,
        y: PLAYER_PHYSICS.wallJumpForce.y,
      });

      this.player.canJump = false;
      this.player.facingDirection = jumpDir;
      this.audioManager.playSFX('wall_jump');
    }

    // Wall climb (hold up while against wall)
    if (controls.up && this.wallSlideTimer > 0) {
      // Allow climbing up the wall
      Body.setVelocity(this.player, {
        x: this.player.velocity.x * 0.5,
        y: -PLAYER_PHYSICS.climbSpeed,
      });
    }
  }

  startRoll() {
    this.player.isRolling = true;
    this.player.isInvulnerable = true;

    const rollDir = this.player.facingDirection || 1;
    Body.setVelocity(this.player, {
      x: rollDir * PLAYER_PHYSICS.rollSpeed,
      y: this.player.velocity.y,
    });

    this.audioManager.playSFX('roll');

    // End roll after duration
    const rollTimeout = setTimeout(() => {
      this.player.isRolling = false;
      this.player.isInvulnerable = false;
    }, 500);
    this.activeTimeouts.push(rollTimeout);

    this.attackCooldown = 0.6; // 600ms cooldown
  }

  dropThroughPlatform() {
    // Temporarily disable platform collision
    const originalMask = this.player.collisionFilter.mask;
    this.player.collisionFilter.mask &= ~0x0004; // Disable PLATFORM

    const dropTimeout = setTimeout(() => {
      this.player.collisionFilter.mask = originalMask;
    }, 200);
    this.activeTimeouts.push(dropTimeout);

    Body.applyForce(this.player, this.player.position, { x: 0, y: 0.01 });
  }

  startParry() {
    this.parryWindow = 0.3; // 300ms parry window
    this.player.isParrying = true;
    this.audioManager.playSFX('parry_ready');

    const parryTimeout = setTimeout(() => {
      this.player.isParrying = false;
    }, 300);
    this.activeTimeouts.push(parryTimeout);
  }

  /**
   * Called when player successfully parries an attack
   */
  onSuccessfulParry(attacker) {
    // Perfect parry opens enemy for riposte
    this.player.riposteTarget = attacker;
    this.player.riposteWindow = 1.0; // 1 second to riposte
    this.parryWindow = 0;

    // Stun attacker
    attacker.stunned = true;
    attacker.stunnedUntil = performance.now() + 1000;

    this.audioManager.playSFX('parry_success');
    this.gameState.restoreWarmth(10); // Reward

    // Screen flash effect
    this.player.parryFlash = 10;
  }

  performAttack() {
    const attack = this.attacks[this.comboIndex % this.attacks.length];

    // Create hitbox
    const hitbox = createAttackHitbox(
      this.player,
      attack.offsetX,
      attack.offsetY,
      attack.width,
      attack.height,
      attack.damage,
      attack.kb
    );

    // Add to world temporarily
    Matter.World.add(this.engine.world, hitbox);

    const hitboxTimeout = setTimeout(() => {
      Matter.World.remove(this.engine.world, hitbox);
    }, 100);
    this.activeTimeouts.push(hitboxTimeout);

    // Audio
    this.audioManager.playSFX('blade_swing', { pitch: 0.9 + Math.random() * 0.2 });

    // Advance combo
    this.comboIndex++;
    this.comboTimer = 0.5; // 500ms combo window
    this.attackCooldown = 0.3; // 300ms between attacks

    // Check if this is a riposte
    if (this.player.riposteWindow > 0 && this.player.riposteTarget) {
      // Devastating riposte damage
      hitbox.damage *= 2;
      hitbox.knockback.x *= 1.5;
      hitbox.knockback.y *= 1.5;
      this.audioManager.playSFX('riposte');

      this.player.riposteWindow = 0;
      this.player.riposteTarget = null;
    }
  }

  performHearthStrike() {
    const hs = this.hearthStrike;

    // Create powerful hitbox
    const hitbox = createAttackHitbox(
      this.player,
      hs.offsetX,
      hs.offsetY,
      hs.width,
      hs.height,
      hs.damage,
      hs.kb
    );

    hitbox.warmthCost = 20; // Costs warmth to use

    Matter.World.add(this.engine.world, hitbox);

    const hearthTimeout = setTimeout(() => {
      Matter.World.remove(this.engine.world, hitbox);
    }, 150);
    this.activeTimeouts.push(hearthTimeout);

    // Visual and audio
    this.audioManager.playSFX('hearth_strike');
    this.player.hearthStrikeEffect = 20; // Visual frames

    // Drain warmth
    this.gameState.drainWarmth(20);

    this.attackCooldown = 1.0; // 1 second cooldown
    this.comboIndex = 0;
  }

  /**
   * Apply damage to player with knockback
   */
  takeDamage(damage, knockback) {
    if (this.player.isInvulnerable || this.player.isParrying) {
      // Successful parry
      if (this.player.isParrying && this.parryWindow > 0) {
        return { parried: true };
      }
      return { blocked: true };
    }

    this.gameState.takeDamage(damage);

    // Apply knockback
    if (knockback) {
      Body.setVelocity(this.player, knockback);
    }

    // Brief invulnerability
    this.player.isInvulnerable = true;
    this.player.damageFlashTimer = 10;

    const damageTimeout = setTimeout(() => {
      this.player.isInvulnerable = false;
    }, 600);
    this.activeTimeouts.push(damageTimeout);

    this.audioManager.playSFX('player_hurt');

    return { hit: true };
  }

  /**
   * Clean up controller resources
   */
  destroy() {
    // Clear all active timeouts
    for (const timeout of this.activeTimeouts) {
      clearTimeout(timeout);
    }
    this.activeTimeouts = [];
  }
}
