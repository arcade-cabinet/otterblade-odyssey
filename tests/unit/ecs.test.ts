/**
 * @fileoverview Unit tests for ECS (Entity Component System)
 * Tests Miniplex world, queries, and systems
 *
 * Note: We mock miniplex-react because it uses React internals that don't work
 * in the happy-dom test environment. The ECS logic itself doesn't need React.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock miniplex-react before any imports that use it
// Based on: https://vitest.dev/guide/mocking/modules
vi.mock('miniplex-react', () => {
  return {
    default: vi.fn(() => ({
      world: null,
      Component: vi.fn(),
      Entity: vi.fn(),
      Entities: vi.fn(),
      useCurrentEntity: vi.fn(),
    })),
    createReactAPI: vi.fn(() => ({
      world: null,
      Component: vi.fn(),
      Entity: vi.fn(),
      Entities: vi.fn(),
      useCurrentEntity: vi.fn(),
    })),
    useEntities: vi.fn(),
    useOnEntityAdded: vi.fn(),
    useOnEntityRemoved: vi.fn(),
  };
});

import {
  cleanupSystem,
  controlSystem,
  damageEntity,
  gravitySystem,
  healthSystem,
  movementSystem,
  spawnEnemy,
  spawnPlayer,
} from '@/game/ecs/systems';
// Now import the modules that depend on miniplex-react
import { type Entity, queries, world } from '@/game/ecs/world';

describe('ECS World', () => {
  beforeEach(() => {
    // Clear all entities before each test
    const entities = [...world];
    for (const entity of entities) {
      world.remove(entity);
    }
  });

  describe('Entity Creation', () => {
    it('should create entities with components', () => {
      const entity = world.add({
        position: { x: 0, y: 0, z: 0 },
      });

      expect(entity.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should add optional components', () => {
      const entity = world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
      });

      expect(entity.velocity).toEqual({ x: 1, y: 0, z: 0 });
    });

    it('should remove entities', () => {
      const entity = world.add({
        position: { x: 0, y: 0, z: 0 },
      });

      const sizeBefore = [...world].length;
      world.remove(entity);
      const sizeAfter = [...world].length;

      expect(sizeAfter).toBe(sizeBefore - 1);
    });
  });

  describe('Queries', () => {
    it('should query entities with position and velocity', () => {
      world.add({ position: { x: 0, y: 0, z: 0 } });
      world.add({ position: { x: 0, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 } });
      world.add({ position: { x: 0, y: 0, z: 0 }, velocity: { x: 2, y: 0, z: 0 } });

      const moving = [...queries.moving];
      expect(moving.length).toBe(2);
    });

    it('should query player entities', () => {
      world.add({ position: { x: 0, y: 0, z: 0 }, player: true });
      world.add({ position: { x: 0, y: 0, z: 0 } });

      const players = [...queries.players];
      expect(players.length).toBe(1);
      expect(players[0].player).toBe(true);
    });

    it('should query enemy entities', () => {
      world.add({ position: { x: 0, y: 0, z: 0 }, enemy: { type: 'skirmisher' } });
      world.add({ position: { x: 0, y: 0, z: 0 }, enemy: { type: 'shielded' } });
      world.add({ position: { x: 0, y: 0, z: 0 } });

      const enemies = [...queries.enemies];
      expect(enemies.length).toBe(2);
    });

    it('should query entities with health', () => {
      world.add({ health: { current: 5, max: 5 } });
      world.add({ health: { current: 3, max: 5 } });
      world.add({ position: { x: 0, y: 0, z: 0 } });

      const withHealth = [...queries.withHealth];
      expect(withHealth.length).toBe(2);
    });
  });
});

describe('ECS Systems', () => {
  beforeEach(() => {
    const entities = [...world];
    for (const entity of entities) {
      world.remove(entity);
    }
  });

  describe('movementSystem', () => {
    it('should update position based on velocity', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 10, y: 5, z: 0 },
      });

      movementSystem(0.1);

      const entity = [...queries.moving][0];
      expect(entity.position.x).toBeCloseTo(1);
      expect(entity.position.y).toBeCloseTo(0.5);
    });

    it('should handle multiple entities', () => {
      const e1 = world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 10, y: 0, z: 0 },
      });
      const e2 = world.add({
        position: { x: 5, y: 0, z: 0 },
        velocity: { x: -10, y: 0, z: 0 },
      });

      movementSystem(0.1);

      // Check the entities directly instead of relying on query order
      expect(e1.position.x).toBeCloseTo(1);
      expect(e2.position.x).toBeCloseTo(4);
    });
  });

  describe('gravitySystem', () => {
    it('should apply gravity to non-grounded entities', () => {
      world.add({
        position: { x: 0, y: 10, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        grounded: false,
      });

      gravitySystem(0.1);

      const entity = [...queries.moving][0];
      expect(entity.velocity?.y).toBeLessThan(0);
    });

    it('should not apply gravity to grounded entities', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        grounded: true,
      });

      gravitySystem(0.1);

      const entity = [...queries.moving][0];
      expect(entity.velocity?.y).toBe(0);
    });
  });

  describe('controlSystem', () => {
    it('should update velocity based on controls', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        controls: {
          left: false,
          right: true,
          jump: false,
          crouch: false,
          attack: false,
        },
      });

      controlSystem(0.016);

      const entity = [...queries.controlled][0];
      expect(entity.velocity?.x).toBeGreaterThan(0);
    });

    it('should update facing direction', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        controls: {
          left: true,
          right: false,
          jump: false,
          crouch: false,
          attack: false,
        },
        facingRight: true,
      });

      controlSystem(0.016);

      const entity = [...queries.controlled][0];
      expect(entity.facingRight).toBe(false);
    });
  });

  describe('healthSystem', () => {
    it('should mark entities as dead when health reaches zero', () => {
      const entity = world.add({
        health: { current: 0, max: 5 },
      });

      healthSystem();

      expect(entity.dead).toBe(true);
    });

    it('should not mark entities as dead with positive health', () => {
      const entity = world.add({
        health: { current: 1, max: 5 },
      });

      healthSystem();

      expect(entity.dead).toBeUndefined();
    });
  });

  describe('cleanupSystem', () => {
    it('should remove dead non-player entities', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        enemy: { type: 'skirmisher' },
        dead: true,
      });

      const sizeBefore = [...world].length;
      cleanupSystem();
      const sizeAfter = [...world].length;

      expect(sizeAfter).toBe(sizeBefore - 1);
    });

    it('should not remove dead player entities', () => {
      world.add({
        position: { x: 0, y: 0, z: 0 },
        player: true,
        dead: true,
      });

      const sizeBefore = [...world].length;
      cleanupSystem();
      const sizeAfter = [...world].length;

      expect(sizeAfter).toBe(sizeBefore);
    });
  });
});

describe('Entity Spawning', () => {
  beforeEach(() => {
    const entities = [...world];
    for (const entity of entities) {
      world.remove(entity);
    }
  });

  describe('spawnPlayer', () => {
    it('should create a player entity', () => {
      const player = spawnPlayer(10, 5);

      expect(player.player).toBe(true);
      expect(player.position).toEqual({ x: 10, y: 5, z: 0 });
      expect(player.health).toEqual({ current: 5, max: 5 });
    });

    it('should initialize player controls', () => {
      const player = spawnPlayer(0, 0);

      expect(player.controls).toBeDefined();
      expect(player.controls?.left).toBe(false);
      expect(player.controls?.right).toBe(false);
      expect(player.controls?.jump).toBe(false);
    });
  });

  describe('spawnEnemy', () => {
    it('should create an enemy entity', () => {
      const enemy = spawnEnemy({ type: 'skirmisher' }, 20, 0);

      expect(enemy.enemy).toEqual({ type: 'skirmisher' });
      expect(enemy.position).toEqual({ x: 20, y: 0, z: 0 });
    });

    it('should use default health', () => {
      const enemy = spawnEnemy({ type: 'shielded' }, 0, 0);

      expect(enemy.health).toEqual({ current: 3, max: 3 });
    });

    it('should use custom health', () => {
      const enemy = spawnEnemy({ type: 'elite' }, 0, 0, 10);

      expect(enemy.health).toEqual({ current: 10, max: 10 });
    });
  });

  describe('damageEntity', () => {
    it('should reduce entity health', () => {
      const entity = world.add({
        health: { current: 5, max: 5 },
      }) as Entity & { health: { current: number; max: number } };

      damageEntity(entity, 2);

      expect(entity.health.current).toBe(3);
    });

    it('should allow health to go negative', () => {
      const entity = world.add({
        health: { current: 1, max: 5 },
      }) as Entity & { health: { current: number; max: number } };

      damageEntity(entity, 5);

      expect(entity.health.current).toBe(-4);
    });
  });
});
