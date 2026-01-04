# Phase 6: game-monolith.js Decomposition Strategy

## Current State

**game-monolith.js**: 4,611 lines containing:
- Physics engine creation
- Player controller
- Audio manager  
- Input manager
- AI manager
- Game loop
- Rendering functions
- Entity factories
- Chapter initialization

## Already Migrated to TypeScript

The following have been extracted and migrated:

### Core Engine (Phase 3)
- ✅ `gameLoop.ts` - Game loop controller
- ✅ `rendering.ts` - Scene rendering
- ✅ `PhysicsManager.ts` - Physics engine and body creation
- ✅ `matter-wrapper.ts` - Matter.js wrapper

### Systems (Phase 4)
- ✅ `InputManager.ts` - Input handling
- ✅ `AudioManager.ts` - Audio system
- ✅ `AIManager.ts` - YUKA AI system
- ✅ `collision.ts` - Collision handlers

### Factories (Phase 5)
- ✅ `enemy-factory.ts` - Enemy creation
- ✅ `npc-factory.ts` - NPC creation
- ✅ `interaction-factory.ts` - Interaction creation
- ✅ `level-factory.ts` - Level building

## Remaining in Monolith

### 1. PlayerController Class
**Location**: Lines 164-301 in game-monolith.js  
**Status**: Needs extraction to `game/src/game/player/PlayerController.ts`
**Dependencies**: Matter.js, physics constants

### 2. Camera Class
**Location**: Lines 700-738 in game-monolith.js  
**Status**: Needs extraction to `game/src/game/engine/Camera.ts`
**Dependencies**: None (pure math)

### 3. Rendering Functions
**Locations**: Lines 739-1277 in game-monolith.js  
**Functions**: `renderFinn()`, `renderEnemy()`, `renderPlatform()`, `renderShard()`
**Status**: Need extraction to `game/src/game/rendering/` directory
**Dependencies**: Canvas 2D API

### 4. Chapter Initialization
**Location**: Lines 496-583 in game-monolith.js  
**Function**: `initializeChapter()`
**Status**: Needs extraction to `game/src/game/initialization/chapter-loader.ts`
**Dependencies**: All factories, physics, AI

### 5. Game Initialization
**Location**: Lines 16-73 in game-monolith.js  
**Function**: `initializeGame()`
**Status**: Main entry point - can stay or move to `game/src/game/initialization/game-init.ts`
**Dependencies**: Everything

## Phase 6 Migration Strategy

### Step 1: Extract PlayerController ✅ (Partially Done)
Create `game/src/game/player/PlayerController.ts`:
```typescript
import type * as Matter from 'matter-js';
import type { InputSystem } from '../types/systems';

export class PlayerController {
  body: Matter.Body;
  
  constructor(body: Matter.Body) {
    this.body = body;
  }
  
  update(controls: any, deltaTime: number): void {
    // Movement logic
  }
  
  takeDamage(amount: number, knockback?: { x: number; y: number }): void {
    // Damage logic
  }
}
```

### Step 2: Extract Camera ✅ (Partially Done)
Create `game/src/game/engine/Camera.ts`:
```typescript
export class Camera {
  x: number = 0;
  y: number = 0;
  
  follow(target: { x: number; y: number }, smoothing: number = 0.1): void {
    // Camera following logic
  }
}
```

### Step 3: Extract Rendering Functions
Create `game/src/game/rendering/` directory:
- `finn.ts` - Procedural Finn rendering
- `enemies.ts` - Enemy rendering (already exists)
- `platforms.ts` - Platform rendering
- `items.ts` - Item rendering

### Step 4: Extract Chapter Initialization
Create `game/src/game/initialization/chapter-loader.ts`:
```typescript
import type { ChapterManifest } from '../types/manifests';
import type * as Matter from 'matter-js';

export function initializeChapter(
  chapterId: number,
  manifest: ChapterManifest,
  engine: Matter.Engine,
  gameState: any
): ChapterData {
  // Chapter initialization logic
}
```

### Step 5: Update game-monolith.js to Import Modules
Replace implementations with imports:
```javascript
// Before: 4,611 lines of implementations
// After: ~100 lines of imports and initialization

import { createPhysicsEngine, createFinnBody } from './physics/PhysicsManager';
import { PlayerController } from './player/PlayerController';
import { AudioManager } from './systems/AudioManager';
import { InputManager } from './systems/InputManager';
import { AIManager } from './systems/AIManager';
import { createGameLoop } from './engine/gameLoop';
import { Camera } from './engine/Camera';
import { initializeChapter } from './initialization/chapter-loader';

// Only keep main initialization function
export async function initializeGame() {
  // Orchestrate initialization using imported modules
}
```

## Expected Outcome

After Phase 6:
- **game-monolith.js**: Reduced to ~100-200 lines (orchestration only)
- **Modular TypeScript files**: ~4,500 lines distributed across focused modules
- **Type safety**: Full type checking across entire codebase
- **Maintainability**: Each system in its own file
- **Testing**: Individual modules can be tested in isolation

## Implementation Priority

1. **High Priority**: PlayerController, Camera (frequently modified)
2. **Medium Priority**: Rendering functions (stable, but large)
3. **Low Priority**: Chapter initialization (orchestration, rarely changes)

## Benefits

- ✅ Type safety across entire game engine
- ✅ Better code organization
- ✅ Easier testing (mock individual systems)
- ✅ Improved IDE support
- ✅ Faster compilation (only changed files recompile)
- ✅ Clearer dependencies
- ✅ No runtime overhead (types stripped at build)

## Validation

After each extraction:
1. Run `pnpm run build` - Must succeed
2. Verify bundle size unchanged
3. Test game initialization
4. Verify no runtime errors

## Notes

- Keep game-monolith.js as entry point for compatibility
- Gradually replace implementations with imports
- Test after each extraction
- Maintain backward compatibility
- No breaking changes to public API
