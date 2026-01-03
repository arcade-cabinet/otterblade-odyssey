/** @jsxImportSource solid-js */
/**
 * Otterblade Odyssey - Main Game Component
 * Orchestrates game systems using modular architecture
 * AGENTS.md compliant: ~200 lines (max 300 target)
 */

import Matter from 'matter-js';
import { createEffect, createSignal, ErrorBoundary, For, onCleanup, Show } from 'solid-js';
import { Vector3 } from 'yuka';
import TouchControls from './components/TouchControls';
import { loadChapterManifest } from './data/chapter-loaders';
import { createGameLoop } from './engine/gameLoop';
import {
  buildEnemies,
  buildInteractionsAndCollectibles,
  buildLevelGeometry,
  buildNPCs,
  initializeAudio,
  initializeChapterData,
  initializeQuests,
} from './engine/initialization';
import { createSceneRenderer } from './engine/rendering';
import { BellSystem, HearthSystem, LanternSystem } from './environment/EnvironmentalSystems';
import { createFinnBody, createPhysicsEngine, HazardSystem } from './physics/PhysicsManager';
import { PlayerController } from './physics/PlayerController';
import { aiManager } from './systems/AIManager';
import { audioManager } from './systems/AudioManager';
import { setupCollisionHandlers } from './systems/collision';
import { inputManager } from './systems/InputManager';

const { World, Runner, Engine } = Matter;

function OtterbladeGameContent() {
  let canvasRef;

  // Game state signals
  const [currentChapter] = createSignal(0);
  const [health, setHealth] = createSignal(5);
  const [maxHealth] = createSignal(5);
  const [warmth, setWarmth] = createSignal(100);
  const [maxWarmth] = createSignal(100);
  const [, setShards] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [questObjectives, setQuestObjectives] = createSignal([]);
  const [activeQuest, setActiveQuest] = createSignal(null);

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
    setCheckpoint: (pos) => console.log('Checkpoint set:', pos),
    summonAlly: (pos) => console.log('Ally summoned:', pos),
    alertGuards: (pos) => console.log('Guards alerted:', pos),
    rallyAllies: () => console.log('Allies rallied'),
    onBossDefeated: () => console.log('Boss defeated!'),
  };

  createEffect(() => {
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

    // Initialize chapter data
    const chapterId = currentChapter();
    const { manifest, spawnPoint } = initializeChapterData(chapterId);
    // Initialize quest system
    initializeQuests(manifest, setActiveQuest, setQuestObjectives);

    // Initialize audio
    initializeAudio(audioManager, manifest);

    // Create physics engine
    const engine = createPhysicsEngine();
    const runner = Runner.create();

    // Create player
    const player = createFinnBody(spawnPoint.x, spawnPoint.y);
    World.add(engine.world, player);

    // Create player controller
    const playerController = new PlayerController(player, engine, gameStateObj, audioManager);

    // Create player reference for AI
    const playerRef = {
      position: new Vector3(player.position.x, player.position.y, 0),
      body: player,
    };

    // Initialize environmental systems
    const lanternSystem = new LanternSystem(audioManager);
    const bellSystem = new BellSystem(audioManager);
    const hearthSystem = new HearthSystem(audioManager);
    const hazardSystem = new HazardSystem();

    // Initialize collections
    const platforms = [];
    const walls = [];
    const ceilings = [];
    const waterZones = [];
    const movingPlatforms = [];
    const flowPuzzles = [];
    const timingSequences = [];

    // Build level geometry
    buildLevelGeometry(
      engine,
      manifest,
      platforms,
      walls,
      ceilings,
      movingPlatforms,
      hazardSystem,
      waterZones,
      lanternSystem,
      bellSystem,
      hearthSystem,
      flowPuzzles,
      timingSequences
    );

    // Build navigation mesh for AI
    try {
      aiManager.buildNavMesh(platforms);
    } catch (error) {
      console.warn('NavMesh generation failed, AI pathfinding will be limited:', error);
    }

    // Build NPCs
    const npcBodies = buildNPCs(chapterId, engine, aiManager);

    // Build enemies and boss
    const { enemyBodyMap, bossAI } = buildEnemies(
      chapterId,
      engine,
      aiManager,
      audioManager,
      playerRef,
      gameStateObj,
      playerController,
      player
    );

    // Build interactions and collectibles
    const { interactions, collectibles } = buildInteractionsAndCollectibles(
      chapterId,
      engine,
      manifest
    );

    // Setup collision handlers with O(1) Map lookups
    setupCollisionHandlers(
      engine,
      player,
      {
        collectibles,
        npcBodies,
        interactions,
        enemyBodyMap,
      },
      {
        inputManager,
        audioManager,
      },
      {
        setHealth,
        setShards,
        setQuestObjectives,
      },
      {
        health,
        maxHealth,
        questObjectives,
      },
      {
        playerController,
      }
    );

    // Create scene renderer
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
    });

    // Create and start game loop with proper delta time
    const gameLoop = createGameLoop({
      canvas,
      ctx,
      engine,
      runner,
      player,
      playerController,
      playerRef,
      inputManager,
      audioManager,
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
    });

    gameLoop.start();

    // Cleanup on unmount
    onCleanup(() => {
      gameLoop.stop();
      playerController.destroy();
      audioManager.stopAll();
      aiManager.destroy();
      inputManager.reset();
      lanternSystem?.destroy?.();
      bellSystem?.destroy?.();
      hearthSystem?.destroy?.();
      for (const sequence of timingSequences) {
        sequence?.destroy?.();
      }
      Engine.clear(engine);
      World.clear(engine.world, false);
      enemyBodyMap.clear();
    });
  });

  return (
    <>
      <Show when={!gameStarted()}>
        <div
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
            A Redwall-inspired woodland epic
          </h2>
          <button
            type="button"
            onClick={() => setGameStarted(true)}
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
          >
            Begin Journey
          </button>
        </div>
      </Show>

      <Show when={gameStarted()}>
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
            Chapter {currentChapter()}: {loadChapterManifest(currentChapter()).name}
          </div>
          <div style={{ 'margin-bottom': '10px' }}>
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
          <div>
            <span style={{ color: '#F4D03F' }}>Shards: </span>
            <span>✨ {shards()}</span>
          </div>

          <Show when={activeQuest()}>
            <div
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

        {/* Touch Controls */}
        <TouchControls />
      </Show>
    </>
  );
}

// Error boundary wrapper
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
