# Otterblade Odyssey

## Overview

Otterblade Odyssey is a production-grade React-based 3D platformer game where players control a mystical otter warrior navigating treacherous biomes, defeating bosses, and collecting shards. The game is built with react-three-fiber for 3D rendering, cannon.js for physics, and Zustand for state management. It supports both desktop keyboard controls and mobile touch controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **3D Rendering**: @react-three/fiber (React renderer for Three.js)
- **3D Utilities**: @react-three/drei for helper components
- **Physics Engine**: @react-three/cannon (React bindings for cannon.js physics)
- **State Management**: Zustand for all game state (health, score, controls, checkpoints)
- **Styling**: Tailwind CSS v4 for HUD/UI overlays
- **UI Components**: shadcn/ui component library with Radix primitives

### Game Architecture
- All 3D components must live within the Canvas context from react-three-fiber
- Physics logic is handled inside Physics wrapper components using cannon hooks (useSphere, useBox)
- Per-frame logic uses the useFrame hook from react-three-fiber
- Player controls are stored in Zustand to avoid React re-renders during gameplay
- Procedural level generation creates platforms, enemies, and collectibles
- Four distinct biomes (Verdant, Crystal, Magma, Aether) with unique visual themes

### Backend Architecture
- Express.js server with TypeScript
- In-memory storage implementation (MemStorage class)
- Drizzle ORM configured for PostgreSQL (schema defined but database optional)
- Static file serving for production builds

### Project Structure
- `/client/src/game/` - Core game logic (Player, Level, Physics, store, constants)
- `/client/src/components/hud/` - UI overlay components (HUD, menus, touch controls)
- `/client/src/components/ui/` - Reusable shadcn/ui components
- `/server/` - Express server and API routes
- `/shared/` - Shared TypeScript schemas (Drizzle + Zod)
- `/agents/` - AI agent-specific instructions for gameplay and rendering
- `/tests/` - Unit tests (Vitest) and E2E tests (Playwright)

### Key Design Patterns
- **Component Isolation**: One file per major component, small and focused
- **State Centralization**: All game state flows through Zustand store
- **Collision Groups**: Bitwise collision filtering for physics (PLAYER, WORLD, ENEMY, etc.)
- **Procedural Generation**: Hash-based deterministic level generation

## External Dependencies

### Core Runtime Dependencies
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/cannon**: Physics engine integration
- **@react-three/drei**: Three.js helper components
- **@react-three/postprocessing**: Visual effects (bloom, vignette)
- **zustand**: Lightweight state management
- **@tanstack/react-query**: Data fetching (configured but minimal use)
- **three**: 3D graphics library (peer dependency)

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **@radix-ui/***: Accessible UI primitives
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

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