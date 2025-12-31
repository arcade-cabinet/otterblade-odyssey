# Otterblade Odyssey: Zephyros Rising

## Overview

Otterblade Odyssey: Zephyros Rising is a production-grade React 2D side-scrolling platformer set in the unique world of Willowmere Hearthhold. Features Prince of Persia-style precision platforming with warm, cozy emotional tone. The game uses rapier2d-compat physics, Miniplex ECS, JSON-based content with Zod validation, and mobile-first touch controls.

## Runtime Requirements

| Requirement | Version | Source |
|-------------|---------|--------|
| **Node.js** | 25.x | `.nvmrc` |
| **pnpm** | 10.x | `package.json` |
| **TypeScript** | ES2022 target | `tsconfig.json` |

All environments (local, CI, Replit) are aligned via `.nvmrc`.

## User Preferences

- Preferred communication style: Simple, everyday language
- Package manager: **pnpm** (not npm/yarn)
- Visual style: Willowmere Hearthhold aesthetic (see BRAND.md, WORLD.md)
- Code quality: Strict linting with Biome, max 300 lines per file, no duplicates

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript (ES2022 target)
- **Build Tool**: Vite with hot module replacement
- **Rendering**: @react-three/fiber in orthographic 2D mode
- **Physics Engine**: @dimforge/rapier2d-compat (pure 2D physics)
- **ECS**: Miniplex + miniplex-react for entity management
- **State Management**: Zustand for game state
- **Data Validation**: Zod schemas for JSON content
- **Styling**: Tailwind CSS v4 for HUD/UI overlays
- **UI Components**: shadcn/ui component library with Radix primitives
- **Linting**: Biome (strict mode)

### Game Architecture
- 2D orthographic rendering with sprite-based graphics
- Physics logic handled by rapier2d-compat
- Content defined in JSON files with typed Zod loaders
- Player controls stored in Zustand to avoid React re-renders
- ECS systems handle movement, gravity, health, and cleanup
- 10-chapter story set in Willowmere Hearthhold

### 10-Chapter Story Progression

| # | Chapter | Setting | Quest |
|---|---------|---------|-------|
| 0 | Prologue | Otter's village | "Answer the Call" |
| 1 | Abbey Approach | Forest, bridge | "Reach the Gatehouse" |
| 2 | Gatehouse | Entry, threshold | "Cross the Threshold" |
| 3 | Great Hall | Interior, oath | "Defend the Great Hall" |
| 4 | Library | Maps, secrets | "Find the Ancient Map" |
| 5 | Dungeon | Catacombs | "Descend into the Depths" |
| 6 | Courtyard | Gardens, rally | "Rally the Defenders" |
| 7 | Rooftops | Bells, rafters | "Ascend to the Bells" |
| 8 | Final Ascent | High keep | "Reach Zephyros" |
| 9 | Epilogue | Victory, dawn | "A New Dawn" |

### Backend Architecture
- Express.js server with TypeScript
- In-memory storage implementation (MemStorage class)
- Drizzle ORM configured for PostgreSQL (schema defined but database optional)
- Static file serving for production builds

### Project Structure
```
/client/src/
  ├── data/             # JSON content files
  │   ├── chapters.json # Chapter definitions
  │   ├── biomes.json   # Visual environment configs
  │   └── README.md     # Data architecture docs
  ├── game/             # Core game logic
  │   ├── data/         # Zod loaders for JSON validation
  │   ├── ecs/          # Miniplex ECS (world, systems, renderers)
  │   ├── Player.tsx    # Player controller with Rapier2D physics
  │   ├── Physics2D.tsx # 2D physics wrapper
  │   ├── Level.tsx     # Level generation
  │   ├── store.ts      # Zustand game state
  │   └── constants.ts  # Loaded from JSON via typed loaders
  ├── components/
  │   ├── hud/          # UI overlays (HUD, menus, touch controls)
  │   └── ui/           # Reusable shadcn/ui components
  └── pages/            # Route pages
/server/                # Express server and API routes
/shared/                # Shared TypeScript schemas (Drizzle + Zod)
/attached_assets/       # Generated images and videos
/proofs/                # Sprite sheet testing package (port 5001)
```

