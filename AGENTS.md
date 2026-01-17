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
6. **Memory Bank First**: Read `.clinerules` and the `memory-bank/` files before starting any work.

---

## Technology Stack (Astro + Solid.js)

**Architecture Decision**: Astro 5.x + Solid.js + Matter.js (proven in POC) replaces React Three Fiber + Rapier (20,000+ lines, broken).

| Layer | Technology | Notes |
|-------|------------|-------|
| **Runtime** | Node.js 25.x | Latest stable, defined in `.nvmrc` |
| **Framework** | Astro 5.x | Static site generation, GitHub Pages deployment |
| **UI Components** | Solid.js | Reactive UI, 7KB runtime (vs 140KB React) |
| **Language** | TypeScript (ES2022 target) | Type safety with ES2022 output |
| **Physics** | Matter.js 0.20 | POC-proven, 2D rigid body physics |
| **Rendering** | Canvas 2D API | Procedural character rendering, parallax |
| **AI/Pathfinding** | YUKA 0.7.8 | Enemy AI, steering behaviors, FSM |
| **State Management** | Zustand 5.x | Game state with localStorage persistence |
| **Audio** | Howler.js / Tone.js | Spatial audio, music |
| **Touch Controls** | nipplejs / Custom | Mobile-first touch joystick |
| **Bundler** | esbuild | Fast JavaScript bundling |
| **Dev Server** | Astro dev server | Port 4321 |
| **Package Manager** | **pnpm 10.x** (never npm/yarn) | |
| **Linting** | Biome | Strict mode |

**Performance**: Fast Solid.js reactivity, <200KB bundle target, 60fps stable

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
game/src/                     # Astro + Solid.js game
├── pages/
│   └── index.astro           # Main game page
├── game/                     # Core game engine + UI shell
│   ├── OtterbladeGame.tsx    # Root Solid game component
│   ├── components/           # Solid UI building blocks
│   │   ├── TouchControls.tsx
│   │   └── LoadingScreen.tsx
│   ├── ui/                   # HUD + menu UI
│   │   ├── HUD.tsx
│   │   └── Menu.tsx
│   ├── engine/               # Game loop + renderer
│   │   ├── physics.ts
│   │   ├── rendering.ts
│   │   └── gameLoop.ts
│   ├── systems/              # Collision, AI, input, audio, triggers
│   ├── factories/            # Level/NPC/enemy construction
│   ├── rendering/            # Procedural render helpers
│   ├── store.ts              # Zustand state management
│   └── constants.ts          # Game constants, collision groups
└── styles.css                # Warm Willowmere styling

game/public/data/
├── manifests/                # JSON DDL definitions
│   ├── chapters/             # 10 chapter definitions
│   ├── schema/               # JSON schemas
│   ├── enemies.json
│   └── sounds.json
└── biomes.json               # Shared authored data

game/src/data/approvals.json  # Asset approval tracking (committed)
```

---

## Data Architecture

### Static Content (JSON files in `game/public/data/`)
- Legacy chapter definitions → `chapters.json`
- Biome configurations → `biomes.json`
- **Chapter manifests** → `manifests/chapters/chapter-*.json` (comprehensive)
- **NPC definitions** → `manifests/npcs.json`
- Asset manifests → `manifests/sprites.json`, `cinematics.json`, etc.

### Data Loaders (in `game/src/ddl/loader.ts`)

```ts
// Load chapter manifests
export async function loadChapterManifest(chapterId) {
  const response = await fetch(`/data/manifests/chapters/chapter-${chapterId}.json`);
  return await response.json();
}

export async function getChapterBoss(chapterId) {
  const manifest = await loadChapterManifest(chapterId);
  return manifest.levelDefinition.bossEncounter;
}

