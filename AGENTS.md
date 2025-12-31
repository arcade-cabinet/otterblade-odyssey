# AI Agent Instructions for Otterblade Odyssey

This document provides comprehensive guidance for **all AI agents** (Claude, Copilot, Cursor, Windsurf, etc.) working on Otterblade Odyssey. Follow these instructions to maintain consistency and quality.

**Repository**: `github.com/jbdevprimary/otterblade-odyssey`

---

## Project Context

**Otterblade Odyssey: Zephyros Rising** is a production-grade React 2.5D platformer with a **Redwall-inspired woodland-epic** aesthetic. Think warm lantern light, mossy stone abbeys, brave woodland creatures—not neon sci-fi or grimdark horror.

### Technology Stack
| Layer | Technology |
|-------|------------|
| 3D Rendering | @react-three/fiber |
| Physics | @react-three/rapier |
| Entity Management | Miniplex + miniplex-react |
| State | Zustand |
| Procedural Graphics | @jbcom/strata |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix primitives |
| Package Manager | **pnpm** (not npm/yarn) |

---

## Critical Guidelines

### 1. Brand Consistency (MANDATORY)

**Always reference `BRAND.md` before generating visual content or making design decisions.**

| DO | DON'T |
|----|-------|
| Warm greens, honey gold, cool misty blues | Neon colors, electric blues |
| Mossy stone, lantern light, cloth, leather | Sci-fi aesthetics, glowing energy |
| Quiet heroism, storybook realism | Grimdark, horror, demons |
| Subtle magic (firefly motes) | Laser beams, energy weapons |

### 2. Package Manager: pnpm ONLY

```bash
# CORRECT
pnpm install
pnpm run dev
pnpm add package-name
pnpm run test

# WRONG - DO NOT USE
npm install
npm run dev
yarn add
```

### 3. Asset Imports Use @assets Alias

```typescript
// CORRECT
import chapterPlate from "@assets/generated_images/prologue_village_chapter_plate.png";
import introVideo from "@assets/generated_videos/intro_cinematic_otter's_journey.mp4";

// WRONG
import bg from "../attached_assets/generated_images/...";
```

### 4. TypeScript Target is ES2022

Required for Miniplex query iteration. Never downgrade.

---

## Architecture

### File Structure
```
client/src/game/
├── ecs/
│   ├── world.ts          # Entity types, world instance, queries
│   ├── systems.ts        # ECS systems (movement, gravity, etc.)
│   └── SpriteRenderer.tsx # Parallax and sprite rendering
├── Player.tsx            # Player controller with Rapier physics
├── Level.tsx             # Level generation and environment
├── store.ts              # Zustand state
├── constants.ts          # Biomes, collision groups
└── utils.ts              # Helper functions

attached_assets/
├── generated_images/     # Chapter plates, parallax backgrounds
└── generated_videos/     # Intro/outro cinematics
```

### 10-Chapter Story Structure

| # | Chapter | Biome | Quest | Assets |
|---|---------|-------|-------|--------|
| 0 | Prologue | Village | "Answer the Call" | prologue_village_chapter_plate.png |
| 1 | Abbey Approach | Forest/Bridge | "Reach the Gatehouse" | abbey_approach_chapter_plate.png |
| 2 | Gatehouse | Entry | "Cross the Threshold" | gatehouse_bridge_chapter_plate.png |
| 3 | Great Hall | Interior | "Defend the Great Hall" | great_hall_oath_chapter_plate.png |
| 4 | Library | Interior | "Find the Ancient Map" | library_map_table_chapter_plate.png |
| 5 | Dungeon | Catacombs | "Descend into the Depths" | dungeon_descent_chapter_plate.png |
| 6 | Courtyard | Gardens | "Rally the Defenders" | courtyard_rally_chapter_plate.png |
| 7 | Rooftops | Rafters | "Ascend to the Bells" | rooftop_wind_chapter_plate.png |
| 8 | Final Ascent | High Keep | "Reach Zephyros" | final_ascent_chapter_plate.png |
| 9 | Epilogue | Victory | "A New Dawn" | epilogue_victory_chapter_plate.png |

**Videos**: `intro_cinematic_otter's_journey.mp4`, `outro_victory_sunrise_scene.mp4`

---

## Code Patterns

### ECS Pattern (Miniplex)

```typescript
// client/src/game/ecs/world.ts
import { World } from "miniplex";

export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  enemy?: { type: "skirmisher" | "shielded" | "ranged" | "flyer" | "trap" | "elite" };
  health?: { current: number; max: number };
  collectible?: { type: "shard" | "health" };
};

export const world = new World<Entity>();

// Create queries for efficient filtering
export const queries = {
  moving: world.with("position", "velocity"),
  players: world.with("player", "position"),
  enemies: world.with("enemy", "position", "health"),
  collectibles: world.with("collectible", "position"),
};

// Iterate safely (requires ES2022 target)
for (const entity of queries.moving) {
  entity.position.x += entity.velocity.x * dt;
}

// Entity removal - collect first, remove after
const toRemove: Entity[] = [];
for (const entity of queries.cleanup) {
  if (entity.position.y < -10) toRemove.push(entity);
}
toRemove.forEach(e => world.remove(e));
```

### Physics with Rapier

```tsx
import { RigidBody, CuboidCollider } from "@react-three/rapier";

// Collision groups (bitwise)
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  WORLD: 0x0002,
  ENEMY: 0x0004,
  COLLECTIBLE: 0x0008,
  TRIGGER: 0x0010,
};

function Platform({ position, args }: PlatformProps) {
  return (
    <RigidBody type="fixed" position={position} collisionGroups={COLLISION_GROUPS.WORLD}>
      <CuboidCollider args={args} />
      <mesh>
        <boxGeometry args={[args[0] * 2, args[1] * 2, args[2] * 2]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </RigidBody>
  );
}
```

