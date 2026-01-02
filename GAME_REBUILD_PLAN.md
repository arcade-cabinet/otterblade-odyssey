# Game Rebuild Plan: DDL Factory Pattern Alignment

**Date:** 2026-01-02  
**Issue:** Built bespoke game instead of using existing DDL factory patterns  
**Status:** Planning complete rebuild

---

## Problem Summary

The game I built (in `game/` directory) was a **simplified, bespoke implementation** that:
- Ignored 6,977 lines of carefully crafted JSON chapter manifests
- Didn't use existing TypeScript loaders (`chapter-loaders.ts`, `loaders.ts`)
- Skipped factory patterns documented in `IMPLEMENTATION.md`
- Missed NPCs, quests, triggers, interactions, story beats, cinematics
- Used vanilla JS instead of TypeScript with Zod validation

## What Exists (That I Should Use)

### 1. Data Layer
```
client/src/data/
├── biomes.json (5 biomes with colors)
├── chapters.json (10 chapter overview)
└── manifests/
    ├── chapters/ (10 detailed manifests, 492-949 lines each)
    ├── enemies.json
    ├── npcs.json
    ├── sprites.json (procedural sprite generation)
    ├── cinematics.json
    ├── sounds.json
    └── schema/ (JSON schemas for validation)
```

### 2. Loader Layer
```
client/src/game/data/
├── loaders.ts (loadChapters, loadBiomes)
├── chapter-loaders.ts (loadChapterManifest, + 20 helper functions)
├── npc-loaders.ts
└── schemas.ts (Zod schemas for type safety)
```

### 3. Implementation Guide
```
IMPLEMENTATION.md (comprehensive technical guide)
- Physics system patterns (Matter.js)
- Rendering pipeline (Canvas 2D)
- Character implementation
- Enemy AI with Yuka
- Level design from DDL
- State management (Zustand)
- Collision & interaction system
- Audio pipeline
- Procedural generation
```

### 4. Test Infrastructure
```
e2e/automated-playthroughs/
- Complete journey validation
- YUKA pathfinding for AI player
- MP4 video capture
docs/COMPLETE_JOURNEY_VALIDATION.md
```

---

## Rebuild Plan

### Phase 1: Setup TypeScript Game Foundation (4-6 hours)

**Goal:** Replace vanilla JS game with TypeScript using existing patterns

**Tasks:**
1. Create new `client/src/game/` directory structure:
   ```
   client/src/game/
   ├── core/
   │   ├── engine.ts (Matter.js wrapper)
   │   ├── renderer.ts (Canvas 2D)
   │   └── loop.ts (game loop)
   ├── entities/
   │   ├── player.ts (Finn)
   │   ├── enemies/
   │   └── npcs/
   ├── systems/
   │   ├── collision.ts
   │   ├── ai.ts (Yuka)
   │   ├── warmth.ts
   │   ├── quest.ts
   │   └── trigger.ts
   ├── drawing/
   │   ├── characters/
   │   ├── environment/
   │   └── effects/
   ├── factories/
   │   ├── level-factory.ts (DDL → game objects)
   │   ├── npc-factory.ts
   │   ├── interaction-factory.ts
   │   └── trigger-factory.ts
   └── store.ts (Zustand)
   ```

2. Port Matter.js physics from POC to TypeScript
3. Port procedural Finn rendering to TypeScript
4. Set up Zustand store with TypeScript types

**Validation:**
- [ ] TypeScript compiles without errors
- [ ] Matter.js engine initializes
- [ ] Finn renders on canvas
- [ ] Game loop runs at 60fps

---

### Phase 2: DDL Loading & Factory Patterns (6-8 hours)

**Goal:** Load chapter manifests and build levels using factory patterns

**Tasks:**

