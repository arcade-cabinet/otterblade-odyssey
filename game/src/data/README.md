# Game Data Directory

This directory contains JSON-based game content that is validated at load time via Zod schemas.

## Files

| File | Purpose | Schema |
|------|---------|--------|
| `chapters.json` | 10-chapter story progression definitions | `ChapterSchema` |
| `biomes.json` | Visual environment configurations | `BiomeSchema` |
| `assets.json` | Legacy asset ledger (deprecated, use manifests) | - |

## Asset Manifest System

The `manifests/` subdirectory contains the **authoritative source** for all generated assets:

### Manifest Files

| Manifest | Category | Provider | Assets |
|----------|----------|----------|--------|
| `sprites.json` | sprites | OpenAI GPT-Image-1 | Player sprite sheet |
| `enemies.json` | enemy-sprites | OpenAI GPT-Image-1 | 5 enemy types |
| `cinematics.json` | cinematics | Google Veo 3.1 | 10 chapter videos |
| `scenes.json` | scenes | Google Imagen 3 | 8 parallax backgrounds |

### Manifest Structure

Each manifest follows this schema:

```json
{
  "$schema": "./manifest-schema.json",
  "category": "sprites",
  "provider": "openai",
  "model": "gpt-image-1",
  "outputDir": "attached_assets/generated_images/sprites",
  "assets": [
    {
      "id": "player_sprite_sheet",
      "name": "Player Sprite Sheet",
      "filename": "player_sprite_sheet.png",
      "status": "pending",
      "config": { ... },
      "prompt": { ... },
      "validation": { ... }
    }
  ]
}
```

### Asset Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `pending` | Not yet generated | Will be generated on next CLI run |
| `complete` | Asset exists and is valid | Skipped unless `--force` |
| `needs_regeneration` | Exists but has issues | Will be regenerated with logged reason |

### Generating Assets

Use the `@otterblade/dev-tools` CLI:

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites

# Preview what would be generated
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration
pnpm --filter @otterblade/dev-tools cli -- --force --id player_sprite_sheet
```

### Asset Locations

| Type | Location |
|------|----------|
| Sprites | `attached_assets/generated_images/sprites/` |
| Chapter plates | `game/src/assets/images/chapter-plates/` |
| Parallax backgrounds | `game/src/assets/images/parallax/` |
| Cinematics | `attached_assets/generated_videos/` |

### Asset Usage (IMPORTANT UPDATE)

**Static PNG/MP4 assets have been REMOVED from the codebase.**

The game should use **procedural generation** like the POC (`pocs/otterblade_odyssey.html`):

```tsx
// ✅ CORRECT - Procedural rendering (to be implemented)
// See pocs/otterblade_odyssey.html for reference
// Use canvas-based procedural generation for visuals

// ❌ WRONG - Static asset imports (removed from codebase)
// import otterSprite from '@assets/...png';  // DO NOT USE
// import chapterPlate from '@assets/...png';  // DO NOT USE
```

See `NEXT_SESSION_TODO.md` for implementation plan.

## Design Principles

1. **Separation of Concerns**: Static authored content lives here; runtime state lives in ECS
2. **Validation**: All JSON is validated at load time via Zod schemas in `game/data/`
3. **Modularity**: Each domain has its own file - never combine unrelated data
4. **Immutability**: This data does not change at runtime
5. **Manifest-Driven Assets**: All visual assets tracked in `manifests/` directory

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

## Adding New Assets

1. **Define in manifest**: Add entry to appropriate `manifests/*.json`
2. **Set status**: Use `pending` for new assets
3. **Run generation**: `pnpm --filter @otterblade/dev-tools cli`
4. **Verify brand compliance**: Check against BRAND.md
5. **Update status**: Change to `complete` after validation

## Proofs Package

A separate testing package exists at `/proofs/` for sprite sheet validation without WebGL:

```bash
cd proofs && pnpm install && pnpm dev
```

This provides:
- Sprite sheet manifest viewer
- Animation frame player with configurable FPS
- Chroma key background removal tool

## Related Documentation

| Document | Purpose |
|----------|---------|
| [BRAND.md](../../../BRAND.md) | Visual style guide |
| [WORLD.md](../../../WORLD.md) | World-building and lore |
| [packages/dev-tools/README.md](../../../packages/dev-tools/README.md) | Asset generation CLI |
| [agents/asset_agent.md](../../../agents/asset_agent.md) | Asset agent instructions |
