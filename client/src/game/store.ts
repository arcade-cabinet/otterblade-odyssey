import { create } from "zustand";

interface GameState {
  health: number;
  score: number;
  isGameOver: boolean;
  takeDamage: (amount: number) => void;
  addScore: (amount: number) => void;
  reset: () => void;
}

export const useStore = create<GameState>((set) => ({
  health: 100,
  score: 0,
  isGameOver: false,
  takeDamage: (amount) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
      isGameOver: state.health - amount <= 0,
    })),
  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  reset: () => set({ health: 100, score: 0, isGameOver: false }),
}));
