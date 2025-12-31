# Otterblade Odyssey: Zephyros Rising

## Overview

Otterblade Odyssey is a production-grade React 2.5D platformer game inspired by the woodland-epic adventures of Redwall. Players control a mystical otter warrior navigating treacherous biomes, defeating bosses, and collecting shards. The game features Rapier physics, Miniplex ECS architecture, procedural generation with Strata, and mobile-first touch controls.

## User Preferences

- Preferred communication style: Simple, everyday language
- Package manager: **pnpm** (not npm)
- Visual style: Redwall-inspired woodland-epic (see BRAND.md)

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript (ES2022 target)
- **Build Tool**: Vite with hot module replacement
- **3D Rendering**: @react-three/fiber (React renderer for Three.js)
- **3D Utilities**: @react-three/drei for helper components
- **Physics Engine**: @react-three/rapier (React bindings for Rapier physics)
- **ECS**: Miniplex + miniplex-react for entity management
- **State Management**: Zustand for game state (health, score, controls, checkpoints)
- **Procedural Graphics**: @jbcom/strata for sky, fog, vegetation
- **Styling**: Tailwind CSS v4 for HUD/UI overlays
- **UI Components**: shadcn/ui component library with Radix primitives

### Game Architecture
- All 3D components live within the Canvas context from react-three-fiber
- Physics logic is handled inside RigidBody components using Rapier hooks
- Per-frame logic uses the useFrame hook from react-three-fiber
- Player controls are stored in Zustand to avoid React re-renders during gameplay
- ECS systems handle movement, gravity, health, and cleanup
- Procedural level generation creates platforms, enemies, and collectibles
- Six distinct biomes with Redwall-themed progression

### Biomes (Story Progression)
1. **Abbey Exterior** - Forest approach, bridge, gatehouse
2. **Abbey Interior** - Great hall, library, cloisters, kitchens
3. **Dungeon/Catacombs** - Stone, torchlight, damp, roots
4. **Courtyard/Gardens** - Sunlight, banners, training yard
5. **Rooftops/Rafters** - Wind, height, bells, shingles
6. **Outer Ruins/River Path** - Mossy remnants, fog

### Backend Architecture
- Express.js server with TypeScript
- In-memory storage implementation (MemStorage class)
- Drizzle ORM configured for PostgreSQL (schema defined but database optional)
- Static file serving for production builds

### Project Structure
```
/client/src/
  ├── game/           # Core game logic
  │   ├── ecs/        # Miniplex ECS (world, systems, renderers)
  │   ├── Player.tsx  # Player controller with Rapier physics
  │   ├── Level.tsx   # Level generation and environment
  │   ├── store.ts    # Zustand game state
  │   └── constants.ts # Biomes, collision groups, dimensions
  ├── components/
  │   ├── hud/        # UI overlays (HUD, menus, touch controls)
  │   └── ui/         # Reusable shadcn/ui components
  └── pages/          # Route pages (Home)
/server/              # Express server and API routes
/shared/              # Shared TypeScript schemas (Drizzle + Zod)
/attached_assets/     # Generated images (parallax backgrounds, chapter plates)
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
pnpm run test:e2e     # Run Playwright E2E tests

# Database
pnpm run db:push      # Push schema to database
```

## Brand Guidelines

See `BRAND.md` for complete visual style guide including:
- Redwall-inspired woodland-epic aesthetic
- Color palettes per biome
- Character and enemy design requirements
- UI/UX mobile-first guidelines
- Cutscene and chapter plate specifications

## Recent Changes

- **2024-12-31**: Integrated Miniplex ECS for entity management
- **2024-12-31**: Added parallax background renderer with generated biome images
- **2024-12-31**: Updated to pnpm package manager
- **2024-12-31**: Fixed TypeScript target to ES2022 for query iteration
- **2024-12-31**: Created BRAND.md style guide for Redwall aesthetic
