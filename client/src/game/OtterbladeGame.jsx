/** @jsxImportSource solid-js */
/**
 * Main Otterblade Odyssey Game Component
 * Uses DDL loaders and factory patterns to build the game from JSON manifests
 * JavaScript implementation following CLAUDE.md guidelines
 */

import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import Matter from 'matter-js';
import { loadChapterManifest, getChapterSpawnPoint } from './data/chapter-loaders';

const { Engine, World, Bodies, Body, Runner } = Matter;

export default function OtterbladeGame() {
  let canvasRef;
  const currentChapter = 0; // Static for now, will be dynamic later
  const [health] = createSignal(5);
  const [shards] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);

  onMount(() => {
    const canvas = canvasRef;
    if (!canvas) {
      console.error('Canvas ref not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create Matter.js engine with POC-proven settings
    const engine = Engine.create();
    engine.gravity.y = 1.5; // POC-proven value

    const runner = Runner.create();

    // Load chapter manifest using DDL loader
    const chapterId = currentChapter;
    const manifest = loadChapterManifest(chapterId);
    const spawnPoint = getChapterSpawnPoint(chapterId);

    // Create player with POC-proven physics settings
    const player = Bodies.rectangle(spawnPoint.x, spawnPoint.y, 35, 55, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      inertia: Infinity,
    });

    World.add(engine.world, player);

    // Build level from DDL manifest using factory pattern
    const platforms = [];

    if (manifest.level?.segments) {
      for (const segment of manifest.level.segments) {
        if (segment.platforms) {
          for (const platformDef of segment.platforms) {
            const platform = Bodies.rectangle(
              platformDef.x,
              platformDef.y,
              platformDef.width,
              platformDef.height,
              {
                isStatic: true,
                label: 'platform',
                friction: 0.8,
              }
            );
            platforms.push(platform);
            World.add(engine.world, platform);
          }
        }
      }
    }

    // Input handling
    const keys = {};

    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Camera
    const camera = { x: 0, y: 0 };

    // Game loop
    function gameLoop() {
      const gameCanvas = canvasRef;
      if (!gameCanvas || !ctx) {
        return;
      }

      // Update physics
      Runner.tick(runner, engine, 16.67);

      // Player movement
      const moveForce = 0.005;
      const maxSpeed = 8;

      if (keys['a'] || keys['arrowleft']) {
        Body.applyForce(player, player.position, { x: -moveForce, y: 0 });
      }
      if (keys['d'] || keys['arrowright']) {
        Body.applyForce(player, player.position, { x: moveForce, y: 0 });
      }

      // Limit speed
      if (Math.abs(player.velocity.x) > maxSpeed) {
        Body.setVelocity(player, {
          x: Math.sign(player.velocity.x) * maxSpeed,
          y: player.velocity.y,
        });
      }

      // Jump
      if ((keys[' '] || keys['w'] || keys['arrowup']) && Math.abs(player.velocity.y) < 0.1) {
        Body.setVelocity(player, { x: player.velocity.x, y: -12 });
      }

      // Update camera to follow player
      camera.x = player.position.x - gameCanvas.width / 2;
      camera.y = player.position.y - gameCanvas.height / 2;

      // Render - use ctx.canvas dimensions to ensure they exist
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Background
      ctx.fillStyle = '#1a1a24';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // Draw platforms
      ctx.fillStyle = '#8B4513';
      for (const platform of platforms) {
        const bounds = platform.bounds;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw player (procedural otter following POC patterns)
      const px = player.position.x;
      const py = player.position.y;

      // Finn's body (warm brown otter)
      ctx.fillStyle = '#8B6F47'; // Warm brown from CLAUDE.md
      ctx.beginPath();
      ctx.ellipse(px, py, 18, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Finn's head
      ctx.beginPath();
      ctx.ellipse(px, py - 20, 15, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(px - 7, py - 23, 3, 3);
      ctx.fillRect(px + 4, py - 23, 3, 3);

      // Whiskers
      ctx.strokeStyle = '#6B5533';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(px - 15, py - 18 + i * 3);
        ctx.lineTo(px - 22, py - 18 + i * 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + 15, py - 18 + i * 3);
        ctx.lineTo(px + 22, py - 18 + i * 3);
        ctx.stroke();
      }

      // Tail
      ctx.fillStyle = '#8B6F47';
      ctx.beginPath();
      ctx.ellipse(px - 20, py + 10, 8, 18, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    // Start game when user clicks
    if (gameStarted()) {
      gameLoop();
    }

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
    });
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Show when={!gameStarted()}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            'text-align': 'center',
            'z-index': '1000',
          }}
        >
          <h1
            style={{
              'font-family': 'Georgia, serif',
              color: '#F4D03F',
              'font-size': '48px',
              'margin-bottom': '20px',
              'text-shadow': '2px 2px 8px rgba(0,0,0,0.9)',
            }}
          >
            Otterblade Odyssey
          </h1>
          <button
            type="button"
            onClick={() => setGameStarted(true)}
            style={{
              background: 'rgba(230, 126, 34, 0.9)',
              border: '3px solid #F4D03F',
              'border-radius': '12px',
              color: '#F4D03F',
              padding: '20px 40px',
              'font-size': '24px',
              'font-family': 'Georgia, serif',
              cursor: 'pointer',
              'box-shadow': '0 4px 12px rgba(192, 57, 43, 0.6)',
            }}
          >
            Begin Journey
          </button>
        </div>
      </Show>

      <canvas ref={(el) => (canvasRef = el)} style={{ display: 'block' }} />

      {/* HUD */}
      <Show when={gameStarted()}>
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(93, 78, 55, 0.9)',
            padding: '15px',
            'border-radius': '12px',
            border: '3px solid #D4A574',
            color: '#F4D03F',
            'font-family': 'Georgia, serif',
            'min-width': '200px',
          }}
        >
          <div>
            Chapter {currentChapter}: {loadChapterManifest(currentChapter).name}
          </div>
          <div style={{ 'margin-top': '8px' }}>Health: {'❤️'.repeat(health())}</div>
          <div>Shards: {shards()} ✨</div>
        </div>
      </Show>
    </div>
  );
}
