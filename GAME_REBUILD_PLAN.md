# Game Rebuild Plan: JavaScript + DDL Factory Pattern (POC-Aligned)

**Date:** 2026-01-02  
**Issue:** Built bespoke game; need DDL alignment with **JAVASCRIPT** (not TypeScript)  
**Status:** Planning JavaScript rebuild following POC architecture

---

## Critical Clarification: JavaScript First!

**User directive:** "Rip OUT with a chainsaw ALL the TypeScript"

### Architecture Goals
1. **JavaScript** (vanilla, like `pocs/otterblade_odyssey.html`)
2. **Matter.js** v0.19.0 for physics (POC-proven)
3. **Astro** for framework (simple, not React/TypeScript complexity)
4. **Factory patterns** in JavaScript to load DDL JSON manifests
5. **POC-aligned** - Follow proven patterns from 1,934-line POC

### What To Avoid
- ❌ TypeScript compilation
- ❌ React complexity
- ❌ Complex build tooling
- ❌ Type systems and schemas (reference only)

### What To Use
- ✅ Vanilla JavaScript
- ✅ Matter.js physics engine
- ✅ Canvas 2D rendering
- ✅ Simple JSON loading
- ✅ Factory functions (JavaScript)
- ✅ POC-proven patterns

## What Exists (Reference for JavaScript Implementation)

### 1. Data Layer (Use These JSON Files)
```
client/src/data/
├── biomes.json (5 biomes with colors) ← LOAD THIS
├── chapters.json (10 chapter overview) ← LOAD THIS
└── manifests/
    ├── chapters/ (10 detailed manifests) ← LOAD THESE
    ├── enemies.json ← LOAD THIS
    ├── npcs.json ← LOAD THIS
    ├── sprites.json ← REFERENCE for procedural generation
    ├── cinematics.json ← LOAD THIS
    └── sounds.json ← LOAD THIS
```

### 2. TypeScript Loaders (REFERENCE ONLY - Rewrite in JavaScript)
```
client/src/game/data/
├── loaders.ts ← Convert to JavaScript
├── chapter-loaders.ts ← Convert to JavaScript  
├── npc-loaders.ts ← Convert to JavaScript
└── schemas.ts ← Reference only, no runtime validation
```

### 3. POC Proven Architecture (FOLLOW THIS)
```
pocs/otterblade_odyssey.html (1,934 lines)
- Vanilla JavaScript
- Matter.js v0.19.0 physics
- Canvas 2D procedural rendering
- Simple game loop
- Touch controls
- HUD system
- NO TypeScript, NO React, NO complex tooling
```

### 4. Implementation Guide (Reference)
```
IMPLEMENTATION.md (comprehensive patterns, adapt to JavaScript)
```

---

## Rebuild Plan (JavaScript Edition)

### Phase 1: JavaScript Game Foundation (3-4 hours)

**Goal:** Create JavaScript game following POC architecture

**Tasks:**
1. Create Astro project with JavaScript (NO TypeScript):
   ```
   game/
   ├── src/
   │   ├── pages/
   │   │   └── index.astro (entry point)
   │   ├── game/
   │   │   ├── engine.js (Matter.js wrapper)
   │   │   ├── renderer.js (Canvas 2D)
   │   │   ├── loop.js (game loop)
   │   │   ├── player.js (Finn)
   │   │   └── camera.js (follow camera)
   │   ├── factories/
   │   │   ├── level-factory.js (DDL → platforms)
   │   │   ├── npc-factory.js (DDL → NPCs)
   │   │   ├── interaction-factory.js (DDL → interactions)
   │   │   └── trigger-factory.js (DDL → triggers)
   │   ├── loaders/
   │   │   ├── chapter-loader.js (load JSON manifests)
   │   │   └── manifest-loader.js (load all DDL)
   │   └── rendering/
   │       ├── finn.js (procedural otter)
   │       ├── parallax.js (backgrounds)
   │       └── effects.js (particles)
   └── astro.config.mjs
   ```

2. Port Matter.js physics from POC (JavaScript):
   ```javascript
   // game/src/game/engine.js
   import Matter from 'matter-js';
   const { Engine, World, Bodies, Body, Events } = Matter;
   
   export function createPhysicsEngine() {
     const engine = Engine.create();
     engine.gravity.y = 1.5; // POC-proven value
     return engine;
   }
   
   export function createPlayerBody(x, y) {
     return Bodies.rectangle(x, y, 35, 55, {
       label: 'player',
       friction: 0.1,
       frictionAir: 0.01,
       restitution: 0
     });
   }
   ```

3. Port procedural Finn rendering (JavaScript):
   ```javascript
   // game/src/rendering/finn.js
   export function drawFinn(ctx, player, state) {
     // ... procedural otter rendering from POC
   }
   ```

