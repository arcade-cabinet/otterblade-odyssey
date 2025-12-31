# Game Data Directory

This directory contains JSON-based game content that is validated at load time via Zod schemas.

## Files

| File | Purpose | Schema |
|------|---------|--------|
| `chapters.json` | 10-chapter story progression definitions | `ChapterSchema` |
| `biomes.json` | Visual environment configurations | `BiomeSchema` |
| `animations.json` | Sprite animation state definitions | `AnimationSchema` |
| `assets.json` | Asset ledger tracking plates, backgrounds, videos, sprites | - |

## Asset Ledger

The `assets.json` file is a comprehensive tracking system for all visual assets:

### Categories

| Category | Description | Status |
|----------|-------------|--------|
| **Chapter Plates** | Story illustrations for chapter transitions | 10/10 complete |
| **Parallax Backgrounds** | Multi-layer scrolling backgrounds | 8/8 complete |
| **Cinematics** | Video cutscenes (intro, outro, chapter opens, boss intros) | 15/15 complete |
| **Sprite Sheets** | Character animation frames | 0/11 (pending) |

### Asset Locations

All generated assets are stored in `/attached_assets/`:
- `generated_images/` - PNG files (plates, backgrounds)
- `generated_videos/` - MP4 files (cinematics)

### Importing Assets

Always use the `@assets` alias in Vite:

```tsx
import chapterPlate from '@assets/generated_images/prologue_village_chapter_plate.png';
import chapterVideo from '@assets/generated_videos/chapter_1_opening_cinematic.mp4';
```

## Design Principles

1. **Separation of Concerns**: Static authored content lives here; runtime state lives in ECS
2. **Validation**: All JSON is validated at load time via Zod schemas in `game/data/`
3. **Modularity**: Each domain has its own file - never combine unrelated data
4. **Immutability**: This data does not change at runtime
5. **Asset Tracking**: The assets.json ledger tracks all visual asset generation status

## Schema Versioning

Each JSON file should include a `$schema` field pointing to a JSON Schema for IDE validation:

```json
{
  "$schema": "./schemas/chapters.schema.json",
  ...
}
```

## Adding New Data

1. Create `{domain}.json` in this directory
2. Create `{domain}Schema.ts` in `game/data/`
3. Create loader function that validates and types the data
4. Export from `game/data/index.ts`
5. Never import JSON directly - always use typed loaders

## Proofs Package

A separate testing package exists at `/proofs/` for sprite sheet validation without WebGL:

```bash
cd proofs && pnpm install && pnpm dev
```

This provides:
- Sprite sheet manifest viewer
- Animation frame player with configurable FPS
- Chroma key background removal tool
