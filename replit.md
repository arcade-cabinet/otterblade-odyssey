# Otterblade Odyssey: Zephyros Rising

## Overview

Otterblade Odyssey: Zephyros Rising is a production-grade React 2D side-scrolling platformer set in the unique world of Willowmere Hearthhold. Features Prince of Persia-style precision platforming with warm, cozy emotional tone. The game uses rapier2d-compat physics, Miniplex ECS, JSON-based content with Zod validation, and mobile-first touch controls.

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
/attached_assets/       # Generated images
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

## Recent Changes

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
