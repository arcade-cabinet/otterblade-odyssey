/** @jsxImportSource solid-js */
/**
 * Main Otterblade Odyssey Game Component
 * Full DDL factory-driven implementation with procedural rendering
 * JavaScript implementation following CLAUDE.md guidelines
 */

import { createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import Matter from 'matter-js';
import {
  loadChapterManifest,
  getChapterSpawnPoint,
  getChapterNPCs,
  getChapterTriggers,
  getChapterEncounters,
  getChapterCollectibles
} from './data/chapter-loaders';

const { Engine, World, Bodies, Body, Runner, Events } = Matter;

export default function OtterbladeGame() {
  let canvasRef;
  const setCanvasRef = (el) => {
    canvasRef = el;
  };

  // Game state
  const [currentChapter, setCurrentChapter] = createSignal(0);
  const [health, setHealth] = createSignal(5);
  const [maxHealth] = createSignal(5);
  const [shards, setShards] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [questObjectives, setQuestObjectives] = createSignal([]);
  const [activeQuest, setActiveQuest] = createSignal(null);

  onMount(() => {
    if (!gameStarted()) return;

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
    const chapterId = currentChapter();
    const manifest = loadChapterManifest(chapterId);
    const spawnPoint = getChapterSpawnPoint(chapterId);

    console.log(`Loading Chapter ${chapterId}: ${manifest.name}`);
    console.log(`Quest: ${manifest.narrative.quest}`);

    // Initialize quest system from DDL
    if (manifest.quests && manifest.quests.length > 0) {
      const mainQuest = manifest.quests[0];
      setActiveQuest(mainQuest.name);
      setQuestObjectives(mainQuest.objectives.map(obj => ({
        id: obj.id,
        description: obj.description,
        completed: false,
        optional: obj.optional || false
      })));
    }

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
    const walls = [];
    const ceilings = [];
    const npcs = [];
    const interactions = [];
    const collectibles = [];
    const enemies = [];

    // Factory: Build platforms, walls, and ceilings from DDL segments
    if (manifest.level?.segments) {
      for (const segment of manifest.level.segments) {
        // Platforms
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
                render: { fillStyle: platformDef.type === 'wood' ? '#8B4513' : '#696969' }
              }
            );
            platforms.push({ body: platform, def: platformDef });
            World.add(engine.world, platform);
          }
        }

        // Walls
        if (segment.walls) {
          for (const wallDef of segment.walls) {
            const wall = Bodies.rectangle(
              wallDef.x,
              wallDef.y,
              wallDef.width,
              wallDef.height,
              {
                isStatic: true,
                label: 'wall',
                friction: 0.3,
                render: { fillStyle: '#5D4E37' }
              }
            );
            walls.push({ body: wall, def: wallDef });
            World.add(engine.world, wall);
          }
        }

        // Ceilings
        if (segment.ceilings) {
          for (const ceilingDef of segment.ceilings) {
            const ceiling = Bodies.rectangle(
              ceilingDef.x,
              ceilingDef.y,
              ceilingDef.width,
              ceilingDef.height,
              {
                isStatic: true,
                label: 'ceiling',
                friction: 0.3,
                render: { fillStyle: '#8B7355' }
              }
            );
            ceilings.push({ body: ceiling, def: ceilingDef });
            World.add(engine.world, ceiling);
          }
        }
      }
    }

    // Factory: Build NPCs from DDL
    const npcData = getChapterNPCs(chapterId);
    for (const npcDef of npcData) {
      const npcBody = Bodies.rectangle(
        npcDef.position.x,
        npcDef.position.y,
        35,
        55,
        {
          isStatic: true,
          label: 'npc',
          isSensor: true
        }
      );
      npcs.push({
        body: npcBody,
        def: npcDef,
        state: npcDef.storyState?.initialState || 'idle'
      });
      World.add(engine.world, npcBody);
    }

    // Factory: Build interaction objects from DDL
    if (manifest.interactions) {
      for (const interactionDef of manifest.interactions) {
        const interactionBody = Bodies.rectangle(
          interactionDef.position.x,
          interactionDef.position.y,
          60,
          60,
          {
            isStatic: true,
            label: `interaction_${interactionDef.type}`,
            isSensor: true
          }
        );
        interactions.push({
          body: interactionBody,
          def: interactionDef,
          state: interactionDef.initialState
        });
        World.add(engine.world, interactionBody);
      }
    }

    // Factory: Build collectibles from DDL
    const collectibleData = getChapterCollectibles(chapterId);
    for (const collectibleDef of collectibleData) {
      const collectibleBody = Bodies.rectangle(
        collectibleDef.position.x,
        collectibleDef.position.y,
        20,
        20,
        {
          isStatic: true,
          label: 'collectible',
          isSensor: true
        }
      );
      collectibles.push({
        body: collectibleBody,
        def: collectibleDef,
        collected: false
      });
      World.add(engine.world, collectibleBody);
    }

    // Factory: Build enemies from DDL
    const encounterData = getChapterEncounters(chapterId);
    for (const encounter of encounterData) {
      if (encounter.enemies) {
        for (const enemyDef of encounter.enemies) {
          const enemyBody = Bodies.rectangle(
            enemyDef.spawnPoint.x,
            enemyDef.spawnPoint.y,
            40,
            50,
            {
              label: 'enemy',
              friction: 0.1,
              frictionAir: 0.02,
              restitution: 0
            }
          );
          enemies.push({
            body: enemyBody,
            def: enemyDef,
            health: enemyDef.health || 3,
            aiState: 'patrol'
          });
          World.add(engine.world, enemyBody);
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

    // Collision handling for DDL-driven interactions
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (const pair of pairs) {
        const { bodyA, bodyB } = pair;

        // Player collects shard
        if ((bodyA === player && bodyB.label === 'collectible') ||
            (bodyB === player && bodyA.label === 'collectible')) {
          const collectibleBody = bodyA === player ? bodyB : bodyA;
          const collectible = collectibles.find(c => c.body === collectibleBody);
          if (collectible && !collectible.collected) {
            collectible.collected = true;
            World.remove(engine.world, collectibleBody);
            setShards(s => s + 1);

            // Update quest objective if collecting shards
            const objectives = questObjectives();
            const shardObjective = objectives.find(o => o.id.includes('collect'));
            if (shardObjective && !shardObjective.completed) {
              const updated = objectives.map(o =>
                o.id === shardObjective.id ? { ...o, completed: true } : o
              );
              setQuestObjectives(updated);
            }
          }
        }

        // Player takes damage from enemy
        if ((bodyA === player && bodyB.label === 'enemy') ||
            (bodyB === player && bodyA.label === 'enemy')) {
          const currentHealth = health();
          if (currentHealth > 0) {
            setHealth(Math.max(0, currentHealth - 1));
          }
        }

        // Player interacts with objects
        if ((bodyA === player && bodyB.label.startsWith('interaction_')) ||
            (bodyB === player && bodyA.label.startsWith('interaction_'))) {
          const interactionBody = bodyA === player ? bodyB : bodyA;
          const interaction = interactions.find(i => i.body === interactionBody);
          if (interaction && keys.e) {
            console.log(`Interacting with ${interaction.def.id}`);
            // Handle interaction state changes from DDL
            if (interaction.def.states && interaction.def.states[interaction.state]) {
              const stateData = interaction.def.states[interaction.state];
              if (stateData.actions) {
                for (const action of stateData.actions) {
                  if (action.type === 'restore_warmth') {
                    console.log(`Restored warmth: ${action.value}`);
                  }
                  if (action.type === 'restore_health') {
                    setHealth(maxHealth());
                  }
                  if (action.type === 'give_item') {
                    console.log(`Received item: ${action.target}`);
                    // Update quest objective
                    const objectives = questObjectives();
                    const updated = objectives.map(o =>
                      o.id === action.target ? { ...o, completed: true } : o
                    );
                    setQuestObjectives(updated);
                  }
                }
              }
            }
          }
        }
      }
    });

    // Camera
    const camera = { x: 0, y: 0 };
    let animFrame = 0;
    let playerFacing = 1; // 1 = right, -1 = left

    // Game loop
    function gameLoop() {
      const gameCanvas = canvasRef;
      if (!gameCanvas || !ctx) {
        return;
      }

      animFrame++;

      // Update physics
      Runner.tick(runner, engine, 16.67);

      // Player movement
      const moveForce = 0.005;
      const maxSpeed = 8;

      if (keys.a || keys.arrowleft) {
        Body.applyForce(player, player.position, { x: -moveForce, y: 0 });
        playerFacing = -1;
      }
      if (keys.d || keys.arrowright) {
        Body.applyForce(player, player.position, { x: moveForce, y: 0 });
        playerFacing = 1;
      }

      // Limit speed
      if (Math.abs(player.velocity.x) > maxSpeed) {
        Body.setVelocity(player, {
          x: Math.sign(player.velocity.x) * maxSpeed,
          y: player.velocity.y,
        });
      }

      // Jump
      const onGround = Math.abs(player.velocity.y) < 0.1;
      if ((keys[' '] || keys.w || keys.arrowup) && onGround) {
        Body.setVelocity(player, { x: player.velocity.x, y: -12 });
      }

      // Simple enemy AI
      for (const enemy of enemies) {
        if (enemy.health > 0) {
          const dx = player.position.x - enemy.body.position.x;
          const distance = Math.abs(dx);

          if (distance < 200) {
            // Chase player
            const chaseForce = 0.002;
            Body.applyForce(enemy.body, enemy.body.position, {
              x: Math.sign(dx) * chaseForce,
              y: 0
            });
          }
        }
      }

      // Update camera to follow player
      camera.x = player.position.x - gameCanvas.width / 2;
      camera.y = player.position.y - gameCanvas.height / 2;

      // Render
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Background (biome-specific color from DDL)
      const biome = manifest.level.biome;
      const bgColors = {
        village: '#2C3E50',
        forest: '#1a3a1a',
        abbey: '#1a1a24',
        catacombs: '#0d0d15'
      };
      ctx.fillStyle = bgColors[biome] || '#1a1a24';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      // Draw platforms
      for (const platform of platforms) {
        const bounds = platform.body.bounds;
        const type = platform.def.type;
        ctx.fillStyle = type === 'wood' ? '#8B4513' : '#696969';
        ctx.strokeStyle = type === 'wood' ? '#654321' : '#505050';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw walls
      for (const wall of walls) {
        const bounds = wall.body.bounds;
        ctx.fillStyle = '#5D4E37';
        ctx.strokeStyle = '#4A3C2B';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw ceilings
      for (const ceiling of ceilings) {
        const bounds = ceiling.body.bounds;
        ctx.fillStyle = '#8B7355';
        ctx.strokeStyle = '#6B5A45';
        ctx.lineWidth = 2;
        ctx.fillRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x,
          bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw interactions (procedural)
      for (const interaction of interactions) {
        const pos = interaction.body.position;
        const type = interaction.def.type;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        if (type === 'shrine' && interaction.def.id.includes('hearth')) {
          // Hearth (warm glowing fire)
          ctx.fillStyle = '#FF6B35';
          ctx.beginPath();
          ctx.arc(0, 0, 20 + Math.sin(animFrame * 0.1) * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, 0, 12 + Math.sin(animFrame * 0.1) * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'shrine' && interaction.def.id.includes('blade')) {
          // Blade mount (silver/iron)
          ctx.fillStyle = '#C0C0C0';
          ctx.fillRect(-15, -25, 30, 50);
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(-10, -20, 20, 40);
        } else if (type === 'sign') {
          // Window or sign
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(-20, -20, 40, 40);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 3;
          ctx.strokeRect(-20, -20, 40, 40);
        } else {
          // Generic interaction
          ctx.fillStyle = '#F4D03F';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw collectibles
      for (const collectible of collectibles) {
        if (!collectible.collected) {
          const pos = collectible.body.position;
          const float = Math.sin(animFrame * 0.1 + pos.x * 0.1) * 3;

          // Shard (golden crystal)
          ctx.save();
          ctx.translate(pos.x, pos.y + float);
          ctx.rotate(animFrame * 0.05);

          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(6, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }

      // Draw NPCs (procedural woodland creatures)
      for (const npc of npcs) {
        const pos = npc.body.position;
        const breathe = Math.sin(animFrame * 0.05) * 2;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Elder otter (brown, sitting)
        ctx.fillStyle = '#8B6F47';
        ctx.strokeStyle = '#6B5D4F';
        ctx.lineWidth = 2;

        // Body
        ctx.beginPath();
        ctx.ellipse(0, breathe, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, -15 + breathe, 16, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-7, -18 + breathe, 3, 3);
        ctx.fillRect(4, -18 + breathe, 3, 3);

        ctx.restore();
      }

      // Draw enemies (procedural)
      for (const enemy of enemies) {
        if (enemy.health > 0) {
          const pos = enemy.body.position;
          const breathe = Math.sin(animFrame * 0.08) * 2;

          ctx.save();
          ctx.translate(pos.x, pos.y);

          // Galeborn enemy (darker, menacing)
          ctx.fillStyle = '#4A4A4A';
          ctx.strokeStyle = '#2C2C2C';
          ctx.lineWidth = 2;

          // Body
          ctx.beginPath();
          ctx.ellipse(0, breathe, 18, 24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Head
          ctx.beginPath();
          ctx.ellipse(0, -18 + breathe, 14, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glowing red eyes
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(-5, -20 + breathe, 3, 0, Math.PI * 2);
          ctx.arc(5, -20 + breathe, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // Draw player (procedural otter - Finn)
      const px = player.position.x;
      const py = player.position.y;
      const breathe = Math.sin(animFrame * 0.05) * 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.scale(playerFacing, 1);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (warm brown otter)
      ctx.fillStyle = '#8B6F47';
      ctx.strokeStyle = '#6B5D4F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, breathe, 18, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chest (lighter tan)
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(2, 2 + breathe, 12, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#8B6F47';
      ctx.beginPath();
      ctx.ellipse(0, -20 + breathe, 15, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Snout
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(8, -18 + breathe, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(12, -18 + breathe, 2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(-7, -23 + breathe, 3, 3);
      ctx.fillRect(2, -23 + breathe, 3, 3);

      // Whiskers
      ctx.strokeStyle = '#6B5533';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-15, -18 + breathe + i * 3);
        ctx.lineTo(-22, -18 + breathe + i * 3);
        ctx.stroke();
      }

      // Tail
      ctx.fillStyle = '#8B6F47';
      ctx.beginPath();
      ctx.ellipse(-20, 10 + breathe, 8, 18, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Otterblade (simple sword on back)
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(-10, -25);
      ctx.stroke();

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-12, -26, 4, 4);

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
    });
  });

  const startGame = () => {
    setGameStarted(true);
  };

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
            Otterblade Odyssey: Zephyros Rising
          </h1>
          <p style={{
            'font-family': 'Georgia, serif',
            color: '#D4A574',
            'font-size': '18px',
            'margin-bottom': '30px',
            'text-shadow': '1px 1px 4px rgba(0,0,0,0.9)',
          }}>
            A Redwall-inspired woodland epic
          </p>
          <button
            type="button"
            onClick={startGame}
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
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(211, 84, 0, 0.95)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(230, 126, 34, 0.9)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Begin Journey
          </button>
          <div style={{
            'margin-top': '30px',
            'font-family': 'Georgia, serif',
            color: '#D4A574',
            'font-size': '14px',
          }}>
            <p>WASD / Arrow Keys - Move</p>
            <p>Space - Jump</p>
            <p>E - Interact</p>
          </div>
        </div>
      </Show>

      <canvas ref={setCanvasRef} style={{ display: 'block' }} />

      {/* HUD */}
      <Show when={gameStarted()}>
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(93, 78, 55, 0.95)',
            padding: '20px',
            'border-radius': '12px',
            border: '3px solid #D4A574',
            color: '#F4D03F',
            'font-family': 'Georgia, serif',
            'min-width': '280px',
            'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ 'font-size': '18px', 'font-weight': 'bold', 'margin-bottom': '12px' }}>
            Chapter {currentChapter()}: {loadChapterManifest(currentChapter()).name}
          </div>
          <div style={{ 'margin-top': '8px', 'font-size': '16px' }}>
            Health: {Array(health()).fill('❤️').join('')}{Array(maxHealth() - health()).fill('🖤').join('')}
          </div>
          <div style={{ 'font-size': '16px' }}>
            Shards: {shards()} ✨
          </div>

          <Show when={activeQuest()}>
            <div style={{
              'margin-top': '15px',
              'padding-top': '15px',
              'border-top': '2px solid #D4A574',
            }}>
              <div style={{ 'font-size': '16px', 'font-weight': 'bold', 'margin-bottom': '8px' }}>
                Quest: {activeQuest()}
              </div>
              <For each={questObjectives()}>
                {(objective) => (
                  <div style={{
                    'font-size': '14px',
                    'margin-left': '10px',
                    'margin-top': '4px',
                    color: objective.completed ? '#7FFF00' : (objective.optional ? '#87CEEB' : '#F4D03F'),
                    'text-decoration': objective.completed ? 'line-through' : 'none',
                  }}>
                    {objective.completed ? '✓' : '○'} {objective.description}
                    {objective.optional ? ' (Optional)' : ''}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Controls reminder */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(93, 78, 55, 0.8)',
          padding: '10px 15px',
          'border-radius': '8px',
          border: '2px solid #D4A574',
          color: '#D4A574',
          'font-family': 'Georgia, serif',
          'font-size': '12px',
        }}>
          <div>WASD/Arrows: Move | Space: Jump | E: Interact</div>
        </div>
      </Show>
    </div>
  );
}
