/**
 * Otterblade Odyssey - Main Game Component
 * Modular TypeScript architecture with DDL-based manifest loading
 */

import type * as Matter from 'matter-js';
import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onCleanup,
  Show,
} from 'solid-js';
import { Vector3 } from 'yuka';
import { ZephyrosAI } from './ai/BossAI';
// DDL loader (second file)
import LoadingScreen from './components/LoadingScreen';
import TouchControls from './components/TouchControls';
import { initializeChapterConstants } from './constants';
import { DebugSystem } from './debug/DebugSystem';
import { createSceneRenderer } from './engine/rendering';
import { BellSystem, HearthSystem, LanternSystem } from './environment/EnvironmentalSystems';
import { buildInteractionsAndCollectibles } from './factories/interaction-factory';
// ONE import - the entire game engine (TypeScript modules)
import {
  aiManager,
  audioManager,
  CHAPTER_FILES,
  createFinnBody,
  createGameLoop,
  createPhysicsEngine,
  initializeChapter,
  initializeGame,
  inputManager,
  PlayerController,
} from './index';
import { getMatterModules } from './physics/matter-wrapper';
import { HazardSystem } from './physics/PhysicsManager';
import type { NPCAIEntity } from './systems/AIManager';
import { setupCollisionHandlers } from './systems/collision';
import { TriggerSystem } from './systems/TriggerSystem';

const cinematicVideoUrls = import.meta.glob('../assets/videos/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const cinematicUrlByFilename = new Map(
  Object.entries(cinematicVideoUrls).map(([path, url]) => [path.split('/').pop() || path, url])
);

/**
 * Preload all game manifests using the DDL loader with progress tracking.
 * This runs once at game startup to fetch all JSON data.
 *
 * @param {(percent: number) => void} [onProgress] Optional callback invoked with
 *   the current preload progress percentage (0–100) after each manifest step.
 * @returns {Promise<{ success: true }>} Promise that resolves when all manifests
 *   have finished preloading successfully.
 */
