# Agent Documentation

This directory contains specialized agent instructions for different aspects of the game.

## Main Documentation

For comprehensive agent guidance, see:
- **[CLAUDE.md](../CLAUDE.md)** - Claude-specific instructions
- **[AGENTS.md](../AGENTS.md)** - Universal agent instructions
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** - GitHub Copilot config
- **[BRAND.md](../BRAND.md)** - Visual style guide

## Specialized Agents

- **[gameplay_agent.md](./gameplay_agent.md)** - Game mechanics, physics, combat
- **[render_agent.md](./render_agent.md)** - Visual fidelity, shaders, performance

## Quick Reference

| Agent Type | Primary Focus | Key Files |
|------------|--------------|-----------|
| Gameplay | Movement, combat, AI | `client/src/game/Player.tsx`, `store.ts` |
| Render | Graphics, shaders, performance | `client/src/game/Level.tsx`, postprocessing |
| UI/UX | HUD, menus, touch controls | `client/src/components/hud/` |
| ECS | Entity management | `client/src/game/ecs/world.ts` |

## Package Manager

**Always use pnpm, not npm or yarn.**

```bash
pnpm install
pnpm run dev
pnpm add <package>
```
