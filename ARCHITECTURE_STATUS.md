# Otterblade Odyssey - Architecture Status & Implementation Plan

**Date:** 2026-01-02  
**Session:** Copilot taking total ownership

## 🎯 THE VISION

**JSON DDL-Driven Game** where EVERYTHING from start to finish is:
1. Defined in JSON manifests (7000 lines across 10 chapters)
2. Generated idempotently (GenAI for sprites/videos, procedural for gameplay)
3. Validated deterministically (YUKA AI player navigates, proves completeness)

## 📊 CURRENT STATE ANALYSIS

### ✅ What EXISTS and WORKS

**1. JSON DDL System** - `client/src/data/manifests/`
- ✅ 10 complete chapter manifests (492-949 lines each)
- ✅ JSON schemas with validation (chapter, procedural, sequences, interactions)
- ✅ Typed loaders with Zod validation (`client/src/game/data/`)
- ✅ Manifest includes: quests, NPCs, encounters, triggers, level geometry, media references

**2. Asset Generation System** - `packages/dev-tools/`
- ✅ OpenAI sprite generation (`generate-sprites.ts`)
- ✅ Google Imagen cinematics (`generate-cinematic.ts`)
- ✅ Audio generation (`generate-sfx.ts`)
- ✅ Manifest-driven prompts (sprites.json, cinematics.json, chapter-plates.json)
- ⚠️ Approvals system exists but empty (`approvals.json`)

**3. Physics & Rendering** - `client/src/game/`
- ✅ Rapier 2D physics working (`Physics2D.tsx`)
- ✅ React Three Fiber rendering (`Game.tsx`)
- ✅ Basic platform generation (`Level.tsx`)
- ✅ ECS architecture with Miniplex (`ecs/world.ts`)
- ✅ Zustand state management (`store.ts`)

**4. Testing Infrastructure**
- ✅ 161 unit tests passing (data loaders, ECS, utils)
- ✅ Playwright configured with MCP integration
- ✅ Test API for E2E automation (`test-api.ts`)
- ✅ Factory pattern for test generation (`tests/factories/`)

### ❌ What's MISSING or BROKEN

**1. Quest System** - DOES NOT EXIST
- ❌ No QuestManager to execute quest objectives from manifests
- ❌ Manifest defines objectives like "interact with otterblade_mount" but NO code handles it
- ❌ No trigger system to connect player actions → quest progression
- ❌ No toast/notification system for quest updates

**2. Level Instantiation** - INCOMPLETE
- ⚠️ `Level.tsx` has procedural platform generation (hash-based) 
- ❌ Does NOT read `level.segments` from chapter manifests
- ❌ Does NOT instantiate NPCs from manifest
- ❌ Does NOT create triggers/interaction zones
- ❌ No boss spawning system

**3. YUKA AI Integration** - NOT IMPLEMENTED
- ❌ `yuka` package installed but ZERO usage in codebase
- ❌ No enemy AI navigation
- ❌ No pathfinding for AI player in E2E tests
- ❌ POC (`pocs/otterblade_odyssey.html`) has enemy AI but not ported

**4. Procedural Rendering System** - PARTIALLY DEFINED
- ✅ Schema exists (`procedural-schema.json` - 425 lines)
- ❌ No renderer that executes `drawInstruction` arrays
- ❌ PlayerSprite still using placeholder (just fixed to procedural but needs manifest integration)
- ❌ No system to load procedural definitions from manifests
- ❌ Chapter plates, cinematics still reference deleted PNG/MP4 files

**5. Asset Management** - BROKEN
- ❌ Game imports deleted PNG/MP4 assets (Claude removed them)
- ❌ ChapterPlate.tsx imports 10 PNGs that don't exist
- ❌ CinematicPlayer.tsx imports MP4s that don't exist
- ❌ No fallback to procedural rendering when assets missing
- ❌ No asset loader that handles BOTH generated AND procedural

## 🏗️ IMPLEMENTATION PLAN

### Phase 1: Universal Asset Loading System (CRITICAL)

**Goal:** Handle BOTH GenAI-generated assets AND procedural rendering from manifests

**Files to Create:**
```
client/src/game/systems/
  ├── asset-loader.ts          # Universal asset loading (checks generated, falls back to procedural)
  ├── procedural-renderer.ts   # Executes drawInstruction arrays from manifest
  └── asset-manager.ts         # Caches, tracks loading state
```

**Implementation:**
1. Create `AssetLoader` that reads manifest and tries:
   - First: Load generated asset from `attached_assets/` (if exists)
   - Fallback: Use procedural definition from manifest
   - Error: Show placeholder with clear error message

