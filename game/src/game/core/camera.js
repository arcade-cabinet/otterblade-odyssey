/**
 * Camera System
 *
 * Handles camera positioning, smooth following, and screen shake effects.
 *
 * @module core/camera
 */

/**
 * Camera class for smooth player following
 */
export class Camera {
  /**
   * Create a camera
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   */
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.smoothing = 0.1; // Lower = smoother, higher = more responsive
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTime = 0;
  }

  /**
   * Follow a target (typically the player)
   * @param {Object} target - Target with position {x, y}
   * @param {number} deltaTime - Time since last frame in ms
   */
  follow(target, deltaTime = 16) {
    if (!target || !target.position) {
      console.warn('Camera.follow: Invalid target');
      return;
    }

    // Set target to center of screen
    this.targetX = target.position.x - this.canvasWidth / 2;
    this.targetY = target.position.y - this.canvasHeight / 2;

    // Smooth interpolation
    const smoothFactor = Math.min(this.smoothing * (deltaTime / 16), 1);
    this.x += (this.targetX - this.x) * smoothFactor;
    this.y += (this.targetY - this.y) * smoothFactor;

    // Apply screen shake if active
    if (this.shakeTime < this.shakeDuration) {
      this.shakeTime += deltaTime;
      const progress = this.shakeTime / this.shakeDuration;
      const decay = 1 - progress;

      this.x += (Math.random() - 0.5) * this.shakeIntensity * decay;
      this.y += (Math.random() - 0.5) * this.shakeIntensity * decay;
    }
  }

  /**
   * Trigger screen shake effect
   * @param {number} intensity - Shake intensity in pixels
   * @param {number} duration - Shake duration in ms
   */
  shake(intensity = 10, duration = 300) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
  }

  /**
   * Apply camera transform to canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  apply(ctx) {
    if (!ctx) {
      console.warn('Camera.apply: Invalid context');
      return;
    }

    ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {{x: number, y: number}} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {{x: number, y: number}} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    };
  }

  /**
   * Check if a position is visible on screen
   * @param {Object} position - Position {x, y}
   * @param {number} margin - Extra margin around screen (default 100px)
   * @returns {boolean} True if visible
   */
  isVisible(position, margin = 100) {
    if (!position) return false;

    return (
      position.x > this.x - margin &&
      position.x < this.x + this.canvasWidth + margin &&
      position.y > this.y - margin &&
      position.y < this.y + this.canvasHeight + margin
    );
  }

  /**
   * Set camera bounds (to prevent showing outside level)
   * @param {number} minX - Minimum X coordinate
   * @param {number} minY - Minimum Y coordinate
   * @param {number} maxX - Maximum X coordinate
   * @param {number} maxY - Maximum Y coordinate
   */
  setBounds(minX, minY, maxX, maxY) {
    this.boundsMinX = minX;
    this.boundsMinY = minY;
    this.boundsMaxX = maxX;
    this.boundsMaxY = maxY;
    this.hasBounds = true;
  }

  /**
   * Clear camera bounds
   */
  clearBounds() {
    this.hasBounds = false;
  }

  /**
   * Apply bounds clamping (call after follow)
   */
  applyBounds() {
    if (!this.hasBounds) return;

    this.x = Math.max(this.boundsMinX, Math.min(this.boundsMaxX - this.canvasWidth, this.x));
    this.y = Math.max(this.boundsMinY, Math.min(this.boundsMaxY - this.canvasHeight, this.y));
  }

  /**
   * Resize camera (when canvas size changes)
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}
