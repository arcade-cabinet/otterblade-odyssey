export function setupInput(player) {
  const keys = {};
  
  // Keyboard input
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      player.setInput('left', true);
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      player.setInput('right', true);
    }
    if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      player.setInput('jump', true);
      e.preventDefault();
    }
    if (e.key === 'z' || e.key === 'Z') {
      player.setInput('attack', true);
    }
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      player.setInput('left', false);
    }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      player.setInput('right', false);
    }
    if (e.key === 'z' || e.key === 'Z') {
      player.setInput('attack', false);
    }
  });
  
  return keys;
}
