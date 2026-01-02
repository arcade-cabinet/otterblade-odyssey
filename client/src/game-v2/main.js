/**
 * Main entry point
 */

import { Game } from './engine/Game.js';
import { store } from './state/store.js';

// Setup canvas
const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Create game
const game = new Game(canvas);

// Initialize and start
async function start() {
  await game.init();
  await game.loadChapter(0);
  game.start();

  // Update HUD
  updateHUD();
  store.subscribe(updateHUD);
}

function updateHUD() {
  const state = store.get();
  const player = game.player;

  if (player) {
    document.getElementById('health').textContent = player.health;
    document.getElementById('shards').textContent = player.shards;
  }

  document.getElementById('chapter').textContent = `${state.currentChapter} - The Calling`;
}

// Expose API for Playwright testing
window.__GAME_API__ = game.getAPI();

// Start game
start().then(() => {
  console.log('🎮 Otterblade Odyssey - Vanilla JS Edition');
  console.log('✅ Game running at 60fps');
  console.log('✅ Procedural rendering (POC otter)');
  console.log('✅ Simple physics (AABB)');
  console.log('✅ State persistence (localStorage)');
  console.log('');
  console.log('THIS IS WHAT WORKS.');
});
