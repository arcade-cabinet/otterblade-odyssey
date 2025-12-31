/**
 * @fileoverview Unit tests for utility functions
 */

import { describe, expect, it } from 'vitest';
import { clamp01, damp, hash1, lerp, smooth } from '@/game/utils';

describe('Utility Functions', () => {
  describe('clamp01', () => {
    it('should clamp values to 0-1 range', () => {
      expect(clamp01(0.5)).toBe(0.5);
      expect(clamp01(0)).toBe(0);
      expect(clamp01(1)).toBe(1);
    });

    it('should clamp values below 0', () => {
      expect(clamp01(-0.5)).toBe(0);
      expect(clamp01(-100)).toBe(0);
    });

    it('should clamp values above 1', () => {
      expect(clamp01(1.5)).toBe(1);
      expect(clamp01(100)).toBe(1);
    });
  });

  describe('smooth', () => {
    it('should return 0 at t=0', () => {
      expect(smooth(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(smooth(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(smooth(0.5)).toBe(0.5);
    });

    it('should produce smooth curve values', () => {
      // Smooth step should have derivative 0 at endpoints
      const nearStart = smooth(0.1);
      const nearEnd = smooth(0.9);

      // Values should be closer to endpoints than linear
      expect(nearStart).toBeLessThan(0.1);
      expect(nearEnd).toBeGreaterThan(0.9);
    });
  });

  describe('lerp', () => {
    it('should return a at t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return b at t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint at t=0.5', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('should extrapolate beyond 0-1', () => {
      expect(lerp(0, 10, 2)).toBe(20);
      expect(lerp(0, 10, -1)).toBe(-10);
    });
  });

  describe('hash1', () => {
    it('should return value between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const result = hash1(i);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      }
    });

    it('should be deterministic', () => {
      expect(hash1(42)).toBe(hash1(42));
      expect(hash1(0)).toBe(hash1(0));
      expect(hash1(999)).toBe(hash1(999));
    });

    it('should produce different values for different inputs', () => {
      const values = new Set<number>();
      for (let i = 0; i < 100; i++) {
        values.add(hash1(i));
      }
      // Should have many unique values (allowing for some collisions)
      expect(values.size).toBeGreaterThan(90);
    });
  });

  describe('damp', () => {
    it('should move towards target', () => {
      const result = damp(0, 10, 5, 0.1);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);
    });

    it('should not overshoot target', () => {
      const result = damp(0, 10, 100, 1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should return current when at target', () => {
      const result = damp(10, 10, 5, 0.1);
      expect(result).toBeCloseTo(10);
    });

    it('should handle negative targets', () => {
      const result = damp(0, -10, 5, 0.1);
      expect(result).toBeLessThan(0);
      expect(result).toBeGreaterThan(-10);
    });

    it('should be affected by lambda (speed)', () => {
      const slow = damp(0, 10, 1, 0.1);
      const fast = damp(0, 10, 10, 0.1);
      expect(fast).toBeGreaterThan(slow);
    });

    it('should be affected by dt (time step)', () => {
      const smallDt = damp(0, 10, 5, 0.01);
      const largeDt = damp(0, 10, 5, 0.1);
      expect(largeDt).toBeGreaterThan(smallDt);
    });
  });
});