**Validation:**
- [ ] Astro builds successfully (JavaScript only)
- [ ] Matter.js initializes
- [ ] Finn renders on canvas
- [ ] 60fps game loop

---

### Phase 2: JavaScript DDL Loaders & Factories (4-6 hours)

**Goal:** Load JSON manifests with JavaScript factory functions

**Tasks:**

#### 2.1 Chapter Loader (JavaScript)
```javascript
// game/src/loaders/chapter-loader.js

// Static imports for all chapter manifests
import chapter0 from '../../../client/src/data/manifests/chapters/chapter-0-the-calling.json';
import chapter1 from '../../../client/src/data/manifests/chapters/chapter-1-river-path.json';
// ... all 10 chapters

const CHAPTERS = {
  0: chapter0,
  1: chapter1,
  // ... map all
};

export function loadChapterManifest(chapterId) {
  const manifest = CHAPTERS[chapterId];
  if (!manifest) {
    throw new Error(`Chapter ${chapterId} not found`);
  }
  return manifest;
}

export function getChapterOverview(chapterId) {
  const chapter = loadChapterManifest(chapterId);
  return {
    id: chapter.id,
    name: chapter.name,
    location: chapter.location,
    quest: chapter.narrative.quest,
    hasBoss: !!chapter.boss
  };
}
```

#### 2.2 Level Factory (JavaScript)
```javascript
// game/src/factories/level-factory.js
import { loadChapterManifest } from '../loaders/chapter-loader.js';
import { createPlatform, createWall } from '../engine.js';

export function buildLevel(chapterId, physics) {
  const manifest = loadChapterManifest(chapterId);
  
  const level = {
    id: chapterId,
    name: manifest.name,
    bounds: manifest.level.bounds,
    platforms: [],
    walls: [],
    npcs: [],
    interactions: [],
    triggers: [],
    collectibles: []
  };
  
  // Build platforms from segments
  for (const segment of manifest.level.segments) {
    for (const platformDef of segment.platforms) {
      const platform = createPlatform(physics, {
        x: platformDef.x,
        y: platformDef.y,
        width: platformDef.width,
        height: platformDef.height,
        type: platformDef.type
      });
      level.platforms.push({
        body: platform,
        asset: platformDef.asset,
        type: platformDef.type
      });
    }
    
    // Build walls
    for (const wallDef of segment.walls) {
      const wall = createWall(physics, wallDef);
      level.walls.push({
        body: wall,
        asset: wallDef.asset
      });
    }
  }
  
  // Build NPCs
  level.npcs = manifest.npcs?.map(npcDef => 
    createNPC(npcDef, physics)
  ) || [];
  
  // Build interactions
  level.interactions = manifest.interactions?.map(interactionDef =>
    createInteraction(interactionDef)
  ) || [];
  
  // Build triggers
  level.triggers = manifest.triggers?.map(triggerDef =>
    createTrigger(triggerDef)
  ) || [];
  
  // Build collectibles
  level.collectibles = manifest.collectibles?.map(collectibleDef =>
    createCollectible(collectibleDef)
  ) || [];
  
  return level;
}
```

#### 2.3 NPC Factory (JavaScript)
```javascript
// game/src/factories/npc-factory.js

export function createNPC(npcDef, physics) {
  const body = physics.createNPCBody(npcDef.position.x, npcDef.position.y);
  
  return {
    id: npcDef.id,
    characterId: npcDef.characterId,
    name: npcDef.name,
    role: npcDef.role,
    body: body,
    facing: npcDef.facing,
    behavior: npcDef.behavior,
    currentState: npcDef.storyState.initialState,
    storyStates: npcDef.storyState.states,
    interactions: npcDef.interactions || [],
    
    update(deltaTime) {
      // Update NPC behavior
      const state = this.storyStates[this.currentState];
      // Render animation based on state
    },
    
    interact(player, gameState) {
      const state = this.storyStates[this.currentState];
      if (!state.canInteract) return;
      
      const interaction = this.findMatchingInteraction(gameState);
      if (interaction) {
        this.performGesture(interaction.gesture);
        player.performGesture(interaction.finnResponse);
        this.executeActions(interaction.actions);
      }
    },
    
    performGesture(gesture) {
      // Wordless animation: nod, point, wave, bow, etc.
      console.log(`NPC performs: ${gesture}`);
    },
    
    findMatchingInteraction(gameState) {
      // Find interaction that matches current triggers
      return this.interactions.find(i => 
        !i.trigger || gameState.triggersF fired.has(i.trigger)
      );
    },
    
    executeActions(actions) {
      // Execute array of actions
      for (const action of actions) {
        executeAction(action);
      }
    }
  };
}
```

