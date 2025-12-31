import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/game/store";

describe("Game Store", () => {
  beforeEach(() => {
    useStore.getState().reset ? useStore.getState().reset() : useStore.setState({
      health: 100,
      score: 0,
      isGameOver: false,
      runId: 0,
      gameStarted: false,
      gameOver: false,
      shards: 0,
      bankedShards: 0,
      distance: 0,
      bestScore: 0,
      bestDistance: 0,
    });
  });

  it("should start game correctly", () => {
    useStore.getState().startGame();
    expect(useStore.getState().gameStarted).toBe(true);
    expect(useStore.getState().health).toBe(5);
    expect(useStore.getState().score).toBe(0);
  });

  it("should reduce health when taking damage", () => {
    useStore.getState().startGame();
    useStore.getState().hitPlayer(1);
    expect(useStore.getState().health).toBe(4);
  });

  it("should detect game over when health reaches zero", () => {
    useStore.getState().startGame();
    useStore.getState().hitPlayer(5);
    expect(useStore.getState().gameOver).toBe(true);
    expect(useStore.getState().health).toBe(0);
  });

  it("should add score when collecting shards", () => {
    useStore.getState().startGame();
    const initialScore = useStore.getState().score;
    useStore.getState().addShard();
    expect(useStore.getState().shards).toBe(1);
    expect(useStore.getState().score).toBeGreaterThan(initialScore);
  });

  it("should save checkpoint and bank shards", () => {
    useStore.getState().startGame();
    useStore.getState().addShard();
    useStore.getState().addShard();
    
    useStore.getState().checkpoint(0, 10, 5);
    
    expect(useStore.getState().bankedShards).toBe(2);
    expect(useStore.getState().shards).toBe(0);
    expect(useStore.getState().checkpointSeen).toBe(0);
  });
});
