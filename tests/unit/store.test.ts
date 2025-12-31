import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "../../client/src/game/store";

describe("Game Store", () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it("should start with 100 health", () => {
    expect(useStore.getState().health).toBe(100);
  });

  it("should reduce health when taking damage", () => {
    useStore.getState().takeDamage(10);
    expect(useStore.getState().health).toBe(90);
  });

  it("should detect game over", () => {
    useStore.getState().takeDamage(100);
    expect(useStore.getState().isGameOver).toBe(true);
  });

  it("should add score", () => {
    useStore.getState().addScore(50);
    expect(useStore.getState().score).toBe(50);
  });
});
