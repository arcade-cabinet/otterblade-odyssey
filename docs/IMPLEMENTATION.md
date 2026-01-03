# Otterblade Odyssey: Astro Implementation Guide

> Source of truth for how the rebuilt Astro + Solid + Matter.js stack is assembled and how it consumes the shared data manifests.

## What We Build With

- **Astro 5 + Solid islands** for the shell, menus, and HUD.
- **Matter.js** for 2D physics and collision handling.
- **Canvas 2D** for procedural rendering (Finn, enemies, parallax, effects).
- **Zustand (vanilla store API)** for runtime state with localStorage persistence.
- **YUKA** for steering behaviors and enemy AI.
- **pnpm + Biome** for tooling and linting.

The prior Vite/React/Miniplex ECS stack is retired. New work must target the Astro/Solid runtime in `game/`.

## Runtime Layout (Astro App)

```
game/
├── src/
│   ├── pages/index.astro        # Entry point that mounts the game shell
│   ├── components/              # Solid components (HUD, menus, overlays)
│   ├── game/
│   │   ├── engine/              # Matter.js setup, game loop
│   │   ├── entities/            # Player, enemies, items
│   │   ├── systems/             # AI, input, collision, audio
│   │   ├── rendering/           # Canvas renderers (Finn, environments, effects)
│   │   ├── ddl/loader.js        # Async JSON loaders (no direct imports)
│   │   └── store.js             # Zustand store and selectors
│   └── ui/                      # Shared styling
└── astro.config.mjs
```

### Data Flow (Single Source of Truth)

1. **Authored data lives in `client/src/data/`** — manifests, schemas, approvals. No authored JSON belongs under `game/`.
2. **Loaders pull JSON at runtime** from `game/src/ddl/loader.js` (or siblings), using `fetch` to read the manifests instead of bundling them.
3. **Factories/systems derive runtime state** (entities, quests, encounters) from loaded manifests, never from hardcoded constants.
4. **Renderers consume derived state** and draw via Canvas; Solid components only orchestrate layout, not game logic.
5. **Persistence** stays in Zustand + localStorage; manifests remain immutable.

### Physics + Rendering Contracts

- Matter.js engine lives in `game/src/game/engine/physics.js`; update cadence via requestAnimationFrame.
- Collision layers and body creation utilities stay under `game/src/game/entities/` and `.../systems/collision.js`.
- Canvas renderers accept plain objects (positions, animations, palette references) generated from manifests to keep rendering deterministic and testable.

### Input + Audio

- `game/src/game/systems/input.js` unifies keyboard, touch, and gamepad events, emitting normalized actions to the store.
- Audio is handled via Howler.js in `game/src/game/systems/audio.js`, with sound IDs coming from manifests rather than inline strings.

## Migration Path (client → game)

The legacy `client/` React/Vite/ECS code is frozen; only the JSON data remains canonical.

1. **Keep authored content in `client/src/data/`** while porting runtime code into `game/src/`.
2. **Replace React components** with Solid equivalents under `game/src/components/` and page routes under `game/src/pages/`.
3. **Port ECS behaviors to systems** in `game/src/game/systems/`, using simple arrays/maps instead of Miniplex.
4. **Swap Rapier/Three** usage for Matter.js + Canvas renderers housed in `game/src/game/rendering/`.
5. **Redirect loaders**: replicate necessary data loaders in `game/src/ddl/` that `fetch` manifests; do not import `client/src/game` TypeScript loaders.
6. **Decommission client runtime** once each feature exists in `game/`, leaving only the data manifests behind.

## Removing the Old Stack

- **Vite → Astro**: Astro handles routing and bundling; do not add Vite-specific config to new code.
- **React → Solid**: New UI islands must be Solid components; avoid JSX that assumes React runtime.
- **ECS (Miniplex) → Systems/Arrays**: Track entities with plain objects and per-system update loops.
- **Three.js → Canvas 2D**: Procedural drawing replaces 3D assets; all references to R3F/Three should be pruned as features migrate.

## Implementation Checklist

- [x] Loader functions fetch data from `client/src/data/**/*.json`.
- [ ] Systems accept manifest-derived configs (no magic numbers).
- [ ] Canvas renderers are pure and side-effect free beyond drawing.
- [ ] Solid components stay <200 lines and focus on composition.
- [ ] Biome passes locally (`pnpm biome check .`).
- [ ] No React/Rapier/Miniplex imports in new code.

---

## DDL Manifest Loader (Detailed Usage)

### Overview

The DDL (Data Definition Language) loader system provides fetch-based, asynchronous loading of all game content from JSON manifests. Located in `game/src/ddl/loader.ts`, it replaces static imports with runtime loading.

