export class GameLoop {
  constructor() {
    this.isRunning = false;
    this.lastTime = 0;
    this.targetFPS = 60;
    this.targetFrameTime = 1000 / this.targetFPS;
    this.systems = [];
    this.rafId = null;
  }
  
  registerSystem(system) {
    this.systems.push(system);
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
  
  loop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    const clampedDelta = Math.min(deltaTime, this.targetFrameTime * 2);
    
    for (const system of this.systems) {
      if (system.update) {
        system.update(clampedDelta);
      }
    }
    
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }
}
