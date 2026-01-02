/** @jsxImportSource solid-js */
/**
 * Main Otterblade Odyssey Game Component
 * Full DDL factory-driven implementation with procedural rendering
 * JavaScript implementation following CLAUDE.md guidelines
 *
 * PROPER LIBRARY USAGE:
 * - YUKA.js: Enemy AI, NPC behaviors, pathfinding
 * - Matter.js: Physics engine (POC-proven settings)
 * - nipplejs: Mobile touch controls
 * - Solid.js: Reactive UI
 */

import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import Matter from 'matter-js';
import * as YUKA from 'yuka';
import nipplejs from 'nipplejs';
import {
  loadChapterManifest,
  getChapterSpawnPoint,
  getChapterNPCs,
  getChapterEncounters,
  getChapterCollectibles
} from './data/chapter-loaders';

const { Engine, World, Bodies, Body, Runner } = Matter;

// Audio System (note: Howler.js not installed yet, using Web Audio API)
class AudioSystem {
  constructor() {
    this.context = null;
    this.sounds = new Map();
    this.music = null;
    this.volumes = {
      master: 0.7,
      music: 0.5,
      sfx: 0.8,
      ambient: 0.6
    };
  }

  init() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playSound(soundId, volume = 1.0) {
    console.log(`[Audio] Play: ${soundId} (volume: ${volume})`);
    // Placeholder: would use Howler.js when installed
  }

  playMusic(musicId, loop = true) {
    console.log(`[Audio] Music: ${musicId} (loop: ${loop})`);
    // Placeholder: would use Howler.js when installed
  }

  stopMusic() {
    console.log('[Audio] Stop music');
  }

