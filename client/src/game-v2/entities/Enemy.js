/**
 * Enemy Entity - Galeborn invaders
 */

export class Enemy {
  constructor(x, y, type = 'scout', behavior = 'patrol') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 50;
    
    this.type = type; // scout, warrior, boss
    this.behavior = behavior; // patrol, chase, aggressive
    this.health = type === 'boss' ? 10 : 3;
    this.maxHealth = this.health;
    this.damage = type === 'boss' ? 2 : 1;
    
    this.facing = -1;
    this.state = 'idle';
    this.physics = true;
    this.onGround = false;
    
    this.patrolStart = x - 100;
    this.patrolEnd = x + 100;
    this.patrolDirection = 1;
    
    this.attackCooldown = 0;
    this.aggroRange = 300;
    this.attackRange = 50;
  }

  update(dt, player) {
    if (this.behavior === 'patrol') {
      this.patrol();
    } else if (this.behavior === 'chase' || this.behavior === 'aggressive') {
      this.chasePlayer(player);
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  patrol() {
    // Simple patrol back and forth
    if (this.x >= this.patrolEnd) {
      this.patrolDirection = -1;
      this.facing = -1;
    } else if (this.x <= this.patrolStart) {
      this.patrolDirection = 1;
      this.facing = 1;
    }

    this.vx = this.patrolDirection * 1.5;
    this.state = 'walking';
  }

  chasePlayer(player) {
    if (!player) return;

    const dx = player.x - this.x;
    const distance = Math.abs(dx);

    // Check if player in aggro range
    if (distance < this.aggroRange) {
      // Move toward player
      if (distance > this.attackRange) {
        this.vx = dx > 0 ? 2 : -2;
        this.facing = dx > 0 ? 1 : -1;
        this.state = 'walking';
      } else {
        // In attack range
        this.vx = 0;
        this.state = 'attacking';
        
        if (this.attackCooldown <= 0) {
          this.attackPlayer(player);
          this.attackCooldown = 60;
        }
      }
    } else {
      // Out of range, stop
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) {
        this.vx = 0;
        this.state = 'idle';
      }
    }
  }

  attackPlayer(player) {
    if (player && !player.invulnerable) {
      player.takeDamage(this.damage);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      console.log(`💀 ${this.type} defeated`);
    }
  }
}
