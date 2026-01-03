# @otterblade/dev-tools

AI-powered development tools for Otterblade Odyssey asset generation and validation.

## Overview

This package provides a **manifest-driven, idempotent CLI** for generating and validating game assets using:

- **OpenAI GPT-Image-1** - Sprite sheets with transparency, masking, and precise control
- **Google Veo 3.1** - High-fidelity cinematic videos with native audio
- **Google Imagen 3** - Scene backgrounds and chapter plates
- **Google Gemini 2.0** - Vision analysis for quality validation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ASSET GENERATION FLOW                            │
│                                                                     │
│  Manifests (JSON)  →  CLI (cli.ts)  →  AI Providers  →  Assets     │
│                                                                     │
│  game/src/data/     manifest-       OpenAI GPT-Image-1           │
│  manifests/*.json     generator.ts    Google Veo 3.1               │
│                                       Google Imagen 3               │
└─────────────────────────────────────────────────────────────────────┘
```

## Manifest System

All assets are defined in JSON manifests at `game/src/data/manifests/`:

| Manifest | Category | Provider | Assets |
|----------|----------|----------|--------|
| `sprites.json` | sprites | OpenAI | Player sprite sheet |
| `enemies.json` | enemy-sprites | OpenAI | 5 enemy types |
| `cinematics.json` | cinematics | Google Veo | 10 chapter videos |
| `scenes.json` | scenes | Google Imagen | 8 parallax backgrounds |

### Manifest Schema

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
| `needs_regeneration` | Exists but has issues | Will be regenerated |

## Use Case Matrix

| Asset Type | Best Provider | Reason |
|------------|--------------|--------|
| Sprite sheets | OpenAI GPT-Image-1 | Transparency, precise grid layout, masking |
| Player animations | OpenAI GPT-Image-1 | Consistent character design across frames |
| Cinematics | Google Veo 3.1 | Native audio, longer duration, cinematic quality |
| Chapter plates | Google Imagen 3 | Painterly style, wide aspect ratio |
| Parallax backgrounds | Google Imagen 3 | Scene composition, atmospheric depth |
| Asset validation | Google Gemini 2.0 | Fast multimodal analysis |

## Setup

```bash
# From workspace root
pnpm install

# Set API keys (both or either depending on what you're generating)
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
```

## Commands

### Main CLI (Recommended)

The manifest-driven CLI is the primary way to generate assets:

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites
pnpm --filter @otterblade/dev-tools cli -- --category enemies
pnpm --filter @otterblade/dev-tools cli -- --category cinematics
pnpm --filter @otterblade/dev-tools cli -- --category scenes

# Preview without generating (dry run)
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration of existing assets
pnpm --filter @otterblade/dev-tools cli -- --force

# Regenerate specific asset by ID
pnpm --filter @otterblade/dev-tools cli -- --force --id intro_cinematic

# Rate limit for cost control
pnpm --filter @otterblade/dev-tools cli -- --max-items 3

# Show help
pnpm --filter @otterblade/dev-tools cli -- --help
```

### Legacy Commands (Individual Scripts)

These scripts still work but the CLI is preferred:

```bash
# Generate player sprite sheet
pnpm generate:sprites

# Generate enemy sprite sheets
pnpm generate:enemy-sprites
pnpm generate:enemy-sprites -- --type skirmisher

# Analyze sprite quality
pnpm analyze:sprite path/to/sprite.png
```

### Google (Videos & Scenes)

```bash
# Generate cinematics with Veo 3.1
pnpm generate:cinematic -- --name intro
pnpm generate:cinematic -- --all

# Generate scenes with Imagen 3
pnpm generate:scene -- --type parallax --biome village
pnpm generate:scene -- --type chapter-plate --chapter 0

# Analyze video for brand compliance
pnpm analyze:video path/to/video.mp4

# Audit all cinematics for violations
pnpm audit:cinematics
```

### Validation

```bash
# Validate all required assets exist
pnpm validate:assets
```

## GitHub Actions Integration

The `assets.yml` workflow automates generation:

```yaml
# Triggered via workflow_dispatch (manual)
# Inputs:
#   - category: sprites, enemies, cinematics, scenes, or all
#   - force: Regenerate existing assets
#   - dry_run: Preview only
#   - max_items: Limit for cost control

# Creates PR with generated assets
# Includes brand compliance checklist
```

## Cost Estimates

| Category | Items | Estimated Cost |
|----------|-------|----------------|
| Sprites | 1 | ~$0.04-0.08 |
| Enemies | 5 | ~$0.20-0.40 |
| Cinematics | 10 | ~$2.50 |
| Scenes | 8 | ~$0.24 |

Always use `--dry-run` first to preview what will be generated.

## Brand Compliance

All generation prompts enforce:

- **Anthropomorphic woodland animals ONLY** - NO humans
- **Warm storybook aesthetic** - NO neon, sci-fi, horror
- **Consistent otter protagonist** (Finn Riverstone)
- **Willowmere Hearthhold setting**

The `audit:cinematics` command specifically checks for:
- Human characters (knights, villagers, etc.)
- Wrong protagonist (not an otter)
- Sci-fi or horror elements
- Visual style violations

## File Structure

```
packages/dev-tools/
├── src/
│   ├── shared/
│   │   ├── config.ts       # API clients, model configs
│   │   └── prompts.ts      # Brand-aligned prompts
│   ├── openai/
│   │   ├── generate-sprites.ts
│   │   ├── generate-enemy-sprites.ts
│   │   └── analyze-sprite.ts
│   ├── google/
│   │   ├── generate-cinematic.ts  # Veo 3.1
│   │   ├── generate-scene.ts      # Imagen 3
│   │   └── analyze-video.ts       # Gemini 2.0
│   ├── validate-assets.ts
│   ├── audit-cinematics.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `OPENAI_API_KEY` | Sprites | OpenAI API key |
| `GEMINI_API_KEY` | Videos/Scenes | Google AI API key |

## Quality Standards

This package follows all project standards:
- Biome strict linting
- JSDoc on all exports
- TypeScript ES2022 target
- Max 300 lines per file
- Zod validation for inputs

## See Also

- [BRAND.md](../../BRAND.md) - Visual style guide
- [WORLD.md](../../WORLD.md) - World-building reference
- [AGENTS.md](../../AGENTS.md) - AI agent quality standards
