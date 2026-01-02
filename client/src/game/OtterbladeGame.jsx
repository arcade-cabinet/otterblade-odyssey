/** @jsxImportSource solid-js */
/**
 * Otterblade Odyssey - Main Game Component
 * Full production implementation with proper library integration
 * - YUKA.js for AI (enemies, NPCs, pathfinding)
 * - Howler.js for audio (music, SFX, ambient)
 * - nipplejs for touch controls
 * - Matter.js for physics
 * - DDL factory patterns throughout
 */

import { createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import Matter from 'matter-js';
import { Vector3 } from 'yuka';

// Import our system modules
import { audioManager } from './systems/AudioManager';
import { inputManager } from './systems/InputManager';
import { aiManager } from './systems/AIManager';
import TouchControls from './components/TouchControls';

// DDL loaders
import {
  loadChapterManifest,
  getChapterSpawnPoint,
  getChapterNPCs,
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
  const [currentChapter] = createSignal(0);
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

    // Create Matter.js engine
    const engine = Engine.create();
    engine.gravity.y = 1.5; // POC-proven value
    const runner = Runner.create();

    // Load chapter manifest
    const chapterId = currentChapter();
    const manifest = loadChapterManifest(chapterId);
    const spawnPoint = getChapterSpawnPoint(chapterId);

    console.log(`Loading Chapter ${chapterId}: ${manifest.name}`);
    console.log(`Quest: ${manifest.narrative.quest}`);

    // Initialize quest system
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

    // Load chapter audio with Howler.js
    audioManager.loadChapterAudio(manifest);

    // Start background music
    if (manifest.media?.audio?.music?.[0]) {
      setTimeout(() => {
        audioManager.playMusic(manifest.media.audio.music[0].id);
      }, 500);
    }

    // Create player
    const player = Bodies.rectangle(spawnPoint.x, spawnPoint.y, 35, 55, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      inertia: Infinity,
    });
    World.add(engine.world, player);

    // Create player reference for AI
    const playerRef = {
      position: new Vector3(player.position.x, player.position.y, 0),
      body: player
    };

    // Build level geometry from DDL
    const platforms = [];
    const walls = [];
    const ceilings = [];

    if (manifest.level?.segments) {
      for (const segment of manifest.level.segments) {
        // Platforms
        if (segment.platforms) {
          for (const platformDef of segment.platforms) {
            const platform = Bodies.rectangle(
              platformDef.x, platformDef.y,
              platformDef.width, platformDef.height,
              {
                isStatic: true,
                label: 'platform',
                friction: 0.8
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
              wallDef.x, wallDef.y,
              wallDef.width, wallDef.height,
              {
                isStatic: true,
                label: 'wall',
                friction: 0.3
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
              ceilingDef.x, ceilingDef.y,
              ceilingDef.width, ceilingDef.height,
              {
                isStatic: true,
                label: 'ceiling',
                friction: 0.3
              }
            );
            ceilings.push({ body: ceiling, def: ceilingDef });
            World.add(engine.world, ceiling);
          }
        }
      }
    }

    // Build NPCs from DDL with YUKA AI
    const npcData = getChapterNPCs(chapterId);
    for (const npcDef of npcData) {
      const npcAI = aiManager.addNPC(npcDef.id, npcDef);

      // Create physics body for NPC
      const npcBody = Bodies.rectangle(
        npcDef.position.x, npcDef.position.y,
        35, 55,
        {
          isStatic: true,
          label: 'npc',
          isSensor: true
        }
      );
      World.add(engine.world, npcBody);
    }

    // Build enemies from DDL with YUKA AI
    const encounterData = getChapterEncounters(chapterId);
    for (const encounter of encounterData) {
      if (encounter.enemies) {
        for (const enemyDef of encounter.enemies) {
          // Create enemy physics body
          const enemyBody = Bodies.rectangle(
            enemyDef.spawnPoint.x, enemyDef.spawnPoint.y,
            40, 50,
            {
              label: 'enemy',
              friction: 0.1,
              frictionAir: 0.02,
              restitution: 0
            }
          );
          World.add(engine.world, enemyBody);

          // Create YUKA AI for enemy
          const enemyAI = aiManager.addEnemy(enemyDef.id, {
            id: enemyDef.id,
            type: enemyDef.type,
            health: enemyDef.health || 3,
            damage: enemyDef.damage || 1,
            speed: enemyDef.speed || 1.0,
            aggroRadius: enemyDef.behavior?.aggroRadius || 200,
            attackRange: enemyDef.behavior?.attackRange || 50,
            patrolZone: {
              x: enemyDef.spawnPoint.x - 100,
              width: 200
            },
            onAlert: () => {
              audioManager.playSFX('enemy_alert');
            },
            onAttack: () => {
              audioManager.playSFX('blade_swing', { rate: 0.9 });
              // Apply damage to player
              if (Math.abs(player.position.x - enemyBody.position.x) < 50) {
                setHealth(h => Math.max(0, h - 1));
              }
            },
            onDeath: () => {
              audioManager.playSFX('enemy_hit');
              World.remove(engine.world, enemyBody);
            }
          });

          // Set player as target for AI
          enemyAI.playerTarget = playerRef;

          // Initialize position
          enemyAI.position.copy(new Vector3(
            enemyDef.spawnPoint.x,
            enemyDef.spawnPoint.y,
            0
          ));
        }
      }
    }

    // Build interactions from DDL
    const interactions = [];
    if (manifest.interactions) {
      for (const interactionDef of manifest.interactions) {
        const interactionBody = Bodies.rectangle(
          interactionDef.position.x, interactionDef.position.y,
          60, 60,
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

    // Build collectibles from DDL
    const collectibles = [];
    const collectibleData = getChapterCollectibles(chapterId);
    for (const collectibleDef of collectibleData) {
      const collectibleBody = Bodies.rectangle(
        collectibleDef.position.x, collectibleDef.position.y,
        20, 20,
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

    // Collision handling
    Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
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
            audioManager.playSFX('shard_pickup');
          }
        }

        // Player takes damage from enemy
        if ((bodyA === player && bodyB.label === 'enemy') ||
            (bodyB === player && bodyA.label === 'enemy')) {
          if (health() > 0) {
            setHealth(h => Math.max(0, h - 1));
            audioManager.playSFX('enemy_hit', { volume: 0.7 });
          }
        }

        // Player interacts with objects
        if ((bodyA === player && bodyB.label.startsWith('interaction_')) ||
            (bodyB === player && bodyA.label.startsWith('interaction_'))) {
          const interactionBody = bodyA === player ? bodyB : bodyA;
          const interaction = interactions.find(i => i.body === interactionBody);
          if (interaction && inputManager.isPressed('interact')) {
            audioManager.playSFX('door_open');
            console.log(`Interacting with ${interaction.def.id}`);

            // Execute DDL actions
            if (interaction.def.states && interaction.def.states[interaction.state]) {
              const stateData = interaction.def.states[interaction.state];
              if (stateData.actions) {
                for (const action of stateData.actions) {
                  if (action.type === 'restore_health') {
                    setHealth(maxHealth());
                  }
                  if (action.type === 'give_item') {
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
    let playerFacing = 1;

    // Game loop
    function gameLoop() {
      if (!canvas || !ctx) return;

      animFrame++;

      // Update input system
      inputManager.update();

      // Update physics
      Runner.tick(runner, engine, 16.67);

      // Update AI system with YUKA
      aiManager.update(16.67 / 1000);

      // Sync AI positions with physics bodies
      for (const [id, enemy] of aiManager.enemies) {
        const enemyBody = Array.from(engine.world.bodies).find(b =>
          b.label === 'enemy' && Math.abs(b.position.x - enemy.position.x) < 1
        );
        if (enemyBody) {
          // Copy AI velocity to physics
          Body.setVelocity(enemyBody, {
            x: enemy.velocity.x,
            y: enemyBody.velocity.y
          });
          // Sync positions
          enemy.position.x = enemyBody.position.x;
          enemy.position.y = enemyBody.position.y;
        }
      }

      // Update player reference for AI
      playerRef.position.x = player.position.x;
      playerRef.position.y = player.position.y;

      // Player movement with unified input
      const moveForce = 0.005;
      const maxSpeed = 8;
      const axis = inputManager.getAxis();

      if (axis !== 0) {
        Body.applyForce(player, player.position, { x: axis * moveForce, y: 0 });
        playerFacing = axis > 0 ? 1 : -1;

        // Play footstep sounds occasionally
        if (animFrame % 20 === 0) {
          audioManager.playSFX('footstep', {
            sprite: ['step1', 'step2', 'step3'][Math.floor(Math.random() * 3)],
            volume: 0.3
          });
        }
      }

      // Limit speed
      if (Math.abs(player.velocity.x) > maxSpeed) {
        Body.setVelocity(player, {
          x: Math.sign(player.velocity.x) * maxSpeed,
          y: player.velocity.y
        });
      }

      // Jump
      const onGround = Math.abs(player.velocity.y) < 0.1;
      if (inputManager.isPressed('jump') && onGround) {
        Body.setVelocity(player, { x: player.velocity.x, y: -12 });
        audioManager.playSFX('blade_swing', { rate: 1.5, volume: 0.4 });
      }

      // Update camera
      camera.x = player.position.x - canvas.width / 2;
      camera.y = player.position.y - canvas.height / 2;

      // === RENDER ===
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const biome = manifest.level.biome;
      const bgColors = {
        village: '#2C3E50',
        forest: '#1a3a1a',
        abbey: '#1a1a24',
        catacombs: '#0d0d15'
      };
      ctx.fillStyle = bgColors[biome] || '#1a1a24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
          bounds.min.x, bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x, bounds.min.y,
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
          bounds.min.x, bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x, bounds.min.y,
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
          bounds.min.x, bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
        ctx.strokeRect(
          bounds.min.x, bounds.min.y,
          bounds.max.x - bounds.min.x,
          bounds.max.y - bounds.min.y
        );
      }

      // Draw interactions
      for (const interaction of interactions) {
        const pos = interaction.body.position;
        const type = interaction.def.type;

        ctx.save();
        ctx.translate(pos.x, pos.y);

        if (type === 'shrine' || type === 'hearth') {
          // Hearth with animated flame
          ctx.fillStyle = '#FF6B35';
          ctx.beginPath();
          ctx.arc(0, 0, 20 + Math.sin(animFrame * 0.1) * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, -5, 10 + Math.sin(animFrame * 0.15) * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'door') {
          // Door
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(-25, -35, 50, 70);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 3;
          ctx.strokeRect(-25, -35, 50, 70);
        }

        ctx.restore();
      }

      // Draw collectibles
      for (const collectible of collectibles) {
        if (!collectible.collected) {
          const pos = collectible.body.position;
          ctx.save();
          ctx.translate(pos.x, pos.y);

          // Rotating golden shard
          ctx.rotate(animFrame * 0.05);
          ctx.fillStyle = '#FFD700';
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        }
      }

      // Draw NPCs
      for (const [id, npc] of aiManager.npcs) {
        drawNPC(ctx, npc, animFrame);
      }

      // Draw enemies
      for (const [id, enemy] of aiManager.enemies) {
        if (enemy.hp > 0) {
          drawEnemy(ctx, enemy, animFrame);
        }
      }

      // Draw player (Finn)
      drawFinn(ctx, player.position, playerFacing, animFrame);

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    // Start game loop
    requestAnimationFrame(gameLoop);

    // Cleanup
    onCleanup(() => {
      audioManager.stopAll();
      aiManager.destroy();
      inputManager.reset();
      Engine.clear(engine);
      World.clear(engine.world, false);
    });
  });

  return (
    <>
      <Show when={!gameStarted()}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a24 0%, #2C3E50 100%)',
          display: 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'justify-content': 'center',
          color: '#F4D03F'
        }}>
          <h1 style={{
            'font-size': '48px',
            'font-weight': 'bold',
            'margin-bottom': '20px',
            color: '#E67E22'
          }}>
            Otterblade Odyssey
          </h1>
          <h2 style={{
            'font-size': '24px',
            'margin-bottom': '40px',
            color: '#F4D03F'
          }}>
            A Redwall-inspired woodland epic
          </h2>
          <button
            onClick={() => setGameStarted(true)}
            style={{
              padding: '15px 40px',
              'font-size': '20px',
              background: '#E67E22',
              color: 'white',
              border: 'none',
              'border-radius': '8px',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            Begin Journey
          </button>
        </div>
      </Show>

      <Show when={gameStarted()}>
        <canvas ref={setCanvasRef} style={{ display: 'block' }} />

        {/* HUD */}
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.7)',
          'border-radius': '10px',
          color: '#F4D03F',
          'font-family': 'monospace',
          'min-width': '250px'
        }}>
          <div style={{ 'font-size': '18px', 'margin-bottom': '10px', color: '#E67E22' }}>
            Chapter {currentChapter()}: {loadChapterManifest(currentChapter()).name}
          </div>
          <div style={{ 'margin-bottom': '10px' }}>
            <span style={{ color: '#F4D03F' }}>Health: </span>
            <For each={Array(maxHealth()).fill(0)}>
              {(_, i) => (
                <span>{i() < health() ? '❤️' : '🖤'}</span>
              )}
            </For>
          </div>
          <div>
            <span style={{ color: '#F4D03F' }}>Shards: </span>
            <span>✨ {shards()}</span>
          </div>

          <Show when={activeQuest()}>
            <div style={{ 'margin-top': '15px', 'padding-top': '10px', 'border-top': '1px solid #F4D03F' }}>
              <div style={{ 'font-weight': 'bold', color: '#8FBC8F' }}>{activeQuest()}</div>
              <For each={questObjectives()}>
                {(obj) => (
                  <div style={{ 'font-size': '12px', 'margin-top': '5px' }}>
                    <span>{obj.completed ? '✓' : '○'}</span> {obj.description}
                    {obj.optional && <span style={{ color: '#7F8C8D' }}> (optional)</span>}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Touch Controls */}
        <TouchControls />
      </Show>
    </>
  );
}

// Procedural rendering functions
function drawFinn(ctx, position, facing, animFrame) {
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.05) * 2;

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
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.ellipse(0, -18 + breathe * 0.5, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -15 + breathe * 0.5, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(12, -16 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(6, -20 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye glint
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(7, -21 + breathe * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(8, -15 + i * 2 + breathe * 0.5);
    ctx.lineTo(18, -17 + i * 2 + breathe * 0.5);
    ctx.stroke();
  }

  // Ears
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.ellipse(-6, -26 + breathe * 0.5, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(4, -27 + breathe * 0.5, 4, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.ellipse(-15, 12 + breathe, 8, 12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Arms
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.ellipse(facing * 8, 8 + breathe, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Otterblade (simplified)
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(facing * 12, 0);
  ctx.lineTo(facing * 12, -18);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(ctx, enemy, animFrame) {
  const x = enemy.position.x;
  const y = enemy.position.y;
  const facing = enemy.facingDirection;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (dark gray)
  ctx.fillStyle = '#4A4A4A';
  ctx.strokeStyle = '#2A2A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.ellipse(0, -15, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes (glowing red)
  ctx.fillStyle = '#FF0000';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(5, -17, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Health bar
  const healthRatio = enemy.hp / enemy.maxHp;
  ctx.fillStyle = '#C0392B';
  ctx.fillRect(-15, -30, 30 * healthRatio, 3);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(-15, -30, 30, 3);

  ctx.restore();
}

function drawNPC(ctx, npc, animFrame) {
  const x = npc.position.x;
  const y = npc.position.y;
  const facing = npc.facingDirection;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.05) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (elder otter - grayer tone)
  ctx.fillStyle = '#7A6A55';
  ctx.strokeStyle = '#5A4A35';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#7A6A55';
  ctx.beginPath();
  ctx.ellipse(0, -18 + breathe * 0.5, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes closed (wisdom/peace)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, -20);
  ctx.lineTo(8, -20);
  ctx.stroke();

  // Shawl marker
  ctx.fillStyle = '#8FBC8F';
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(10, -5);
  ctx.lineTo(8, 5);
  ctx.lineTo(-8, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
