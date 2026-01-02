# Next Phase Roadmap: Otterblade Odyssey Game Implementation

**Date:** 2026-01-02  
**Phase:** Post-PR #24 Implementation  
**Goal:** Build complete, playable 10-chapter game following Astro + Solid.js + Matter.js architecture

---

## 🎯 Mission Statement

Build the Otterblade Odyssey game using the **proven POC patterns** (Matter.js physics, Canvas 2D procedural rendering) within an **Astro + Solid.js** framework, validated by **complete journey tests** with **MP4 video capture**, and deployed to **GitHub Pages**.

**Core Principle:** Chainsaw the complexity. Build clean, simple, maintainable code that WORKS.

---

## 🚨 IMMEDIATE ACTIONS (Before Starting Features)

### Priority 0: Security Hardening (CRITICAL - 2 hours)
**Why:** PR #24 merged with 4 open security vulnerabilities in workflow files.

**Tasks:**
1. **Fix prompt injection** in `.github/workflows/ai-reviewer.yml:233`
   ```yaml
   # BEFORE (VULNERABLE):
   prompt: |
     Review PR #${{ needs.resolve-context.outputs.pr_number }}
   
   # AFTER (SAFE):
   prompt: |
     Review the pull request in this repository.
     Pull request number: ${{ needs.resolve-context.outputs.pr_number }}
     Repository: ${{ github.repository }}
   ```

2. **Fix command injection** in `.github/workflows/ecosystem-connector.yml:76`
   ```yaml
   # BEFORE (VULNERABLE):
   run: |
     echo "PR Title: ${{ github.event.pull_request.title }}" | command
   
   # AFTER (SAFE):
   env:
     PR_TITLE: ${{ github.event.pull_request.title }}
   run: |
     SAFE_TITLE=$(echo "$PR_TITLE" | tr -d '\n\r' | head -c 100)
     echo "PR Title: $SAFE_TITLE" | command
   ```

3. **Fix allowed_tools syntax** in `.github/workflows/ecosystem-reviewer.yml:154`
   - Verify format against claude-code-action documentation
   - Ensure tool allowlist is properly configured

4. **Fix claude_args format** in `.github/workflows/ai-reviewer.yml:247`
   ```yaml
   # BEFORE (WRONG):
   claude_args: "--allowedTools Read,Glob,..."
   
   # AFTER (CORRECT):
   allowed_tools: "Read,Glob,Grep,LS,Bash(gh:*),mcp__github__*,..."
   ```

**Validation:**
```bash
# Run CodeQL scan
pnpm run security:scan

# Check workflow syntax
actionlint .github/workflows/*.yml
```

**Commit Message:** `🔒 Fix 4 security vulnerabilities in GitHub workflow files`

---

## 📋 Phase-by-Phase Implementation Plan

### Phase 1: Astro + Solid.js Foundation (6-8 hours)

#### Step 1.1: Initialize Astro Project (1 hour)
```bash
# In game/ directory
pnpm create astro@latest . -- --template minimal --no-git

# Install Solid.js integration
pnpm add @astrojs/solid-js solid-js

# Install game dependencies
pnpm add matter-js yuka zustand howler tone nipplejs
```

**Create:** `game/astro.config.mjs`
```javascript
import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  integrations: [solidJs()],
  site: 'https://arcade-cabinet.github.io',
  base: '/otterblade-odyssey',
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@game': '/src/game',
        '@components': '/src/components',
        '@stores': '/src/stores',
      }
    }
  }
});
```

**Validation:**
```bash
cd game
pnpm install
pnpm dev  # Should start on port 4321
```

**Commit:** `✨ Initialize Astro + Solid.js project with game dependencies`

---

