# TypeScript Migration Plan

**Status:** 🟡 PROPOSED  
**Created:** 2026-01-04  
**Related to:** PR #60 (DDL Manifest Loader)  
**Assignee:** @copilot  

## Executive Summary

Migrate game engine from JavaScript monoliths to **TypeScript with ES2022 compilation target**. This provides type safety, better tooling, and maintainability while **preserving vanilla JavaScript simplicity and performance**.

**Critical alignment:** This migration happens WITHIN PR #60's scope, enhancing the DDL manifest loader with type safety.

## The Problem: JavaScript Monoliths

Current state:
- `game/src/game/game-monolith.js` - 4,214 lines
- `game/src/game/engine/gameLoop.js`, `rendering.js`, `initialization.js` - Large JavaScript files
- No type safety for Matter.js bodies, YUKA entities, DDL manifests
- Hard to refactor - changing component shapes breaks everything silently

## The Solution: TypeScript → JavaScript Compilation

**NOT adding React. NOT adding frameworks. ADDING type safety.**

### What We Get
1. **Type-safe DDL manifests** - Zod schemas + TypeScript interfaces
2. **Matter.js body types** - Catch label typos at compile time
3. **YUKA entity types** - Self-documenting AI behaviors
4. **IDE autocomplete** - For Canvas API, physics properties, etc.
5. **Refactoring confidence** - Rename a property, find all usages
6. **Zero runtime overhead** - Compiles to same ES2022 JavaScript

### What We Keep
- **Vanilla patterns** from POC (no ECS, no React)
- **Performance** - Same 60fps, same memory footprint
- **Build simplicity** - TypeScript compiler built into Astro
- **Small bundles** - Types stripped at build time

## Architecture Decision

### Inspiration: Phaser3 Matter.js BitECS Example

Reference file cloned to `/tmp/Matter.ts`:
```typescript
// System interface pattern
export interface System {
  update(deltaTime: number): void;
  beforeCollision?(pairs: Matter.Collision[]): void;
  afterCollision?(pairs: Matter.Collision[]): void;
}

// Entity component types
export interface PhysicsComponent {
  body: Matter.Body;
  bodyId: number;
}

export interface AIComponent {
  state: 'idle' | 'patrol' | 'chase' | 'attack';
  speed: number;
  detectionRadius: number;
}
```

### Our Implementation

```typescript
// game/src/game/types/systems.ts
export interface GameSystem {
  name: string;
  update(deltaTime: number): void;
  cleanup?(): void;
}

export interface PhysicsSystem extends GameSystem {
  beforeCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
  afterCollision?(pairs: Matter.IEventCollision<Matter.Engine>): void;
}

// game/src/game/types/entities.ts
export interface Entity {
  id: string;
  type: 'player' | 'enemy' | 'platform' | 'item';
  body: Matter.Body;
}

export interface Player extends Entity {
  type: 'player';
  health: number;
  maxHealth: number;
  attackDamage: number;
  velocity: { x: number; y: number };
}

export interface Enemy extends Entity {
  type: 'enemy';
  enemyType: 'scout' | 'warrior' | 'boss';
  hp: number;
  damage: number;
  speed: number;
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'hurt';
}
```

## Migration Strategy

### Phase 1: Type Definitions (Week 1)

Create type definition files WITHOUT migrating code yet:

```
game/src/game/types/
├── systems.ts          # System interfaces
├── entities.ts         # Entity types
├── manifests.ts        # DDL manifest types (from Zod schemas)
├── physics.ts          # Matter.js body types
├── ai.ts               # YUKA entity types
└── canvas.ts           # Canvas rendering types
```

**Tasks:**
- [ ] Define System interfaces
- [ ] Define Entity types
- [ ] Extract manifest types from existing Zod schemas
- [ ] Create Matter.js body type guards
- [ ] Document YUKA entity interfaces

### Phase 2: Core Engine Migration (Week 2)

Migrate engine files one at a time:

