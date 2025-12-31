# @otterblade/dev-tools

AI-powered development tools for Otterblade Odyssey asset generation and validation.

## Overview

This package provides command-line tools for generating and validating game assets using:

- **OpenAI GPT-Image-1** - Sprite sheets with transparency, masking, and precise control
- **Google Veo 3.1** - High-fidelity cinematic videos with native audio
- **Google Imagen 3** - Scene backgrounds and chapter plates
- **Google Gemini 2.0** - Vision analysis for quality validation

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

### OpenAI (Sprites)

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
