# Game Data Directory

This directory contains JSON-based game content that is validated at load time via Zod schemas.

## Files

| File | Purpose | Schema |
|------|---------|--------|
| `chapters.json` | 10-chapter story progression definitions | `ChapterSchema` |
| `biomes.json` | Visual environment configurations | `BiomeSchema` |
| `animations.json` | Sprite animation state definitions | `AnimationSchema` |

## Design Principles

1. **Separation of Concerns**: Static authored content lives here; runtime state lives in ECS
2. **Validation**: All JSON is validated at load time via Zod schemas in `game/data/`
3. **Modularity**: Each domain has its own file - never combine unrelated data
4. **Immutability**: This data does not change at runtime

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