async function preloadGameManifests(onProgress: (percent: number) => void) {
  try {
    // Dynamic import to avoid SSR issues
    const {
      loadChapterManifest,
      loadEnemiesManifest,
      loadNPCsManifest,
      loadSpritesManifest,
      loadCinematicsManifest,
      loadSoundsManifest,
      loadEffectsManifest,
      loadItemsManifest,
      loadScenesManifest,
      loadChapterPlatesManifest,
    } = await import('../ddl/loader');

    const totalSteps = 19; // 10 chapters + 9 manifests
    let completed = 0;

    const updateProgress = () => {
      completed++;
      const percent = Math.floor((completed / totalSteps) * 100);
      onProgress?.(percent);
      void percent;
    };

    // Load all manifests in parallel with progress tracking
    const loaders = [];

    // Load all chapters
    for (let i = 0; i < CHAPTER_FILES.length; i++) {
      loaders.push(
        loadChapterManifest(i)
          .then(() => {
            updateProgress();
          })
          .catch((error) => {
            console.error(`Failed to load chapter ${i}:`, error);
            updateProgress(); // Still count as progress even if failed
          })
      );
    }

    // Load entity and asset manifests
    const manifestLoaders = [
      { loader: loadEnemiesManifest, name: 'Enemies' },
      { loader: loadNPCsManifest, name: 'NPCs' },
      { loader: loadSpritesManifest, name: 'Sprites' },
      { loader: loadCinematicsManifest, name: 'Cinematics' },
      { loader: loadSoundsManifest, name: 'Sounds' },
      { loader: loadEffectsManifest, name: 'Effects' },
      { loader: loadItemsManifest, name: 'Items' },
      { loader: loadScenesManifest, name: 'Scenes' },
      { loader: loadChapterPlatesManifest, name: 'Chapter Plates' },
    ];

    for (const { loader } of manifestLoaders) {
      loaders.push(
        loader()
          .then(() => {
            updateProgress();
          })
          .catch((error) => {
            console.error('Failed to load manifest:', error);
            updateProgress();
          })
      );
    }

    await Promise.all(loaders);
    await initializeChapterConstants();

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to load game data: ${(error as Error).message}`);
  }
}

function OtterbladeGameContent() {
  let canvasRef: HTMLCanvasElement | undefined;
  const TOAST_DURATION_MS = 2000;
  const PARTICLE_BURST_DURATION_MS = 900;
  const PARTICLE_BURST_COUNT_WARM = 16;
  const PARTICLE_BURST_COUNT_DEFAULT = 12;
  const PARTICLE_BURST_RADIUS_WARM = 40;
  const PARTICLE_BURST_RADIUS_DEFAULT = 28;
  const PARTICLE_BURST_COLOR_WARM = '#FFB347';
  const PARTICLE_BURST_COLOR_DEFAULT = '#FFD27D';
  const PARTICLE_BURST_SIZE_MIN = 2;
  const PARTICLE_BURST_SIZE_VARIANCE = 3;
  const NPC_BODY_WIDTH = 32;
  const NPC_BODY_HEIGHT = 48;
  const SLOW_MOTION_SCALE = 0.5;

  // Track loading progress
  const [loadingProgress, setLoadingProgress] = createSignal(0);
  const [runtimeError, setRuntimeError] = createSignal<string | null>(null);

  // Preload manifests using createResource with progress tracking
  const [manifestsLoaded] = createResource(() => preloadGameManifests(setLoadingProgress));

  // Game state signals
  const [currentChapter] = createSignal(0);
  const [currentChapterManifest, setCurrentChapterManifest] = createSignal(null);
  const [health, setHealth] = createSignal(5);
  const [maxHealth] = createSignal(5);
  const [warmth, setWarmth] = createSignal(100);
  const [maxWarmth] = createSignal(100);
  const [shards, setShards] = createSignal(0);
  const [score, setScore] = createSignal(0);
  const [toastMessage, setToastMessage] = createSignal<string | null>(null);
  const [activeCinematic, setActiveCinematic] = createSignal<{ id: string; src: string } | null>(
    null
  );
  const [paused, setPaused] = createSignal(false);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [questObjectives, setQuestObjectives] = createSignal([]);
  const [activeQuest, setActiveQuest] = createSignal(null);
  const [_checkpoint, setCheckpoint] = createSignal<{ x: number; y: number } | null>(null);
  const [_allyCalls, setAllyCalls] = createSignal(0);
  const [_guardAlerts, setGuardAlerts] = createSignal(0);

  let slowMotionUntil = 0;
  let timeScale = 1;
  let cameraPan: { target: { x: number; y: number }; startTime: number; duration: number } | null =
    null;

  const showToast = (message: string, durationMs: number = TOAST_DURATION_MS) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  };

  const particleBursts: Array<{
    x: number;
    y: number;
    startTime: number;
    duration: number;
    color: string;
    particles: Array<{ dx: number; dy: number; size: number }>;
  }> = [];

  const spawnParticleBurst = (position: { x: number; y: number }, style?: string) => {
    const count = style === 'warm' ? PARTICLE_BURST_COUNT_WARM : PARTICLE_BURST_COUNT_DEFAULT;
    const radius = style === 'warm' ? PARTICLE_BURST_RADIUS_WARM : PARTICLE_BURST_RADIUS_DEFAULT;
    const color = style === 'warm' ? PARTICLE_BURST_COLOR_WARM : PARTICLE_BURST_COLOR_DEFAULT;
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: PARTICLE_BURST_SIZE_MIN + Math.random() * PARTICLE_BURST_SIZE_VARIANCE,
      };
    });
    particleBursts.push({
      x: position.x,
      y: position.y,
      startTime: performance.now(),
      duration: PARTICLE_BURST_DURATION_MS,
      color,
      particles,
    });
  };

  // Game state object for systems
  const gameStateObj = {
    health: () => health(),
    maxHealth: () => maxHealth(),
    warmth: () => warmth(),
    maxWarmth: () => maxWarmth(),
    takeDamage: (amount) => setHealth((h) => Math.max(0, h - amount)),
    restoreHealth: (amount) => setHealth((h) => Math.min(maxHealth(), h + amount)),
    drainWarmth: (amount) => setWarmth((w) => Math.max(0, w - amount)),
    restoreWarmth: (amount) => setWarmth((w) => Math.min(maxWarmth(), w + amount)),
    setCheckpoint: (pos) => setCheckpoint(pos),
    summonAlly: (_pos) => setAllyCalls((count) => count + 1),
    alertGuards: (_pos) => setGuardAlerts((count) => count + 1),
    rallyAllies: () => setAllyCalls((count) => count + 1),
    onBossDefeated: () => setScore((current) => current + 500),
    setSlowMotion: (durationMs: number) => {
      timeScale = SLOW_MOTION_SCALE;
      slowMotionUntil = performance.now() + durationMs;
    },
    getTimeScale: () => timeScale,
    updateTimeScale: (now: number) => {
      if (slowMotionUntil && now >= slowMotionUntil) {
        slowMotionUntil = 0;
        timeScale = 1;
      }
    },
    isPaused: () => paused(),
    getCameraPan: (now: number) => {
      if (!cameraPan) return null;
      if (now - cameraPan.startTime > cameraPan.duration) {
        cameraPan = null;
        return null;
      }
      return cameraPan;
    },
  };

  createEffect(async () => {
    // Wait for manifests to load before starting game
    if (!manifestsLoaded() || !gameStarted()) return;

    // Initialize game engine (loads Matter.js dynamically)
    await initializeGame();

    const canvas = canvasRef;
    if (!canvas) {
      setRuntimeError('Canvas is not available. Please refresh and try again.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRuntimeError('Unable to initialize the 2D renderer.');
      return;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load chapter manifest using DDL sync accessor (already preloaded)
    const { getChapterManifestSync, loadChapterManifest, getCinematicsManifestSync } = await import(
      '../ddl/loader'
    );

    // Ensure current chapter is loaded (in case cache was cleared)
    await loadChapterManifest(currentChapter());

    const manifest = getChapterManifestSync(currentChapter());

    if (!manifest) {
      setRuntimeError('Failed to load chapter data.');
      return;
    }

    // Store for UI access
    setCurrentChapterManifest(manifest);

    if (manifest.quests?.length) {
      const primaryQuest = manifest.quests[0];
      setActiveQuest(primaryQuest.name);
      setQuestObjectives(
        primaryQuest.objectives.map((objective) => ({
          id: objective.id,
          target: objective.target,
          type: objective.type,
          description: objective.description,
          completed: false,
          progress: 0,
          optional: !!objective.optional,
        }))
      );
    }

    if (!inputManager) {
      setRuntimeError('Input system failed to initialize.');
      return;
    }

    // Create physics engine
    const engine = createPhysicsEngine();
    const runner = window.Matter.Runner.create();
    const { Bodies, World } = getMatterModules();

    // Create player
    const spawnPoint = manifest.level?.spawnPoint || { x: 200, y: 300 };
    const player = createFinnBody(spawnPoint.x, spawnPoint.y);
    World.add(engine.world, player);

    // Create player controller
    const playerController = new PlayerController(player, engine, gameStateObj, audioManager);

    // Initialize chapter (platforms, enemies, etc.)
    const { platforms, walls, ceilings, hazards, waterZones, movingPlatforms } = initializeChapter(
      currentChapter(),
      manifest,
      engine,
      gameStateObj
    );
    const { interactions, collectibles } = buildInteractionsAndCollectibles(manifest, engine);
    const interactionById = new Map<string, (typeof interactions)[number]>();
    for (const interaction of interactions) {
      interactionById.set(interaction.def.id, interaction);
    }

    const lanternSystem = new LanternSystem(audioManager);
    const bellSystem = new BellSystem(audioManager);
    const hearthSystem = new HearthSystem(audioManager);
    const hazardSystem = new HazardSystem();

    if (hazards?.length) {
      for (const hazard of hazards) {
        hazardSystem.addHazard(
          hazard.type,
          hazard.region,
          hazard.damage,
          hazard.cooldown,
          hazard.warmthDrain
        );
      }
    }

    const flowPuzzles = [];
    const timingSequences = [];

    const npcBodies = new Map<string, { body: Matter.Body; npc: NPCAIEntity }>();
    if (manifest.npcs?.length) {
      for (const npcDef of manifest.npcs) {
        if (!npcDef.position) {
          continue;
        }
        const npc = aiManager.addNPC(npcDef.id, {
          id: npcDef.id,
          type: npcDef.characterId ?? npcDef.id,
          position: npcDef.position,
          behavior: npcDef.behavior,
          storyState: npcDef.storyState,
          interaction: npcDef.interactions?.[0] ?? null,
        });
        const npcBody = Bodies.rectangle(
          npcDef.position.x,
          npcDef.position.y,
          NPC_BODY_WIDTH,
          NPC_BODY_HEIGHT,
          { isStatic: true, isSensor: true, label: 'npc' }
        );
        World.add(engine.world, npcBody);
        npcBodies.set(npcDef.id, { body: npcBody, npc });
      }
    }

    let bossAI = null;
    if (manifest.boss?.stats) {
      const bossPos = manifest.boss.arenaPosition ?? {
        x: player.position.x + 400,
        y: player.position.y,
      };
      bossAI = new ZephyrosAI(
        {
          x: bossPos.x,
          y: bossPos.y,
          health: manifest.boss.stats.health,
          damage: manifest.boss.stats.damage,
          speed: manifest.boss.stats.speed,
        },
        gameStateObj,
        audioManager
      );
      bossAI.setTarget({
        position: new Vector3(player.position.x, player.position.y, 0),
        hp: health(),
        maxHp: maxHealth(),
      });
    }

    const cinematicsManifest = getCinematicsManifestSync();
    const cinematicsById = new Map(
      cinematicsManifest.assets.map((asset) => [asset.id, asset.filename])
    );

    const resolveCinematicSrc = (cinematicId: string): string | null => {
      const direct = cinematicsById.get(cinematicId);
      if (direct) {
        return cinematicUrlByFilename.get(direct) ?? null;
      }
      for (const [id, filename] of cinematicsById.entries()) {
        if (filename.includes(cinematicId) || id.includes(cinematicId)) {
          const resolved = cinematicUrlByFilename.get(filename);
          if (resolved) {
            return resolved;
          }
        }
      }
      if (cinematicId.endsWith('.mp4')) {
        return cinematicUrlByFilename.get(cinematicId) ?? null;
      }
      return null;
    };

    const requestCameraPan = (position: { x: number; y: number }, durationMs: number) => {
      cameraPan = {
        target: position,
        startTime: performance.now(),
        duration: durationMs,
      };
    };

    const triggerSystem = new TriggerSystem(engine, player, {
      showToast,
      playSound: (soundId: string) => {
        audioManager.playSFX(soundId);
      },
      changeMusic: (trackId: string) => {
        audioManager.playMusic(trackId);
      },
      slowMotion: (durationMs: number) => {
        gameStateObj.setSlowMotion(durationMs);
      },
      particleBurst: (position, style) => {
        spawnParticleBurst(position, style);
      },
      completeQuest: (_questId: string) => {
        setQuestObjectives((objectives) =>
          objectives.map((objective) => ({ ...objective, completed: true }))
        );
        showToast('Quest complete');
      },
      completeChapter: () => {
        setScore((current) => current + 1000);
        showToast('Chapter complete');
      },
      unlockAchievement: (achievementId: string) => {
        showToast(`Achievement unlocked: ${achievementId}`);
      },
      npcAction: (npcId: string, state: string) => {
        const npc = aiManager.getNPC(npcId);
        if (npc?.setState) {
          npc.setState(state);
        }
      },
      setInteractionState: (interactionId: string, state: string) => {
        const interaction = interactionById.get(interactionId);
        if (interaction) {
          interaction.state = state;
        }
      },
      cameraPan: requestCameraPan,
      playCinematic: (cinematicId: string) => {
        const src = resolveCinematicSrc(cinematicId);
        if (!src) {
          showToast('Cinematic unavailable');
          return;
        }
        setActiveCinematic({ id: cinematicId, src });
        setPaused(true);
      },
      resolveTargetPosition: (targetId: string) => {
        const interaction = interactionById.get(targetId);
        if (interaction) {
          return { x: interaction.body.position.x, y: interaction.body.position.y };
        }
        const npc = npcBodies.get(targetId);
        if (npc) {
          return { x: npc.body.position.x, y: npc.body.position.y };
        }
        if (targetId === 'player') {
          return { x: player.position.x, y: player.position.y };
        }
        return null;
      },
    });

    triggerSystem.registerTriggers(manifest);

    const debugSystem = new DebugSystem({
      enabled: import.meta.env.MODE !== 'production',
      getPlayerPosition: () => ({ x: player.position.x, y: player.position.y }),
      toggleColliders: (_enabled) => {},
      toggleTriggers: (_enabled) => {},
      toggleAI: (_enabled) => {},
      spawnParticleBurst,
      hazardSystem,
    });

    const renderScene = createSceneRenderer({
      manifest,
      player,
      platforms,
      walls,
      ceilings,
      interactions,
      waterZones,
      lanternSystem,
      bellSystem,
      hearthSystem,
      flowPuzzles,
      timingSequences,
      collectibles,
      aiManager,
      particleBursts,
      debugSystem,
    });

    const enemyBodyMap = new Map<number, Matter.Body>();
    const playerRef = { position: new Vector3(player.position.x, player.position.y, 0) };

    setupCollisionHandlers(
      engine,
      player,
      {
        collectibles,
        npcBodies,
        interactions,
        _enemyBodyMap: enemyBodyMap,
      },
      {
        inputManager,
        audioManager,
      },
      {
        setHealth,
        setShards,
        setQuestObjectives,
        setWarmth,
        showToast,
        setSlowMotion: gameStateObj.setSlowMotion,
        spawnParticleBurst,
      },
      {
        health,
        maxHealth,
        maxWarmth,
        questObjectives,
      },
      {
        _playerController: playerController,
      }
    );

    // Validate required systems
    if (!inputManager) {
      throw new Error('InputManager is not available (window is undefined)');
    }

    // Create game loop
    const loop = createGameLoop({
      canvas,
      ctx,
      engine,
      runner,
      player,
      playerController,
      playerRef,
      inputManager: inputManager,
      _audioManager: audioManager,
      aiManager,
      bossAI,
      enemyBodyMap,
      lanternSystem,
      bellSystem,
      hearthSystem,
      hazardSystem,
      movingPlatforms,
      waterZones,
      flowPuzzles,
      timingSequences,
      gameStateObj,
      renderScene,
      triggerSystem,
    });

    if (import.meta.env.MODE !== 'production') {
      window.__GAME_RUNTIME__ = { player };
    }

    // Start game
    loop.start();

    setScore(0);

    // Cleanup on unmount
    onCleanup(() => {
      loop.stop();
      const { World, Engine } = window.Matter;
      World.clear(engine.world, false);
      Engine.clear(engine);
    });
  });

  return (
    <>
      {/* Loading Screen - Show while manifests are loading */}
      <Show when={manifestsLoaded.loading}>
        <LoadingScreen progress={loadingProgress()} status="Loading game manifests..." />
      </Show>

      {/* Error Screen - Show if manifest loading failed */}
      <Show when={manifestsLoaded.error}>
        <LoadingScreen
          progress={0}
          status="Failed to load game data"
          error={manifestsLoaded.error?.message || 'Unknown error occurred'}
        />
      </Show>

      {/* Runtime Error Screen - Show if game initialization failed */}
      <Show when={runtimeError()}>
        <LoadingScreen
          progress={0}
          status="Failed to start the game"
          error={runtimeError() || 'Unknown error occurred'}
        />
      </Show>

      {/* Start Menu - Show after manifests load but before game starts */}
      <Show when={!manifestsLoaded.loading && !manifestsLoaded.error && !gameStarted()}>
        <div
          data-testid="start-menu"
          style={{
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
            color: '#F4D03F',
          }}
        >
          <h1
            style={{
              'font-size': '48px',
              'font-weight': 'bold',
              'margin-bottom': '20px',
              color: '#E67E22',
            }}
          >
            Otterblade Odyssey
          </h1>
          <h2
            style={{
              'font-size': '24px',
              'margin-bottom': '40px',
              color: '#F4D03F',
            }}
          >
            A Willowmere Hearthhold woodland epic
          </h2>
          <button
            type="button"
            onClick={() => setGameStarted(true)}
            data-testid="button-start-game"
            style={{
              padding: '15px 40px',
              'font-size': '20px',
              background: '#E67E22',
              color: 'white',
              border: 'none',
              'border-radius': '8px',
              cursor: 'pointer',
              'box-shadow': '0 4px 8px rgba(0,0,0,0.3)',
            }}
            disabled={manifestsLoaded.loading}
          >
            Begin Journey
          </button>
        </div>
      </Show>

      {/* Game Canvas - Show when game is started and manifests are loaded */}
      <Show when={gameStarted() && manifestsLoaded()}>
        <div data-testid="game-container">
          <canvas ref={canvasRef} style={{ display: 'block' }} />

          {/* HUD */}
          <div
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.7)',
              'border-radius': '10px',
              color: '#F4D03F',
              'font-family': 'monospace',
              'min-width': '250px',
            }}
          >
            <div style={{ 'font-size': '18px', 'margin-bottom': '10px', color: '#E67E22' }}>
              <Show
                when={currentChapterManifest()}
                fallback={<span>Chapter {currentChapter()}</span>}
              >
                Chapter {currentChapter()}: {currentChapterManifest().name}
              </Show>
            </div>
            <div data-testid="health-hearts" style={{ 'margin-bottom': '10px' }}>
              <span style={{ color: '#F4D03F' }}>Health: </span>
              <For each={Array(maxHealth()).fill(0)}>
                {(_, i) => <span>{i() < health() ? '❤️' : '🖤'}</span>}
              </For>
            </div>
            <div style={{ 'margin-bottom': '10px' }}>
              <span style={{ color: '#F4D03F' }}>Warmth: </span>
              <div
                style={{
                  display: 'inline-block',
                  width: '100px',
                  height: '12px',
                  background: '#333',
                  border: '1px solid #F4D03F',
                  'vertical-align': 'middle',
                }}
              >
                <div
                  style={{
                    width: `${(warmth() / maxWarmth()) * 100}%`,
                    height: '100%',
                    background: warmth() > 50 ? '#FF6B35' : '#E67E22',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <span style={{ 'margin-left': '8px' }}>
                {warmth()}/{maxWarmth()}
              </span>
            </div>
            <div data-testid="score-display" style={{ 'margin-bottom': '10px' }}>
              <span style={{ color: '#F4D03F' }}>Score: </span>
              <span>{score()}</span>
            </div>
            <div data-testid="shard-count">
              <span style={{ color: '#F4D03F' }}>Shards: </span>
              <span>✨ {shards()}</span>
            </div>

            <Show when={activeQuest()}>
              <div
                data-testid="quest-message"
                style={{
                  'margin-top': '15px',
                  'padding-top': '10px',
                  'border-top': '1px solid #F4D03F',
                }}
              >
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

          <Show when={toastMessage()}>
            <div
              style={{
                position: 'fixed',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 20px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#F4D03F',
                'border-radius': '8px',
                'font-family': 'monospace',
                'font-size': '14px',
                'box-shadow': '0 4px 8px rgba(0,0,0,0.4)',
              }}
            >
              {toastMessage()}
            </div>
          </Show>

          <Show when={activeCinematic()}>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'z-index': 999,
                'flex-direction': 'column',
                gap: '12px',
              }}
            >
              <video
                src={activeCinematic()?.src}
                controls
                autoPlay
                playsInline
                style={{ width: '80%', 'max-width': '900px', 'border-radius': '12px' }}
                onEnded={() => {
                  setActiveCinematic(null);
                  setPaused(false);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setActiveCinematic(null);
                  setPaused(false);
                }}
                style={{
                  padding: '10px 24px',
                  background: '#E67E22',
                  color: 'white',
                  border: 'none',
                  'border-radius': '6px',
                  cursor: 'pointer',
                }}
              >
                Skip cinematic
              </button>
            </div>
          </Show>

          {/* Touch Controls */}
          <TouchControls />
        </div>
      </Show>
    </>
  );
}

// Error boundary wrapper
/**
 * Wraps the main game content with error handling.
 */
export default function OtterbladeGame() {
  return (
    <ErrorBoundary
      fallback={(err) => (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '30px',
            background: '#1a1a24',
            color: '#E67E22',
            'border-radius': '10px',
            'text-align': 'center',
            'max-width': '500px',
          }}
        >
          <h2 style={{ 'margin-bottom': '15px' }}>Game Error</h2>
          <p style={{ 'margin-bottom': '20px', color: '#F4D03F' }}>{err.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 30px',
              background: '#E67E22',
              color: 'white',
              border: 'none',
              'border-radius': '8px',
              cursor: 'pointer',
            }}
          >
            Restart Game
          </button>
        </div>
      )}
    >
      <OtterbladeGameContent />
    </ErrorBoundary>
  );
}
