/**
 * State Store - Zustand-style with localStorage
 */

export const store = {
  state: {
    currentChapter: 0,
    health: 5,
    maxHealth: 5,
    shards: 0,
    bestScore: 0,
    unlockedChapters: [0],
    completedQuests: [],
    playTime: 0
  },

  listeners: new Set(),

  get() {
    return { ...this.state };
  },

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
    this.save();
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  },

  save() {
    try {
      localStorage.setItem('otterblade-save', JSON.stringify(this.state));
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  load() {
    try {
      const saved = localStorage.getItem('otterblade-save');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
        console.log('📂 Save loaded');
      }
    } catch (e) {
      console.error('Load failed:', e);
    }
  },

  reset() {
    localStorage.removeItem('otterblade-save');
    this.state = {
      currentChapter: 0,
      health: 5,
      maxHealth: 5,
      shards: 0,
      bestScore: 0,
      unlockedChapters: [0],
      completedQuests: [],
      playTime: 0
    };
    this.notify();
    console.log('🔄 Save reset');
  }
};
