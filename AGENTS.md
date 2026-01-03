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

## Technology Stack (Astro + Solid.js)

**Architecture Decision**: Astro 5.x + Solid.js + Matter.js (proven in POC) replaces React Three Fiber + Rapier (20,000+ lines, broken).

| Layer | Technology | Notes |
|-------|------------|-------|
| **Runtime** | Node.js 25.x | Latest stable, defined in `.nvmrc` |
| **Framework** | Astro 5.x | Static site generation, GitHub Pages deployment |
| **UI Components** | Solid.js | Reactive UI, 7KB runtime (vs 140KB React) |
| **Language** | JavaScript (ES2022) | No TypeScript compilation overhead |
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
game/src/                  # Astro + Solid.js game
├── pages/
│   └── index.astro        # Main game page
├── components/            # Solid.js components
│   ├── GameCanvas.jsx     # Game canvas wrapper
│   ├── HUD.jsx            # Health, shards, quest display
│   ├── TouchControls.jsx  # Mobile controls
│   ├── StartMenu.jsx      # Start screen
│   └── ChapterPlate.jsx   # Chapter transitions
├── game/                  # Core game engine
│   ├── engine/
│   │   ├── physics.js     # Matter.js engine setup
│   │   ├── renderer.js    # Canvas 2D rendering pipeline
│   │   └── gameLoop.js    # RequestAnimationFrame loop
│   ├── entities/
│   │   ├── Player.js      # Finn (otter protagonist)
│   │   ├── Enemy.js       # Galeborn enemies
│   │   ├── Platform.js    # Platforms, walls, hazards
│   │   └── Item.js        # Collectibles, powerups
│   ├── systems/
│   │   ├── collision.js   # Collision handlers
│   │   ├── ai.js          # YUKA AI manager
│   │   ├── input.js       # Unified input (keyboard, gamepad, touch)
│   │   └── audio.js       # Howler.js audio manager
│   ├── rendering/
│   │   ├── finn.js        # Procedural Finn rendering
│   │   ├── enemies.js     # Procedural enemy rendering
│   │   ├── environment.js # Platforms, parallax backgrounds
│   │   └── effects.js     # Particles, post-process
│   ├── store.js           # Zustand state management
│   └── constants.js       # Game constants, collision groups
└── ui/
    └── styles.css         # Warm Redwall-inspired CSS