### Key Benefits

- **Dynamic content updates** without recompilation
- **Separation of data and code** - manifests are data, not bundled code
- **Deterministic testing** with controlled data fixtures
- **Cache-first loading** for performance (Map-based, O(1) lookups)
- **Type safety** via Zod validation on every load

### Architecture

**Manifest Storage**: All manifests live in `game/public/data/manifests/`:
```
game/public/data/manifests/
├── chapters/           # 10 chapter manifests
│   ├── chapter-0-the-calling.json
│   ├── chapter-1-river-path.json
│   └── ... (through chapter-9)
├── enemies.json        # Galeborn enemy definitions
├── npcs.json           # Woodland folk NPCs
├── sprites.json        # Character sprite metadata
├── cinematics.json     # Cutscene video metadata
├── sounds.json         # Audio asset references
├── effects.json        # Particle/visual effects
├── items.json          # Collectibles, doors, hazards
├── scenes.json         # Parallax backgrounds
└── chapter-plates.json # Storybook chapter transitions
```

**Cache Layer**: Simple Map-based cache with O(1) lookups. Manifests are cached after first load and reused for subsequent access.

### Usage Patterns

#### 1. Game Initialization (Recommended)

Preload ALL manifests at game startup in parallel:

```javascript
import { preloadManifests } from '../ddl/loader';

async function initializeGame() {
  await preloadManifests({
    manifestTypes: ['chapters', 'enemies', 'npcs', 'sprites',
                    'cinematics', 'sounds', 'effects', 'items',
                    'scenes', 'chapter-plates'],
    logProgress: true,
    throwOnError: false, // Don't fail entire game if one manifest fails
  });

  // After preload, use synchronous accessors
  const chapter0 = getChapterManifestSync(0);
  const enemies = getEnemiesManifestSync();
  console.log(`Loaded chapter: ${chapter0.name}`);
}
```

#### 2. Individual Manifest Loading

Load specific manifests on-demand:

```javascript
import { loadChapterManifest, loadEnemiesManifest } from '../ddl/loader';

async function loadChapter(id) {
  const chapter = await loadChapterManifest(id);
  console.log(`Loaded: ${chapter.name} at ${chapter.location}`);
  return chapter;
}

async function loadEnemies() {
  const enemies = await loadEnemiesManifest();
  console.log(`Loaded ${enemies.assets.length} enemy types`);
  return enemies;
}
```

#### 3. Synchronous Access After Preload

Once manifests are preloaded, use synchronous accessors for zero-latency access:

```javascript
import {
  getChapterManifestSync,
  getEnemiesManifestSync,
  getNPCsManifestSync
} from '../ddl/loader';

function buildLevel(chapterId) {
  // No await needed - data is already cached
  const chapter = getChapterManifestSync(chapterId);
  const enemies = getEnemiesManifestSync();
  const npcs = getNPCsManifestSync();

  // Build level from manifest data
  buildLevelGeometry(chapter.level);
  spawnEnemies(chapter.encounters, enemies);
  spawnNPCs(chapter.npcs, npcs);
}
```

**⚠️ Important**: Sync accessors throw errors if data isn't preloaded. Always call `preloadManifests()` first!

#### 4. Progress Tracking

Track loading progress for UI feedback:

```javascript
async function preloadWithProgress(setProgress) {
  const totalSteps = 19; // 10 chapters + 9 manifests
  let completed = 0;

  // Load chapters
  for (let i = 0; i <= 9; i++) {
    await loadChapterManifest(i);
    completed++;
    setProgress(Math.floor((completed / totalSteps) * 100));
  }

  // Load other manifests...
}
```

### Manifest Types

#### Chapter Manifests

```javascript
import { loadChapterManifest, getChapterManifestSync } from '../ddl/loader';

const chapter = await loadChapterManifest(5);
console.log(chapter.name); // "Deep Cellars"
console.log(chapter.boss.name); // "Frostclaw"

// After preload, sync access:
const chapter0 = getChapterManifestSync(0);
```

**Chapter manifest structure:**
- `narrative`: Theme, quest, story beats, emotional arc
- `level`: Platforms, walls, segments, spawn points, water zones
- `encounters`: Enemy placements and AI behaviors
- `boss`: Boss stats, phases, attacks
- `npcs`: Character positions, dialogue trees
- `triggers`: Event system (enter_region, defeat_enemies, etc.)
- `media`: Cinematic and audio references

#### Entity Manifests

