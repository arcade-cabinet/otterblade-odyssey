# Render Agent Instructions

## Role

Focus on visual fidelity, rendering performance, and brand-consistent visuals.

## Responsibilities

- Manage the Three.js scene graph and orthographic camera
- Implement post-processing effects (Bloom, Vignette, Color Correction)
- Optimize rendering performance (batching, texture compression)
- Implement parallax background rendering
- Ensure visual consistency with BRAND.md guidelines

## Key Files

| File | Purpose |
|------|---------|
| `client/src/game/Level.tsx` | Level rendering and procedural generation |
| `client/src/game/components/AnimatedSprite.tsx` | Sprite animation component |
| `client/src/game/components/PlayerSprite.tsx` | Player character rendering |
| `client/src/game/ecs/SpriteRenderer.tsx` | ECS sprite rendering system |
| `client/src/components/hud/PostFX.tsx` | Post-processing effects |

## Rendering Architecture

**Framework**: `@react-three/fiber` in orthographic 2D mode

```typescript
// Orthographic camera setup
<Canvas orthographic camera={{ zoom: 100, position: [0, 0, 10] }}>
  <Physics2D>
    <Level />
    <Player />
  </Physics2D>
  <EffectComposer>
    <Bloom intensity={0.3} />
    <Vignette darkness={0.5} />
  </EffectComposer>
</Canvas>
```

## Parallax System

3-layer depth backgrounds using biome images:

| Layer | Depth | Content |
|-------|-------|---------|
| Foreground | z=1 | Props, foliage, decorations |
| Midground | z=0 | Platforms, main gameplay |
| Background | z=-1 | Parallax background images |

## Visual Guidelines (from BRAND.md)

### Color Palette

| Biome | Primary | Accent | Fog |
|-------|---------|--------|-----|
| Abbey Exterior | Warm stone beige | Moss green | Morning mist blue |
| Abbey Interior | Warm amber | Candle gold | Dusty shadow |
| Dungeon | Deep stone gray | Torch orange | Damp blue |
| Courtyard | Sunlit green | Banner crimson | Bright haze |
| Rooftops | Slate gray | Bronze | Wind blue |

### Lighting Requirements

- Warm lantern/hearth light sources
- Soft god rays through windows/canopy
- Subtle ambient glow
- **NO neon or electric lighting**

## Post-Processing

```typescript
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';

<EffectComposer>
  <Bloom 
    intensity={0.3} 
    luminanceThreshold={0.8}
    luminanceSmoothing={0.9}
  />
  <Vignette darkness={0.4} offset={0.3} />
</EffectComposer>
```

## Performance Guidelines

### Optimization Targets

- Maintain 60 FPS on mobile devices
- Keep draw calls under 100
- Texture atlas for sprites
- Power-of-two textures

### Techniques

```typescript
// ✅ Use instanced meshes for repeated objects
<instancedMesh args={[geometry, material, count]}>
  {instances.map((pos, i) => (
    <Instance key={i} position={pos} />
  ))}
</instancedMesh>

// ✅ Batch static geometry
const mergedGeometry = mergeBufferGeometries(geometries);
```

## Sprite Animation

```typescript
interface SpriteConfig {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  animations: {
    [name: string]: {
      row: number;
      frames: number;
      fps: number;
    };
  };
}
```

## Asset Integration

Import assets using the `@assets` alias:

```typescript
import parallax from '@assets/images/parallax/village_morning_parallax_background.png';
import playerSprite from '@assets/generated_images/sprites/player_sprite_sheet.png';
```

## Testing

```bash
# Visual regression tests
PLAYWRIGHT_MCP=true pnpm playwright test e2e/visual-regression.spec.ts

# Update snapshots
PLAYWRIGHT_MCP=true pnpm playwright test --update-snapshots
```

## See Also

- [BRAND.md](../BRAND.md) - Complete visual style guide
- [asset_agent.md](./asset_agent.md) - Asset generation and manifests
- [gameplay_agent.md](./gameplay_agent.md) - Physics integration