#### 2.1 Level Factory
```typescript
// client/src/game/factories/level-factory.ts
import { loadChapterManifest } from '../data/chapter-loaders';
import type { ChapterManifest } from '../data/manifest-schemas';

export class LevelFactory {
  static buildLevel(chapterId: number, physics: PhysicsEngine): Level {
    const manifest = loadChapterManifest(chapterId);
    
    // Build platforms from segments
    const platforms = this.buildPlatforms(manifest.level.segments, physics);
    
    // Build walls/ceilings
    const walls = this.buildWalls(manifest.level.segments, physics);
    
    // Build checkpoints
    const checkpoints = this.buildCheckpoints(manifest.level.checkpoints);
    
    // Build interactions
    const interactions = this.buildInteractions(manifest.interactions, physics);
    
    return new Level({
      manifest,
      platforms,
      walls,
      checkpoints,
      interactions,
      bounds: manifest.level.bounds,
      biome: manifest.level.biome
    });
  }
  
  private static buildPlatforms(segments, physics) {
    const platforms = [];
    for (const segment of segments) {
      for (const platformDef of segment.platforms) {
        const platform = physics.createPlatform({
          x: platformDef.x,
          y: platformDef.y,
          width: platformDef.width,
          height: platformDef.height,
          type: platformDef.type,
          properties: platformDef.properties
        });
        platforms.push({
          body: platform,
          asset: platformDef.asset,
          type: platformDef.type
        });
      }
    }
    return platforms;
  }
  
  // ... more factory methods
}
```

#### 2.2 NPC Factory
```typescript
// client/src/game/factories/npc-factory.ts
export class NPCFactory {
  static createNPC(npcDef: ChapterNPC, physics: PhysicsEngine): NPC {
    const body = physics.createNPCBody(npcDef.position.x, npcDef.position.y);
    
    return new NPC({
      id: npcDef.id,
      characterId: npcDef.characterId,
      name: npcDef.name,
      role: npcDef.role,
      body,
      facing: npcDef.facing,
      behavior: npcDef.behavior,
      storyState: npcDef.storyState,
      interactions: npcDef.interactions
    });
  }
}
```

#### 2.3 Interaction Factory
```typescript
// client/src/game/factories/interaction-factory.ts
export class InteractionFactory {
  static createInteraction(def: ChapterInteraction): InteractionObject {
    switch (def.type) {
      case 'lantern':
        return new Lantern(def);
      case 'lever':
        return new Lever(def);
      case 'door':
        return new Door(def);
      case 'chest':
        return new Chest(def);
      case 'shrine':
        return new Shrine(def);
      // ... all interaction types from schema
    }
  }
}
```

#### 2.4 Trigger System
```typescript
// client/src/game/systems/trigger.ts
export class TriggerSystem {
  private triggers: Map<string, Trigger>;
  private firedTriggers: Set<string>;
  
  loadFromManifest(manifest: ChapterManifest) {
    for (const triggerDef of manifest.triggers) {
      const trigger = new Trigger({
        id: triggerDef.id,
        type: triggerDef.type,
        region: triggerDef.region,
        once: triggerDef.once,
        requires: triggerDef.requires,
        actions: triggerDef.actions
      });
      this.triggers.set(trigger.id, trigger);
    }
  }
  
  update(player: Player, gameState: GameState) {
    for (const [id, trigger] of this.triggers) {
      if (trigger.checkConditions(player, gameState, this.firedTriggers)) {
        this.executeTrigger(trigger);
        if (trigger.once) {
          this.firedTriggers.add(id);
        }
      }
    }
  }
  
  private executeTrigger(trigger: Trigger) {
    for (const action of trigger.actions) {
      this.executeAction(action);
    }
  }
  
  private executeAction(action: TriggerAction) {
    switch (action.type) {
      case 'spawn_enemies':
        // ... implementation
      case 'play_cinematic':
        // ... implementation
      case 'show_toast':
        // ... implementation
      // ... all 20+ action types from schema
    }
  }
}
```

**Validation:**
- [ ] Load chapter-0-the-calling.json successfully
- [ ] Build platforms from segments
- [ ] Create NPCs at correct positions
- [ ] Set up interactions (hearth, window, blade, door)
- [ ] Register triggers (chapter_start, approach_window, etc.)

