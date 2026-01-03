# Claude Agent Instructions for Otterblade Odyssey

This is the primary instruction file for Claude-based AI agents working on Otterblade Odyssey. Claude agents should read this file first, then reference `BRAND.md` for visual guidelines and `AGENTS.md` for technical patterns.

## Quick Context

**Otterblade Odyssey: Zephyros Rising** is a production-grade 2.5D platformer built with **Astro + Solid.js + Matter.js**, with Redwall-inspired woodland-epic branding. Think warm lantern light, mossy stone abbeys, brave woodland creatures—not neon sci-fi or grimdark horror.

**Repository**: `github.com/jbdevprimary/otterblade-odyssey`

**Architecture Decision**: Astro 5.x + Solid.js + Matter.js (proven in POC) replaces React Three Fiber + Rapier (20,000+ lines, broken).

## Critical Rules for Claude

### 1. Package Manager: pnpm ONLY
```bash
# CORRECT
pnpm install
pnpm add <package>
pnpm run dev

# WRONG - NEVER USE
npm install
npm run dev
yarn add
```

### 2. Brand Consistency is Non-Negotiable
Before generating ANY visual content or making design decisions, read `BRAND.md`. The visual identity is:
- **Warm, brave, hopeful, "cozy-but-heroic"**
- Moss, stone, lantern light, cloth, leather, iron
- Subtle magic (firefly motes, not laser beams)

### 3. Use Procedural Generation (NOT Static Assets)
```javascript
// CORRECT - Procedural rendering like POC
// See pocs/otterblade_odyssey.html for reference
// Use canvas-based procedural generation for player, enemies, effects

// WRONG - Static PNG/MP4 imports (removed from codebase)
// import otterSprite from "@assets/...png";  // DO NOT USE
// import chapterPlate from "@assets/...png";  // DO NOT USE
```

### 4. JavaScript Target is ES2022
Modern JavaScript features, ES modules. **Use JavaScript (not TypeScript)** for simplicity.

### 5. Node.js Version is 25.x
All environments use Node.js 25 (latest stable). Version is defined in `.nvmrc` at repo root. CI/CD workflows, Replit, and local dev must all align to this version.

## Architecture Overview

### Current Technology Stack
| Layer | Technology |
|-------|------------|
| Framework | Astro 5.x (static site generation) |
| UI Components | Solid.js (reactive UI) |
| Language | JavaScript (ES2022) |
| Physics | Matter.js 0.20 (POC-proven) |
| Rendering | Canvas 2D API |
| AI/Pathfinding | YUKA 0.7.8 |
| State Management | Zustand 5.x (with localStorage) |
| Audio | Howler.js / Tone.js |
| Touch Controls | nipplejs / Custom |
| Bundler | esbuild |
| Dev Server | Astro dev server (port 4321) |

### Key Directories
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

client/src/data/
├── manifests/             # JSON DDL definitions
│   └── chapters/          # 10 chapter definitions
└── approvals.json         # Asset approval tracking
```

## 10-Chapter Story Structure

| # | Chapter | Biome | Quest |
|---|---------|-------|-------|
| 0 | Prologue | Village | "Answer the Call" |
| 1 | Abbey Approach | Forest/Bridge | "Reach the Gatehouse" |
| 2 | Gatehouse | Entry | "Cross the Threshold" |
| 3 | Great Hall | Interior | "Defend the Great Hall" |
| 4 | Library | Interior | "Find the Ancient Map" |
| 5 | Dungeon | Catacombs | "Descend into the Depths" |
| 6 | Courtyard | Gardens | "Rally the Defenders" |
| 7 | Rooftops | Rafters | "Ascend to the Bells" |
| 8 | Final Ascent | High Keep | "Reach Zephyros" |
| 9 | Epilogue | Victory | "A New Dawn" |

## Code Patterns

### Matter.js Physics Setup (from POC)
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
```

### Procedural Finn Rendering (from POC)
```javascript
export function drawFinn(ctx, { x, y, facing, state, animFrame, warmth }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.05) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (warm brown otter)
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // ... (head, snout, eyes, ears, arms, sword)

  ctx.restore();
}
```

### Zustand State Management (with localStorage)
```javascript
// game/src/game/store.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set) => ({
      health: 5,
      maxHealth: 5,
      shards: 0,
      currentChapter: 0,
      checkpointPosition: { x: 100, y: 450 },

      takeDamage: (amount) => set((state) => ({
        health: Math.max(0, state.health - amount)
      })),

      collectShard: () => set((state) => ({
        shards: state.shards + 1
      })),

      setCheckpoint: (pos) => set({ checkpointPosition: pos })
    }),
    {
      name: 'otterblade-save',
      partialize: (state) => ({
        bestScore: state.bestScore,
        unlockedChapters: state.unlockedChapters
      })
    }
  )
);

// Usage in Solid.js components
import { useGameStore } from '../game/store';

const health = useGameStore((state) => state.health);
const takeDamage = useGameStore((state) => state.takeDamage);
```