#### Step 1.2: Create Directory Structure (30 min)
```
game/src/
├── pages/
│   └── index.astro              # Main game page
├── components/
│   ├── GameCanvas.jsx           # Matter.js canvas wrapper
│   ├── HUD.jsx                  # Health, warmth, shards display
│   ├── TouchControls.jsx        # nipplejs joystick
│   ├── Menu.jsx                 # Start screen
│   └── ChapterPlate.jsx         # Chapter intro overlay
├── game/
│   ├── engine/
│   │   ├── physics.js           # Matter.js wrapper
│   │   ├── gameLoop.js          # 60fps animation loop
│   │   └── camera.js            # Camera follow system
│   ├── entities/
│   │   ├── Player.js            # Finn the otter
│   │   ├── Enemy.js             # Galeborn enemies
│   │   └── Platform.js          # Ground/walls/hazards
│   ├── rendering/
│   │   ├── finn.js              # Procedural otter (from POC)
│   │   ├── enemies.js           # Procedural Galeborn
│   │   ├── parallax.js          # Biome backgrounds
│   │   └── particles.js         # Visual effects
│   ├── systems/
│   │   ├── collision.js         # Collision handling
│   │   ├── input.js             # Keyboard/gamepad/touch
│   │   ├── audio.js             # Howler.js manager
│   │   └── ai.js                # YUKA integration
│   └── ddl/
│       ├── loader.js            # Load JSON manifests
│       └── builder.js           # Build levels from DDL
├── stores/
│   └── gameStore.js             # Zustand state
└── styles/
    └── global.css               # Warm Redwall styling
```

**Commit:** `📁 Create game directory structure`

---

#### Step 1.3: Build Landing Page (1 hour)
**Create:** `game/src/pages/index.astro`
```astro
---
import '../styles/global.css';
import Menu from '../components/Menu';
import GameCanvas from '../components/GameCanvas';
import HUD from '../components/HUD';
import TouchControls from '../components/TouchControls';
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Otterblade Odyssey - A Woodland Adventure</title>
</head>
<body>
  <div id="app">
    <Menu client:load />
    <GameCanvas client:load />
    <HUD client:load />
    <TouchControls client:visible />
  </div>
</body>
</html>
```

