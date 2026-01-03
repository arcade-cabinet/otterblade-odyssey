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

- **[gameplay_agent.md](./gameplay_agent.md)** - Game mechanics, physics, combat
- **[render_agent.md](./render_agent.md)** - Visual fidelity, shaders, performance

## Quick Reference

| Agent Type | Primary Focus | Key Files |
|------------|--------------|-----------|
| **Gameplay** | Movement, combat, AI | `game/src/game/`, `store.js` |
| **Render** | Graphics, shaders, performance | `game/src/game/rendering/` |
| **UI/UX** | HUD, menus, touch controls | `game/src/components/` |

## Asset Generation

Asset generation uses the `jbcom/control-center` enterprise binary (Veo 3.1 + Imagen 3).
See issue #45 for archived documentation of the previous dev-tools implementation.

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