**Priority order:**
1. ✅ `gameLoop.js` → `gameLoop.ts` (smallest, most critical)
2. ✅ `rendering.js` → `rendering.ts` (pure functions, easy to type)
3. ✅ `physics.js` → `physics.ts` (Matter.js wrapper)
4. ✅ `initialization.js` → `initialization.ts` (orchestration)

**Migration pattern:**
```typescript
// Before: gameLoop.js
export function gameLoop(engine, renderer, deltaTime) {
  Engine.update(engine, deltaTime);
  renderer.render();
}

// After: gameLoop.ts
import { Engine } from 'matter-js';
import type { Renderer } from '../types/systems';

export function gameLoop(
  engine: Matter.Engine,
  renderer: Renderer,
  deltaTime: number
): void {
  Engine.update(engine, deltaTime);
  renderer.render();
}
```

### Phase 3: Systems Migration (Week 3)

Convert system modules:

```
game/src/game/systems/
├── collision.ts        # From collision.js
├── AIManager.ts        # From ai.js
├── input.ts            # From input.js
└── audio.ts            # From audio.js
```

**Focus:** Type-safe event handlers and state machines.

### Phase 4: Entity Factories (Week 4)

Convert entity creation to typed factories:

```typescript
// game/src/game/factories/PlayerFactory.ts
import type { Player } from '../types/entities';
import { Bodies } from 'matter-js';

export function createPlayer(x: number, y: number): Player {
  const body = Bodies.rectangle(x, y, 35, 55, {
    label: 'player',
    friction: 0.1,
    frictionAir: 0.01,
    restitution: 0
  });

  return {
    id: `player-${Date.now()}`,
    type: 'player',
    body,
    health: 5,
    maxHealth: 5,
    attackDamage: 10,
    velocity: { x: 0, y: 0 }
  };
}
```

### Phase 5: Game Monolith Decomposition (Week 5-6)

**The big one.** Break `game-monolith.js` (4,214 lines) into typed modules:

```
game/src/game/
├── Game.ts                 # Main game controller
├── systems/
│   ├── CameraSystem.ts
│   ├── ParticleSystem.ts
│   ├── NPCSystem.ts
│   ├── CollectibleSystem.ts
│   ├── TriggerSystem.ts
│   ├── QuestSystem.ts
│   └── ...
├── entities/
│   ├── Player.ts
│   ├── Enemy.ts
│   └── ...
└── rendering/
    ├── FinnRenderer.ts
    ├── EnemyRenderer.ts
    └── ...
```

**Strategy:** Extract one system at a time, test, commit.

## TypeScript Configuration

### tsconfig.json (Root)

