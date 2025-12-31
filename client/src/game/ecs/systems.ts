import { queries, world, type Entity } from "./world";
import type { With } from "miniplex";

const SPEED = 10;
const JUMP_FORCE = 14;
const GRAVITY = -30;
const COYOTE_TIME = 0.15;
const JUMP_BUFFER = 0.1;

export function movementSystem(dt: number) {
  for (const entity of queries.moving.entities) {
    entity.position.x += entity.velocity.x * dt;
    entity.position.y += entity.velocity.y * dt;
    entity.position.z += entity.velocity.z * dt;
  }
}

export function gravitySystem(dt: number) {
  for (const entity of queries.moving.entities) {
    if (!entity.grounded) {
      entity.velocity.y += GRAVITY * dt;
    }
  }
}

export function controlSystem(dt: number) {
  for (const entity of queries.controlled.entities) {
    const { controls, velocity } = entity;
    
    let moveX = 0;
    if (controls.left) moveX = -1;
    if (controls.right) moveX = 1;
    
    velocity.x = moveX * SPEED;
    
    if (moveX !== 0) {
      entity.facingRight = moveX > 0;
    }
    
    if (entity.coyoteTime !== undefined) {
      if (entity.grounded) {
        entity.coyoteTime = COYOTE_TIME;
      } else {
        entity.coyoteTime = Math.max(0, entity.coyoteTime - dt);
      }
    }
    
    if (entity.jumpBuffer !== undefined) {
      if (controls.jump) {
        entity.jumpBuffer = JUMP_BUFFER;
      } else {
        entity.jumpBuffer = Math.max(0, entity.jumpBuffer - dt);
      }
    }
    
    if (
      entity.jumpBuffer !== undefined &&
      entity.coyoteTime !== undefined &&
      entity.jumpBuffer > 0 &&
      entity.coyoteTime > 0
    ) {
      velocity.y = JUMP_FORCE;
      entity.coyoteTime = 0;
      entity.jumpBuffer = 0;
      entity.grounded = false;
    }
  }
}

export function healthSystem() {
  for (const entity of queries.withHealth.entities) {
    if (entity.health.current <= 0) {
      world.addComponent(entity, "dead", true);
    }
  }
}

export function cleanupSystem() {
  for (const entity of queries.dead.entities) {
    if (!entity.player) {
      world.remove(entity);
    }
  }
}

export function damageEntity(entity: With<Entity, "health">, amount: number) {
  entity.health.current -= amount;
}

export function spawnPlayer(x: number, y: number): Entity {
  return world.add({
    player: true,
    position: { x, y, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: { current: 5, max: 5 },
    facingRight: true,
    grounded: false,
    controls: {
      left: false,
      right: false,
      jump: false,
      crouch: false,
      attack: false,
    },
    coyoteTime: 0,
    jumpBuffer: 0,
  });
}

export function spawnEnemy(
  type: Entity["enemy"],
  x: number,
  y: number,
  health: number = 3
): Entity {
  return world.add({
    enemy: type,
    position: { x, y, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: { current: health, max: health },
    facingRight: false,
  });
}

export function spawnParallaxLayer(
  src: string,
  layer: number,
  scrollFactor: number,
  width: number = 1920,
  height: number = 1080
): Entity {
  return world.add({
    position: { x: 0, y: 0, z: -layer * 10 },
    sprite: { src, width, height },
    parallax: { layer, scrollFactor },
  });
}
