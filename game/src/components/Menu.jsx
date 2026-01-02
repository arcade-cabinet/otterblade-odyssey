import { createSignal, Show, onMount } from 'solid-js';
import { gameStore } from '../stores/gameStore';

export default function Menu() {
  const [gameStarted, setGameStarted] = createSignal(false);
  
  onMount(() => {
    gameStore.subscribe((state) => {
      setGameStarted(state.gameStarted);
    });
  });
  
  const startGame = () => {
    gameStore.getState().startGame();
  };
  
  return (
    <Show when={!gameStarted()}>
      <div class="menu-overlay">
        <div class="menu-content">
          <h1 class="title">Otterblade Odyssey</h1>
          <p class="subtitle">A Woodland Adventure</p>
          <button type="button" class="start-btn" onClick={startGame}>
            Begin Journey
          </button>
          <div class="controls-hint">
            <p>WASD / Arrows - Move</p>
            <p>Space - Jump</p>
            <p>Z - Attack</p>
          </div>
        </div>
      </div>
    </Show>
  );
}