## Asset Generation System

### Manifest-Driven Pipeline

All game assets are managed through JSON manifests in `client/src/data/manifests/`:

| Manifest | Assets | Provider |
|----------|--------|----------|
| `sprites.json` | Finn (12 animations) + 5 NPCs | OpenAI GPT-Image-1 |
| `enemies.json` | 6 enemy types + Zephyros boss | OpenAI GPT-Image-1 |
| `cinematics.json` | 18 cinematics (intro, chapters, boss, outro) | Google Veo 3.1 |
| `chapter-plates.json` | 10 storybook chapter plates | Google Imagen 3 |
| `scenes.json` | 8 parallax backgrounds | Google Imagen 3 |
| `items.json` | Collectibles, doors, platforms, hazards | OpenAI GPT-Image-1 |
| `effects.json` | Particles, combat effects, weather | OpenAI GPT-Image-1 |
| `sounds.json` | 18 ambient, SFX, and music tracks | Freesound/Custom |

### dev-tools Package

The `@otterblade/dev-tools` package handles all asset generation:

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites

# Dry run to preview
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration
pnpm --filter @otterblade/dev-tools cli -- --force --id intro_cinematic
```

### GitHub Actions Workflow

Use `assets.yml` workflow for automated generation:
- Validates API keys (OPENAI_API_KEY, GEMINI_API_KEY)
- Creates PR with generated assets
- Includes brand compliance checklist

### Brand Enforcement

All prompts in `packages/dev-tools/src/shared/prompts.ts` enforce:
- **Anthropomorphic woodland animals ONLY** - NO humans ever
- **Warm storybook aesthetic** - NO neon, sci-fi, horror
- **Consistent protagonist** - Finn the otter warrior
- **Willowmere Hearthhold setting** - See WORLD.md

### Asset Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Not yet generated |
| `complete` | Valid and ready to use |
| `needs_regeneration` | Has issues, will be regenerated |
| `approved` | Reviewed and locked (IDEMPOTENT) |
| `rejected` | Reviewed and marked for regeneration |

### Asset Approval Workflow (CRITICAL)

**Approved assets are NEVER regenerated.** This is how we achieve idempotency.

**Review Gallery URL:** `https://jbdevprimary.github.io/otterblade-odyssey/assets`

**Workflow:**
```
1. Generate assets → pnpm --filter @otterblade/dev-tools cli
2. Push to main → CD deploys to GitHub Pages
3. Visit /assets → Review in gallery
4. Select + Approve assets
5. Click "🚀 Create PR on GitHub" → Opens GitHub with content pre-filled
6. Commit on new branch → PR created automatically
7. Merge → Assets locked as idempotent
```

**Approval Storage:** `client/src/data/approvals.json`

**Before generating, respect approvals:**
```typescript
// Skip approved assets
if (approvalsJson.approvals.find(a => a.id === asset.id)) {
  continue; // Don't regenerate
}
```

## Testing Commands

```bash
# Unit tests
pnpm run test

# E2E tests (headless, CI-safe)
pnpm playwright test

# E2E tests with full WebGL (requires GPU)
PLAYWRIGHT_MCP=true pnpm playwright test

# Visual regression update
PLAYWRIGHT_MCP=true pnpm playwright test --update-snapshots

# Validate all assets exist
pnpm validate:assets

# Audit cinematics for brand violations
pnpm audit:cinematics
```

## Common Mistakes to Avoid

1. **Using npm/yarn** - Always use pnpm
2. **Static PNG/MP4 assets** - Use procedural generation from POC, not static files
3. **Wrong framework** - Use Astro + Solid.js, NOT vanilla JS, NOT React
4. **TypeScript** - Use JavaScript for simplicity
5. **Neon/sci-fi aesthetics** - Always check BRAND.md
6. **Over-engineering** - Keep it simple, proven patterns from POC

## Image Generation Prompts

When generating visual assets, always include:
```
Style: Storybook art, painterly, warm lighting, Redwall-inspired woodland-epic
Palette: [refer to BRAND.md for biome-specific colors]
Negative: neon, sci-fi, glowing energy, anime, grimdark, horror, demons, modern, plastic, glossy
```

## Reference Files

| File | Purpose |
|------|---------|
| `BRAND.md` | Complete visual style guide |
| `AGENTS.md` | Technical patterns for all AI agents |
| `BUILD_PLAN_TONIGHT.md` | 6-hour build plan |
| `VANILLA_JS_PLAN.md` | Why vanilla JS is superior |
| `.github/copilot-instructions.md` | GitHub Copilot config |
| `pocs/otterblade_odyssey.html` | Working POC (2,847 lines, Matter.js) |
| `client/src/data/manifests/chapters/` | JSON DDL chapter definitions |