  setVolume(category, value) {
    this.volumes[category] = value;
    console.log(`[Audio] Volume ${category}: ${value}`);
  }
}

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

  // Mobile controls state
  const [isMobile] = createSignal(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [mobileJoystickData, setMobileJoystickData] = createSignal({ x: 0, y: 0 });
  const [mobileJump, setMobileJump] = createSignal(false);
  const [mobileInteract, setMobileInteract] = createSignal(false);

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

    // Initialize Audio System
    const audioSystem = new AudioSystem();
    audioSystem.init();

    // Initialize YUKA AI Manager
    const yukaEntityManager = new YUKA.EntityManager();
    const yukaTime = new YUKA.Time();

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

    // Play chapter music
    audioSystem.playMusic(`chapter_${chapterId}_theme`, true);

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

    // Player state
    const playerState = {
      onGround: false,
      canWallClimb: false,
      isWallRunning: false,
      combatMode: false,
      facing: 1, // 1 = right, -1 = left
      parryWindow: 0,
      dodgeRollCooldown: 0
    };

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
            platforms.push({
              body: platform,
              def: platformDef,
              canClimb: platformDef.type === 'stone' // Stone can be climbed
            });
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

    // Factory: Build NPCs from DDL with YUKA behaviors
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

      // YUKA: Create AI entity for NPC
      const yukaVehicle = new YUKA.Vehicle();
      yukaVehicle.position.set(npcDef.position.x, npcDef.position.y, 0);
      yukaVehicle.maxSpeed = 0; // NPCs are stationary
      yukaVehicle.userData = { name: npcDef.name, dialogueIndex: 0 };

      // YUKA: Simple state machine for NPC behaviors
      const stateMachine = new YUKA.StateMachine(yukaVehicle);
      const idleState = new YUKA.State('idle');
      const talkingState = new YUKA.State('talking');

      idleState.enter = () => {
        console.log(`${npcDef.name} enters idle state`);
      };

      talkingState.enter = () => {
        console.log(`${npcDef.name} enters talking state`);
        audioSystem.playSound('npc_talk', 0.5);
      };

      stateMachine.add(idleState);
      stateMachine.add(talkingState);
      stateMachine.changeTo('idle');

      yukaEntityManager.add(yukaVehicle);

      npcs.push({
        body: npcBody,
        def: npcDef,
        state: npcDef.storyState?.initialState || 'idle',
        yukaVehicle,
        stateMachine
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

    // Factory: Build enemies from DDL with YUKA AI
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

          // YUKA: Create AI vehicle for enemy
          const yukaVehicle = new YUKA.Vehicle();
          yukaVehicle.position.set(enemyDef.spawnPoint.x, enemyDef.spawnPoint.y, 0);
          yukaVehicle.maxSpeed = 3;
          yukaVehicle.maxForce = 2;
          yukaVehicle.userData = { enemyType: enemyDef.type };

          // YUKA: Pathfinding and steering behaviors
          const pathPlanner = new YUKA.PathPlanner(yukaVehicle);
          const navMesh = new YUKA.NavMesh();

          // Create patrol path
          const path = new YUKA.Path();
          const patrolRadius = enemyDef.behavior?.patrolRadius || 100;
          path.add(new YUKA.Vector3(enemyDef.spawnPoint.x - patrolRadius, enemyDef.spawnPoint.y, 0));
          path.add(new YUKA.Vector3(enemyDef.spawnPoint.x + patrolRadius, enemyDef.spawnPoint.y, 0));
          path.loop = true;

          const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);

          // YUKA: State machine for enemy AI
          const stateMachine = new YUKA.StateMachine(yukaVehicle);
          const patrolState = new YUKA.State('patrol');
          const chaseState = new YUKA.State('chase');
          const attackState = new YUKA.State('attack');

          patrolState.enter = () => {
            yukaVehicle.steering.clear();
            yukaVehicle.steering.add(followPathBehavior);
          };

          chaseState.enter = () => {
            yukaVehicle.steering.clear();
            const seekBehavior = new YUKA.SeekBehavior(new YUKA.Vector3(player.position.x, player.position.y, 0));
            yukaVehicle.steering.add(seekBehavior);
            audioSystem.playSound('enemy_alert', 0.6);
          };

          attackState.enter = () => {
            console.log(`${enemyDef.type} attacking!`);
            audioSystem.playSound('enemy_attack', 0.7);
          };

          // Transition logic (updated in game loop)
          patrolState.update = () => {
            const distanceToPlayer = Math.hypot(
              player.position.x - yukaVehicle.position.x,
              player.position.y - yukaVehicle.position.y
            );
            if (distanceToPlayer < 200) {
              stateMachine.changeTo('chase');
            }
          };

          chaseState.update = () => {
            const distanceToPlayer = Math.hypot(
              player.position.x - yukaVehicle.position.x,
              player.position.y - yukaVehicle.position.y
            );
            if (distanceToPlayer < 50) {
              stateMachine.changeTo('attack');
            } else if (distanceToPlayer > 300) {
              stateMachine.changeTo('patrol');
            }
          };

          attackState.update = () => {
            const distanceToPlayer = Math.hypot(
              player.position.x - yukaVehicle.position.x,
              player.position.y - yukaVehicle.position.y
            );
            if (distanceToPlayer > 80) {
              stateMachine.changeTo('chase');
            }
          };

          stateMachine.add(patrolState);
          stateMachine.add(chaseState);
          stateMachine.add(attackState);
          stateMachine.changeTo('patrol');

          yukaEntityManager.add(yukaVehicle);

          enemies.push({
            body: enemyBody,
            def: enemyDef,
            health: enemyDef.health || 3,
            yukaVehicle,
            stateMachine
          });
          World.add(engine.world, enemyBody);
        }
      }
    }

    // Input handling (keyboard + gamepad)
    const keys = {};
    const gamepadState = {
      connected: false,
      axes: [0, 0, 0, 0],
      buttons: []
    };

    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gamepad support
    window.addEventListener('gamepadconnected', (e) => {
      console.log('[Gamepad] Connected:', e.gamepad.id);
      gamepadState.connected = true;
      audioSystem.playSound('menu_select', 0.5);
    });

    window.addEventListener('gamepaddisconnected', () => {
      console.log('[Gamepad] Disconnected');
      gamepadState.connected = false;
    });

    // Mobile touch controls (nipplejs)
    let joystickManager = null;
    let jumpButton = null;
    let interactButton = null;

    if (isMobile()) {
      // Virtual joystick for movement
      setTimeout(() => {
        const joystickZone = document.getElementById('joystick-zone');
        if (joystickZone) {
          joystickManager = nipplejs.create({
            zone: joystickZone,
            mode: 'static',
            position: { left: '100px', bottom: '100px' },
            color: '#F4D03F',
            size: 120
          });

          joystickManager.on('move', (evt, data) => {
            const angle = data.angle.radian;
            const force = Math.min(data.force, 2) / 2;
            setMobileJoystickData({
              x: Math.cos(angle) * force,
              y: -Math.sin(angle) * force
            });
          });

          joystickManager.on('end', () => {
            setMobileJoystickData({ x: 0, y: 0 });
          });
        }

        // Jump button
        jumpButton = document.getElementById('mobile-jump');
        if (jumpButton) {
          jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setMobileJump(true);
            audioSystem.playSound('jump', 0.6);
          });
          jumpButton.addEventListener('touchend', () => {
            setMobileJump(false);
          });
        }

        // Interact button
        interactButton = document.getElementById('mobile-interact');
        if (interactButton) {
          interactButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            setMobileInteract(true);
          });
          interactButton.addEventListener('touchend', () => {
            setMobileInteract(false);
          });
        }
      }, 100);
    }

    // Collision handling for DDL-driven interactions
    Matter.Events.on(engine, 'collisionStart', (event) => {
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
            audioSystem.playSound('shard_collect', 0.8);

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
          if (currentHealth > 0 && playerState.dodgeRollCooldown === 0) {
            setHealth(Math.max(0, currentHealth - 1));
            audioSystem.playSound('player_hurt', 0.7);
            playerState.dodgeRollCooldown = 60; // 1 second immunity
          }
        }

        // Player interacts with objects
        if ((bodyA === player && bodyB.label.startsWith('interaction_')) ||
            (bodyB === player && bodyA.label.startsWith('interaction_'))) {
          const interactionBody = bodyA === player ? bodyB : bodyA;
          const interaction = interactions.find(i => i.body === interactionBody);
          const wantsToInteract = keys.e || keys[' '] || mobileInteract();

          if (interaction && wantsToInteract) {
            console.log(`Interacting with ${interaction.def.id}`);
            audioSystem.playSound('interact', 0.6);

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
                    audioSystem.playSound('heal', 0.7);
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

    // Game loop
    function gameLoop() {
      const gameCanvas = canvasRef;
      if (!gameCanvas || !ctx) {
        return;
      }

      animFrame++;

      // Update YUKA AI manager
      const delta = yukaTime.update().getDelta();
      yukaEntityManager.update(delta);

      // Sync YUKA entities with Matter.js bodies
      for (const enemy of enemies) {
        if (enemy.health > 0) {
          enemy.stateMachine.update();

          // Apply YUKA steering force to Matter.js body
          const yukaPos = enemy.yukaVehicle.position;
          const yukaVel = enemy.yukaVehicle.velocity;

          Body.setPosition(enemy.body, {
            x: yukaPos.x,
            y: yukaPos.y
          });
          Body.setVelocity(enemy.body, {
            x: yukaVel.x,
            y: enemy.body.velocity.y // Keep Matter.js gravity for y-axis
          });

          // Update YUKA position to match Matter.js (for gravity)
          enemy.yukaVehicle.position.y = enemy.body.position.y;
        }
      }

      // Update NPCs
      for (const npc of npcs) {
        npc.stateMachine.update();
      }

      // Update physics
      Runner.tick(runner, engine, 16.67);

      // Player movement (unified input: keyboard, gamepad, mobile)
      const moveForce = 0.005;
      const maxSpeed = 8;
      let moveX = 0;

      // Keyboard
      if (keys.a || keys.arrowleft) moveX -= 1;
      if (keys.d || keys.arrowright) moveX += 1;

      // Gamepad
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gp = gamepads[0];
        const axisX = gp.axes[0];
        if (Math.abs(axisX) > 0.2) moveX += axisX;
      }

      // Mobile joystick
      if (isMobile()) {
        const joystickData = mobileJoystickData();
        moveX += joystickData.x * 2;
      }

      if (moveX !== 0) {
        Body.applyForce(player, player.position, { x: moveX * moveForce, y: 0 });
        playerState.facing = Math.sign(moveX);

        if (Math.abs(player.velocity.x) > 2 && playerState.onGround) {
          // Play footstep sounds periodically
          if (animFrame % 20 === 0) {
            audioSystem.playSound('footstep', 0.3);
          }
        }
      }

      // Limit speed
      if (Math.abs(player.velocity.x) > maxSpeed) {
        Body.setVelocity(player, {
          x: Math.sign(player.velocity.x) * maxSpeed,
          y: player.velocity.y,
        });
      }

      // Ground detection with coyote time
      playerState.onGround = Math.abs(player.velocity.y) < 0.5;

      // Jump (keyboard, gamepad, mobile)
      const wantsToJump = keys[' '] || keys.w || keys.arrowup ||
                          (gamepads[0] && gamepads[0].buttons[0]?.pressed) ||
                          mobileJump();

      if (wantsToJump && playerState.onGround) {
        Body.setVelocity(player, { x: player.velocity.x, y: -12 });
        audioSystem.playSound('jump', 0.6);
        setMobileJump(false); // Reset mobile jump
      }

      // Dodge roll (Shift key or gamepad B button)
      if ((keys.shift || (gamepads[0] && gamepads[0].buttons[1]?.pressed)) &&
          playerState.dodgeRollCooldown === 0) {
        playerState.dodgeRollCooldown = 120; // 2 second cooldown
        Body.setVelocity(player, {
          x: playerState.facing * 15,
          y: player.velocity.y
        });
        audioSystem.playSound('dodge_roll', 0.5);
      }

      // Cooldown decrements
      if (playerState.dodgeRollCooldown > 0) {
        playerState.dodgeRollCooldown--;
      }
      if (playerState.parryWindow > 0) {
        playerState.parryWindow--;
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

        // Draw moss on climbable stone
        if (platform.canClimb) {
          ctx.fillStyle = '#556B2F'; // Mossy stone
        }

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

      // Draw enemies (procedural with YUKA AI state indicators)
      for (const enemy of enemies) {
        if (enemy.health > 0) {
          const pos = enemy.body.position;
          const breathe = Math.sin(animFrame * 0.08) * 2;
          const currentState = enemy.stateMachine.currentState?.name || 'patrol';

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

          // Eyes (color based on AI state)
          const eyeColor = currentState === 'attack' ? '#FF0000' :
                          currentState === 'chase' ? '#FFA500' :
                          '#FFFF00';
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.arc(-5, -20 + breathe, 3, 0, Math.PI * 2);
          ctx.arc(5, -20 + breathe, 3, 0, Math.PI * 2);
          ctx.fill();

          // AI state indicator (debug)
          ctx.fillStyle = '#FFF';
          ctx.font = '8px monospace';
          ctx.fillText(currentState, -15, -35);

          ctx.restore();
        }
      }

      // Draw player (procedural otter - Finn)
      const px = player.position.x;
      const py = player.position.y;
      const breathe = Math.sin(animFrame * 0.05) * 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.scale(playerState.facing, 1);

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

      // Eye glints
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-6, -23 + breathe, 1, 1);
      ctx.fillRect(3, -23 + breathe, 1, 1);

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

      // Dodge roll visual effect
      if (playerState.dodgeRollCooldown > 60) {
        ctx.strokeStyle = 'rgba(244, 208, 63, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (joystickManager) {
        joystickManager.destroy();
      }

      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);

      yukaEntityManager.clear();

      audioSystem.stopMusic();
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
            <p>WASD / Arrow Keys / Gamepad - Move</p>
            <p>Space / A Button - Jump</p>
            <p>E / X Button - Interact</p>
            <p>Shift / B Button - Dodge Roll</p>
          </div>
        </div>
      </Show>

      <canvas ref={setCanvasRef} style={{ display: 'block' }} />

      {/* Mobile touch controls */}
      <Show when={gameStarted() && isMobile()}>
        <div id="joystick-zone" style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '150px',
          height: '150px',
          'z-index': '1000'
        }} />

        <button
          id="mobile-jump"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '100px',
            width: '70px',
            height: '70px',
            'border-radius': '50%',
            background: 'rgba(244, 208, 63, 0.8)',
            border: '3px solid #F4D03F',
            color: '#FFF',
            'font-size': '24px',
            'font-weight': 'bold',
            'z-index': '1000',
            'touch-action': 'none'
          }}
        >
          ↑
        </button>

        <button
          id="mobile-interact"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '70px',
            height: '70px',
            'border-radius': '50%',
            background: 'rgba(230, 126, 34, 0.8)',
            border: '3px solid #E67E22',
            color: '#FFF',
            'font-size': '20px',
            'font-weight': 'bold',
            'z-index': '1000',
            'touch-action': 'none'
          }}
        >
          E
        </button>
      </Show>

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
              {questObjectives().map((objective) => (
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
              ))}
            </div>
          </Show>
        </div>

        {/* Controls reminder */}
        <Show when={!isMobile()}>
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
            <div>WASD/Arrows: Move | Space: Jump | E: Interact | Shift: Dodge Roll</div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
