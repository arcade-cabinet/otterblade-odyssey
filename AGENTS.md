# AI Agent Instructions for Otterblade Odyssey

This document provides guidance for AI agents working on Otterblade Odyssey. Follow these instructions to maintain consistency and quality.

## Project Context

Otterblade Odyssey is a React 2.5D platformer with a **Redwall-inspired woodland-epic** aesthetic. The game uses:
- React Three Fiber for 3D rendering
- Rapier for physics
- Miniplex for entity management
- Zustand for state
- **pnpm** as package manager (not npm)

## Critical Guidelines

### 1. Brand Consistency (MANDATORY)
**Always reference `BRAND.md` before generating visual content or making design decisions.**

- **DO**: Warm greens, honey gold, cool misty blues, mossy stone, lantern light
- **DON'T**: Neon colors, sci-fi aesthetics, grimdark themes, demons, glowing energy

### 2. Package Manager
**Use pnpm, not npm.**

```bash
# Correct
pnpm install
pnpm run dev
pnpm add package-name

# Wrong - DO NOT USE
npm install
npm run dev
```

### 3. Code Architecture

#### ECS Pattern (Miniplex)
```typescript
// Define entities in client/src/game/ecs/world.ts
export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  // ... other components
};

// Create queries for efficient filtering
export const queries = {
  moving: world.with("position", "velocity"),
  players: world.with("player", "position"),
};

// Iterate safely in systems (requires ES2022 target)
for (const entity of queries.moving) {
  entity.position.x += entity.velocity.x * dt;
}
```

#### Physics with Rapier
```tsx
import { RigidBody, CuboidCollider } from "@react-three/rapier";

function Platform({ position, args }) {
  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider args={args} />
      <mesh>
        <boxGeometry args={[args[0] * 2, args[1] * 2, args[2] * 2]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </RigidBody>
  );
}
```

#### State with Zustand
```typescript
// All game state in client/src/game/store.ts
interface GameState {
  health: number;
  shards: number;
  playerX: number;
  setHealth: (h: number) => void;
}

export const useStore = create<GameState>((set) => ({
  health: 5,
  shards: 0,
  playerX: 0,
  setHealth: (health) => set({ health }),
}));
```

### 4. File Organization

```
client/src/game/
├── ecs/
│   ├── world.ts          # Entity types, world instance, queries
│   ├── systems.ts        # ECS systems (movement, gravity, etc.)
│   └── SpriteRenderer.tsx # Parallax and sprite rendering
├── Player.tsx            # Player controller
├── Level.tsx             # Level generation and environment
├── store.ts              # Zustand state
├── constants.ts          # Biomes, collision groups
└── utils.ts              # Helper functions
```

### 5. Biomes

The game has 6 biomes matching Redwall story progression:

| Index | Name | Quest |
|-------|------|-------|
| 0 | Abbey Exterior | "Reach the Gatehouse" |
| 1 | Abbey Interior | "Defend the Great Hall" |
| 2 | Dungeon | "Descend into the Depths" |
| 3 | Courtyard | "Rally the Defenders" |
| 4 | Rooftops | "Ascend to the Bells" |
| 5 | Outer Ruins | "Follow the River Path" |

### 6. Generated Assets

AI-generated images are stored in `attached_assets/generated_images/`:
- `abbey_exterior_parallax_background.png`
- `abbey_interior_parallax_background.png`
- `dungeon_parallax_background.png`
- `courtyard_parallax_background.png`
- `rooftops_parallax_background.png`
- `outer_ruins_parallax_background.png`
- `chapter_plate_*.png` (storybook cutscene illustrations)

Import using the `@assets` alias:
```typescript
import abbeyBg from "@assets/generated_images/abbey_exterior_parallax_background.png";
```

### 7. Mobile Controls

Touch controls use a diamond layout on the right side:
- **Jump** (top)
- **Attack** (right)
- **Crouch** (bottom)
- **Special** (left)

Movement buttons on the left side:
- **Left** / **Right**

All touch elements must have:
- `touch-action: none` to prevent browser gestures
- No hover dependency
- Large, thumb-friendly sizing

### 8. Testing

```bash
# Unit tests with Vitest
pnpm run test

# E2E tests with Playwright
pnpm run test:e2e
```

Write tests for:
- Game state transitions
- Entity spawning and cleanup
- Physics interactions
- UI component rendering

### 9. Common Pitfalls

1. **Query Iteration**: Use `for (const entity of query)` not `query.entities.forEach()`
2. **Entity Removal**: Collect entities to remove, then remove after iteration
3. **Component Addition**: Use `world.addComponent(entity, "key", value)` not direct assignment
4. **BIOMES Index**: Always use `Math.abs()` and bounds checking for biome index
5. **TypeScript Target**: Must be ES2022+ for Miniplex query iteration

### 10. Performance

- Minimize React re-renders during gameplay
- Use `useFrame` for per-frame updates instead of `useEffect`
- Pre-create queries outside render functions
- Use instanced meshes for repeated geometry
- Keep ECS systems lightweight

## Gameplay Invariants

- Player must always have control unless in a cutscene
- Gravity must be constant
- Enemies must spawn off-screen or with a warning
- Checkpoints must save state immediately on collision

## Prompt Templates

### For Image Generation

```
Generate a [parallax background / chapter plate] for [biome name].

Style: Storybook art, painterly, warm lighting, Redwall-inspired woodland-epic.
Palette: [refer to BRAND.md biome colors]
Elements: [specific scene elements]
Avoid: Neon, sci-fi, grimdark, demons, glowing energy weapons.
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

## Reference Files

- `BRAND.md` - Complete visual style guide
- `replit.md` - Project architecture and commands
- `client/src/game/ecs/world.ts` - Entity type definitions
- `client/src/game/constants.ts` - Biome definitions
- `client/src/game/store.ts` - Zustand state structure