### State with Zustand

```typescript
// client/src/game/store.ts
import { create } from "zustand";

interface GameState {
  health: number;
  maxHealth: number;
  shards: number;
  currentBiome: number;
  checkpointPosition: { x: number; y: number };
  
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  collectShard: () => void;
  setCheckpoint: (pos: { x: number; y: number }) => void;
  advanceBiome: () => void;
}

export const useStore = create<GameState>((set, get) => ({
  health: 5,
  maxHealth: 5,
  shards: 0,
  currentBiome: 0,
  checkpointPosition: { x: 0, y: 0 },
  
  takeDamage: (amount) => set((s) => ({ 
    health: Math.max(0, s.health - amount) 
  })),
  heal: (amount) => set((s) => ({ 
    health: Math.min(s.maxHealth, s.health + amount) 
  })),
  collectShard: () => set((s) => ({ shards: s.shards + 1 })),
  setCheckpoint: (pos) => set({ checkpointPosition: pos }),
  advanceBiome: () => set((s) => ({ 
    currentBiome: Math.min(9, s.currentBiome + 1) 
  })),
}));
```

### Strata Procedural Graphics

```typescript
import { createCharacter, animateCharacter, updateFurUniforms, fbm, noise3D } from "@jbcom/strata";
import * as THREE from "three";

// Procedural terrain height
const height = noise3D(x * 0.1, 0, z * 0.1) * 5;
const detail = fbm(x * 0.3, 0, z * 0.3, 3) * 1.5;
const finalHeight = height + detail;

// Character creation with fur
const otter = createCharacter({
  skinColor: 0x8b6914,
  furOptions: {
    baseColor: new THREE.Color("#5d4420"),
    tipColor: new THREE.Color("#8b6914"),
    layerCount: 8,
    spacing: 0.015,
    windStrength: 0.3,
  },
  scale: 1.0,
});

// In useFrame loop:
animateCharacter(otter, elapsedTime);
updateFurUniforms(furGroup, elapsedTime);
```

---

## Mobile Controls

Touch controls use a diamond layout on the right side:
- **Jump** (top)
- **Attack** (right)
- **Crouch/Slide** (bottom)
- **Special/Interact** (left)

Movement buttons on the left side:
- **Left** / **Right**

All touch elements must have:
- `touch-action: none` to prevent browser gestures
- No hover dependency
- Large, thumb-friendly sizing (min 44px)

---

## Testing

```bash
# Unit tests with Vitest
pnpm run test

# E2E tests with Playwright (headless - for CI)
pnpm playwright test

# E2E tests with full WebGL support (requires GPU)
PLAYWRIGHT_MCP=true pnpm playwright test

# Interactive test UI
pnpm playwright test --ui

# Update visual regression snapshots
PLAYWRIGHT_MCP=true pnpm playwright test --update-snapshots
```

### Playwright Test Modes
- **Headless mode** (default): Uses SwiftShader for software WebGL, skips GPU-dependent tests
- **MCP mode** (`PLAYWRIGHT_MCP=true`): Full GPU, all tests including visual regression

### Writing E2E Tests
```typescript
const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";

test("should render canvas", async ({ page }) => {
  await page.goto("/");
  if (hasMcpSupport) {
    await expect(page.locator("canvas")).toBeVisible();
  } else {
    console.log("Canvas test skipped in headless mode");
  }
});

test("WebGL-only test", async ({ page }) => {
  test.skip(!hasMcpSupport, "Requires WebGL/MCP support");
  // ... full WebGL test code
});
```

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Using npm/yarn | Always use pnpm |
| Wrong asset paths | Use `@assets` alias |
| Query iteration with forEach | Use `for (const e of query)` |
| Entity removal during iteration | Collect first, remove after |
| Neon/sci-fi aesthetics | Check BRAND.md |
| ES2021 target | Must be ES2022+ |
| Biome index out of bounds | Use `Math.max(0, Math.min(9, index))` |

---

## Performance Guidelines

- Minimize React re-renders during gameplay
- Use `useFrame` for per-frame updates instead of `useEffect`
- Pre-create queries outside render functions
- Use instanced meshes for repeated geometry
- Keep ECS systems lightweight
- Dispose of Three.js resources on unmount

---

## Prompt Templates

### For Image Generation
```
Generate a [chapter plate / parallax background] for [chapter name].

Style: Storybook art, painterly, warm lighting, Redwall-inspired woodland-epic
Palette: [refer to BRAND.md biome colors]
Elements: [specific scene elements]
Negative: Neon, sci-fi, grimdark, demons, glowing energy weapons, anime, modern
```

### For Code Generation
```
Implement [feature] for Otterblade Odyssey.

Requirements:
- Use Miniplex ECS pattern
- Follow existing code style in [reference file]
- Maintain Redwall woodland-epic aesthetic
- Support mobile touch controls
- Use pnpm for any package operations
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `BRAND.md` | Complete visual style guide |
| `CLAUDE.md` | Claude-specific instructions |
| `.github/copilot-instructions.md` | Copilot configuration |
| `replit.md` | Project architecture (Replit-specific) |
| `client/src/game/ecs/world.ts` | Entity type definitions |
| `client/src/game/constants.ts` | Biome definitions |
| `client/src/game/store.ts` | Zustand state structure |
| `playwright.config.ts` | E2E test configuration |
