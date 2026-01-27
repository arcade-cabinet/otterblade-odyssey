# Runtime Manifest Data

This directory contains JSON manifest files that are **fetched at runtime** by the game engine.

## Purpose

These manifests are served statically via Astro's public directory and loaded asynchronously using `fetch()` rather than being bundled into the JavaScript. This approach provides:

1. **Smaller initial bundle size** - Manifests are loaded on-demand
2. **Faster builds** - JSON files aren't processed by bundler
3. **Hot-reloading in dev** - Changes to manifests don't require full rebuild
4. **Cache control** - Manifests can be cached separately from code

## Source of Truth

The **authoritative source** for these manifests is:
```
game/src/data/manifests/
```

This `public/data/manifests/` directory is a **copy** created during build/dev for runtime access.

## Loader Module

Manifests are loaded via the DDL loader:
```javascript
import { loadChapterManifest, preloadManifests } from '@/ddl/loader';

// Async loading
const chapter = await loadChapterManifest(0);

// Preload all manifests
await preloadManifests();

// Sync access (after preload)
const chapter = getChapterManifestSync(0);
```

## Manifest Types

| File | Type | Description |
|------|------|-------------|
| `chapters/*.json` | Chapter | 10 chapter definitions with levels, quests, NPCs |
| `enemies.json` | Enemies | Enemy types, AI behaviors, stats |
| `npcs.json` | NPCs | Non-player characters, dialogue, story states |
| `sprites.json` | Sprites | Character sprite definitions and animations |
| `cinematics.json` | Cinematics | Cutscene and cinematic sequences |
| `sounds.json` | Sounds | Audio asset references |
| `effects.json` | Effects | Particle and visual effects |
| `items.json` | Items | Collectibles and items |
| `scenes.json` | Scenes | Background scenes and parallax layers |
| `chapter-plates.json` | Plates | Chapter transition plates |

## Schema Validation

All manifests are validated against Zod schemas defined in:
```
game/src/game/data/manifest-schemas.ts
```

Invalid manifests will throw descriptive errors at load time.

## Development

When modifying manifests:

1. Edit files in `game/src/data/manifests/`
2. Changes auto-copy to `public/` in dev mode
3. Reload browser to fetch updated manifests
4. Validate changes with unit tests

## Architecture

This follows the **DDL (Data Definition Language)** pattern where:
- Game content is defined in JSON manifests
- Loaders fetch and validate at runtime
- Factories build game entities from manifest data
- No hardcoded game content in JavaScript code
