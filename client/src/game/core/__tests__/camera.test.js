/**
 * Tests for Camera System
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { Camera } from '../camera.js';

describe('Camera', () => {
  let camera;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    camera = new Camera(canvasWidth, canvasHeight);
  });

  describe('Construction', () => {
    it('should initialize with correct dimensions', () => {
      expect(camera.canvasWidth).toBe(canvasWidth);
      expect(camera.canvasHeight).toBe(canvasHeight);
    });

    it('should initialize position at origin', () => {
      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
    });

    it('should initialize with default smoothing', () => {
      expect(camera.smoothing).toBe(0.1);
    });
  });

  describe('follow()', () => {
    it('should center on target', () => {
      const target = { position: { x: 1000, y: 1000 } };
      camera.follow(target, 16);

      // After one frame, should move toward target
      expect(camera.x).toBeGreaterThan(0);
      expect(camera.y).toBeGreaterThan(0);
    });

    it('should handle invalid target gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      camera.follow(null);
      expect(consoleSpy).toHaveBeenCalledWith('Camera.follow: Invalid target');

      camera.follow({});
      expect(consoleSpy).toHaveBeenCalledWith('Camera.follow: Invalid target');

      consoleSpy.mockRestore();
    });

    it('should smooth camera movement', () => {
      const target = { position: { x: 1000, y: 1000 } };

      camera.follow(target, 16);
      const firstX = camera.x;

      camera.follow(target, 16);
      const secondX = camera.x;

      // Should continue moving toward target
      expect(secondX).toBeGreaterThan(firstX);
      expect(secondX).toBeLessThan(1000 - canvasWidth / 2);
    });

    it('should respect deltaTime for consistent speed', () => {
      const target = { position: { x: 1000, y: 1000 } };

      // Slow frame
      camera.follow(target, 32);
      const slowFrameDistance = camera.x;

      camera.x = 0; // Reset

      // Fast frame
      camera.follow(target, 16);
      const fastFrameDistance = camera.x;

      // Slow frame should move roughly twice as far
      expect(slowFrameDistance).toBeGreaterThan(fastFrameDistance * 1.5);
    });
  });

  describe('shake()', () => {
    it('should set shake parameters', () => {
      camera.shake(15, 500);

      expect(camera.shakeIntensity).toBe(15);
      expect(camera.shakeDuration).toBe(500);
      expect(camera.shakeTime).toBe(0);
    });

    it('should apply shake offset during follow', () => {
      const target = { position: { x: 400, y: 300 } };

      // Move to target first
      for (let i = 0; i < 10; i++) {
        camera.follow(target, 16);
      }
      const steadyX = camera.x;

      // Apply shake
      camera.shake(20, 500);
      camera.follow(target, 16);

      // Position should differ from steady state (with some randomness)
      // We can't test exact value due to randomness, but it should have moved
      expect(Math.abs(camera.x - steadyX)).toBeGreaterThan(0);
    });

    it('should decay shake over time', () => {
      const target = { position: { x: 400, y: 300 } };
      camera.shake(20, 100);

      camera.follow(target, 50);
      const earlyShake = Math.abs(camera.x);

      camera.x = 0; // Reset
      camera.shakeTime = 90;
      camera.follow(target, 50);
      const lateShake = Math.abs(camera.x);

      // Later shake should be smaller (decayed)
      expect(lateShake).toBeLessThan(earlyShake);
    });
  });

  describe('apply()', () => {
    it('should translate context', () => {
      const mockCtx = { translate: vi.fn() };
      camera.x = 100;
      camera.y = 200;

      camera.apply(mockCtx);

      expect(mockCtx.translate).toHaveBeenCalledWith(-100, -200);
    });

    it('should handle invalid context', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      camera.apply(null);
      expect(consoleSpy).toHaveBeenCalledWith('Camera.apply: Invalid context');

      consoleSpy.mockRestore();
    });

    it('should floor coordinates to prevent sub-pixel rendering', () => {
      const mockCtx = { translate: vi.fn() };
      camera.x = 100.7;
      camera.y = 200.3;

      camera.apply(mockCtx);

      expect(mockCtx.translate).toHaveBeenCalledWith(-100, -200);
    });
  });

  describe('screenToWorld()', () => {
    it('should convert screen to world coordinates', () => {
      camera.x = 100;
      camera.y = 200;

      const world = camera.screenToWorld(50, 75);

      expect(world.x).toBe(150);
      expect(world.y).toBe(275);
    });
  });

  describe('worldToScreen()', () => {
    it('should convert world to screen coordinates', () => {
      camera.x = 100;
      camera.y = 200;

      const screen = camera.worldToScreen(150, 275);

      expect(screen.x).toBe(50);
      expect(screen.y).toBe(75);
    });

    it('should be inverse of screenToWorld', () => {
      camera.x = 100;
      camera.y = 200;

      const world = camera.screenToWorld(50, 75);
      const screen = camera.worldToScreen(world.x, world.y);

      expect(screen.x).toBe(50);
      expect(screen.y).toBe(75);
    });
  });

  describe('isVisible()', () => {
    beforeEach(() => {
      camera.x = 0;
      camera.y = 0;
    });

    it('should return true for positions on screen', () => {
      const position = { x: 400, y: 300 };
      expect(camera.isVisible(position)).toBe(true);
    });

    it('should return false for positions off screen left', () => {
      const position = { x: -200, y: 300 };
      expect(camera.isVisible(position)).toBe(false);
    });

    it('should return false for positions off screen right', () => {
      const position = { x: 1200, y: 300 };
      expect(camera.isVisible(position)).toBe(false);
    });

    it('should return false for positions off screen top', () => {
      const position = { x: 400, y: -200 };
      expect(camera.isVisible(position)).toBe(false);
    });

    it('should return false for positions off screen bottom', () => {
      const position = { x: 400, y: 900 };
      expect(camera.isVisible(position)).toBe(false);
    });

    it('should respect margin parameter', () => {
      const position = { x: -50, y: 300 };

      expect(camera.isVisible(position, 0)).toBe(false);
      expect(camera.isVisible(position, 100)).toBe(true);
    });

    it('should handle null position', () => {
      expect(camera.isVisible(null)).toBe(false);
    });
  });

  describe('setBounds() and applyBounds()', () => {
    it('should set bounds', () => {
      camera.setBounds(0, 0, 2000, 1500);

      expect(camera.boundsMinX).toBe(0);
      expect(camera.boundsMinY).toBe(0);
      expect(camera.boundsMaxX).toBe(2000);
      expect(camera.boundsMaxY).toBe(1500);
      expect(camera.hasBounds).toBe(true);
    });

    it('should clamp camera to bounds', () => {
      camera.setBounds(0, 0, 2000, 1500);
      camera.x = -100;
      camera.y = -100;

      camera.applyBounds();

      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
    });

    it('should clamp camera to max bounds', () => {
      camera.setBounds(0, 0, 2000, 1500);
      camera.x = 3000;
      camera.y = 3000;

      camera.applyBounds();

      expect(camera.x).toBe(2000 - canvasWidth);
      expect(camera.y).toBe(1500 - canvasHeight);
    });

    it('should not clamp when bounds cleared', () => {
      camera.setBounds(0, 0, 2000, 1500);
      camera.clearBounds();
      camera.x = -100;

      camera.applyBounds();

      expect(camera.x).toBe(-100);
    });
  });

  describe('resize()', () => {
    it('should update canvas dimensions', () => {
      camera.resize(1024, 768);

      expect(camera.canvasWidth).toBe(1024);
      expect(camera.canvasHeight).toBe(768);
    });

    it('should affect visibility calculations', () => {
      const position = { x: 900, y: 300 };

      expect(camera.isVisible(position)).toBe(false); // 800x600

      camera.resize(1024, 768);
      expect(camera.isVisible(position)).toBe(true); // 1024x768
    });
  });
});