**Create:** `game/src/styles/global.css`
```css
:root {
  /* Warm Redwall palette */
  --color-ember: #E67E22;
  --color-gold: #F4D03F;
  --color-moss: #8FBC8F;
  --color-hearth: #8B4513;
  --color-parchment: #F5E6D3;
  --color-shadow: #2C1810;
}

body {
  margin: 0;
  font-family: 'Georgia', serif;
  background: linear-gradient(to bottom, var(--color-hearth), var(--color-shadow));
  color: var(--color-parchment);
  overflow: hidden;
}

#app {
  position: relative;
  width: 100vw;
  height: 100vh;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

**Commit:** `🎨 Create landing page with warm Redwall styling`

---

#### Step 1.4: Build Zustand Store (1 hour)
**Create:** `game/src/stores/gameStore.js`
```javascript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Game state
      gameStarted: false,
      gameOver: false,
      gamePaused: false,
      
      // Player state
      health: 5,
      maxHealth: 5,
      warmth: 100,
      maxWarmth: 100,
      shards: 0,
      
      // Chapter state
      currentChapter: 0,
      chapterName: "The Calling",
      location: "Finn's Cottage",
      quest: "Answer the Call",
      chaptersCompleted: [],
      
      // Actions
      startGame: () => set({ gameStarted: true, gameOver: false }),
      pauseGame: () => set({ gamePaused: true }),
      resumeGame: () => set({ gamePaused: false }),
      gameOverAction: () => set({ gameOver: true, gameStarted: false }),
      
      takeDamage: (amount) => set((state) => ({
        health: Math.max(0, state.health - amount),
        gameOver: state.health - amount <= 0
      })),
      
      heal: (amount) => set((state) => ({
        health: Math.min(state.maxHealth, state.health + amount)
      })),
      
      loseWarmth: (amount) => set((state) => ({
        warmth: Math.max(0, state.warmth - amount)
      })),
      
      gainWarmth: (amount) => set((state) => ({
        warmth: Math.min(state.maxWarmth, state.warmth + amount)
      })),
      
      collectShard: () => set((state) => ({ shards: state.shards + 1 })),
      
      setChapter: (chapterId, name, location, quest) => set({
        currentChapter: chapterId,
        chapterName: name,
        location,
        quest
      }),
      
      completeChapter: (chapterId) => set((state) => ({
        chaptersCompleted: [...state.chaptersCompleted, chapterId]
      })),
      
      resetGame: () => set({
        health: 5,
        warmth: 100,
        shards: 0,
        currentChapter: 0,
        chaptersCompleted: [],
        gameStarted: false,
        gameOver: false,
        gamePaused: false
      })
    }),
    {
      name: 'otterblade-odyssey-save',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
```

**Validation:**
```javascript
// Test in browser console
import { useGameStore } from '@stores/gameStore';
const store = useGameStore.getState();
store.startGame();
store.takeDamage(2);
console.log(store.health); // Should be 3
```

**Commit:** `💾 Create Zustand game store with localStorage persistence`

---

#### Step 1.5: Build Core Components (2-3 hours)
**Create:** `game/src/components/Menu.jsx`
```jsx
import { createSignal, Show } from 'solid-js';
import { useGameStore } from '@stores/gameStore';

export default function Menu() {
  const gameStarted = useGameStore((state) => state.gameStarted);
  const startGame = useGameStore((state) => state.startGame);
  
  return (
    <Show when={!gameStarted()}>
      <div class="menu-overlay">
        <div class="menu-content">
          <h1 class="title">Otterblade Odyssey</h1>
          <p class="subtitle">A Woodland Adventure</p>
          <button class="start-btn" onClick={startGame}>
            Begin Journey
          </button>
          <div class="controls-hint">
            <p>WASD / Arrows - Move</p>
            <p>Space - Jump & Dismiss Text</p>
            <p>Z - Attack</p>
          </div>
        </div>
      </div>
    </Show>
  );
}
```

**Create:** `game/src/components/HUD.jsx`
```jsx
import { createEffect, createSignal, For } from 'solid-js';
import { useGameStore } from '@stores/gameStore';

export default function HUD() {
  const health = useGameStore((state) => state.health);
  const warmth = useGameStore((state) => state.warmth);
  const shards = useGameStore((state) => state.shards);
  const chapterName = useGameStore((state) => state.chapterName);
  const quest = useGameStore((state) => state.quest);
  
  return (
    <div class="hud">
      <div class="hud-left">
        <div class="health-display">
          <span class="label">Health:</span>
          <div class="health-hearts">
            <For each={Array(5)}>
              {(_, i) => (
                <span class={`heart ${i() < health() ? 'filled' : 'empty'}`}>
                  ♥
                </span>
              )}
            </For>
          </div>
        </div>
        
        <div class="warmth-display">
          <span class="label">Warmth:</span>
          <div class="warmth-bar">
            <div class="warmth-fill" style={{ width: `${warmth()}%` }} />
          </div>
        </div>
        
        <div class="shards-display">
          <span class="label">Shards:</span>
          <span class="count">{shards()}</span>
        </div>
      </div>
      
      <div class="hud-right">
        <div class="chapter-info">
          <p class="chapter-name">{chapterName()}</p>
          <p class="quest">{quest()}</p>
        </div>
      </div>
    </div>
  );
}
```

**Create:** `game/src/components/GameCanvas.jsx`
```jsx
import { onMount, onCleanup } from 'solid-js';
import Matter from 'matter-js';

export default function GameCanvas() {
  let canvasRef;
  let engine;
  let render;
  
  onMount(() => {
    // Initialize Matter.js
    engine = Matter.Engine.create();
    engine.gravity.y = 1.5; // POC-proven value
    
    render = Matter.Render.create({
      canvas: canvasRef,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
      }
    });
    
    Matter.Render.run(render);
    
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    
    // TODO: Initialize game systems here
    // - Load level
    // - Create player
    // - Start game loop
  });
  
  onCleanup(() => {
    if (render) Matter.Render.stop(render);
    if (engine) Matter.Engine.clear(engine);
  });
  
  return <canvas ref={canvasRef} />;
}
```

**Commit:** `🎮 Build core Solid.js components (Menu, HUD, GameCanvas)`

---

### Phase 2: Matter.js Game Engine (8-12 hours)

#### Step 2.1: Physics Engine Wrapper (2 hours)
**Create:** `game/src/game/engine/physics.js`
```javascript
import Matter from 'matter-js';
const { Engine, World, Bodies, Events } = Matter;