// Usage
const chapter0 = await loadChapterManifest(0);
const boss = await getChapterBoss(8); // Returns Zephyros data
```

### Runtime State (Zustand store)
- Current chapter progress → Zustand store (persisted via localStorage)
- Player state → Zustand store (persisted via localStorage)
- Physics bodies → Matter.js world
- Active entities → Simple array/object tracking

### Critical Rules
- **NEVER** put mutable state in JSON
- **NEVER** put authored content in JavaScript constants
- **NEVER** import JSON directly - always use async loaders
- **ALWAYS** validate JSON structure (optional: use JSON Schema)
- **Keep it simple** - TypeScript-first patterns, no over-engineering

### Documentation Alignment
- Keep `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` synchronized so agent guidance consistently reflects the Astro + Solid + Matter.js stack and manifest-driven data flow.
- Update everything under `docs/` whenever architecture, workflows, or stack choices change; contributors should never see conflicting instructions across docs.

---

## Code Quality Checklist

Before completing any task, verify ALL of these:

- [ ] `pnpm biome check .` reports no errors
- [ ] No unused imports (Biome enforces)
- [ ] No unused variables (Biome enforces)
- [ ] JSDoc on all exports
- [ ] No console.log in production code
- [ ] No hardcoded magic strings/numbers
- [ ] No duplicate code
- [ ] Obsolete files removed
- [ ] TypeScript only (ES2022 target)

---

## Naming Conventions

### Files
- Modules: `PascalCase.ts` (classes) or `camelCase.ts` (utilities)
- Data: `kebab-case.json`
- Tests: `*.test.ts` or `*.spec.ts`
- HTML: `index.html`
- CSS: `styles.css`

### Code
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Schema validators: `*Schema` suffix

---

## Forbidden Patterns

```ts
// ❌ Hardcoded magic numbers
const damage = 10;

// ✅ Named constants or JSON data
import { PLAYER_BASE_DAMAGE } from "./constants";

// ❌ Direct JSON import (doesn't work well in browsers anyway)
import data from './data.json';

// ✅ Async loader
import { loadChapters } from './ddl/loader';
const chapters = await loadChapters();

// ❌ Massive function (500+ lines)
function gameLoop() { /* everything */ }

// ✅ Composed functions
function gameLoop() {
  updatePhysics(deltaTime);
  updateAI(deltaTime);
  updateCamera();
  render();
}

// ❌ Using npm/yarn
npm install something

// ✅ Using pnpm
pnpm add something

// ❌ Adding frameworks when vanilla DOM works
import React from 'react';
import { createRoot } from 'react-dom/client';

// ✅ Vanilla DOM manipulation (TypeScript)
const hud = document.createElement('div');
hud.className = 'hud';
document.body.appendChild(hud);
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

## Matter.js + TypeScript Patterns (from POC)

### Matter.js Physics Setup
```ts
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events } = Matter;

// Create engine
const engine = Engine.create();
engine.gravity.y = 1.5; // POC-proven gravity value

// Create player body
const player = Bodies.rectangle(x, y, 35, 55, {
  label: 'player',
  friction: 0.1,
  frictionAir: 0.01,
  restitution: 0
});

World.add(engine.world, player);

// Game loop
function gameLoop() {
  Engine.update(engine, 1000 / 60); // 60fps
  render();
  requestAnimationFrame(gameLoop);
}
```

### Entity Tracking (Simple Arrays)
```ts
// Track entities in simple arrays
const enemies = [];
const platforms = [];
const items = [];

// Add enemy
function spawnEnemy(x, y, type) {
  const enemyBody = Bodies.rectangle(x, y, 28, 45, { label: 'enemy' });
  const enemy = {
    body: enemyBody,
    type: type,
    hp: 25,
    damage: 8,
    speed: 1.2,
    aiState: 'patrol'
  };
  enemies.push(enemy);
  World.add(engine.world, enemyBody);
  return enemy;
}

// Update loop
function updateEnemies(deltaTime) {
  for (const enemy of enemies) {
    updateEnemyAI(enemy, deltaTime);
    updateEnemyAnimation(enemy);
  }
}

// Remove dead enemies
function cleanupEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      World.remove(engine.world, enemies[i].body);
      enemies.splice(i, 1);
    }
  }
}
```

---

## Agent Responsibilities

### Before Starting Work
1. Read this document
2. Read `WORLD.md` for lore context
3. Review `BUILD_PLAN_TONIGHT.md` for architecture
4. Study POC (`pocs/otterblade_odyssey.html`) for proven patterns
5. Check existing code patterns

### During Work
1. Follow these standards strictly
2. Clean up as you go
3. Test your changes
4. Use async data loaders (not direct imports)
5. Keep it simple - TypeScript-first patterns from POC

