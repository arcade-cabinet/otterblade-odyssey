import { onMount, onCleanup } from 'solid-js';
import { gameStore } from '../stores/gameStore';
import { PhysicsEngine } from '../game/engine/physics';
import { GameLoop } from '../game/engine/gameLoop';
import { Player } from '../game/entities/Player';
import { drawFinn } from '../game/rendering/finn';
import { drawParallax } from '../game/rendering/parallax';
import { setupInput } from '../game/systems/input';
import { loadChapter } from '../game/ddl/loader';

export default function GameCanvas() {
  let canvasRef;
  let physics;
  let gameLoop;
  let player;
  let camera = { x: 0, y: 0 };
  let currentLevel;
  let collectibles = [];
  let resizeHandler;
  
  onMount(async () => {
    const ctx = canvasRef.getContext('2d');
    
    // Resize canvas
    resizeHandler = () => {
      canvasRef.width = window.innerWidth;
      canvasRef.height = window.innerHeight;
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    
    // Initialize physics and game systems
    physics = new PhysicsEngine();
    gameLoop = new GameLoop();
    
    // Load initial level
    await loadLevel(0);
    
    // Create player
    player = new Player(physics, 100, 300);
    setupInput(player);
    
    // Register update systems
    gameLoop.registerSystem({
      update: (deltaTime) => {
        const state = gameStore.getState();
        if (!state.gameStarted) return;
        
        physics.update(deltaTime);
        player.update(deltaTime);
        updateCamera();
        updateCollectibles();
        checkLevelComplete();
        render(ctx);
      }
    });
    
    gameLoop.start();
  });
  
  async function loadLevel(chapterId) {
    currentLevel = await loadChapter(chapterId);
    if (!currentLevel) return;
    
    // Update store
    gameStore.getState().setChapter(
      currentLevel.id,
      currentLevel.name,
      currentLevel.location,
      currentLevel.quest
    );
    
    // Create platforms
    currentLevel.platforms.forEach((platform, i) => {
      const body = physics.createPlatform(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
      physics.addBody(`platform-${i}`, body);
    });
    
    // Create collectibles
    collectibles = currentLevel.collectibles.map(c => ({
      ...c,
      collected: false
    }));
  }
  
  function updateCamera() {
    const playerPos = player.getPosition();
    camera.x = playerPos.x - canvasRef.width / 2;
    camera.y = playerPos.y - canvasRef.height / 2;
  }
  
  function updateCollectibles() {
    const playerPos = player.getPosition();
    collectibles.forEach(collectible => {
      if (collectible.collected) return;
      
      const dx = playerPos.x - collectible.x;
      const dy = playerPos.y - collectible.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        collectible.collected = true;
        gameStore.getState().collectShard();
      }
    });
  }
  
  function checkLevelComplete() {
    const playerPos = player.getPosition();
    if (playerPos.x > currentLevel.exitX) {
      gameStore.getState().completeChapter(currentLevel.id);
      if (currentLevel.id < 9) {
        loadLevel(currentLevel.id + 1);
        player.body.position.x = 100;
        player.body.position.y = 300;
      }
    }
  }
  
  function render(ctx) {
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Draw parallax background
    const currentChapter = gameStore.getState().currentChapter;
    drawParallax(ctx, camera, currentChapter);
    
    // Draw platforms
    ctx.fillStyle = '#8B4513';
    currentLevel.platforms.forEach(platform => {
      ctx.fillRect(
        platform.x - platform.width / 2,
        platform.y - platform.height / 2,
        platform.width,
        platform.height
      );
    });
    
    // Draw collectibles
    ctx.fillStyle = '#F4D03F';
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        ctx.beginPath();
        ctx.arc(collectible.x, collectible.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.strokeStyle = 'rgba(244, 208, 63, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    
    // Draw player
    drawFinn(ctx, player.getState());
    
    // Draw exit
    ctx.fillStyle = '#E67E22';
    ctx.fillRect(currentLevel.exitX - 25, 475, 50, 100);
    ctx.fillStyle = '#F4D03F';
    ctx.font = 'bold 20px Georgia';
    ctx.fillText('→', currentLevel.exitX - 10, 530);
    
    ctx.restore();
  }
  
  onCleanup(() => {
    if (gameLoop) gameLoop.stop();
    if (resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeHandler);
    }
  });
  
  return <canvas ref={canvasRef} />;
}
