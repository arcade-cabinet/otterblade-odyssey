/**
 * Game Loop
 * 
 * Main game loop handling update and render cycles at 60fps.
 * 
 * @module core/game-loop
 */

/**
 * Game Loop class
 */
export class GameLoop {
  /**
   * Create a game loop
   * 
   * @param {Function} updateCallback - Called each frame with deltaTime
   * @param {Function} renderCallback - Called each frame after update
   */
  constructor(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    
    this.running = false;
    this.animationFrameId = null;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    this.currentFps = 60;
    
    // Fixed timestep for physics (60fps = 16.67ms)
    this.fixedDeltaTime = 1000 / 60;
    this.accumulator = 0;
    this.maxAccumulator = this.fixedDeltaTime * 5; // Prevent spiral of death
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.running) {
      console.warn('Game loop already running');
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main loop function
   * @private
   */
  loop() {
    if (!this.running) return;

    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap delta time to prevent huge jumps (e.g., when tab inactive)
    const cappedDeltaTime = Math.min(this.deltaTime, 100);

    // Update FPS counter
    this.updateFpsCounter(currentTime);

    try {
      // Fixed timestep update (for physics)
      this.accumulator += cappedDeltaTime;
      
      // Clamp accumulator to prevent spiral of death
      if (this.accumulator > this.maxAccumulator) {
        this.accumulator = this.maxAccumulator;
      }

      // Process fixed updates
      while (this.accumulator >= this.fixedDeltaTime) {
        if (this.updateCallback) {
          this.updateCallback(this.fixedDeltaTime);
        }
        this.accumulator -= this.fixedDeltaTime;
      }

      // Render with interpolation factor
      const interpolation = this.accumulator / this.fixedDeltaTime;
      if (this.renderCallback) {
        this.renderCallback(interpolation);
      }
    } catch (error) {
      console.error('Error in game loop:', error);
      this.stop();
      throw error;
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Update FPS counter
   * @private
   */
  updateFpsCounter(currentTime) {
    this.frameCount++;

    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  /**
   * Get current FPS
   * 
   * @returns {number} Current FPS
   */
  getFps() {
    return this.currentFps;
  }

  /**
   * Get delta time
   * 
   * @returns {number} Delta time in milliseconds
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Check if loop is running
   * 
   * @returns {boolean}
   */
  isRunning() {
    return this.running;
  }

  /**
   * Pause the game loop
   */
  pause() {
    if (!this.running) return;
    this.running = false;
  }

  /**
   * Resume the game loop
   */
  resume() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * Toggle pause/resume
   */
  togglePause() {
    if (this.running) {
      this.pause();
    } else {
      this.resume();
    }
  }
}
