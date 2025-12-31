# Agent Documentation

This directory contains specialized agent instructions for different aspects of the game.

## Main Documentation

For comprehensive agent guidance, see:
- **[CLAUDE.md](../CLAUDE.md)** - Claude-specific instructions
- **[AGENTS.md](../AGENTS.md)** - Universal agent instructions
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** - GitHub Copilot config
- **[BRAND.md](../BRAND.md)** - Visual style guide
- **[WORLD.md](../WORLD.md)** - World-building and lore

## Specialized Agents

- **[asset_agent.md](./asset_agent.md)** - Asset generation, validation, brand compliance
- **[gameplay_agent.md](./gameplay_agent.md)** - Game mechanics, physics, combat
- **[render_agent.md](./render_agent.md)** - Visual fidelity, shaders, performance

## Quick Reference

| Agent Type | Primary Focus | Key Files |
|------------|--------------|-----------|
| **Asset** | Generation, validation, brand | `packages/dev-tools/`, `manifests/*.json` |
| **Gameplay** | Movement, combat, AI | `client/src/game/Player.tsx`, `store.ts` |
| **Render** | Graphics, shaders, performance | `client/src/game/Level.tsx`, postprocessing |
| **UI/UX** | HUD, menus, touch controls | `client/src/components/hud/` |
| **ECS** | Entity management | `client/src/game/ecs/world.ts` |

## Asset Generation Quick Start

```bash
# Generate missing assets
pnpm --filter @otterblade/dev-tools cli

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites

# Preview without generating
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Validate assets exist
pnpm validate:assets

# Audit cinematics for brand violations
pnpm audit:cinematics
```

See **[asset_agent.md](./asset_agent.md)** for complete asset generation documentation.

## Package Manager

**Always use pnpm, not npm or yarn.**

```bash
pnpm install
pnpm run dev
pnpm add <package>
```

## Brand Compliance (All Agents)

When generating or reviewing ANY visual content:

✅ **REQUIRED:**
- Anthropomorphic woodland animals ONLY
- Warm storybook aesthetic (Willowmere Hearthhold)
- Protagonist is Finn the otter warrior

❌ **FORBIDDEN:**
- Human characters (NO knights, villagers, soldiers)
- Neon, sci-fi, horror elements
- Glowing energy weapons

See **[BRAND.md](../BRAND.md)** for complete guidelines.
