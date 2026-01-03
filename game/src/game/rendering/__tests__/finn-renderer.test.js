/**
 * Tests for Finn Procedural Renderer
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drawFinn } from '../finn-renderer.js';

describe('Finn Renderer', () => {
  let mockCtx;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
    };
  });

  it('should validate input parameters', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Invalid ctx
    drawFinn(null, { x: 0, y: 0 }, 1, 0);
    expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters to drawFinn');

    // Invalid position
    drawFinn(mockCtx, null, 1, 0);
    expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters to drawFinn');

    // Invalid animFrame
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 'invalid');
    expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters to drawFinn');

    consoleSpy.mockRestore();
  });

  it('should save and restore canvas context', () => {
    drawFinn(mockCtx, { x: 100, y: 200 }, 1, 0);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should translate to position', () => {
    const position = { x: 100, y: 200 };
    drawFinn(mockCtx, position, 1, 0);

    expect(mockCtx.translate).toHaveBeenCalledWith(position.x, position.y);
  });

  it('should flip sprite when facing left', () => {
    drawFinn(mockCtx, { x: 0, y: 0 }, -1, 0);

    expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
  });

  it('should not flip sprite when facing right', () => {
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 0);

    expect(mockCtx.scale).not.toHaveBeenCalled();
  });

  it('should draw body parts', () => {
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 0);

    // Should draw multiple ellipses for body parts
    expect(mockCtx.ellipse).toHaveBeenCalled();
    expect(mockCtx.ellipse.mock.calls.length).toBeGreaterThan(5);
  });

  it('should draw sword when attacking', () => {
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 0, { attacking: true });

    // Should rotate for sword swing
    expect(mockCtx.rotate).toHaveBeenCalled();

    // Should create gradient for blade
    expect(mockCtx.createLinearGradient).toHaveBeenCalled();
  });

  it('should not draw sword when not attacking', () => {
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 0, { attacking: false });

    // Should not rotate (sword drawing includes rotation)
    expect(mockCtx.rotate).not.toHaveBeenCalled();
  });

  it('should apply bounce animation when moving', () => {
    const staticCalls = [];
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 10, { moving: false });
    staticCalls.push([...mockCtx.ellipse.mock.calls]);
    mockCtx.ellipse.mockClear();

    const movingCalls = [];
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 10, { moving: true });
    movingCalls.push([...mockCtx.ellipse.mock.calls]);

    // Y coordinates should differ when moving (bounce effect)
    // Check body ellipse (index 1) not shadow (index 0)
    expect(staticCalls[0][1][1]).not.toEqual(movingCalls[0][1][1]);
  });

  it('should animate breathing over time', () => {
    const frame0Calls = [];
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 0);
    frame0Calls.push([...mockCtx.ellipse.mock.calls]);
    mockCtx.ellipse.mockClear();

    const frame100Calls = [];
    drawFinn(mockCtx, { x: 0, y: 0 }, 1, 100);
    frame100Calls.push([...mockCtx.ellipse.mock.calls]);

    // Y coordinates should differ between frames (breathing animation)
    // Check body ellipse (index 1) not shadow (index 0)
    expect(frame0Calls[0][1][1]).not.toEqual(frame100Calls[0][1][1]);
  });
});
