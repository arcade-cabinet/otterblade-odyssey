# Claude Agent Instructions for Otterblade Odyssey

This is the primary instruction file for Claude-based AI agents working on Otterblade Odyssey. Claude agents should read this file first, then reference `BRAND.md` for visual guidelines and `AGENTS.md` for technical patterns.

## Quick Context

**Otterblade Odyssey: Zephyros Rising** is a production-grade React 2.5D platformer with Redwall-inspired woodland-epic branding. Think warm lantern light, mossy stone abbeys, brave woodland creatures—not neon sci-fi or grimdark horror.

**Repository**: `github.com/jbdevprimary/otterblade-odyssey`

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

### 3. Asset Imports Use @assets Alias
```typescript
// CORRECT
import chapterPlate from "@assets/images/chapter-plates/prologue_village_chapter_plate.png";
import parallax from "@assets/images/parallax/village_morning_parallax_background.png";

// WRONG
import bg from "../attached_assets/generated_images/...";
import bg from "./assets/...";
```

### 4. TypeScript Target is ES2022
Required for Miniplex query iteration. Never downgrade to ES2021 or lower.

### 5. Node.js Version is 25.x
All environments use Node.js 25 (latest stable). Version is defined in `.nvmrc` at repo root. CI/CD workflows, Replit, and local dev must all align to this version.

## Architecture Overview

> **Note**: See `IMPLEMENTATION.md` for planned Canvas 2D + Matter.js migration. Current production code uses React Three Fiber.

### Current Technology Stack (Production)
| Layer | Technology |
|-------|------------|
| 3D Rendering | @react-three/fiber (React Three Fiber) |
| Physics | @react-three/rapier (Rapier WASM) |
| Entity Management | Miniplex + miniplex-react |
| State | Zustand |
| Procedural Graphics | @jbcom/strata |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix |
| Mobile | Capacitor (native features, haptics) |
| Audio | Howler.js (spatial audio, music) |

### Key Directories
```
client/src/game/
├── ecs/              # Miniplex entities, systems, queries
│   ├── world.ts      # Entity types and world instance
│   ├── systems.ts    # Movement, gravity, cleanup systems
│   └── SpriteRenderer.tsx
├── Player.tsx        # Rapier physics player controller
├── Level.tsx         # Procedural level generation
├── store.ts          # Zustand game state
└── constants.ts      # Biomes, collision groups

attached_assets/
├── generated_images/ # Chapter plates, parallax backgrounds
└── generated_videos/ # Intro/outro cinematics
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

### ECS Entity Definition (Miniplex)
```typescript
export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  enemy?: { type: "skirmisher" | "shielded" | "ranged" };
  health?: { current: number; max: number };
  collectible?: { type: "shard" | "health" };
};

export const queries = {
  moving: world.with("position", "velocity"),
  players: world.with("player", "position"),
  enemies: world.with("enemy", "position", "health"),
};
```

### Physics with Rapier
```tsx
import { RigidBody, CuboidCollider } from "@react-three/rapier";

function Platform({ position, size }: PlatformProps) {
  return (
    <RigidBody type="fixed" position={position} collisionGroups={COLLISION_GROUPS.WORLD}>
      <CuboidCollider args={size} />
      <mesh>
        <boxGeometry args={[size[0] * 2, size[1] * 2, size[2] * 2]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </RigidBody>
  );
}
```

### Zustand State
```typescript
interface GameState {
  health: number;
  maxHealth: number;
  shards: number;
  currentBiome: number;
  checkpointPosition: { x: number; y: number };
  // Actions
  takeDamage: (amount: number) => void;
  collectShard: () => void;
  setCheckpoint: (pos: { x: number; y: number }) => void;
}
```

### Strata Procedural Graphics
```typescript
import { createCharacter, animateCharacter, updateFurUniforms, fbm, noise3D } from "@jbcom/strata";

// Procedural terrain
const height = noise3D(x * 0.1, 0, z * 0.1) * 5 + fbm(x * 0.3, 0, z * 0.3, 3) * 1.5;

// Character with fur
const otter = createCharacter({
  skinColor: 0x8b6914,
  furOptions: {
    baseColor: new THREE.Color("#5d4420"),
    tipColor: new THREE.Color("#8b6914"),
    layerCount: 8,
    spacing: 0.015,
    windStrength: 0.3,
  },
});
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
2. **Wrong asset paths** - Use `@assets` alias
3. **Query iteration** - Use `for (const e of query)`, not `.forEach()`
4. **Entity removal during iteration** - Collect first, remove after
5. **Neon/sci-fi aesthetics** - Always check BRAND.md
6. **ES2021 target** - Must be ES2022 for Miniplex

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
| `replit.md` | Project architecture (Replit-specific) |
| `.github/copilot-instructions.md` | GitHub Copilot config |
| `client/src/game/constants.ts` | Biome definitions |
| `client/src/game/store.ts` | Zustand state structure |
