# @otterblade/dev-tools

Development tools for Otterblade Odyssey - AI-powered asset generation and validation.

## Overview

This package provides command-line tools for generating and validating game assets using OpenAI's GPT-Image-1 API. It's designed to work within the pnpm workspace and follows all project quality standards.

## Features

- **Sprite Sheet Generation**: Generate animated sprite sheets for player and enemy characters
- **Sprite Analysis**: Validate sprite sheets using AI vision for consistency and quality
- **Asset Validation**: Verify all required assets exist and meet specifications

## Requirements

- Node.js 20+
- pnpm 10+
- OpenAI API key with GPT-Image-1 access

## Setup

```bash
# From workspace root
pnpm install

# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."
```

## Usage

### Generate Player Sprite Sheet

```bash
pnpm --filter @otterblade/dev-tools generate:sprites
```

Generates a complete player sprite sheet with:
- Idle animation (4 frames)
- Run cycle (6 frames)
- Jump/Fall (5 frames)
- Attack (4 frames)
- Hurt (2 frames)
- Crouch (2 frames)

### Generate Enemy Sprites

```bash
pnpm --filter @otterblade/dev-tools generate:enemy-sprites
```

Generates sprite sheets for all enemy archetypes defined in BRAND.md.

### Analyze Sprite Quality

```bash
pnpm --filter @otterblade/dev-tools analyze:sprite <path-to-sprite>
```

Uses GPT-4 Vision to analyze sprite consistency, style alignment, and animation quality.

### Validate All Assets

```bash
pnpm --filter @otterblade/dev-tools validate:assets
```

Checks that all required assets exist and match specifications in `assets.json`.

## Generated Assets

All generated assets are saved to:
- `attached_assets/generated_images/sprites/` - Sprite sheets
- `attached_assets/generated_images/` - Other images

## Brand Compliance

All generation prompts include brand guidelines from:
- `BRAND.md` - Visual style guide
- `WORLD.md` - World-building and lore

Generated assets automatically include:
- Warm, cozy woodland-epic aesthetic
- Consistent otter warrior design
- Storybook-style painterly textures
- No neon, sci-fi, or grimdark elements

## File Structure

```
packages/dev-tools/
├── src/
│   ├── config.ts           # OpenAI client and shared config
│   ├── prompts.ts          # Brand-aligned generation prompts
│   ├── generate-sprites.ts # Player sprite generation
│   ├── generate-enemy-sprites.ts # Enemy sprite generation
│   ├── analyze-sprite.ts   # AI-powered sprite analysis
│   └── validate-assets.ts  # Asset validation
├── package.json
├── tsconfig.json
└── README.md
```

## Code Quality

This package follows all project standards:
- Biome strict linting
- JSDoc on all exports
- TypeScript ES2022 target
- Max 300 lines per file
- Zod validation for all inputs

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key with GPT-Image-1 access |
| `OPENAI_ORG_ID` | No | OpenAI organization ID (optional) |

## See Also

- [BRAND.md](../../BRAND.md) - Visual style guide
- [WORLD.md](../../WORLD.md) - World-building reference
- [AGENTS.md](../../AGENTS.md) - AI agent quality standards
