/**
 * Tests for AI Pathfinding
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'yuka';
import { AIManager } from '../AIManager.js';

describe('AIManager Pathfinding', () => {
  let aiManager;

  beforeEach(() => {
    aiManager = new AIManager();
  });

  describe('findPath()', () => {
    it('should return fallback path when navmesh is not initialized', () => {
      const start = new Vector3(10, 10, 0);
      const end = new Vector3(200, 10, 0);

      const path = aiManager.findPath(start, end);

      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThanOrEqual(1);
      // Should at least have the destination
      expect(path[path.length - 1]).toEqual(end);
    });

    it('should handle same start and end position', () => {
      const position = new Vector3(10, 10, 0);

      const path = aiManager.findPath(position, position);

      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('smoothPath()', () => {
    it('should return original path if 2 or fewer waypoints', () => {
      const path = [new Vector3(0, 0, 0), new Vector3(100, 0, 0)];

      const smoothed = aiManager.smoothPath(path);

      expect(smoothed.length).toBe(2);
      expect(smoothed).toEqual(path);
    });

    it('should remove unnecessary intermediate waypoints', () => {
      const path = [
        new Vector3(0, 0, 0),
        new Vector3(50, 0, 0),
        new Vector3(100, 0, 0),
        new Vector3(150, 0, 0),
      ];

      const smoothed = aiManager.smoothPath(path);

      expect(smoothed.length).toBeLessThanOrEqual(path.length);
      expect(smoothed[0]).toEqual(path[0]); // Start preserved
      expect(smoothed[smoothed.length - 1]).toEqual(path[path.length - 1]); // End preserved
    });

    it('should preserve waypoints that do not have line of sight', () => {
      const path = [
        new Vector3(0, 0, 0),
        new Vector3(100, 0, 0),
        new Vector3(200, 0, 0), // Far away, no line of sight
        new Vector3(300, 0, 0),
      ];

      const smoothed = aiManager.smoothPath(path);

      expect(smoothed.length).toBeGreaterThan(2);
    });
  });

  describe('hasLineOfSight()', () => {
    it('should return true for close points', () => {
      const from = new Vector3(0, 0, 0);
      const to = new Vector3(50, 0, 0);

      const result = aiManager.hasLineOfSight(from, to);

      expect(result).toBe(true);
    });

    it('should return false for distant points', () => {
      const from = new Vector3(0, 0, 0);
      const to = new Vector3(200, 0, 0);

      const result = aiManager.hasLineOfSight(from, to);

      expect(result).toBe(false);
    });
  });

  describe('aStarPathfinding()', () => {
    it('should return direct path if no regions available', () => {
      const start = new Vector3(10, 10, 0);
      const goal = new Vector3(200, 10, 0);
      aiManager.navMesh = { regions: [] };

      const path = aiManager.aStarPathfinding(start, goal);

      expect(path.length).toBe(2);
      expect(path[0].x).toBe(start.x);
      expect(path[1].x).toBe(goal.x);
    });
  });

  describe('Performance', () => {
    it('should complete pathfinding in reasonable time for fallback paths', () => {
      const start = new Vector3(10, 10, 0);
      const end = new Vector3(300, 10, 0);

      const startTime = performance.now();
      aiManager.findPath(start, end);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5); // Generous timeout for fallback
    });

    it('should handle multiple pathfinding requests efficiently', () => {
      const positions = [
        [new Vector3(10, 10, 0), new Vector3(200, 10, 0)],
        [new Vector3(50, 10, 0), new Vector3(150, 10, 0)],
        [new Vector3(100, 10, 0), new Vector3(300, 10, 0)],
      ];

      const startTime = performance.now();
      for (const [start, end] of positions) {
        aiManager.findPath(start, end);
      }
      const endTime = performance.now();

      const avgDuration = (endTime - startTime) / positions.length;
      expect(avgDuration).toBeLessThan(5); // Reasonable time per path
    });
  });
});
