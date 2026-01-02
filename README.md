# Otterblade Odyssey: Zephyros Rising

A 2.5D woodland-epic platformer built with Astro, Solid.js, and Matter.js. Follow Finn Riverstone, an otter warrior wielding the legendary Otterblade, as he defends Willowmere Hearthhold from the frost of Zephyros.

![Otterblade Odyssey](https://img.shields.io/badge/Status-In_Development-yellow)
![Node.js](https://img.shields.io/badge/Node.js-25.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎮 About

**Genre:** 2.5D Action Platformer
**Theme:** Redwall-inspired woodland epic
**Aesthetic:** Warm, cozy-but-heroic, storybook art
**Story:** 10 chapters from Finn's Cottage to Victory over Zephyros

### Core Pillars
- **Wordless Storytelling:** No dialogue - gesture, expression, music tell the tale
- **Procedural Generation:** Characters and effects rendered procedurally (no sprite sheets)
- **DDL-Driven:** All content defined in JSON manifests
- **Mobile-First:** Touch controls, responsive design, Capacitor native features

## 🚀 Quick Start

### Prerequisites
- **Node.js 25.x** (see `.nvmrc`)
- **pnpm 10.x** (NEVER use npm or yarn)

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev:game

# Build for production
pnpm run build:game

# Deploy to GitHub Pages
pnpm run deploy
```

## 🏗️ Architecture

### Technology Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Astro + Solid.js | Static site generation + reactive UI |
| Physics | Matter.js | 2D rigid body physics, collision |
| AI | YUKA | Pathfinding, steering behaviors |
| State | Zustand | Game state management |
| Audio | Howler.js / Tone.js | Sound effects and music |
| Controls | nipplejs | Touch joystick (mobile) |
| Build | esbuild | Fast JavaScript bundling |

### Project Structure
```
otterblade-odyssey/
├── game/                      # Main game (Astro + Solid.js)
│   ├── src/
│   │   ├── pages/
│   │   │   └── index.astro   # Game entry point
│   │   ├── components/
│   │   │   ├── GameCanvas.jsx # Solid.js game canvas wrapper
│   │   │   ├── HUD.jsx        # Heads-up display
│   │   │   ├── Menu.jsx       # Start/pause menus
│   │   │   └── ChapterPlate.jsx # Chapter transitions
│   │   ├── game/
│   │   │   ├── engine/        # Matter.js game loop
│   │   │   ├── entities/      # Player, enemies, platforms
│   │   │   ├── rendering/     # Procedural drawing functions
│   │   │   ├── ai/            # YUKA pathfinding
│   │   │   ├── audio/         # Howler.js integration
│   │   │   └── state/         # Zustand store
│   │   └── data/
│   │       └── manifests/     # JSON DDL files
│   └── public/                # Static assets
├── pocs/                      # Proof of concept files
│   ├── otterblade_odyssey.html  # Original Matter.js POC (2,847 lines)
│   └── clean-ddl-first.html     # DDL-first POC (267 lines)
├── docs/                      # Documentation
├── e2e/                       # Playwright tests
└── packages/
    └── dev-tools/             # Asset generation tools
```

## 🎨 Brand & Aesthetic

**Visual Style:** Warm storybook realism, Redwall-inspired
- Moss, stone, lantern light, cloth, leather
- NO neon, sci-fi, glowing energy, grimdark, or horror
- Subtle magic (firefly motes, not laser beams)

**Color Palette:**
- Warm greens (forest canopy, moss)
- Honey gold (candlelight, autumn leaves)
- Cool misty blues (dawn mist, shadows)

See `BRAND.md` for complete visual guidelines.

## 🗺️ The Journey

### 10 Chapters
| # | Chapter | Biome | Quest |
|---|---------|-------|-------|
| 0 | Prologue | Village | Answer the Call |
| 1 | Abbey Approach | Forest/Bridge | Reach the Gatehouse |
| 2 | Gatehouse | Entry | Cross the Threshold |
| 3 | Great Hall | Interior | Defend the Great Hall |
| 4 | Library | Interior | Find the Ancient Map |
| 5 | Dungeon | Catacombs | Descend into the Depths |
| 6 | Courtyard | Gardens | Rally the Defenders |
| 7 | Rooftops | Rafters | Ascend to the Bells |
| 8 | Final Ascent | High Keep | Reach Zephyros |
| 9 | Epilogue | Victory | A New Dawn |

See `docs/WORLD.md` for complete lore and story.

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Complete game journey with video capture
pnpm test:journey:mcp

# All chapter playthroughs
pnpm test:playthroughs
```

## 📦 DDL System

All game content is defined in JSON manifests:

```javascript
// Example: client/src/data/manifests/chapters/chapter-0.json
{
  "id": 0,
  "name": "Prologue: The Calling",
  "biome": "village",
  "quest": {
    "id": "answer_the_call",
    "title": "Answer the Call",
    "description": "Journey to Willowmere Hearthhold"
  },
  "levelDefinition": {
    "boundaries": [
      { "x": 0, "y": 450, "width": 1200, "height": 50 },
      { "x": 300, "y": 350, "width": 150, "height": 20 }
    ],
    "enemySpawns": [
      { "type": "scout", "x": 500, "y": 300 }
    ]
  }
}
```

Factory pattern loads DDL → instantiates Matter.js entities.

## 🎯 Development

### Commands
```bash
# Development
pnpm run dev:game              # Start Astro dev server
pnpm run dev:game -- --host    # Expose on network (mobile testing)

# Building
pnpm run build:game            # Build for production
pnpm run preview:game          # Preview production build

# Linting & Formatting
pnpm run lint                  # Biome linter
pnpm run format                # Biome formatter
pnpm run check                 # Lint + format

# Testing
pnpm test                      # Unit tests (Vitest)
pnpm test:e2e                  # E2E tests (Playwright)
pnpm test:journey              # Complete game playthrough

# Mobile (Capacitor)
pnpm cap:sync                  # Sync web → native
pnpm cap:run:android           # Run on Android device
```

### Agent Instructions
- **Claude:** See `CLAUDE.md` for complete instructions
- **GitHub Copilot:** See `.github/copilot-instructions.md`
- **General Agents:** See `AGENTS.md`

## 🚢 Deployment

### GitHub Pages (Automatic)
Pushing to `main` triggers automatic deployment:
1. Astro builds static site
2. Deployed to `https://your-username.github.io/otterblade-odyssey/`

### Manual Deploy
```bash
pnpm run build:game
pnpm run deploy
```

See `DEPLOYMENT.md` for advanced configuration.

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

1. Read `CLAUDE.md` and `BRAND.md` first
2. Follow the warm, cozy-but-heroic aesthetic
3. Use pnpm (never npm/yarn)
4. Procedural generation > static assets
5. Test with Playwright before submitting

## 📚 Documentation

- `CLAUDE.md` - Primary instructions for AI agents
- `BRAND.md` - Visual style guide
- `WORLD.md` - Story, lore, world building
- `IMPLEMENTATION.md` - Technical implementation guide
- `AGENTS.md` - Multi-agent patterns and handoffs
- `docs/` - Additional documentation

## 🎵 Audio

Audio manifests in `client/src/data/manifests/sounds.json`:
- Ambient tracks (18 total)
- Sound effects (combat, movement, environment)
- Music (chapter themes, boss themes)

Loaded dynamically via Howler.js/Tone.js.

## 📱 Mobile Support

Built mobile-first with Capacitor:
- Touch controls (nipplejs joystick)
- Haptic feedback
- Screen orientation lock
- Splash screen
- Native storage (Preferences API)

```bash
pnpm cap:init                  # Initialize Capacitor
pnpm cap:add:android           # Add Android platform
pnpm cap:sync                  # Sync web → native
pnpm cap:run:android           # Run on device
```

## 🐛 Known Issues

- [ ] CodeQL workflow needs workflow file permissions (cosmetic only)
- [ ] First load may require `pnpm install` to sync lockfile

## 📝 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- Inspired by Brian Jacques' **Redwall** series
- POC development proved procedural generation approach
- Community feedback shaped the wordless storytelling direction

---

**"The Everember never dies, so long as one heart remains to tend it."**