game/src/data/
├── manifests/             # JSON DDL definitions
│   ├── chapters/          # 10 chapter definitions
│   ├── schema/            # JSON schemas
│   ├── enemies.json
│   └── sounds.json
└── approvals.json         # Asset approval tracking
```

---

## Data Architecture

### Static Content (JSON files in `game/src/data/`)
- Legacy chapter definitions → `chapters.json`
- Biome configurations → `biomes.json`
- **Chapter manifests** → `manifests/chapters/chapter-*.json` (comprehensive)
- **NPC definitions** → `manifests/npcs.json`
- Asset manifests → `manifests/sprites.json`, `cinematics.json`, etc.

### Data Loaders (in `game/src/ddl/loader.js`)

```javascript
// Load chapter manifests
export async function loadChapterManifest(chapterId) {
  const response = await fetch(`../../game/src/data/manifests/chapters/chapter-${chapterId}.json`);
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

### Runtime State (Vanilla JS store)
- Current chapter progress → Vanilla JS store (persisted via localStorage)
- Player state → Vanilla JS store (persisted via localStorage)
- Physics bodies → Matter.js world
- Active entities → Simple array/object tracking

### Critical Rules
- **NEVER** put mutable state in JSON
- **NEVER** put authored content in JavaScript constants
- **NEVER** import JSON directly - always use async loaders
- **ALWAYS** validate JSON structure (optional: use JSON Schema)
- **Keep it simple** - Vanilla JS patterns, no over-engineering

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
- [ ] ES2022 features only (no TypeScript)

---

## Naming Conventions

### Files
- Modules: `PascalCase.js` (classes) or `camelCase.js` (utilities)
- Data: `kebab-case.json`
- Tests: `*.test.js` or `*.spec.js`
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

```javascript
// ❌ Hardcoded magic numbers
const damage = 10;

// ✅ Named constants or JSON data
import { PLAYER_BASE_DAMAGE } from "./constants.js";

// ❌ Direct JSON import (doesn't work well in browsers anyway)
import data from './data.json';

// ✅ Async loader
import { loadChapters } from './ddl/loader.js';
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

// ❌ Adding frameworks when vanilla JS works
import React from 'react';
import { createRoot } from 'react-dom/client';

// ✅ Vanilla JS DOM manipulation
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

## Matter.js + Vanilla JS Patterns (from POC)

### Matter.js Physics Setup
```javascript
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
```javascript
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
3. Review `BUILD_PLAN_TONIGHT.md` and `VANILLA_JS_PLAN.md` for architecture
4. Study POC (`pocs/otterblade_odyssey.html`) for proven patterns
5. Check existing code patterns

### During Work
1. Follow these standards strictly
2. Clean up as you go
3. Test your changes
4. Use async data loaders (not direct imports)
5. Keep it simple - vanilla JS patterns from POC

### Before Completing
1. Run `pnpm biome check .`
2. Test in browser (no build step needed for dev)
3. Request review if making significant changes
4. Fix all raised issues
5. Verify workflow runs without errors

---

## Asset Generation System

### Manifest-Driven Architecture

All visual assets are managed through JSON manifests in `game/src/data/manifests/`:

```
game/src/data/manifests/
├── sprites.json        # Finn + NPCs (OpenAI GPT-Image-1)
├── enemies.json        # 6 enemies + Zephyros boss (OpenAI)
├── cinematics.json     # 18 story/boss cinematics (Google Veo 3.1)
├── chapter-plates.json # 10 storybook chapter plates (Google Imagen 3)
├── scenes.json         # 8 parallax backgrounds (Google Imagen 3)
├── items.json          # Collectibles, platforms, hazards (OpenAI)
├── effects.json        # Particles, combat, weather (OpenAI)
└── sounds.json         # 18 ambient, SFX, music (Freesound)
```

### dev-tools Package

The `@otterblade/dev-tools` package provides idempotent asset generation:

```bash
# Located at: packages/dev-tools/

# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate by category
pnpm --filter @otterblade/dev-tools cli -- --category sprites
pnpm --filter @otterblade/dev-tools cli -- --category cinematics

# Preview without generating
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration
pnpm --filter @otterblade/dev-tools cli -- --force
```

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
1. GENERATE  → pnpm --filter @otterblade/dev-tools cli
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

### GitHub Actions Integration

The `assets.yml` workflow automates generation:

1. Triggered via `workflow_dispatch` (manual)
2. Validates API keys (OPENAI_API_KEY, GEMINI_API_KEY)
3. Runs dev-tools CLI with selected options
4. Creates PR with generated assets
5. PR includes brand compliance checklist

### Provider Selection Matrix

| Asset Type | Provider | Model | Why |
|------------|----------|-------|-----|
| Sprites | OpenAI | gpt-image-1 | Transparency, precise grid |
| Enemies | OpenAI | gpt-image-1 | Consistent style |
| Cinematics | Google | veo-3.1 | Native audio, long duration |
| Scenes | Google | imagen-3.0 | Painterly, wide format |

### Validation Commands

```bash
# Validate all assets exist
pnpm validate:assets

# Audit cinematics for brand violations
pnpm audit:cinematics

# Analyze sprite quality
pnpm analyze:sprite path/to/sprite.png

# Analyze video compliance
pnpm analyze:video path/to/video.mp4
```

### Key Files

| File | Purpose |
|------|---------|
| `packages/dev-tools/src/cli.ts` | Main CLI entry point |
| `packages/dev-tools/src/manifest-generator.ts` | Asset generation logic |
| `packages/dev-tools/src/shared/prompts.ts` | Brand-aligned prompts |
| `packages/dev-tools/src/shared/config.ts` | API clients, models |
| `.github/workflows/assets.yml` | GitHub Actions workflow |

---

## Reference Files

| File | Purpose |
|------|---------|
| `WORLD.md` | World-building and lore |
| `BRAND.md` | Visual style guide |
| `replit.md` | Project architecture |
| `game/src/data/*.json` | Game content data |
| `game/src/game/data/` | Typed data loaders |
| `game/src/data/manifests/` | Asset generation manifests |
| `packages/dev-tools/` | Asset generation tools |

---

*"Clean code is not written by following rules. It's written by craftsmen who care."*