export class PhysicsEngine {
  constructor() {
    this.engine = Engine.create();
    this.engine.gravity.y = 1.5; // POC-proven
    this.world = this.engine.world;
    this.bodies = new Map(); // Track bodies by ID
  }
  
  update(deltaTime) {
    Engine.update(this.engine, deltaTime);
  }
  
  addBody(id, body) {
    World.add(this.world, body);
    this.bodies.set(id, body);
    return body;
  }
  
  removeBody(id) {
    const body = this.bodies.get(id);
    if (body) {
      World.remove(this.world, body);
      this.bodies.delete(id);
    }
  }
  
  getBody(id) {
    return this.bodies.get(id);
  }
  
  createPlatform(x, y, width, height, options = {}) {
    return Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.8,
      ...options
    });
  }
  
  createPlayer(x, y) {
    return Bodies.rectangle(x, y, 35, 55, {
      label: 'player',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0,
      density: 0.01
    });
  }
  
  createEnemy(x, y) {
    return Bodies.rectangle(x, y, 28, 45, {
      label: 'enemy',
      friction: 0.1,
      frictionAir: 0.01,
      restitution: 0
    });
  }
  
  onCollisionStart(callback) {
    Events.on(this.engine, 'collisionStart', callback);
  }
  
  onCollisionEnd(callback) {
    Events.on(this.engine, 'collisionEnd', callback);
  }
}
```

**Commit:** `⚙️ Create Matter.js physics engine wrapper`

---

#### Step 2.2: Game Loop (2 hours)
**Create:** `game/src/game/engine/gameLoop.js`
```javascript
export class GameLoop {
  constructor() {
    this.isRunning = false;
    this.lastTime = 0;
    this.targetFPS = 60;
    this.targetFrameTime = 1000 / this.targetFPS;
    this.systems = [];
    this.rafId = null;
  }
  
  registerSystem(system) {
    this.systems.push(system);
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
  
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
  
  loop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Cap delta to prevent huge jumps
    const clampedDelta = Math.min(deltaTime, this.targetFrameTime * 2);
    
    // Update all systems
    for (const system of this.systems) {
      if (system.update) {
        system.update(clampedDelta);
      }
    }
    
    this.rafId = requestAnimationFrame((time) => this.loop(time));
  }
}
```

**Commit:** `⏰ Create 60fps game loop with system registration`

---

#### Step 2.3: Player Controller (3-4 hours)
**Create:** `game/src/game/entities/Player.js`
```javascript
import Matter from 'matter-js';
const { Body } = Matter;

export class Player {
  constructor(physics, x, y) {
    this.physics = physics;
    this.body = physics.createPlayer(x, y);
    physics.addBody('player', this.body);
    
    // Movement constants (from POC)
    this.moveForce = 0.005;
    this.maxSpeed = 8;
    this.jumpVelocity = -12;
    
    // State
    this.isGrounded = false;
    this.facing = 1; // 1 = right, -1 = left
    this.state = 'idle'; // idle, walk, jump, attack
    this.animationFrame = 0;
    
    // Input tracking
    this.inputs = {
      left: false,
      right: false,
      jump: false,
      attack: false
    };
  }
  
  update(deltaTime) {
    this.updateMovement();
    this.updateAnimation(deltaTime);
    this.checkGrounded();
  }
  
