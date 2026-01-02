# Otterblade Odyssey: Zephyros Rising

A production-grade 2.5D platformer built with **Vanilla JavaScript + Matter.js + Canvas 2D**, inspired by the woodland-epic adventures of Redwall.

![Otterblade Odyssey](https://github.com/user-attachments/assets/c3b31ba2-ce5c-4d9a-80d1-db0f4df18543)
*Finn the otter warrior, procedurally rendered with Canvas 2D*

![Status](https://img.shields.io/badge/Status-In_Development-yellow)
![Node.js](https://img.shields.io/badge/Node.js-25.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 Play Now

**Live Demo:** [https://jbdevprimary.github.io/otterblade-odyssey](https://jbdevprimary.github.io/otterblade-odyssey)

## 📖 Story

**Finn Riverstone**, a humble river otter, inherits the legendary **Otterblade** and must defend **Willowmere Hearthhold** abbey from **Zephyros**, the storm hawk lord, and his cold-hearted Galeborn army.

Journey through 10 chapters from Finn's cottage to the final confrontation with Zephyros, experiencing a wordless narrative told through gesture, expression, music, and environmental storytelling.

## 🏗️ Architecture

### Why Vanilla JavaScript?

**The POC proved it works:**
- `pocs/otterblade_odyssey.html` - 2,847 lines, Matter.js physics, beautiful procedural rendering, **60fps stable**
- `pocs/clean-ddl-first.html` - 267 lines, DDL-driven, procedural otter, **WORKS**

**Previous attempts that didn't work:**
- React Three Fiber + Rapier + TypeScript + Miniplex ECS (20,000+ lines) - over-engineered, couldn't progress past level 0

**Vanilla JS approach priorities:**
1. **Simple** - Proven patterns from POCs, no unnecessary frameworks
2. **Fast** - Direct Canvas 2D rendering, no virtual DOM overhead
3. **Maintainable** - JavaScript modules, clear separation of concerns
4. **Performant** - 8MB memory vs 120MB with React, 60fps by default
5. **Procedural** - Canvas-based rendering, no static assets, brand-consistent

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Language** | Vanilla JavaScript (ES2022) | No TypeScript compilation overhead |
| **Physics Engine** | Matter.js 0.20 | 2D rigid body physics, collision detection |
| **AI/Pathfinding** | YUKA 0.9 | Enemy AI, steering behaviors, FSM |
| **State Management** | Vanilla JS (20 lines) | Game state with localStorage persistence |
| **Audio** | Howler.js | Sound playback, spatial audio, music |
| **Touch Controls** | Custom implementation | Mobile-first touch joystick |
| **Procedural Graphics** | Canvas 2D API | Procedural character rendering, parallax |
| **Bundler** | esbuild | Fast JavaScript bundling for production |
| **Dev Server** | Python SimpleHTTPServer | No build step in development |

### Project Structure

```
otterblade-odyssey/
├── game/src/                  # Vanilla JS game
│   ├── index.html             # Single HTML entry point
│   ├── main.js                # Game initialization
│   ├── ui/
│   │   └── styles.css         # Warm Redwall-inspired CSS
│   ├── core/
│   │   ├── Game.js            # Main game loop controller
│   │   ├── Physics.js         # Matter.js engine wrapper
│   │   ├── Renderer.js        # Canvas 2D rendering pipeline
│   │   └── Camera.js          # Camera follow system
│   ├── entities/
│   │   ├── Player.js          # Finn (otter protagonist)
│   │   ├── Enemy.js           # Galeborn enemies
│   │   ├── Platform.js        # Platforms, walls, hazards
│   │   └── Item.js            # Collectibles, powerups
│   ├── systems/
│   │   ├── collision.js       # Collision handlers
│   │   ├── ai.js              # YUKA AI manager
│   │   ├── input.js           # Unified input (keyboard, gamepad, touch)
│   │   └── audio.js           # Howler.js audio manager
│   ├── rendering/
│   │   ├── finn.js            # Procedural Finn rendering (from POC)
│   │   ├── enemies.js         # Procedural enemy rendering
│   │   ├── parallax.js        # Parallax backgrounds
│   │   └── particles.js       # Particle effects
│   ├── ddl/
│   │   ├── loader.js          # Load chapter JSON manifests
│   │   └── builder.js         # Build levels from DDL
│   └── state/
│       └── store.js           # Vanilla JS state management
├── client/src/data/
│   ├── manifests/             # JSON DDL definitions
│   │   ├── chapters/          # 10 chapter definitions
│   │   │   ├── chapter-0-the-calling.json
│   │   │   ├── chapter-1-abbey-approach.json
│   │   │   └── ...
│   │   ├── schema/            # JSON schemas
│   │   ├── enemies.json
│   │   ├── sounds.json
│   │   └── sprites.json
│   └── approvals.json         # Asset approval tracking
├── pocs/                      # Proof of concept files
│   ├── otterblade_odyssey.html    # 2,847 lines, Matter.js POC (PROVEN)
│   └── clean-ddl-first.html       # 267 lines, DDL-driven POC
├── docs/                      # Documentation
│   ├── COMPLETE_JOURNEY_VALIDATION.md
│   └── WORLD.md               # Lore and story
├── e2e/                       # Playwright end-to-end tests
│   ├── automated-playthroughs/
│   └── complete-game-journey.spec.ts
├── BRAND.md                   # Visual style guide
├── CLAUDE.md                  # Claude agent instructions
├── AGENTS.md                  # Technical patterns for AI agents
├── BUILD_PLAN_TONIGHT.md      # 6-hour build plan
├── VANILLA_JS_PLAN.md         # Why vanilla JS is superior
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 25.x** (see `.nvmrc`)
- **pnpm 10.x** (package manager)

```bash
# Install Node.js 25.x (using nvm)
nvm install 25
nvm use 25

# Install pnpm
npm install -g pnpm@10.12.1

# Install dependencies
pnpm install

# Start development server (no build step!)
cd game/src
python3 -m http.server 8080

# Open browser to http://localhost:8080
```

### Development Commands

| Command | Description |
|---------|-------------|
| `python3 -m http.server 8080` | Start dev server (ES modules, no build) |
| `pnpm run build:game` | Build production bundle with esbuild |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm test:journey:mcp` | Complete game journey validation with video |

## 🎨 Brand & Visual Identity

**Otterblade Odyssey** follows a **warm, cozy-but-heroic** aesthetic inspired by Redwall.

### Visual Principles

- **Wordless Storytelling** - Pantomime tradition, no dialogue
- **Warm Palette** - Moss greens, honey golds, ember oranges, cool mist blues
- **Grounded Materials** - Stone, wood, cloth, leather, iron (no neon, no sci-fi)
- **Procedural Rendering** - Canvas-based character drawing, no static sprites
- **Storybook Art** - Painterly, warm lighting, atmospheric

### Color Palette

```css
/* Primary Colors */
--color-ember: #E67E22;      /* Warmth, firelight */
--color-gold: #F4D03F;       /* Candlelight, accents */
--color-moss: #8FBC8F;       /* Forest, growth */
--color-stone: #8B7355;      /* Abbey walls */
--color-mist: #A8DADC;       /* Morning fog */

/* Otter Fur */
--color-fur-base: #8B6F47;   /* Warm brown */
--color-fur-chest: #D4A574;  /* Lighter tan */
--color-fur-outline: #6B5330; /* Dark outline */
```

See **[BRAND.md](./BRAND.md)** for complete visual guidelines.

## 📜 10-Chapter Story Structure

| Chapter | Location | Biome | Quest |
|---------|----------|-------|-------|
| **0. Prologue** | Finn's Cottage | Village | "Answer the Call" |
| **1. Abbey Approach** | Forest Path | Forest/Bridge | "Reach the Gatehouse" |
| **2. Gatehouse** | Entry | Stone/Banners | "Cross the Threshold" |
| **3. Great Hall** | Interior | Hearth/Hall | "Defend the Great Hall" |
| **4. Library** | Scholar's Wing | Books/Maps | "Find the Ancient Map" |
| **5. Dungeon** | Catacombs | Stone/Torchlight | "Descend into the Depths" |
| **6. Courtyard** | Training Grounds | Gardens/Sun | "Rally the Defenders" |
| **7. Rooftops** | High Rafters | Wind/Bells | "Ascend to the Bells" |
| **8. Final Ascent** | High Keep | Storm/Zephyros | "Reach Zephyros" |
| **9. Epilogue** | Dawn Victory | Warmth Returns | "A New Dawn" |

Each chapter is defined in `client/src/data/manifests/chapters/` as JSON DDL (Data Definition Language).

## 🕹️ Gameplay

### Controls

**Keyboard:**
- **Arrow Keys / WASD** - Move left/right
- **Space** - Jump
- **K / X** - Attack (swing Otterblade)
- **L / C** - Roll/dodge
- **S / Down / Ctrl** - Slink (crouch)
- **E / Z** - Interact

**Gamepad:**
- **Left Stick / D-Pad** - Move
- **A Button** - Jump
- **X Button** - Attack
- **B Button** - Roll
- **Y Button** - Interact

**Touch (Mobile):**
- **Left Side** - Virtual joystick (left/right movement)
- **Right Side** - Action buttons (jump, attack, roll, interact)

### Core Mechanics

- **Prince of Persia-style Precision** - Wall climb, ledge grab, careful jumps
- **Sword Combat** - Attack, parry, combo timing
- **Warmth Mechanic** - Drain over time, restore at hearths
- **Ember Shards** - Collectibles for upgrades
- **Hearthstones** - Checkpoints and fast travel

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:unit:watch

# Coverage report
pnpm test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Complete game journey validation (with video capture)
pnpm test:journey:mcp
```

### Automated Playthroughs

All 10 chapters have automated AI player tests:

```bash
# Test all chapters
pnpm test:playthroughs:mcp

# Test specific chapter
pnpm test:playthrough:chapter 3
```

Tests use **YUKA** for AI navigation and **Playwright MCP** for browser automation with video capture.

## 📦 Deployment

### GitHub Pages

Deployment is handled by GitHub Actions workflow (`.github/workflows/cd.yml`).

**How it works:**
1. esbuild bundles `game/src/main.js` → `game/dist/game.js`
2. Copy `game/dist/` and `client/src/data/manifests/` to deployment directory
3. Deploy to GitHub Pages
4. Access game at: `https://jbdevprimary.github.io/otterblade-odyssey`

### Build for Production

```bash
# Bundle with esbuild
pnpm run build:game

# Output: game/dist/game.js (minified, <100KB target)
```

## 🎨 Asset Generation

Assets are generated from JSON manifests using **idempotent GenAI pipelines**.

### Asset Types

- **Sprites** - Finn animations, NPCs (OpenAI GPT-Image-1)
- **Enemies** - Galeborn types, Zephyros (OpenAI GPT-Image-1)
- **Cinematics** - 18 cinematic sequences (Google Veo 3.1)
- **Chapter Plates** - Storybook chapter intros (Google Imagen 3)
- **Backgrounds** - Parallax environment layers (Google Imagen 3)
- **Sounds** - Ambient, SFX, music (Freesound/Custom)

### Generate Assets

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites

# Audit for brand violations
pnpm audit:cinematics
```

**Approval Workflow:**

1. Generate assets
2. Review at `https://jbdevprimary.github.io/otterblade-odyssey/assets`
3. Approve via web gallery
4. Approved assets are locked (idempotent) and never regenerated

## 📚 Documentation

### Core Documentation

| File | Purpose |
|------|---------|
| [BRAND.md](./BRAND.md) | Complete visual style guide |
| [CLAUDE.md](./CLAUDE.md) | Claude agent instructions |
| [AGENTS.md](./AGENTS.md) | Technical patterns for AI agents |
| [BUILD_PLAN_TONIGHT.md](./BUILD_PLAN_TONIGHT.md) | 6-hour build plan |
| [VANILLA_JS_PLAN.md](./VANILLA_JS_PLAN.md) | Why vanilla JS is superior |
| [WORLD.md](./docs/WORLD.md) | Story, lore, and characters |
| [COMPLETE_JOURNEY_VALIDATION.md](./docs/COMPLETE_JOURNEY_VALIDATION.md) | Testing architecture |

### Code Patterns

#### Matter.js Physics Setup (from POC)

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

#### Procedural Finn Rendering (from POC)

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

#### Vanilla JS State Management (20 lines, no Zustand!)

```javascript
// game/src/state/store.js
export const store = {
  state: {
    currentChapter: 0,
    health: 5,
    shards: 0,
    bestScore: 0
  },

  listeners: new Set(),

  get() {
    return this.state;
  },

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
    this.save();
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  },

  save() {
    localStorage.setItem('otterblade', JSON.stringify(this.state));
  },

  load() {
    const saved = localStorage.getItem('otterblade');
    if (saved) this.state = JSON.parse(saved);
  }
};

// Usage - same API as Zustand, zero dependencies
import { store } from './state/store.js';

store.set({ health: 4 });
store.subscribe(state => console.log('Health:', state.health));
```

## 🤝 Contributing

### Development Workflow

1. **Read Documentation** - Start with [CLAUDE.md](./CLAUDE.md), [BRAND.md](./BRAND.md), [BUILD_PLAN_TONIGHT.md](./BUILD_PLAN_TONIGHT.md)
2. **Check POCs** - Review `pocs/otterblade_odyssey.html` for proven patterns
3. **Follow Brand** - Maintain warm, Redwall-inspired aesthetic
4. **Test Thoroughly** - Run `pnpm test:journey:mcp` before submitting
5. **Document Changes** - Update relevant .md files

### Code Style

- **Package Manager:** `pnpm` ONLY (never npm/yarn)
- **Formatting:** Biome (`pnpm format`)
- **Linting:** Biome (`pnpm lint`)
- **Language:** Vanilla JavaScript (no TypeScript)
- **Procedural Graphics** - Canvas 2D, no static PNG/MP4 imports
- **ES2022 Target** - For modern JavaScript features

### Common Mistakes to Avoid

1. ❌ Using npm/yarn instead of pnpm
2. ❌ Importing static PNG/MP4 assets (use procedural rendering from POC)
3. ❌ Adding neon/sci-fi aesthetics (stay grounded, warm, Redwall-inspired)
4. ❌ Over-engineering with frameworks (vanilla JS is the correct path)
5. ❌ Skipping tests before pushing

## 📊 Performance Comparison

### React Three Fiber Version (Abandoned)
- **Memory:** 120MB (growing to crash)
- **Bundle Size:** 1.2MB
- **FPS:** 15-25 (unstable with drops)
- **Lines of Code:** 20,000+
- **Status:** Broken, can't progress past level 0

### Vanilla JS Version (Current)
- **Memory:** 8MB (stable)
- **Bundle Size:** <100KB (target)
- **FPS:** 60 (stable)
- **Lines of Code:** ~3,000 (based on POC)
- **Status:** POC proven, in development

**15x less memory, 12x smaller bundle, 3x better FPS, 7x less code.**

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- **Brian Jacques** - Redwall series inspiration
- **Matter.js** - Excellent 2D physics engine
- **YUKA** - AI/pathfinding library
- **Howler.js** - Audio library

## 🔗 Links

- **Live Demo:** [https://jbdevprimary.github.io/otterblade-odyssey](https://jbdevprimary.github.io/otterblade-odyssey)
- **Asset Gallery:** [https://jbdevprimary.github.io/otterblade-odyssey/assets](https://jbdevprimary.github.io/otterblade-odyssey/assets)
- **Repository:** [https://github.com/jbdevprimary/otterblade-odyssey](https://github.com/jbdevprimary/otterblade-odyssey)

---

**"The blade serves the hearth. The code serves the story."**

*Built with 🦦 and ❤️ by Jon Bogaty*