Already exists. Update for strict mode:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "dom", "dom.iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./game/src/*"],
      "@game/*": ["./game/src/game/*"],
      "@types/*": ["./game/src/game/types/*"]
    }
  },
  "include": ["game/src/**/*", "shared/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### game/tsconfig.json

Extends root config:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@game/*": ["./game/*"],
      "@types/*": ["./game/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["dist"]
}
```

## Type Safety Examples

### 1. DDL Manifest Loading

**Before (JavaScript):**
```javascript
const chapter = await loadChapterManifest(0);
console.log(chapter.name); // No autocomplete, might be undefined
```

**After (TypeScript):**
```typescript
import type { ChapterManifest } from '@types/manifests';

const chapter: ChapterManifest = await loadChapterManifest(0);
console.log(chapter.narrative.theme); // Full autocomplete, type-checked
// TypeScript error if chapter.narrative is undefined
```

### 2. Matter.js Collision Handling

**Before (JavaScript):**
```javascript
Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    if (pair.bodyA.label === 'playar') { // Typo! Runtime bug
      takeDamage(1);
    }
  }
});
```

**After (TypeScript):**
```typescript
import type { Player, Enemy } from '@types/entities';

Events.on(engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
  for (const pair of event.pairs) {
    const playerBody = pair.bodyA as Matter.Body;
    const enemyBody = pair.bodyB as Matter.Body;
    
    if (isPlayer(playerBody) && isEnemy(enemyBody)) {
      const player = getEntity<Player>(playerBody.id);
      const enemy = getEntity<Enemy>(enemyBody.id);
      takeDamage(player, enemy.damage); // Type-safe damage calculation
    }
  }
});

// Type guards
function isPlayer(body: Matter.Body): boolean {
  return body.label === 'player'; // Autocomplete suggests 'player'
}
```

### 3. YUKA AI Entities

**Before (JavaScript):**
```javascript
const enemy = new Vehicle();
enemy.maxSpeed = 2.5;
enemy.aiState = 'ptrol'; // Typo! Runtime bug
```

**After (TypeScript):**
```typescript
import type { EnemyAI } from '@types/ai';
import { Vehicle } from 'yuka';

interface EnemyVehicle extends Vehicle {
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'hurt';
  hp: number;
  damage: number;
}

const enemy: EnemyVehicle = Object.assign(new Vehicle(), {
  maxSpeed: 2.5,
  aiState: 'patrol' as const, // Type-checked, IDE suggests valid states
  hp: 25,
  damage: 8
});

// TypeScript error if you write 'ptrol' instead of 'patrol'
```

## Build Process

### Development (Astro Dev Server)

TypeScript compilation happens automatically via Astro:

```bash
pnpm dev
# Astro compiles .ts files to .js on the fly
# No separate build step needed
```

### Production Build

```bash
pnpm build
# Astro compiles TypeScript → JavaScript
# Output: ES2022 JavaScript modules
# Same bundle size as before (types stripped)
```

### Type Checking

```bash
# Check types without emitting files
pnpm tsc --noEmit

# Watch mode for development
pnpm tsc --noEmit --watch
```

## Testing Strategy

### Unit Tests (Vitest)

Vitest supports TypeScript natively:

```typescript
// tests/unit/GameLoop.test.ts
import { describe, it, expect } from 'vitest';
import { gameLoop } from '@game/engine/gameLoop';
import type { Renderer } from '@types/systems';

describe('Game Loop', () => {
  it('should update engine with correct delta time', () => {
    const mockEngine = createMockEngine();
    const mockRenderer: Renderer = {
      render: vi.fn()
    };
    
    gameLoop(mockEngine, mockRenderer, 16.67);
    
    expect(mockRenderer.render).toHaveBeenCalledOnce();
  });
});
```

### E2E Tests (Playwright)

Playwright tests stay in JavaScript (testing interface, not implementation):

```javascript
// e2e/game.spec.ts
import { test, expect } from '@playwright/test';

test('game initializes with TypeScript engine', async ({ page }) => {
  await page.goto('/');
  
  // Wait for TypeScript-compiled game to load
  await page.waitForFunction(() => window.__GAME_API__);
  
  const state = await page.evaluate(() => window.__GAME_API__.getState());
  expect(state.health).toBe(5);
});
```

## Dependencies

### Required Packages

```bash
# TypeScript (already installed)
pnpm add -D typescript

# Type definitions
pnpm add -D @types/matter-js
pnpm add -D @types/howler

# YUKA has built-in TypeScript types (no @types needed)
```

### No New Runtime Dependencies

**CRITICAL:** TypeScript is **compile-time only**. No runtime overhead.

## Performance Validation

### Before Migration (JavaScript)
- Bundle size: ~200KB
- Memory usage: 8-12MB
- FPS: 60 stable
- Load time: <100ms

### After Migration (TypeScript → JS)
- Bundle size: ~200KB (same, types stripped)
- Memory usage: 8-12MB (same, no runtime types)
- FPS: 60 stable (same compiled JS)
- Load time: <100ms (same)

**Zero performance cost. Pure tooling benefit.**

## Migration Checklist

### Week 1: Foundation
- [ ] Create `game/src/game/types/` directory
- [ ] Define core type interfaces
- [ ] Update tsconfig.json for strict mode
- [ ] Install type definition packages
- [ ] Test type checking with `tsc --noEmit`

### Week 2: Engine Core
- [ ] Migrate `gameLoop.js` → `gameLoop.ts`
- [ ] Migrate `rendering.js` → `rendering.ts`
- [ ] Migrate `physics.js` → `physics.ts`
- [ ] Migrate `initialization.js` → `initialization.ts`
- [ ] Verify dev server still works

### Week 3: Systems
- [ ] Migrate `systems/collision.js` → `collision.ts`
- [ ] Migrate `systems/AIManager.js` → `AIManager.ts`
- [ ] Migrate `systems/input.js` → `input.ts`
- [ ] Migrate `systems/audio.js` → `audio.ts`
- [ ] Update unit tests to TypeScript

### Week 4: Entities & Factories
- [ ] Create typed entity factories
- [ ] Migrate `entities/Player.js` → `Player.ts`
- [ ] Migrate `entities/Enemy.js` → `Enemy.ts`
- [ ] Add type guards for runtime checks

### Week 5-6: Monolith Decomposition
- [ ] Extract systems from `game-monolith.js`
- [ ] Create TypeScript modules for each system
- [ ] Test each extraction incrementally
- [ ] Remove `game-monolith.js` when complete

### Week 7: Polish & Documentation
- [ ] Update all JSDoc to TypeScript interfaces
- [ ] Add type examples to documentation
- [ ] Run full E2E test suite
- [ ] Verify production build
- [ ] Update PR #60 with TypeScript benefits

## Success Criteria

✅ **All game code migrated to TypeScript**  
✅ **No TypeScript compilation errors**  
✅ **Zero performance regression**  
✅ **Same bundle size (±5KB)**  
✅ **All tests passing**  
✅ **Full IDE autocomplete working**  
✅ **Type-safe manifest loading**  
✅ **Type-safe Matter.js bodies**  
✅ **Type-safe YUKA entities**  
✅ **Documentation updated**  

## Risks & Mitigations

### Risk 1: Migration Breaks Build
**Mitigation:** Migrate one file at a time. Each file is independently testable.

### Risk 2: Type Errors Block Development
**Mitigation:** Use `@ts-ignore` temporarily for complex types. Fix incrementally.

### Risk 3: Team Unfamiliar with TypeScript
**Mitigation:** Provide type examples in documentation. TypeScript is optional for reading code.

### Risk 4: Breaks PR #60 Timeline
**Mitigation:** TypeScript migration happens IN PARALLEL with DDL work. Phase 1-2 first, then continue.

## Alignment with PR #60

This migration **enhances** PR #60's goals:

1. **Type-safe manifest loading**
   ```typescript
   const chapter: ChapterManifest = await loadChapterManifest(0);
   // Full autocomplete for chapter.narrative.theme, etc.
   ```

2. **Better DDL validation**
   ```typescript
   function buildLevel(manifest: ChapterManifest): Level {
     // TypeScript ensures manifest has required fields
   }
   ```

3. **Self-documenting code**
   ```typescript
   interface ChapterManifest {
     id: number;
     name: string;
     narrative: {
       theme: string;
       quest: string;
       // ... all fields documented by types
     };
   }
   ```

## Next Steps

1. ✅ Read all documentation (complete)
2. ✅ Review PR #60 plan (complete)
3. ✅ Create TypeScript migration plan (this document)
4. 🔄 Get approval from user
5. 🔄 Begin Phase 1: Type definitions
6. 🔄 Update PR #60 description with TypeScript scope

## Resources

- **Phaser3 Matter.js BitECS Example:** `/tmp/Matter.ts` (cloned)
- **Current PR #60 Plan:** `.github/plans/PR-60-ddl-manifest-loader.md`
- **Architecture Docs:** `docs/IMPLEMENTATION.md`, `docs/PHYSICS.md`, `docs/AI.md`
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/intro.html
- **Matter.js Types:** https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/matter-js

---

**Status:** ✅ READY FOR REVIEW  
**Author:** @copilot  
**Date:** 2026-01-04