### Before Completing
1. Run `pnpm biome check .`
2. Test in browser (no build step needed for dev)
3. Request review if making significant changes
4. Fix all raised issues
5. Verify workflow runs without errors

---

## Asset Generation System

### Manifest-Driven Architecture

All visual assets are managed through JSON manifests in `game/public/data/manifests/`:

```
game/public/data/manifests/
├── sprites.json        # Finn + NPCs (OpenAI GPT-Image-1)
├── enemies.json        # 6 enemies + Zephyros boss (OpenAI)
├── cinematics.json     # 18 story/boss cinematics (Google Veo 3.1)
├── chapter-plates.json # 10 storybook chapter plates (Google Imagen 3)
├── scenes.json         # 8 parallax backgrounds (Google Imagen 3)
├── items.json          # Collectibles, platforms, hazards (OpenAI)
├── effects.json        # Particles, combat, weather (OpenAI)
└── sounds.json         # 18 ambient, SFX, music (Freesound)
```

### Asset Generation (Enterprise)

Asset generation uses the `jbcom/control-center` enterprise binary:
- **Veo 3.1** - Video/cinematic generation
- **Imagen 3** - Image/sprite generation
- Parallel generation at scale
- Built-in brand enforcement

See issue #45 for archived documentation of the previous dev-tools implementation.

### Asset Status Workflow

```
pending → [generate] → complete → [review] → approved
                ↓                      ↓
        needs_regeneration ←──── rejected
```

| Status | Description |
|--------|-------------|
| `pending` | Asset defined but not yet generated |
| `complete` | Asset exists and passes validation |
| `needs_regeneration` | Asset exists but has brand violations |
| `approved` | Asset reviewed and locked (IDEMPOTENT) |
| `rejected` | Asset reviewed and marked for regeneration |

### Asset Approval Workflow (CRITICAL)

**Idempotency Rule**: Approved assets are NEVER regenerated.

```
1. GENERATE  → via jbcom/control-center
2. DEPLOY    → Push to main → CD deploys to GitHub Pages
3. REVIEW    → Visit /assets on GitHub Pages
4. APPROVE   → Select assets → Click "Approve Selected"
5. CREATE PR → Click "🚀 Create PR on GitHub" (opens GitHub directly)
6. COMMIT    → Create branch, commit → PR created automatically
7. MERGE     → Assets locked as idempotent
```

**Asset Review Gallery URL:**
`https://jbdevprimary.github.io/otterblade-odyssey/assets`

**Approval Storage:**
- `game/src/data/approvals.json` - Production approvals (committed)
- `localStorage` - Working selections (browser-local)

**Before generating, check:**
```bash
# Check if asset is approved
jq '.approvals[] | select(.id == "intro_cinematic")' game/src/data/approvals.json
```

### Brand Compliance (CRITICAL)

All generation prompts enforce these rules from `BRAND.md`:

**REQUIRED:**
- Anthropomorphic woodland animals ONLY
- Warm storybook aesthetic (moss, stone, lantern light)
- Protagonist: Finn the otter warrior
- Willowmere Hearthhold setting

**FORBIDDEN:**
- Human characters (NO knights, villagers, soldiers)
- Neon, sci-fi, or horror elements
- Glowing energy weapons or magic beams
- Anime/JRPG styling

### Provider Selection Matrix

| Asset Type | Provider | Model | Why |
|------------|----------|-------|-----|
| Sprites | OpenAI | gpt-image-1 | Transparency, precise grid |
| Enemies | OpenAI | gpt-image-1 | Consistent style |
| Cinematics | Google | veo-3.1 | Native audio, long duration |
| Scenes | Google | imagen-3.0 | Painterly, wide format |

---

## Reference Files

| File | Purpose |
|------|---------|
| `WORLD.md` | World-building and lore |
| `BRAND.md` | Visual style guide |
| `replit.md` | Project architecture |
| `game/public/data/*.json` | Game content data |
| `game/src/game/data/` | Typed data loaders |
| `game/public/data/manifests/` | Asset generation manifests |
| `game/src/data/approvals.json` | Asset approval tracking |

---

*"Clean code is not written by following rules. It's written by craftsmen who care."*
