# Rendering Module

Procedural Canvas 2D rendering functions for all visual elements in Otterblade Odyssey.

## Purpose

This module provides pure rendering functions that take canvas context and game state data, and draw procedural visuals. All rendering is done through Canvas 2D API - no static image assets are used.

## Modules

### `characters.js` (100 lines)
Character rendering functions:
- `drawFinn()` - Protagonist otter warrior with procedural detail
- `drawEnemy()` - Galeborn enemy soldiers
- `drawNPC()` - Friendly woodland creatures
- `drawBoss()` - Zephyros boss with health bar and phase indicator

### `environment.js` (190 lines)
Level geometry and object rendering:
- `drawPlatforms()` - Platforms with wood/stone materials
- `drawWalls()` - Stone walls
- `drawCeilings()` - Wood beam ceilings
- `drawInteractions()` - Doors, shrines, hearths (animated)
- `drawWaterZones()` - Translucent water regions
- `drawCollectibles()` - Rotating golden shards
- `drawEnvironmentalSystems()` - Lanterns, bells, hearths
- `drawFlowPuzzles()` - Directional current zones
- `drawTimingSequences()` - Timed gates and platforms
- `drawBossProjectiles()` - Frost wave projectiles
- `drawBossHazardZones()` - Boss AoE danger zones with particles
- `drawBackground()` - Biome-appropriate backgrounds

### `index.js`
Main entry point - re-exports all rendering functions.

## Usage

```javascript
import { drawFinn, drawEnemy, drawPlatforms } from './rendering/index.js';

// In game loop
const ctx = canvas.getContext('2d');

// Draw level geometry
drawPlatforms(ctx, platforms);

// Draw characters
drawFinn(ctx, player.position, playerFacing, animFrame);
drawEnemy(ctx, enemy, animFrame);
```

## Architecture

**Pure Functions**: All render functions are stateless and side-effect free (except canvas drawing).

**Canvas 2D Only**: Uses procedural shapes, gradients, and shadows - no sprite sheets or textures.

**Warm Aesthetic**: Follows BRAND.md color palette (moss, stone, lantern light, warm browns).

## Performance

- All functions use `ctx.save()`/`ctx.restore()` for safe state management
- No memory allocations during render (except temporary objects for positioning)
- Simple geometry keeps 60fps stable even with many entities

## Testing

Unit tests verify:
- Input validation (null checks, type checks)
- Canvas state isolation (save/restore)
- Proper transforms (translate, scale, rotate)
- Color palette compliance

Run tests: `pnpm test client/src/game/rendering`
