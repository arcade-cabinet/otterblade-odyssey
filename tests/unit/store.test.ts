/**
 * @fileoverview Unit tests for the Zustand game store
 * Tests all game state management functionality
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/game/store';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.setState({
      runId: 0,
      gameStarted: false,
      gameOver: false,
      health: 5,
      shards: 0,
      bankedShards: 0,
      score: 0,
      bestScore: 0,
      distance: 0,
      bestDistance: 0,
      biomeIndex: 0,
      inBossFight: false,
      bossHp: 0,
      bossMax: 0,
      bossIndex: 0,
      checkpointX: 0,
      checkpointY: 8,
      checkpointSeen: -1,
      toast: '',
      toastUntil: 0,
      playerX: 0,
      playerY: 0,
      playerFacingRight: true,
      playerState: 'run',
      damageFlash: 0,
      platformAABBs: new Map(),
      quality: 2,
      avgMs: 16.7,
      showQualityBadgeUntil: 0,
      controls: {
        left: false,
        right: false,
        jump: false,
        crouch: false,
        attack: false,
        up: false,
        down: false,
      },
    });
  });

  describe('Game Lifecycle', () => {
    it('should start game correctly', () => {
      const state = useStore.getState();
      expect(state.gameStarted).toBe(false);

      state.startGame();

      const newState = useStore.getState();
      expect(newState.gameStarted).toBe(true);
      expect(newState.gameOver).toBe(false);
      expect(newState.health).toBe(5);
      expect(newState.score).toBe(0);
      expect(newState.shards).toBe(0);
      expect(newState.runId).toBe(1);
    });

    it('should increment runId on each new game', () => {
      const state = useStore.getState();
      state.startGame();
      expect(useStore.getState().runId).toBe(1);

      state.startGame();
      expect(useStore.getState().runId).toBe(2);

      state.startGame();
      expect(useStore.getState().runId).toBe(3);
    });

    it('should reset game state on start', () => {
      // Set up some game state
      useStore.setState({
        health: 2,
        shards: 10,
        score: 5000,
        gameOver: true,
      });

      useStore.getState().startGame();

      const state = useStore.getState();
      expect(state.health).toBe(5);
      expect(state.shards).toBe(0);
      expect(state.score).toBe(0);
      expect(state.gameOver).toBe(false);
    });
  });

  describe('Health System', () => {
    it('should reduce health when taking damage', () => {
      useStore.getState().startGame();
      expect(useStore.getState().health).toBe(5);

      useStore.getState().hitPlayer(1);
      expect(useStore.getState().health).toBe(4);
    });

    it('should handle multi-point damage', () => {
      useStore.getState().startGame();
      useStore.getState().hitPlayer(3);
      expect(useStore.getState().health).toBe(2);
    });

    it('should detect game over when health reaches zero', () => {
      useStore.getState().startGame();
      useStore.getState().hitPlayer(5);

      const state = useStore.getState();
      expect(state.gameOver).toBe(true);
      expect(state.health).toBe(0);
    });

    it('should detect game over when health goes negative', () => {
      useStore.getState().startGame();
      useStore.getState().hitPlayer(10);

      const state = useStore.getState();
      expect(state.gameOver).toBe(true);
      expect(state.health).toBe(-5);
    });

    it('should not take damage when already game over', () => {
      useStore.getState().startGame();
      useStore.getState().hitPlayer(5);
      expect(useStore.getState().gameOver).toBe(true);

      const healthBeforeSecondHit = useStore.getState().health;
      useStore.getState().hitPlayer(5);
      expect(useStore.getState().health).toBe(healthBeforeSecondHit);
    });

    it('should trigger damage flash on hit', () => {
      useStore.getState().startGame();
      const beforeHit = performance.now();
      useStore.getState().hitPlayer(1);

      const state = useStore.getState();
      expect(state.damageFlash).toBeGreaterThan(beforeHit);
    });

    it('should update best score on game over', () => {
      useStore.getState().startGame();
      useStore.setState({ score: 1000, distance: 500 });
      useStore.getState().hitPlayer(5);

      const state = useStore.getState();
      expect(state.bestScore).toBe(1000);
      expect(state.bestDistance).toBe(500);
    });
  });

  describe('Score System', () => {
    it('should advance score based on distance', () => {
      useStore.getState().startGame();
      useStore.getState().advanceScore(100);

      const state = useStore.getState();
      expect(state.distance).toBe(100);
      expect(state.score).toBe(1000); // 100 * 10
    });

    it('should only increase distance, never decrease', () => {
      useStore.getState().startGame();
      useStore.getState().advanceScore(100);
      useStore.getState().advanceScore(50);

      expect(useStore.getState().distance).toBe(100);
    });

    it('should add score when collecting shards', () => {
      useStore.getState().startGame();
      const initialScore = useStore.getState().score;

      useStore.getState().addShard();

      const state = useStore.getState();
      expect(state.shards).toBe(1);
      expect(state.score).toBe(initialScore + 180);
    });

    it('should accumulate shards', () => {
      useStore.getState().startGame();
      useStore.getState().addShard();
      useStore.getState().addShard();
      useStore.getState().addShard();

      expect(useStore.getState().shards).toBe(3);
    });
  });

  describe('Checkpoint System', () => {
    it('should save checkpoint and bank shards', () => {
      useStore.getState().startGame();
      useStore.getState().addShard();
      useStore.getState().addShard();

      useStore.getState().checkpoint(0, 10, 5);

      const state = useStore.getState();
      expect(state.bankedShards).toBe(2);
      expect(state.shards).toBe(0);
      expect(state.checkpointSeen).toBe(0);
      expect(state.checkpointX).toBe(10);
      expect(state.checkpointY).toBe(5);
    });

    it('should restore health at checkpoint (max 5)', () => {
      useStore.getState().startGame();
      useStore.getState().hitPlayer(2);
      expect(useStore.getState().health).toBe(3);

      useStore.getState().checkpoint(0, 0, 0);
      expect(useStore.getState().health).toBe(4); // +1, but not over 5
    });

    it('should not exceed max health at checkpoint', () => {
      useStore.getState().startGame();
      expect(useStore.getState().health).toBe(5);

      useStore.getState().checkpoint(0, 0, 0);
      expect(useStore.getState().health).toBe(5);
    });

    it('should add score for reaching checkpoint', () => {
      useStore.getState().startGame();
      const initialScore = useStore.getState().score;

      useStore.getState().checkpoint(0, 0, 0);
      expect(useStore.getState().score).toBe(initialScore + 400);
    });

    it('should display toast message on checkpoint', () => {
      useStore.getState().startGame();
      useStore.getState().checkpoint(0, 0, 0);

      const state = useStore.getState();
      expect(state.toast).toBe('Checkpoint acquired');
      expect(state.toastUntil).toBeGreaterThan(performance.now());
    });

    it('should accumulate banked shards across checkpoints', () => {
      useStore.getState().startGame();

      useStore.getState().addShard();
      useStore.getState().addShard();
      useStore.getState().checkpoint(0, 0, 0);

      useStore.getState().addShard();
      useStore.getState().addShard();
      useStore.getState().addShard();
      useStore.getState().checkpoint(1, 10, 5);

      expect(useStore.getState().bankedShards).toBe(5);
    });
  });

  describe('Respawn System', () => {
    it('should respawn from checkpoint correctly', () => {
      useStore.getState().startGame();
      useStore.getState().checkpoint(0, 100, 50);
      useStore.getState().hitPlayer(5);

      expect(useStore.getState().gameOver).toBe(true);

      useStore.getState().respawnFromCheckpoint();

      const state = useStore.getState();
      expect(state.gameOver).toBe(false);
      expect(state.health).toBe(5);
      expect(state.shards).toBe(0);
    });

    it('should penalize score on respawn', () => {
      useStore.getState().startGame();
      useStore.setState({ score: 2000, distance: 200 });

      useStore.getState().respawnFromCheckpoint();

      const state = useStore.getState();
      expect(state.score).toBe(1100); // 2000 - 900
      expect(state.distance).toBe(120); // 200 - 80
    });

    it('should not go negative on score/distance penalty', () => {
      useStore.getState().startGame();
      useStore.setState({ score: 100, distance: 20 });

      useStore.getState().respawnFromCheckpoint();

      const state = useStore.getState();
      expect(state.score).toBe(0);
      expect(state.distance).toBe(0);
    });

    it('should reset boss fight state on respawn', () => {
      useStore.getState().startGame();
      useStore.getState().setBossState(true, 100, 100, 1);

      useStore.getState().respawnFromCheckpoint();

      const state = useStore.getState();
      expect(state.inBossFight).toBe(false);
      expect(state.bossHp).toBe(0);
    });
  });

  describe('Boss System', () => {
    it('should set boss state correctly', () => {
      useStore.getState().startGame();
      useStore.getState().setBossState(true, 75, 100, 2);

      const state = useStore.getState();
      expect(state.inBossFight).toBe(true);
      expect(state.bossHp).toBe(75);
      expect(state.bossMax).toBe(100);
      expect(state.bossIndex).toBe(2);
    });

    it('should clear boss state', () => {
      useStore.getState().startGame();
      useStore.getState().setBossState(true, 100, 100, 1);
      useStore.getState().setBossState(false, 0, 0, 0);

      const state = useStore.getState();
      expect(state.inBossFight).toBe(false);
    });
  });

  describe('Controls', () => {
    it('should set individual controls', () => {
      useStore.getState().setControl('left', true);
      expect(useStore.getState().controls.left).toBe(true);

      useStore.getState().setControl('left', false);
      expect(useStore.getState().controls.left).toBe(false);
    });

    it('should handle multiple controls simultaneously', () => {
      useStore.getState().setControl('left', true);
      useStore.getState().setControl('jump', true);

      const controls = useStore.getState().controls;
      expect(controls.left).toBe(true);
      expect(controls.jump).toBe(true);
      expect(controls.right).toBe(false);
    });

    it('should support all control types', () => {
      const controlTypes = ['left', 'right', 'jump', 'crouch', 'attack', 'up', 'down'] as const;

      for (const control of controlTypes) {
        useStore.getState().setControl(control, true);
        expect(useStore.getState().controls[control]).toBe(true);
      }
    });
  });

  describe('Player Position', () => {
    it('should update player position', () => {
      useStore.getState().setPlayerPos(100, 50);

      const state = useStore.getState();
      expect(state.playerX).toBe(100);
      expect(state.playerY).toBe(50);
    });

    it('should update player facing direction', () => {
      useStore.getState().setPlayerFacing(true);
      expect(useStore.getState().playerFacingRight).toBe(true);

      useStore.getState().setPlayerFacing(false);
      expect(useStore.getState().playerFacingRight).toBe(false);
    });

    it('should update player state', () => {
      useStore.getState().setPlayerState('jump');
      expect(useStore.getState().playerState).toBe('jump');

      useStore.getState().setPlayerState('idle');
      expect(useStore.getState().playerState).toBe('idle');
    });
  });

  describe('Biome System', () => {
    it('should update biome metadata', () => {
      useStore.getState().setBiomeMeta(3, '#ff0000');

      const state = useStore.getState();
      expect(state.biomeIndex).toBe(3);
      expect(state.accent).toBe('#ff0000');
    });
  });

  describe('Toast System', () => {
    it('should display toast message', () => {
      useStore.getState().toastMsg('Test message', 2000);

      const state = useStore.getState();
      expect(state.toast).toBe('Test message');
      expect(state.toastUntil).toBeGreaterThan(performance.now());
    });

    it('should use default duration', () => {
      const before = performance.now();
      useStore.getState().toastMsg('Test');

      const state = useStore.getState();
      expect(state.toastUntil).toBeGreaterThan(before);
      expect(state.toastUntil).toBeLessThan(before + 2000);
    });
  });

  describe('Platform Registry', () => {
    it('should register platforms', () => {
      useStore.getState().registerPlatform('plat-1', { minX: 0, maxX: 10, topY: 5 });

      const platforms = useStore.getState().platformAABBs;
      expect(platforms.has('plat-1')).toBe(true);
      expect(platforms.get('plat-1')).toEqual({ minX: 0, maxX: 10, topY: 5 });
    });

    it('should unregister platforms', () => {
      useStore.getState().registerPlatform('plat-1', { minX: 0, maxX: 10, topY: 5 });
      useStore.getState().unregisterPlatform('plat-1');

      expect(useStore.getState().platformAABBs.has('plat-1')).toBe(false);
    });

    it('should handle multiple platforms', () => {
      useStore.getState().registerPlatform('plat-1', { minX: 0, maxX: 10, topY: 5 });
      useStore.getState().registerPlatform('plat-2', { minX: 20, maxX: 30, topY: 10 });

      const platforms = useStore.getState().platformAABBs;
      expect(platforms.size).toBe(2);
    });
  });
});
