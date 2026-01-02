import { createGame } from './core/Game.js';

// Initialize game on start
document.addEventListener('DOMContentLoaded', async () => {
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const hud = document.getElementById('hud');
  const touchControls = document.getElementById('touchControls');

  let game = null;

  async function startGame() {
    // Hide overlays
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    hud.classList.remove('hidden');

    // Show touch controls on mobile
    if ('ontouchstart' in window) {
      touchControls.classList.remove('hidden');
    }

    // Create game
    if (!game) {
      game = await createGame();
    }

    // Reset and start
    game.reset();
    game.start();
  }

  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', startGame);

  // Prevent default behaviors
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
});
