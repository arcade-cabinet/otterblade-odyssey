/**
 * Player Entity
 */

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 60;
    
    this.health = 5;
    this.maxHealth = 5;
    this.shards = 0;
    
    this.facing = 1; // 1 = right, -1 = left
    this.state = 'idle'; // idle, walking, jumping, attacking, rolling
    this.onGround = false;
    this.physics = true;
    
    this.attackCooldown = 0;
    this.rollCooldown = 0;
    this.invulnerable = false;
    this.invulnerableTime = 0;
  }

  handleInput(commands) {
    // Horizontal movement
    if (commands.left) {
      this.vx = -4;
      this.facing = -1;
      if (this.state !== 'attacking' && this.state !== 'rolling') {
        this.state = 'walking';
      }
    } else if (commands.right) {
      this.vx = 4;
      this.facing = 1;
      if (this.state !== 'attacking' && this.state !== 'rolling') {
        this.state = 'walking';
      }
    } else {
      this.vx *= 0.8; // Friction
      if (Math.abs(this.vx) < 0.1) {
        this.vx = 0;
        if (this.state === 'walking') {
          this.state = 'idle';
        }
      }
    }

    // Jump
    if (commands.jump && this.onGround) {
      this.vy = -12;
      this.state = 'jumping';
    }

    // Attack
    if (commands.attack && this.attackCooldown <= 0) {
      this.state = 'attacking';
      this.attackCooldown = 30;
    }

    // Roll
    if (commands.roll && this.rollCooldown <= 0 && this.onGround) {
      this.state = 'rolling';
      this.rollCooldown = 60;
      this.invulnerable = true;
      this.invulnerableTime = 30;
      this.vx = this.facing * 8;
    }
  }

  update(dt) {
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.rollCooldown > 0) this.rollCooldown--;
    
    if (this.invulnerableTime > 0) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }

    // Reset state after attack
    if (this.state === 'attacking' && this.attackCooldown <= 15) {
      this.state = 'idle';
    }

    // Reset state after roll
    if (this.state === 'rolling' && this.rollCooldown <= 30) {
      this.state = 'idle';
    }

    // Landing
    if (this.onGround && this.state === 'jumping') {
      this.state = 'idle';
    }
  }

  takeDamage(amount) {
    if (this.invulnerable) return;
    
    this.health -= amount;
    this.invulnerable = true;
    this.invulnerableTime = 60;
    
    if (this.health <= 0) {
      this.health = 0;
      console.log('💀 Player died');
    }
    
    console.log(`❤️ Player health: ${this.health}/${this.maxHealth}`);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  collectShard() {
    this.shards++;
    console.log(`💎 Collected shard! Total: ${this.shards}`);
  }
}