---

### Phase 3: NPC & Quest Systems (6-8 hours)

**Goal:** Implement NPCs with story states and quest objectives

**Tasks:**

#### 3.1 NPC System
```typescript
// client/src/game/entities/npcs/NPC.ts
export class NPC {
  private currentState: string;
  private storyStates: Record<string, NPCState>;
  
  constructor(config: NPCConfig) {
    this.currentState = config.storyState.initialState;
    this.storyStates = config.storyState.states;
  }
  
  interact(player: Player, gameState: GameState) {
    const state = this.storyStates[this.currentState];
    if (!state.canInteract) return;
    
    const interaction = this.findMatchingInteraction(gameState);
    if (interaction) {
      this.performGesture(interaction.gesture);
      player.performGesture(interaction.finnResponse);
      this.executeActions(interaction.actions);
    }
  }
  
  performGesture(gesture: string) {
    // Wordless animation: nod, point, wave, bow, etc.
  }
  
  update(deltaTime: number) {
    const state = this.storyStates[this.currentState];
    this.playAnimation(state.animation);
    this.showExpression(state.expression);
  }
}
```

#### 3.2 Quest System
```typescript
// client/src/game/systems/quest.ts
export class QuestSystem {
  private activeQuests: Map<string, Quest>;
  
  loadFromManifest(manifest: ChapterManifest) {
    for (const questDef of manifest.quests) {
      const quest = new Quest({
        id: questDef.id,
        name: questDef.name,
        type: questDef.type,
        objectives: questDef.objectives,
        rewards: questDef.rewards
      });
      this.activeQuests.set(quest.id, quest);
    }
  }
  
  updateObjective(objectiveId: string, value: number | boolean) {
    for (const quest of this.activeQuests.values()) {
      const objective = quest.objectives.find(o => o.id === objectiveId);
      if (objective) {
        objective.progress = value;
        if (quest.isComplete()) {
          this.completeQuest(quest);
        }
      }
    }
  }
  
  completeQuest(quest: Quest) {
    this.giveRewards(quest.rewards);
    this.activeQuests.delete(quest.id);
    // Trigger completion events
  }
}
```

**Validation:**
- [ ] Mother Riverstone NPC in chapter 0 at position (300, 320)
- [ ] NPC story state changes from "worried" to "blessing_given"
- [ ] Quest "Answer the Call" with 3 objectives
- [ ] Objective completion detection
- [ ] Wordless gesture animations play

---

### Phase 4: Interaction & Environment Systems (4-6 hours)

**Goal:** Implement all interaction types and environment effects

**Tasks:**

#### 4.1 Interaction Base Class
```typescript
// client/src/game/entities/interactions/InteractionObject.ts
export abstract class InteractionObject {
  protected currentState: string;
  protected states: Record<string, InteractionState>;
  
  abstract interact(player: Player): void;
  abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void;
  
  changeState(newState: string) {
    this.currentState = newState;
    const state = this.states[newState];
    this.executeActions(state.actions);
  }
  
  protected executeActions(actions: TriggerAction[]) {
    // Execute all state transition actions
  }
}
```

#### 4.2 Specific Interactions
- Lantern (light/unlit states)
- Lever (up/down states)
- Door (closed/open/locked states)
- Chest (closed/open states)
- Bell (resting/ringing states)
- Shrine (hearth checkpoints)
- Sign (environmental storytelling)
- Pressure plate (triggers)
- Breakable objects
- Pushable objects

#### 4.3 Environment System
```typescript
// client/src/game/systems/environment.ts
export class EnvironmentSystem {
  private lighting: LightingConfig;
  private weather: WeatherConfig;
  private warmthDrain: number;
  private particles: ParticleEmitter[];
  
  loadFromManifest(manifest: ChapterManifest) {
    this.lighting = manifest.environment.lighting;
    this.weather = manifest.environment.weather;
    this.warmthDrain = manifest.environment.warmthDrain;
    this.particles = manifest.environment.particles.map(p => 
      new ParticleEmitter(p)
    );
  }
  
  update(deltaTime: number, player: Player, gameState: GameState) {
    this.updateLighting(gameState.warmth);
    this.updateWeather(deltaTime);
    this.drainWarmth(player, deltaTime);
    this.updateParticles(deltaTime);
  }
}
```