2. Create `ProceduralRenderer` that:
   - Takes `proceduralShape` from manifest
   - Executes `drawInstruction` array on canvas
   - Returns THREE.CanvasTexture for use in game

3. Integrate with existing components:
   - `PlayerSprite.tsx` → use AssetLoader
   - `ChapterPlate.tsx` → use AssetLoader
   - `CinematicPlayer.tsx` → use AssetLoader

### Phase 2: Level Instantiation from Manifests

**Goal:** Levels are 100% defined by JSON, not hard-coded

**Files to Modify:**
```
client/src/game/Level.tsx     # Replace procedural with manifest-driven
client/src/game/systems/
  └── level-instantiator.ts   # Reads chapter manifest, creates world
```

**Implementation:**
1. Read `chapter.level.segments` from manifest
2. For each segment:
   - Create platforms from `platforms` array
   - Create walls from `walls` array  
   - Set up `transitions` (doors, exits)
3. Spawn NPCs from `chapter.npcs`
4. Create trigger zones from `chapter.triggers`
5. Spawn enemies from `chapter.encounters`

### Phase 3: Quest System

**Goal:** Quests from manifests are playable and track progress

**Files to Create:**
```
client/src/game/systems/
  ├── quest-manager.ts         # Tracks active quests, objectives
  ├── trigger-system.ts        # Handles trigger activation
  └── interaction-system.ts    # Player interactions with world
```

**Implementation:**
1. `QuestManager` loads quests from manifest
2. Tracks objective completion
3. `TriggerSystem` watches for:
   - Player entering regions
   - Player interacting with objects/NPCs
   - Enemies defeated
   - Items collected
4. Updates quest state, shows toasts
5. Unlocks chapter transitions on completion

### Phase 4: YUKA AI Integration

**Goal:** Enemies navigate intelligently, E2E tests use AI player

**Files to Create:**
```
client/src/game/systems/
  ├── yuka-manager.ts          # YUKA EntityManager wrapper
  ├── enemy-ai.ts              # Enemy FSM states
  └── navigation-graph.ts      # Build nav graph from level
```

**Files to Modify:**
```
tests/factories/ai-player.ts   # Use YUKA for test navigation
e2e/automated-playthroughs/    # Enable deterministic tests
```

**Implementation:**
1. Create navigation graph from level platforms
2. Enemy entities with FSM (idle, patrol, chase, attack)
3. Steering behaviors for movement
4. AI player for E2E tests uses same pathfinding
5. Validates all 10 chapters are completable

### Phase 5: Complete Journey Validation

**Goal:** Prove the game works start-to-finish with video evidence

**Files to Run:**
```bash
pnpm exec playwright install chromium
pnpm test:journey:mcp  # All 10 chapters with video
```

**Success Criteria:**
- All chapter quests complete
- AI player reaches all objectives
- Videos show warm, Redwall aesthetic
- No crashes, no blocking bugs
- Story progression coherent

## 📋 IMMEDIATE NEXT STEPS

### Step 1: Fix Asset Loading (TODAY)
1. Create universal asset loader with procedural fallback
2. Update PlayerSprite, ChapterPlate, CinematicPlayer
3. Remove broken PNG/MP4 imports
4. Test build succeeds

### Step 2: Asset Generation (TODAY)
1. Run asset generators for critical assets:
   ```bash
   pnpm --filter @otterblade/dev-tools generate:sprites
   pnpm --filter @otterblade/dev-tools generate:chapter-plates
   ```
2. Verify approval workflow
3. Test asset loading with real generated assets

### Step 3: Level Instantiation (TOMORROW)
1. Create level-instantiator that reads manifest
2. Replace hard-coded platforms with manifest data
3. Test Chapter 0 loads correctly
4. Validate all 10 chapters instantiate

### Step 4: Quest System (TOMORROW)
1. Create quest manager
2. Create trigger system
3. Make Chapter 0 quest completable
4. Test toast notifications work

### Step 5: YUKA AI (NEXT)
1. Port enemy AI from POC
2. Create navigation graphs
3. Implement enemy FSM
4. Test AI player navigation

### Step 6: Complete Validation (FINAL)
1. Run all E2E tests
2. Capture video proof
3. Validate story coherence
4. Security scan
5. Code review

## 🎮 THE ENDGAME

When this is complete:
- ✅ Game is 100% DDL-driven (no hard-coded content)
- ✅ Assets are generated idempotently (reproducible)
- ✅ Levels instantiate from manifests
- ✅ Quests execute from definitions
- ✅ AI navigation works across all chapters
- ✅ E2E tests prove completeness with video
- ✅ Deployment to GitHub Pages works
- ✅ Community can extend game via JSON

**This is the vision. This is what we're building. This is TOTAL OWNERSHIP.**