  updateMovement() {
    const velocity = this.body.velocity;
    
    // Horizontal movement
    if (this.inputs.left) {
      Body.applyForce(this.body, this.body.position, { 
        x: -this.moveForce, 
        y: 0 
      });
      this.facing = -1;
    }
    if (this.inputs.right) {
      Body.applyForce(this.body, this.body.position, { 
        x: this.moveForce, 
        y: 0 
      });
      this.facing = 1;
    }
    
    // Limit max speed
    if (Math.abs(velocity.x) > this.maxSpeed) {
      Body.setVelocity(this.body, {
        x: Math.sign(velocity.x) * this.maxSpeed,
        y: velocity.y
      });
    }
    
    // Jump
    if (this.inputs.jump && this.isGrounded) {
      Body.setVelocity(this.body, {
        x: velocity.x,
        y: this.jumpVelocity
      });
      this.inputs.jump = false; // Consume jump
    }
  }
  
  checkGrounded() {
    // Check if player is on ground (collision detection)
    // TODO: Implement proper ground check via collision events
    this.isGrounded = Math.abs(this.body.velocity.y) < 0.5;
  }
  
  updateAnimation(deltaTime) {
    // Determine state
    if (this.inputs.attack) {
      this.state = 'attack';
    } else if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.abs(this.body.velocity.x) > 0.5) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
    
    // Update animation frame
    this.animationFrame += deltaTime * 0.01;
    if (this.animationFrame > 100) this.animationFrame = 0;
  }
  
  setInput(key, value) {
    if (key in this.inputs) {
      this.inputs[key] = value;
    }
  }
  
  getPosition() {
    return this.body.position;
  }
  
  getState() {
    return {
      position: this.body.position,
      velocity: this.body.velocity,
      facing: this.facing,
      state: this.state,
      frame: this.animationFrame
    };
  }
}
```

**Commit:** `🦦 Create Player entity with Matter.js physics and input handling`

---

**Continue with remaining phases in similar detail...**

---

## ⏱️ Time Estimates Summary

| Phase | Tasks | Est. Hours |
|-------|-------|------------|
| 0. Security Hardening | 4 fixes + validation | 2 |
| 1. Astro Foundation | Init + structure + components | 6-8 |
| 2. Matter.js Engine | Physics + loop + player | 8-12 |
| 3. Procedural Rendering | Finn + parallax + enemies | 6-8 |
| 4. DDL Integration | Loading + building + progression | 4-6 |
| 5. Enemy AI & Combat | YUKA + FSM + combat | 6-8 |
| 6. UI Polish | Menus + HUD + overlays | 3-4 |
| 7. Audio System | SFX + music | 3-4 |
| 8. Testing | Automated + manual + fixes | 4-6 |
| 9. Deployment | Build + deploy + validate | 2-3 |
| **TOTAL** | | **44-61 hours** |

**Recommended Schedule:** 2-3 weeks @ 20-25 hours/week

---

## ✅ Validation Checklist

After each phase, validate:
- [ ] Code compiles without errors
- [ ] `pnpm dev` runs successfully
- [ ] Visual changes captured in screenshots
- [ ] Unit tests pass (if applicable)
- [ ] Playwright E2E tests pass (if applicable)
- [ ] No console errors in browser
- [ ] Performance metrics acceptable (60fps, low memory)
- [ ] Git commit pushed with clear message

---

## 🎯 Success Criteria (Final)

- [ ] All 10 chapters playable from start to finish
- [ ] Procedural Finn rendering matches POC aesthetic
- [ ] Matter.js physics feels responsive and "right"
- [ ] YUKA enemy AI behaves intelligently
- [ ] Complete journey test captures 60-min MP4 video
- [ ] Game deployed to https://arcade-cabinet.github.io/otterblade-odyssey/
- [ ] Bundle size <200KB (vs 2.1MB React)
- [ ] 60fps stable (vs 15-25fps React)
- [ ] Zero progression blockers
- [ ] User confirms: "THAT'S the vision!"

---

**Let's build it. 🚀**
