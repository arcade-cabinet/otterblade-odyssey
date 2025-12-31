# AI Agent Quality Standards for Otterblade Odyssey

This document defines **mandatory** code quality standards for all AI agents working on this project.
These standards must be enforced rigorously to prevent technical debt accumulation.

**Repository**: `github.com/jbdevprimary/otterblade-odyssey`

---

## Core Principles

1. **No Monoliths**: Files must be modular and focused. Max ~300 lines per file.
2. **No Duplicates**: Refactor, don't duplicate. Search before creating.
3. **Clean As You Go**: Remove obsolete code immediately when refactoring.
4. **Test-Driven**: Write tests for new functionality.
5. **Document**: All exports must have JSDoc comments.

---

## Technology Stack (Updated)

| Layer | Technology | Notes |
|-------|------------|-------|
| Rendering | @react-three/fiber | Orthographic 2D mode |
| Physics | @dimforge/rapier2d-compat | 2D physics only |
| Entity Management | Miniplex + miniplex-react | Resources for state |
| State | Zustand | Gameplay state |
| Styling | Tailwind CSS v4 | HUD/UI only |
| UI Components | shadcn/ui + Radix | Menus, dialogs |
| Package Manager | **pnpm** (never npm/yarn) | |
| Linting | Biome | Strict mode |

**Removed**: @react-three/rapier, @jbcom/strata (3D not needed for 2D side-scroller)

---

## File Structure Standards

### Maximum File Sizes
| Type | Max Lines | Action if Exceeded |
|------|-----------|-------------------|
| Component | 200 | Split into subcomponents |
| Utility | 150 | Split by domain |
| System | 300 | Split by responsibility |
| Constants | 100 | Move to JSON data files |

### Directory Responsibilities
```
client/src/
├── data/               # JSON content files ONLY
│   ├── chapters.json   # Chapter definitions
│   ├── biomes.json     # Visual environment configs
│   └── README.md       # Data architecture docs
├── game/
│   ├── data/           # Zod loaders for JSON validation
│   │   ├── schemas.ts  # Zod schemas
│   │   ├── loaders.ts  # Typed data loaders
│   │   └── index.ts    # Barrel export
│   ├── ecs/            # Miniplex entities/systems
│   └── *.tsx           # Game components
├── components/
│   ├── hud/            # Game UI overlays
│   └── ui/             # Reusable UI primitives (shadcn)
└── pages/              # Route pages
```

---

## Data Architecture

### Static Content (JSON files in `client/src/data/`)
- Chapter definitions → `chapters.json`
- Biome configurations → `biomes.json`
- Animation specs → `animations.json` (future)
- Dialogue trees → `dialogue.json` (future)

### Runtime State (ECS/Zustand)
- Current chapter progress → Miniplex resources
- Player state → Zustand store
- Physics bodies → Rapier2D world
- Active entities → Miniplex world

### Critical Rules
- **NEVER** put mutable state in JSON
- **NEVER** put authored content in TypeScript constants
- **NEVER** import JSON directly - always use typed loaders
- **ALWAYS** validate JSON via Zod schemas

---

## Code Quality Checklist

Before completing any task, verify ALL of these:

- [ ] `pnpm biome check .` reports no errors
- [ ] `pnpm tsc --noEmit` passes
- [ ] No unused imports (Biome enforces)
- [ ] No unused variables (Biome enforces)
- [ ] JSDoc on all exports
- [ ] No console.log in production code
- [ ] No hardcoded magic strings/numbers
- [ ] No duplicate code
- [ ] Obsolete files removed

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Data: `kebab-case.json`
- Tests: `*.test.ts` or `*.spec.ts`

### Code
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Schema validators: `*Schema` suffix

---

## Forbidden Patterns

```typescript
// ❌ Hardcoded magic numbers
const damage = 10;

// ✅ Named constants or JSON data
import { PLAYER_BASE_DAMAGE } from "./constants";

// ❌ Direct JSON import
import data from './data.json';

// ✅ Typed loader with validation
import { loadChapters } from './data';

// ❌ Any type
function process(data: any) {}

// ✅ Proper typing
function process(data: Chapter) {}

// ❌ Massive component (500+ lines)
function GameScreen() { /* everything */ }

// ✅ Composed components
function GameScreen() {
  return (
    <>
      <GameCanvas />
      <GameHUD />
      <GameControls />
    </>
  );
}

// ❌ Using npm/yarn
npm install something

// ✅ Using pnpm
pnpm add something
```

---

## World Identity: Willowmere Hearthhold

This game has its **own unique world** - not Redwall, but inspired by its emotional core.

| Old (Don't Use) | New (Use Instead) |
|-----------------|-------------------|
| "The Abbey" | "The Hearthhold" or "Willowmere" |
| "Redwall" | "Willowmere" |
| "Martin the Warrior" | "The Otterblade Legacy" |
| "Mossflower" | "The Willow Banks" |
| "vermin" | "Galeborn" |

See `WORLD.md` for complete lore and world-building details.

---

## 10-Chapter Story Structure

| # | Chapter | Location | Quest |
|---|---------|----------|-------|
| 0 | The Calling | Finn's Cottage | Answer the Call |
| 1 | River Path | Willow Banks | Reach the Gatehouse |
| 2 | The Gatehouse | Northern Gate | Cross the Threshold |
| 3 | Great Hall | Central Hearthhold | Take the Oath |
| 4 | The Archives | Library Spire | Find the Ancient Map |
| 5 | Deep Cellars | Underground Passages | Descend into the Depths |
| 6 | Kitchen Gardens | Southern Grounds | Rally the Defenders |
| 7 | Bell Tower | Highest Spire | Sound the Alarm |
| 8 | Storm's Edge | Outer Ramparts | Face Zephyros |
| 9 | New Dawn | The Great Hearth | The Everember Rekindled |

---

## ECS Pattern (Miniplex)

```typescript
import { World } from "miniplex";

export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  // ... other components
};

export const world = new World<Entity>();

// Create queries for efficient filtering
export const queries = {
  moving: world.with("position", "velocity"),
  players: world.with("player", "position"),
};

// Safe iteration (requires ES2022 target)
for (const entity of queries.moving) {
  entity.position.x += entity.velocity.x * dt;
}

// Entity removal - collect first, remove after
const toRemove: Entity[] = [];
for (const e of queries.dead) toRemove.push(e);
toRemove.forEach(e => world.remove(e));
```

---

## Agent Responsibilities

### Before Starting Work
1. Read this document
2. Read `WORLD.md` for lore context
3. Review `replit.md` for technical context
4. Check existing code patterns

### During Work
1. Follow these standards strictly
2. Clean up as you go
3. Test your changes
4. Use typed data loaders

### Before Completing
1. Run `pnpm biome check .`
2. Run `pnpm tsc --noEmit`
3. Request architect review
4. Fix all raised issues
5. Verify workflow runs without errors

---

## Reference Files

| File | Purpose |
|------|---------|
| `WORLD.md` | World-building and lore |
| `BRAND.md` | Visual style guide |
| `replit.md` | Project architecture |
| `client/src/data/*.json` | Game content data |
| `client/src/game/data/` | Typed data loaders |

---

*"Clean code is not written by following rules. It's written by craftsmen who care."*