**Validation:**
- [ ] Cottage hearth interaction restores warmth
- [ ] Window interaction triggers distant bells sound
- [ ] Otterblade mount interaction with slow motion effect
- [ ] Door requires blade_taken trigger to open
- [ ] Ambient particles (dust, embers) render correctly

---

### Phase 5: Boss Fights & Encounters (4-6 hours)

**Goal:** Implement enemy encounters and boss fights

**Tasks:**

#### 5.1 Enemy Factory
```typescript
// client/src/game/factories/enemy-factory.ts
export class EnemyFactory {
  static createEnemy(encounterDef: ChapterEncounter): Enemy {
    const enemyType = loadEnemyType(encounterDef.enemyType);
    
    const enemy = new Enemy({
      type: encounterDef.enemyType,
      position: encounterDef.position,
      behavior: encounterDef.behavior,
      difficulty: encounterDef.difficulty,
      stats: enemyType.stats
    });
    
    this.setupAI(enemy, encounterDef.behavior);
    return enemy;
  }
  
  private static setupAI(enemy: Enemy, behavior: EncounterBehavior) {
    switch (behavior.type) {
      case 'patrol':
        enemy.setPatrolPath(behavior.patrolPath);
        break;
      case 'guard':
        enemy.setGuardPosition(behavior.guardRadius);
        break;
      case 'chase':
        enemy.setAggroRadius(behavior.aggroRadius);
        break;
    }
  }
}
```

#### 5.2 Boss System
```typescript
// client/src/game/entities/bosses/Boss.ts
export class Boss extends Enemy {
  private phases: BossPhase[];
  private currentPhase: number = 0;
  
  update(deltaTime: number) {
    super.update(deltaTime);
    this.checkPhaseTransition();
  }
  
  private checkPhaseTransition() {
    const healthPercent = this.health / this.maxHealth;
    const nextPhase = this.phases[this.currentPhase + 1];
    
    if (nextPhase && healthPercent <= nextPhase.healthThreshold) {
      this.enterPhase(this.currentPhase + 1);
    }
  }
  
  private enterPhase(phaseIndex: number) {
    this.currentPhase = phaseIndex;
    const phase = this.phases[phaseIndex];
    this.setBehavior(phase.behavior);
    this.spawnAdds(phase.adds);
  }
}
```

**Validation:**
- [ ] Chapter 2 boss (gatehouse) spawns correctly
- [ ] Chapter 8 Zephyros boss with multiple phases
- [ ] Enemy patrol behaviors work
- [ ] Guard and chase behaviors trigger correctly

---

### Phase 6: Cinematics & Story Beats (3-4 hours)

**Goal:** Implement wordless storytelling system

**Tasks:**

#### 6.1 Cinematic System
```typescript
// client/src/game/systems/cinematic.ts
export class CinematicSystem {
  private currentCinematic: Cinematic | null = null;
  
  playCinematic(cinematicId: string) {
    const cinematicData = loadCinematic(cinematicId);
    this.currentCinematic = new Cinematic(cinematicData);
    this.currentCinematic.play();
  }
  
  update(deltaTime: number) {
    if (this.currentCinematic) {
      this.currentCinematic.update(deltaTime);
      if (this.currentCinematic.isComplete()) {
        this.currentCinematic = null;
      }
    }
  }
}
```