#### 2.4 Interaction Factory (JavaScript)
```javascript
// game/src/factories/interaction-factory.js

export function createInteraction(def) {
  return {
    id: def.id,
    type: def.type,
    position: def.position,
    asset: def.asset,
    activateRadius: def.activateRadius || 50,
    currentState: def.initialState,
    states: def.states || {},
    requires: def.requires || {},
    linkedTo: def.linkedTo || [],
    
    canActivate(player, gameState) {
      // Check requirements
      if (this.requires.trigger && !gameState.triggersFired.has(this.requires.trigger)) {
        return false;
      }
      if (this.requires.warmth && gameState.warmth < this.requires.warmth) {
        return false;
      }
      return true;
    },
    
    activate(player, gameState) {
      if (!this.canActivate(player, gameState)) return false;
      
      const state = this.states[this.currentState];
      if (state.actions) {
        for (const action of state.actions) {
          executeAction(action, gameState);
        }
      }
      
      // Change to next state if defined
      const nextState = this.getNextState();
      if (nextState) {
        this.currentState = nextState;
      }
      
      return true;
    },
    
    render(ctx, camera) {
      const state = this.states[this.currentState];
      // Render based on current state asset
      // ... rendering logic
    }
  };
}
```

**Validation:**
- [ ] Load chapter-0-the-calling.json successfully
- [ ] Build platforms from segments
- [ ] Create NPCs at correct positions
- [ ] Set up interactions (hearth, window, blade, door)
- [ ] Register triggers

---

### Phase 3: Quest & Trigger Systems (JavaScript) (3-4 hours)

**Goal:** Implement quests and event triggers in JavaScript

**Tasks:**

#### 3.1 Trigger System
```javascript
// game/src/game/trigger-system.js

export function createTriggerSystem() {
  const triggers = new Map();
  const firedTriggers = new Set();
  
  return {
    loadFromManifest(manifest) {
      for (const triggerDef of manifest.triggers || []) {
        triggers.set(triggerDef.id, {
          ...triggerDef,
          fired: false
        });
      }
    },
    
    update(player, gameState) {
      for (const [id, trigger] of triggers) {
        if (trigger.once && firedTriggers.has(id)) continue;
        
        if (this.checkTrigger(trigger, player, gameState)) {
          this.executeTrigger(trigger, gameState);
          if (trigger.once) {
            firedTriggers.add(id);
          }
        }
      }
    },
    
    checkTrigger(trigger, player, gameState) {
      // Check if required triggers have fired
      if (trigger.requires) {
        for (const reqId of trigger.requires) {
          if (!firedTriggers.has(reqId)) return false;
        }
      }
      
      // Check trigger type
      switch (trigger.type) {
        case 'enter_region':
          return this.checkEnterRegion(trigger.region, player);
        case 'interact':
          return gameState.lastInteraction === trigger.targetId;
        case 'defeat_enemies':
          return gameState.enemiesDefeated >= trigger.threshold;
        // ... more trigger types
        default:
          return false;
      }
    },
    
    checkEnterRegion(region, player) {
      const px = player.body.position.x;
      const py = player.body.position.y;
      return px >= region.x && px <= region.x + region.width &&
             py >= region.y && py <= region.y + region.height;
    },
    
    executeTrigger(trigger, gameState) {
      for (const action of trigger.actions) {
        executeAction(action, gameState);
      }
    }
  };
}
```

#### 3.2 Quest System
```javascript
// game/src/game/quest-system.js

export function createQuestSystem() {
  const activeQuests = new Map();
  
  return {
    loadFromManifest(manifest) {
      for (const questDef of manifest.quests || []) {
        activeQuests.set(questDef.id, {
          ...questDef,
          objectives: questDef.objectives.map(obj => ({
            ...obj,
            complete: false
          }))
        });
      }
    },
    
    updateObjective(objectiveId, value) {
      for (const quest of activeQuests.values()) {
        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (objective) {
          objective.complete = true;
          objective.progress = value;
          
          if (this.isQuestComplete(quest)) {
            this.completeQuest(quest);
          }
        }
      }
    },
    
    isQuestComplete(quest) {
      return quest.objectives
        .filter(o => !o.optional)
        .every(o => o.complete);
    },
    
    completeQuest(quest) {
      console.log(`Quest complete: ${quest.name}`);
      this.giveRewards(quest.rewards);
      activeQuests.delete(quest.id);
    },
    
    giveRewards(rewards) {
      // Give ember shards, achievements, etc.
      if (rewards.emberShards) {
        gameState.shards += rewards.emberShards;
      }
      if (rewards.achievement) {
        console.log(`Achievement unlocked: ${rewards.achievement}`);
      }
    }
  };
}
```

**Validation:**
- [ ] Triggers fire on region enter
- [ ] Quests track objectives
- [ ] Quest completion gives rewards

---

### Phase 4: Complete Integration (JavaScript) (4-6 hours)

**Goal:** Wire everything together and test