### Key Design Patterns
- **ECS Architecture**: Miniplex entities with component queries for efficient updates
- **State Centralization**: All game state flows through Zustand store
- **Collision Groups**: Bitwise collision filtering for physics (PLAYER, WORLD, ENEMY, etc.)
- **Procedural Generation**: Hash-based deterministic level generation
- **Parallax Rendering**: 3-layer depth backgrounds using generated biome images

## External Dependencies

### Core Runtime Dependencies
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/rapier**: Rapier physics engine integration
- **@react-three/drei**: Three.js helper components
- **@react-three/postprocessing**: Visual effects (bloom, vignette)
- **@jbcom/strata**: Procedural graphics (sky, fog, vegetation)
- **miniplex**: Entity Component System for game entities
- **miniplex-react**: React bindings for Miniplex
- **zustand**: Lightweight state management
- **three**: 3D graphics library (peer dependency)
- **yuka**: Game AI library (peer dependency for Strata)

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **@radix-ui/***: Accessible UI primitives
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library
- **framer-motion**: Animation library

### Development and Testing
- **vite**: Build tool and dev server
- **@biomejs/biome**: Linting and formatting
- **vitest**: Unit testing framework
- **@playwright/test**: End-to-end testing
- **@testing-library/react**: React component testing utilities

### Database (Optional)
- **drizzle-orm**: TypeScript ORM
- **drizzle-kit**: Database migration tooling
- **pg**: PostgreSQL client (requires DATABASE_URL environment variable)

### Server
- **express**: HTTP server framework
- **express-session**: Session management

## Commands

```bash
# Development
pnpm run dev          # Start dev server on port 5000

# Production
pnpm run build        # Build for production
pnpm run start        # Start production server

# Testing
pnpm run test         # Run Vitest unit tests
pnpm playwright test  # Run Playwright E2E tests (headless)
PLAYWRIGHT_MCP=true pnpm playwright test  # Full WebGL tests with GPU
pnpm playwright test --ui  # Interactive test UI

# Database
pnpm run db:push      # Push schema to database
```

## Deployment

### Replit Deployment (Recommended)
Use Replit's built-in deployment - click "Deploy" in the UI.

### Render.com Deployment
Push to GitHub, then connect Render to the repo. The `render.yaml` configures:
- Static site with pnpm build
- Security headers
- Asset caching
- SPA rewrites

## Brand Guidelines

See `BRAND.md` for complete visual style guide including:
- Willowmere Hearthhold aesthetic (not Redwall - unique world)
- Color palettes per biome
- Character and enemy design requirements
- UI/UX mobile-first guidelines
- Cutscene and chapter plate specifications

## Testing Strategy

### Playwright E2E Tests
The Playwright config supports two modes:

1. **Headless Mode** (default): Uses SwiftShader for software WebGL
   - Runs in CI/limited environments
   - GPU-dependent tests are skipped

2. **MCP Mode** (`PLAYWRIGHT_MCP=true`): Full GPU support
   - Headed browser with hardware acceleration
   - Visual regression testing with screenshot comparison
   - All WebGL tests enabled

### Test Files
- `e2e/game.spec.ts` - Core game tests (page load, canvas, HUD)
- Visual regression tests use 20% diff tolerance for WebGL variations

## Asset Generation System

### Architecture Overview

The asset generation system uses a **manifest-driven, idempotent pipeline** powered by the `@otterblade/dev-tools` package. This ensures all assets are tracked, validated, and aligned with the brand guidelines.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ASSET GENERATION FLOW                            │
│                                                                     │
│  Manifests (JSON)  →  dev-tools CLI  →  AI Providers  →  Assets    │
│                                                                     │
│  client/src/data/     packages/        OpenAI GPT-Image-1          │
│  manifests/*.json     dev-tools/       Google Veo 3.1              │
│                       src/cli.ts       Google Imagen 3              │
└─────────────────────────────────────────────────────────────────────┘
```

### Manifest System

All assets are defined in JSON manifest files that serve as the single source of truth:

| Manifest File | Category | Provider | Description |
|---------------|----------|----------|-------------|
| `sprites.json` | sprites | OpenAI | Player sprite sheets |
| `enemies.json` | enemy-sprites | OpenAI | Enemy sprite sheets (5 types) |
| `cinematics.json` | cinematics | Google Veo 3.1 | Video cutscenes (10 chapters) |
| `scenes.json` | scenes | Google Imagen 3 | Parallax backgrounds (8 biomes) |

**Manifest Location**: `client/src/data/manifests/`

### Asset Status Tracking

Each asset in a manifest has a status field:

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Not yet generated | Will be generated on next run |
| `complete` | Asset exists and is valid | Skipped unless `--force` |
| `needs_regeneration` | Exists but has issues | Will be regenerated with reason |

### dev-tools CLI Commands

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites
pnpm --filter @otterblade/dev-tools cli -- --category cinematics

# Dry run (preview what would be generated)
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration of specific asset
pnpm --filter @otterblade/dev-tools cli -- --force --id intro_cinematic

# Rate-limited generation (for cost control)
pnpm --filter @otterblade/dev-tools cli -- --max-items 3
```

### GitHub Actions Integration

The `assets.yml` workflow automates asset generation:

```bash
# Trigger via GitHub Actions UI:
# Actions → Generate Assets → Run workflow

# Options:
# - category: sprites, enemies, cinematics, scenes, or all
# - force: Regenerate existing assets
# - dry_run: Preview only
# - max_items: Limit generation count (cost control)
```

**Cost Estimates**:
- Sprites (4 items): ~$0.16-0.32
- Enemies (5 items): ~$0.20-0.40
- Cinematics (10 items): ~$2.50
- Scenes (8 items): ~$0.24

### Provider Selection

| Asset Type | Best Provider | Why |
|------------|--------------|-----|
| Sprite sheets | OpenAI GPT-Image-1 | Transparency, grid layout, masking |
| Player animations | OpenAI GPT-Image-1 | Consistent character across frames |
| Cinematics | Google Veo 3.1 | Native audio, longer duration |
| Chapter plates | Google Imagen 3 | Painterly style, wide aspect |
| Parallax backgrounds | Google Imagen 3 | Scene composition, depth |

### Brand Compliance

All generation prompts automatically enforce brand guidelines from `BRAND.md`:

**MUST HAVE:**
- Anthropomorphic woodland animals ONLY
- Warm storybook aesthetic (Willowmere Hearthhold)
- Grounded materials (fur, cloth, leather, iron, stone)
- Protagonist is Finn the otter warrior

**MUST AVOID:**
- Human characters (NO knights, villagers, soldiers)
- Neon/sci-fi/horror elements
- Glowing energy weapons
- Anime/JRPG styling

### Validation Commands

```bash
# Validate all required assets exist
pnpm validate:assets

# Audit cinematics for brand violations
pnpm audit:cinematics

# Analyze individual sprite quality
pnpm analyze:sprite path/to/sprite.png

# Analyze video for brand compliance
pnpm analyze:video path/to/video.mp4
```

### Asset Storage

```
attached_assets/
├── generated_images/
│   ├── sprites/           # Sprite sheets (PNG with transparency)
│   └── chapter-plates/    # Chapter illustrations
│
├── generated_videos/      # Cinematic videos (MP4)

client/src/assets/images/
└── parallax/              # Parallax backgrounds (PNG)
```

### Importing Assets

Always use the `@assets` alias in Vite:

```tsx
// ✅ CORRECT
import chapterPlate from "@assets/images/chapter-plates/prologue_village_chapter_plate.png";
import introVideo from "@assets/generated_videos/intro_cinematic_otter's_journey.mp4";

// ❌ WRONG - Never use relative paths to attached_assets
import bg from "../attached_assets/generated_images/...";
```

### Proofs Package

A separate testing package at `/proofs/` provides sprite sheet validation without WebGL:

```bash
cd proofs && pnpm install && pnpm dev  # Runs on port 5001
```

Features:
- Sprite manifest viewer
- Animation frame player with configurable FPS
- Chroma key background removal tool

### Adding New Assets

1. **Define in manifest**: Add asset entry to appropriate manifest JSON
2. **Set status**: Use `pending` for new assets
3. **Run generation**: `pnpm --filter @otterblade/dev-tools cli`
4. **Verify brand compliance**: Check for violations
5. **Update status**: Change to `complete` after validation

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "No API keys configured" | Set `OPENAI_API_KEY` and/or `GEMINI_API_KEY` |
| "Human characters detected" | Asset marked `needs_regeneration` with reason |
| Generation timeout | Videos can take 5-10 minutes; check Veo polling |
| Wrong visual style | Check prompts.ts for style directives |

## CI/CD Pipeline

### Continuous Integration (ci.yml)

| Job | Steps |
|-----|-------|
| **Build & Lint** | Checkout → pnpm install → lint → typecheck → test:coverage → build |
| **E2E Tests** | Download artifacts → Playwright install → test:e2e |
| **SonarQube** | Code quality analysis (if secrets configured) |

### Continuous Deployment (cd.yml)

| Job | Trigger |
|-----|---------|
| **Node.js CD** | Push to main, release published |
| **Deploy to Pages** | After build success |
| **Sync Docs** | After deploy success |

### Asset Generation (assets.yml)

| Trigger | Description |
|---------|-------------|
| `workflow_dispatch` | Manual trigger with category, force, dry_run, max_items inputs |
| Creates PR | With generated assets and brand compliance checklist |

### Key Workflows

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint, typecheck, test, build |
| `cd.yml` | Deploy to GitHub Pages |
| `assets.yml` | AI-powered asset generation |
| `ai-reviewer.yml` | AI code review on PRs |
| `ecosystem-*.yml` | Multi-repo orchestration |

## Recent Changes

- **2025-12-31**: Upgraded to Node.js 25.x (latest stable) across all environments
- **2025-12-31**: Merged replit.nix into .replit, removed separate nix file
- **2025-12-31**: Added .nvmrc for consistent Node.js version alignment
- **2025-12-31**: Ran pnpm upgrade with Node.js 25, updated testing libraries
- **2025-12-31**: Updated all GitHub Actions to latest SHA-pinned versions
- **2025-12-31**: Created comprehensive asset generation documentation in replit.md
- **2025-12-31**: Added asset_agent.md with full generation workflow docs
- **2025-12-31**: Updated CLAUDE.md and AGENTS.md with manifest system details
- **2025-12-31**: Enhanced gameplay_agent.md and render_agent.md
- **2024-12-31**: Generated all 8 chapter opening cinematics and 5 boss arrival videos
- **2024-12-31**: Created proofs/ package for sprite sheet testing without WebGL
- **2024-12-31**: Generated missing parallax backgrounds (village morning, new dawn hall)
- **2024-12-31**: Created comprehensive asset ledger (assets.json) with generation tracking
- **2024-12-31**: Created strict biome.json with Biome 2.3.10 linting rules
- **2024-12-31**: Refactored constants.ts to use typed JSON loaders with error handling
- **2024-12-31**: Updated AGENTS.md with comprehensive quality standards
- **2024-12-31**: Removed obsolete 3D materials and ParallaxBackground component
- **2024-12-31**: Fixed TypeScript errors in storySystem.ts with NonNullable types
- **2024-12-31**: Created JSON-based data system with Zod validation
- **2024-12-31**: Refactored from 3D to 2D architecture (rapier2d-compat)
- **2024-12-31**: Established Willowmere Hearthhold world identity in WORLD.md
- **2024-12-31**: Generated all 10 chapter plates and intro/outro videos
- **2024-12-31**: Integrated Miniplex ECS for entity management
- **2024-12-31**: Fixed TypeScript target to ES2022 for query iteration
