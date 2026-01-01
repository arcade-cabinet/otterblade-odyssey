# GitHub Copilot Instructions for Otterblade Odyssey

## Project Overview

Otterblade Odyssey is a React 2.5D platformer with Redwall-inspired woodland-epic aesthetics. This document configures Copilot for optimal code suggestions.

> **Note**: See `IMPLEMENTATION.md` for planned Canvas 2D + Matter.js migration. Current production code uses React Three Fiber + Rapier physics.

## Package Manager

**Use pnpm exclusively.** Never suggest npm or yarn commands.

```bash
pnpm install
pnpm add <package>
pnpm run dev
pnpm run build
```

## Code Style

### TypeScript Configuration
- Target: ES2022 (required for Miniplex)
- Strict mode enabled
- Path alias: `@assets` → `attached_assets/`

### Import Patterns
```typescript
// React Three Fiber
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CuboidCollider, useRapier } from "@react-three/rapier";
import { Text, OrbitControls, Environment } from "@react-three/drei";

// ECS
import { world, queries, type Entity } from "@/game/ecs/world";

// State
import { useStore } from "@/game/store";

// Assets - always use @assets alias
import chapterPlate from "@assets/generated_images/prologue_village_chapter_plate.png";
```

### Entity Component System (Miniplex)
```typescript
// Define entities with optional components
export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  enemy?: { type: string };
};

// Query pattern - use for...of iteration
for (const entity of queries.moving) {
  entity.position.x += entity.velocity.x * dt;
}

// Entity removal - collect first, then remove
const toRemove: Entity[] = [];
for (const entity of queries.cleanup) {
  if (entity.position.y < -10) toRemove.push(entity);
}
toRemove.forEach(e => world.remove(e));
```

### Physics (Rapier)
```typescript
// RigidBody types: "dynamic" | "fixed" | "kinematicPosition" | "kinematicVelocity"
<RigidBody type="dynamic" position={[0, 5, 0]} collisionGroups={COLLISION_GROUPS.PLAYER}>
  <CuboidCollider args={[0.5, 1, 0.5]} />
</RigidBody>

// Collision groups are bitwise
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  WORLD: 0x0002,
  ENEMY: 0x0004,
  COLLECTIBLE: 0x0008,
};
```

### State Management (Zustand)
```typescript
export const useStore = create<GameState>((set, get) => ({
  health: 5,
  shards: 0,
  
  takeDamage: (amount) => set((s) => ({ 
    health: Math.max(0, s.health - amount) 
  })),
  
  collectShard: () => set((s) => ({ 
    shards: s.shards + 1 
  })),
}));
```

## File Structure

```
client/src/
├── game/
│   ├── ecs/
│   │   ├── world.ts      # Entity types, world, queries
│   │   ├── systems.ts    # Movement, gravity, cleanup
│   │   └── SpriteRenderer.tsx
│   ├── Player.tsx        # Player controller
│   ├── Level.tsx         # Level generation
│   ├── store.ts          # Zustand state
│   └── constants.ts      # Biomes, collision groups
├── components/
│   ├── hud/              # HUD overlays
│   └── ui/               # shadcn/ui components
└── pages/                # Route pages

attached_assets/
├── generated_images/     # Chapter plates, backgrounds
└── generated_videos/     # Intro/outro videos
```

## Biome System

```typescript
export const BIOMES = [
  { name: "prologue", quest: "Answer the Call" },
  { name: "abbey_approach", quest: "Reach the Gatehouse" },
  { name: "gatehouse", quest: "Cross the Threshold" },
  { name: "great_hall", quest: "Defend the Great Hall" },
  { name: "library", quest: "Find the Ancient Map" },
  { name: "dungeon", quest: "Descend into the Depths" },
  { name: "courtyard", quest: "Rally the Defenders" },
  { name: "rooftops", quest: "Ascend to the Bells" },
  { name: "final_ascent", quest: "Reach Zephyros" },
  { name: "epilogue", quest: "A New Dawn" },
];

// Always bounds-check biome index
const biomeIndex = Math.max(0, Math.min(BIOMES.length - 1, Math.abs(index)));
```

## Testing Patterns

```typescript
// Vitest unit tests
import { describe, it, expect } from "vitest";

describe("GameStore", () => {
  it("should decrease health on damage", () => {
    const store = useStore.getState();
    store.takeDamage(1);
    expect(useStore.getState().health).toBe(4);
  });
});

// Playwright E2E
test("game canvas renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
});
```

## Avoid These Patterns

```typescript
// WRONG: npm commands
npm install  // Use: pnpm install

// WRONG: forEach on queries
queries.moving.entities.forEach(...)  // Use: for (const e of queries.moving)

// WRONG: Direct asset paths
import bg from "../attached_assets/..."  // Use: @assets alias

// WRONG: Removing during iteration
for (const e of query) { world.remove(e); }  // Collect first

// WRONG: ES2021 target in tsconfig
"target": "ES2021"  // Must be ES2022
```

## Brand Compliance

When generating comments, strings, or UI text:
- Use warm, hopeful tone ("Rally the defenders" not "Kill all enemies")
- Reference woodland/abbey themes
- Avoid grimdark, sci-fi, or horror language

See `BRAND.md` for complete visual and narrative guidelines.
