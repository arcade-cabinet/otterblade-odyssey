import Matter from 'matter-js';
const { Body } = Matter;

export class Player {
  constructor(physics, x, y) {
    this.physics = physics;
    this.body = physics.createPlayer(x, y);
    physics.addBody('player', this.body);
    
    this.moveForce = 0.005;
    this.maxSpeed = 8;
    this.jumpVelocity = -12;
    
    this.isGrounded = false;
    this.facing = 1;
    this.state = 'idle';
    this.animationFrame = 0;
    
    this.inputs = {
      left: false,
      right: false,
      jump: false,
      attack: false
    };
  }
  
  update(deltaTime) {
    this.updateMovement();
    this.updateAnimation(deltaTime);
    this.checkGrounded();
  }
  
  updateMovement() {
    const velocity = this.body.velocity;
    
    if (this.inputs.left) {
      Body.applyForce(this.body, this.body.position, { x: -this.moveForce, y: 0 });
      this.facing = -1;
    }
    if (this.inputs.right) {
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
      this.facing = 1;
    }
    
    if (Math.abs(velocity.x) > this.maxSpeed) {
      Body.setVelocity(this.body, {
        x: Math.sign(velocity.x) * this.maxSpeed,
        y: velocity.y
      });
    }
    
    if (this.inputs.jump && this.isGrounded) {
      Body.setVelocity(this.body, {
        x: velocity.x,
        y: this.jumpVelocity
      });
      this.inputs.jump = false;
    }
  }
  
  checkGrounded() {
    this.isGrounded = Math.abs(this.body.velocity.y) < 0.5;
  }
  
  updateAnimation(deltaTime) {
    if (this.inputs.attack) {
      this.state = 'attack';
    } else if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.abs(this.body.velocity.x) > 0.5) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
    
    this.animationFrame += deltaTime * 0.01;
    if (this.animationFrame > 100) this.animationFrame = 0;
  }
  
  setInput(key, value) {
    if (key in this.inputs) {
      this.inputs[key] = value;
    }
  }
  
  getPosition() {
    return this.body.position;
  }
  
  getState() {
    return {
      position: this.body.position,
      velocity: this.body.velocity,
      facing: this.facing,
      state: this.state,
      frame: this.animationFrame
    };
  }
}
