import { createStore } from 'zustand/vanilla';

export const gameStore = createStore((set, _get) => ({
  // Game state
  gameStarted: false,
  gameOver: false,
  gamePaused: false,
  
  // Player state
  health: 5,
  maxHealth: 5,
  warmth: 100,
  maxWarmth: 100,
  shards: 0,
  
  // Chapter state
  currentChapter: 0,
  chapterName: "The Calling",
  location: "Finn's Cottage",
  quest: "Answer the Call",
  chaptersCompleted: [],
  
  // Actions
  startGame: () => set({ gameStarted: true, gameOver: false }),
  pauseGame: () => set({ gamePaused: true }),
  resumeGame: () => set({ gamePaused: false }),
  gameOverAction: () => set({ gameOver: true, gameStarted: false }),
  
  takeDamage: (amount) => set((state) => ({
    health: Math.max(0, state.health - amount),
    gameOver: state.health - amount <= 0
  })),
  
  heal: (amount) => set((state) => ({
    health: Math.min(state.maxHealth, state.health + amount)
  })),
  
  loseWarmth: (amount) => set((state) => ({
    warmth: Math.max(0, state.warmth - amount)
  })),
  
  gainWarmth: (amount) => set((state) => ({
    warmth: Math.min(state.maxWarmth, state.warmth + amount)
  })),
  
  collectShard: () => set((state) => ({ shards: state.shards + 1 })),
  
  setChapter: (chapterId, name, location, quest) => set({
    currentChapter: chapterId,
    chapterName: name,
    location,
    quest
  }),
  
  completeChapter: (chapterId) => set((state) => ({
    chaptersCompleted: [...state.chaptersCompleted, chapterId]
  })),
  
  resetGame: () => set({
    health: 5,
    warmth: 100,
    shards: 0,
    currentChapter: 0,
    chaptersCompleted: [],
    gameStarted: false,
    gameOver: false,
    gamePaused: false
  })
}));

// Save to localStorage on state changes
gameStore.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('otterblade-odyssey-save', JSON.stringify(state));
  }
});

// Load from localStorage on init
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('otterblade-odyssey-save');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameStore.setState(parsed);
    } catch (e) {
      console.error('Failed to load save:', e);
    }
  }
}