```javascript
import { loadEnemiesManifest, loadNPCsManifest } from '../ddl/loader';

// Enemies
const enemies = await loadEnemiesManifest();
const scout = enemies.assets.find(e => e.id === 'enemy_skirmisher');
console.log(scout.name); // "Galeborn Skirmisher"

// NPCs
const npcs = await loadNPCsManifest();
console.log(npcs.species.otter.description); // "Brave, loyal, skilled swimmers..."
```

#### Asset Manifests

```javascript
import {
  loadSpritesManifest,
  loadCinematicsManifest,
  loadSoundsManifest
} from '../ddl/loader';

// Sprites
const sprites = await loadSpritesManifest();
const finnIdle = sprites.assets.find(s => s.id === 'finn_idle');

// Cinematics (Veo 3.1 generated videos)
const cinematics = await loadCinematicsManifest();
const intro = cinematics.assets.find(c => c.id === 'intro_cinematic');

// Sounds (Freesound/custom audio)
const sounds = await loadSoundsManifest();
const music = sounds.assets.filter(s => s.type === 'music');
```

### Validation

All manifests are validated with Zod schemas on load:

```javascript
// Chapter manifests validated against ChapterManifestSchema
const chapter = await loadChapterManifest(0);
// TypeScript knows: chapter.narrative.theme is a string
// TypeScript knows: chapter.boss.stats.health is a number

// Asset manifests validated against specific schemas
const enemies = await loadEnemiesManifest();
// TypeScript knows: enemies.category is 'enemies'
// TypeScript knows: enemies.assets is an array
```

**Validation errors** provide detailed messages:
```
Invalid chapter-0 manifest: Expected object, received null at "narrative"
Invalid enemies manifest: Required at "assets[0].filename"
```

### Error Handling

```javascript
// Async loading with error handling
try {
  const chapter = await loadChapterManifest(5);
} catch (error) {
  // Handles: 404 Not Found, network failures, invalid JSON, schema validation
  console.error('Failed to load chapter:', error.message);
  // Fallback to safe default
  const fallback = await loadChapterManifest(0);
}

// Sync access error handling
try {
  const chapter = getChapterManifestSync(0);
} catch (error) {
  // Thrown if manifest not preloaded
  console.error('Chapter not in cache. Did you call preloadManifests()?');
}
```

### Performance

**Caching**: Map-based cache with O(1) lookups. Manifests stay cached for session lifetime (~268KB total).

**Parallel Loading**: `preloadManifests()` loads all manifests in parallel (~200-500ms for 19 files).

**No Refetching**: Cached data is reused. Fetch only happens once per manifest per session.

### Testing

#### Unit Tests

Located in `game/src/ddl/loader.test.ts`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadChapterManifest, clearManifestCache } from './loader';

describe('DDL Loader', () => {
  beforeEach(() => {
    clearManifestCache();
    vi.clearAllMocks();
  });

  it('should cache manifests', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 0, name: 'Test', /* ... */ }),
    });

    await loadChapterManifest(0);
    await loadChapterManifest(0); // Should use cache

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
```

**Current test coverage**: 7.32% (needs improvement to 80%+)

### Migration from Static Imports

**Before:**
```javascript
import chapter0 from '@data/manifests/chapters/chapter-0-the-calling.json';

function loadLevel() {
  buildLevel(chapter0);
}
```

**After:**
```javascript
import { getChapterManifestSync } from '../ddl/loader';

function loadLevel() {
  const chapter0 = getChapterManifestSync(0);
  buildLevel(chapter0);
}
```

### API Reference

**Core Functions**:
- `loadManifest(path)` - Base fetch function with caching
- `loadChapterManifest(id)` - Load chapter by ID (0-9)
- `getChapterManifestSync(id)` - Get cached chapter (post-preload)
- `loadEnemiesManifest()` / `getEnemiesManifestSync()` - Enemies
- `loadNPCsManifest()` / `getNPCsManifestSync()` - NPCs
- `loadSpritesManifest()` - Sprites
- `loadCinematicsManifest()` - Cinematics
- `loadSoundsManifest()` - Sounds
- `loadEffectsManifest()` - Effects
- `loadItemsManifest()` - Items
- `loadScenesManifest()` - Scenes
- `loadChapterPlatesManifest()` - Chapter plates
- `preloadManifests(options)` - Batch preload all manifests
- `clearManifestCache()` - Clear cache (dev/testing)
- `getCacheStats()` - Get cache info

**Constants**:
- `ALL_CHAPTER_IDS` - `[0, 1, 2, ..., 9]`
- `TOTAL_CHAPTERS` - `10`
- `isValidChapterId(id)` - Validator function

**Types**: All types exported from `game/src/game/data/manifest-schemas.ts` (ChapterManifest, EnemiesManifest, NPCsManifest, etc.)
