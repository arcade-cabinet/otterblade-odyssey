import Matter from 'matter-js';
const { Engine, World, Bodies, Events } = Matter;

export class PhysicsEngine {
  constructor() {
    this.engine = Engine.create();
    this.engine.gravity.y = 1.5;
    this.world = this.engine.world;
    this.bodies = new Map();
  }
  
  update(deltaTime) {
    Engine.update(this.engine, deltaTime);
  }
  
  addBody(id, body) {
    World.add(this.world, body);
    this.bodies.set(id, body);
    return body;
  }
  
  removeBody(id) {
    const body = this.bodies.get(id);
    if (body) {
      World.remove(this.world, body);
      this.bodies.delete(id);
    }
  }
  
  getBody(id) {
    return this.bodies.get(id);
  }
  
  createPlatform(x, y, width, height, options = {}) {
    return Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.8,
      ...options
    });
  }
  
  createPlayer(x, y) {
    return Bodies.rectangle(x, y, 35, 55, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      density: 0.01
    });
  }
  
  createEnemy(x, y) {
    return Bodies.rectangle(x, y, 28, 45, {
      label: 'enemy',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0
    });
  }
  
  onCollisionStart(callback) {
    Events.on(this.engine, 'collisionStart', callback);
  }
  
  onCollisionEnd(callback) {
    Events.on(this.engine, 'collisionEnd', callback);
  }
}