**Tasks:**

1. Create main game class
2. Integrate all systems
3. Test chapter 0 fully
4. Test other chapters load
5. Fix bugs

**Main Game Structure:**
```javascript
// game/src/game/main.js

import { createPhysicsEngine } from './engine.js';
import { createPlayer } from './player.js';
import { buildLevel } from '../factories/level-factory.js';
import { createTriggerSystem } from './trigger-system.js';
import { createQuestSystem } from './quest-system.js';
import { drawFinn } from '../rendering/finn.js';
import { drawParallax } from '../rendering/parallax.js';

export function initGame(canvas) {
  const ctx = canvas.getContext('2d');
  const physics = createPhysicsEngine();
  const player = createPlayer(physics, 100, 300);
  
  let currentLevel = null;
  let triggerSystem = null;
  let questSystem = null;
  let camera = { x: 0, y: 0 };
  
  const gameState = {
    health: 5,
    warmth: 100,
    shards: 0,
    chapter: 0,
    triggersFired: new Set(),
    lastInteraction: null,
    enemiesDefeated: 0
  };
  
  async function loadChapter(chapterId) {
    currentLevel = buildLevel(chapterId, physics);
    triggerSystem = createTriggerSystem();
    triggerSystem.loadFromManifest(currentLevel.manifest);
    questSystem = createQuestSystem();
    questSystem.loadFromManifest(currentLevel.manifest);
  }
  
  function gameLoop(timestamp) {
    const deltaTime = 16.67; // 60fps
    
    // Update physics
    physics.update(deltaTime);
    
    // Update player
    player.update(deltaTime);
    
    // Update triggers
    triggerSystem.update(player, gameState);
    
    // Update camera
    camera.x = player.body.position.x - canvas.width / 2;
    camera.y = player.body.position.y - canvas.height / 2;
    
    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    drawParallax(ctx, camera, gameState.chapter);
    
    // Draw platforms
    for (const platform of currentLevel.platforms) {
      ctx.fillStyle = '#8B4513';
      const pos = platform.body.position;
      ctx.fillRect(
        pos.x - platform.body.bounds.max.x + pos.x,
        pos.y - platform.body.bounds.max.y + pos.y,
        platform.body.bounds.max.x - platform.body.bounds.min.x,
        platform.body.bounds.max.y - platform.body.bounds.min.y
      );
    }
    
    // Draw NPCs
    for (const npc of currentLevel.npcs) {
      npc.render(ctx, camera);
    }
    
    // Draw interactions
    for (const interaction of currentLevel.interactions) {
      interaction.render(ctx, camera);
    }
    
    // Draw player
    drawFinn(ctx, player.getState());
    
    ctx.restore();
    
    requestAnimationFrame(gameLoop);
  }
  
  // Start game
  loadChapter(0).then(() => {
    requestAnimationFrame(gameLoop);
  });
  
  return {
    loadChapter,
    gameState
  };
}
```

**Validation:**
- [ ] Chapter 0 fully playable
- [ ] All systems working together
- [ ] No console errors
- [ ] 60fps maintained

---

## Timeline Estimate (JavaScript)

| Phase | Hours | Description |
|-------|-------|-------------|
| 1. JavaScript Foundation | 3-4 | Astro + Matter.js + POC patterns |
| 2. DDL Loaders & Factories | 4-6 | JavaScript loaders, factories |
| 3. Quest & Triggers | 3-4 | Event system, objectives |
| 4. Integration & Testing | 4-6 | Wire together, validate |
| **Total** | **14-20 hours** | ~1 week part-time |

**Much simpler than TypeScript approach!**

---

## Success Criteria

### Technical
- [ ] Pure JavaScript (no TypeScript compilation)
- [ ] All 10 chapter manifests load successfully
- [ ] Factory functions build game objects from DDL
- [ ] 60fps maintained
- [ ] Follows POC architecture patterns

### Gameplay
- [ ] Chapter 0 fully playable with DDL content
- [ ] Quest system tracks objectives
- [ ] Trigger system fires events
- [ ] NPC interactions work

### Testing
- [ ] Game runs in browser
- [ ] No console errors
- [ ] Manual validation of gameplay

---

## What to Keep from Current Implementation

- **Matter.js setup** ✅
- **Game loop** ✅
- **Procedural Finn rendering** ✅
- **HUD components** ✅ (port to vanilla JS)
- **Camera follow** ✅

---

## Next Steps

1. ✅ Issue acknowledged  
2. ✅ JavaScript-first plan created
3. ⏳ Begin Phase 1: JavaScript foundation
4. ⏳ Execute phases systematically
5. ⏳ Validate with manual testing
6. ⏳ Deploy

---

**This JavaScript-first approach follows the POC proven architecture and avoids TypeScript complexity while still loading from DDL manifests using factory patterns.**
