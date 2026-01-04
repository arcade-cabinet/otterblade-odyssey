import type * as Matter from 'matter-js';

interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface CameraTarget {
  position: Matter.Vector;
}

/**
 * Camera - Smooth camera following with bounds
 * Migrated from game-monolith.js lines 700-732
 */
export class Camera {
  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;
  smoothing: number = 0.1;
  canvas: HTMLCanvasElement;
  bounds: CameraBounds | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  follow(target: CameraTarget, bounds: CameraBounds | null = null): void {
    this.targetX = target.position.x - this.canvas.width / 2;
    this.targetY = target.position.y - this.canvas.height / 2;
    
    if (bounds) {
      this.targetX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX - this.canvas.width, this.targetX)
      );
      this.targetY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY - this.canvas.height, this.targetY)
      );
    }
    
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Set camera bounds to constrain camera movement
   */
  setBounds(bounds: CameraBounds | null): void {
    this.bounds = bounds;
  }

  /**
   * Set camera smoothing factor (0-1)
   * 0 = instant, 1 = never reaches target
   */
  setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Snap camera to target immediately (no smoothing)
   */
  snap(target: CameraTarget, bounds: CameraBounds | null = null): void {
    this.targetX = target.position.x - this.canvas.width / 2;
    this.targetY = target.position.y - this.canvas.height / 2;
    
    if (bounds) {
      this.targetX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX - this.canvas.width, this.targetX)
      );
      this.targetY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY - this.canvas.height, this.targetY)
      );
    }
    
    this.x = this.targetX;
    this.y = this.targetY;
  }
}