#### 6.2 Story Beat System
```typescript
// client/src/game/systems/storybeat.ts
export class StoryBeatSystem {
  private storyBeats: Map<string, StoryBeat>;
  private triggeredBeats: Set<string>;
  
  loadFromManifest(manifest: ChapterManifest) {
    for (const beat of manifest.narrative.storyBeats) {
      this.storyBeats.set(beat.id, new StoryBeat(beat));
    }
  }
  
  triggerBeat(beatId: string, player: Player) {
    if (this.triggeredBeats.has(beatId)) return;
    
    const beat = this.storyBeats.get(beatId);
    if (beat) {
      player.showExpression(beat.expression);
      // Play moment animation/camera work
      this.triggeredBeats.add(beatId);
    }
  }
}
```

**Validation:**
- [ ] Chapter 0 story beats trigger (awakening, the_sign, fathers_blade, etc.)
- [ ] Finn expressions change (wonder, fear, sorrow, determination, resolve)
- [ ] Intro cinematic plays on chapter start
- [ ] Outro cinematic plays on chapter complete

---

### Phase 7: Integration & Testing (6-8 hours)

**Goal:** Integrate all systems and validate with automated tests

**Tasks:**

1. Wire all systems together in main game class
2. Test chapter 0 complete playthrough
3. Test chapter 1-9 basic loading
4. Fix integration bugs
5. Run automated playthrough tests
6. Capture MP4 videos of each chapter

**Validation:**
- [ ] All 10 chapters load without errors
- [ ] Chapter 0 fully playable (cottage → threshold)
- [ ] NPCs behave correctly
- [ ] Quests track properly
- [ ] Triggers fire as expected
- [ ] Interactions work
- [ ] Complete journey test passes
- [ ] Video captures show proper gameplay

---

## Timeline Estimate

| Phase | Hours | Description |
|-------|-------|-------------|
| 1. TypeScript Foundation | 4-6 | Setup structure, port core systems |
| 2. DDL & Factories | 6-8 | Load manifests, build levels |
| 3. NPCs & Quests | 6-8 | Story states, objectives |
| 4. Interactions & Environment | 4-6 | All interaction types, lighting, particles |
| 5. Bosses & Encounters | 4-6 | Enemy AI, boss fights |
| 6. Cinematics & Story | 3-4 | Wordless storytelling |
| 7. Integration & Testing | 6-8 | Wire together, validate |
| **Total** | **33-46 hours** | ~1-2 weeks full-time |

---

## Success Criteria

### Technical
- [ ] All 10 chapter manifests load successfully
- [ ] Factory patterns build game objects from DDL
- [ ] Zod validation passes for all schemas
- [ ] TypeScript compiles with no errors
- [ ] 60fps maintained with all systems

### Gameplay
- [ ] Chapter 0 fully playable with all content:
  - Mother Riverstone NPC with blessing
  - Otterblade quest with 3 objectives
  - Hearth, window, blade, door interactions
  - All story beats trigger correctly
  - Cinematic on completion
- [ ] All chapters loadable
- [ ] Quest system tracks objectives
- [ ] Trigger system fires events
- [ ] NPC story states change

### Testing
- [ ] Complete journey test passes
- [ ] All 10 chapter playthroughs work
- [ ] MP4 videos captured
- [ ] No console errors

---

## What to Keep from Current Implementation

The current simplified game has value:
- **Physics engine wrapper** - Matter.js setup is solid
- **Game loop** - 60fps loop works well
- **Procedural Finn rendering** - Good starting point (needs TypeScript)
- **HUD components** - Basic UI structure
- **Camera follow** - Camera system works

These can be ported to TypeScript and integrated with the DDL system.

---

## Next Steps

1. **Acknowledge** - Document the architectural misalignment (DONE)
2. **Study** - Review all existing loaders and schemas (IN PROGRESS)
3. **Plan** - Create detailed rebuild plan (THIS DOCUMENT)
4. **Execute** - Rebuild game using factory patterns (NEXT)
5. **Validate** - Test with automated playthroughs
6. **Deploy** - GitHub Pages deployment

---

**This rebuild aligns the implementation with the sophisticated DDL architecture and factory patterns already designed in the codebase.**
