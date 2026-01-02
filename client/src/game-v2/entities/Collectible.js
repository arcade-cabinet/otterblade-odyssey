/**
 * Collectible Entity - Ember shards, health, etc.
 */

export class Collectible {
  constructor(x, y, type = 'shard') {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // shard, health, powerup
    this.collected = false;
    this.bob = 0; // For floating animation
  }

  update(dt) {
    this.bob += 0.1;
  }

  collect(player) {
    if (this.collected) return;
    
    this.collected = true;
    
    if (this.type === 'shard') {
      player.collectShard();
    } else if (this.type === 'health') {
      player.heal(1);
    }
  }
}
