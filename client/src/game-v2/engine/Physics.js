/**
 * Simple AABB Physics - No Rapier needed
 */

export class Physics {
  constructor() {
    this.gravity = 0.6;
  }

  update(entities, dt) {
    entities.forEach(entity => {
      if (!entity.physics) return;

      // Apply gravity
      entity.vy += this.gravity;

      // Apply velocity
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;

      // Reset ground flag
      entity.onGround = false;

      // Check collisions with platforms
      entities.forEach(other => {
        if (other === entity || !other.solid) return;
        this.resolveCollision(entity, other);
      });

      // World bounds
      if (entity.y > 1000) {
        entity.y = 300;
        entity.vy = 0;
        if (entity.takeDamage) entity.takeDamage(1);
      }
    });
  }

  resolveCollision(entity, platform) {
    // AABB collision detection
    const eLeft = entity.x - entity.width / 2;
    const eRight = entity.x + entity.width / 2;
    const eTop = entity.y - entity.height / 2;
    const eBottom = entity.y + entity.height / 2;

    const pLeft = platform.x;
    const pRight = platform.x + platform.width;
    const pTop = platform.y;
    const pBottom = platform.y + platform.height;

    // Check overlap
    if (eRight > pLeft && eLeft < pRight && eBottom > pTop && eTop < pBottom) {
      // Resolve by pushing entity out
      const overlapLeft = eRight - pLeft;
      const overlapRight = pRight - eLeft;
      const overlapTop = eBottom - pTop;
      const overlapBottom = pBottom - eTop;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && entity.vy > 0) {
        // Land on top
        entity.y = pTop - entity.height / 2;
        entity.vy = 0;
        entity.onGround = true;
      } else if (minOverlap === overlapBottom && entity.vy < 0) {
        // Hit ceiling
        entity.y = pBottom + entity.height / 2;
        entity.vy = 0;
      } else if (minOverlap === overlapLeft) {
        // Hit from right
        entity.x = pLeft - entity.width / 2;
        entity.vx = 0;
      } else if (minOverlap === overlapRight) {
        // Hit from left
        entity.x = pRight + entity.width / 2;
        entity.vx = 0;
      }
    }
  }

  checkOverlap(a, b) {
    const aLeft = a.x - a.width / 2;
    const aRight = a.x + a.width / 2;
    const aTop = a.y - a.height / 2;
    const aBottom = a.y + a.height / 2;

    const bLeft = b.x - b.width / 2;
    const bRight = b.x + b.width / 2;
    const bTop = b.y - b.height / 2;
    const bBottom = b.y + b.height / 2;

    return aRight > bLeft && aLeft < bRight && aBottom > bTop && aTop < bBottom;
  }
}
