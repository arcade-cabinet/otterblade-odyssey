# Gameplay Agent Instructions

## Role

Focus on implementing and refining game mechanics, physics, and combat systems.

## Responsibilities

- Implement player movement (run, jump, slide, wall jump, ledge grab)
- Implement combat system (hitboxes, hurtboxes, health, damage, parry)
- Design enemy AI behavior (patrol, chase, attack, flee)
- Tune physics constants (gravity, friction, restitution)
- Integrate with ECS for entity management

## Key Files

| File | Purpose |
|------|---------|
| `client/src/game/Player.tsx` | Player controller with Rapier2D physics |
| `client/src/game/Physics2D.tsx` | Physics world wrapper |
| `client/src/game/store.ts` | Zustand game state |
| `client/src/game/ecs/systems.ts` | ECS systems (movement, gravity) |
| `client/src/game/ecs/world.ts` | Miniplex entity types and queries |
| `client/src/game/constants.ts` | Gameplay constants (loaded from JSON) |

## Physics System

**Engine**: `@dimforge/rapier2d-compat` (pure 2D physics)

```typescript
// Collision groups (bitwise)
const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  WORLD: 0x0002,
  ENEMY: 0x0004,
  COLLECTIBLE: 0x0008,
  HAZARD: 0x0010,
};
```

## Guidelines

### Performance

- Use `useFrame` for per-frame logic
- Use `zustand` for input state to avoid React re-renders
- Keep physics logic inside `Physics2D` wrapper
- Use ECS queries for efficient entity updates

### Movement Feel

- **Tight, responsive controls** with subtle weight
- **No floatiness** - immediate response to input
- Jump buffering and coyote time for forgiveness
- Reliable grounding detection

### Combat

- Clear attack telegraphs
- Parry window: ~200ms
- Invincibility frames on dodge
- Hitbox/hurtbox separation

## ECS Pattern

```typescript
// Define entity types
export type Entity = {
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  player?: true;
  enemy?: { type: "skirmisher" | "shielded" | "ranged" };
  health?: { current: number; max: number };
};

// Create queries
export const queries = {
  moving: world.with("position", "velocity"),
  players: world.with("player", "position"),
  enemies: world.with("enemy", "position", "health"),
};

// Safe iteration (requires ES2022)
for (const entity of queries.moving) {
  entity.position.x += entity.velocity.x * dt;
}
```

## Enemy Archetypes

| Type | Behavior | Implementation |
|------|----------|----------------|
| Skirmisher | Fast, low HP, closes distance | Simple chase AI |
| Shielded | Slow, blocks frontal attacks | Shield state machine |
| Ranged | Throws projectiles, maintains distance | Projectile spawning |
| Flyer | Engages vertical space | Y-axis movement |
| Elite | Miniboss with patterns | Phase-based state machine |

## Data-Driven Design

Load gameplay constants from JSON via typed loaders:

```typescript
// ❌ WRONG - Hardcoded
const PLAYER_SPEED = 5;

// ✅ CORRECT - Data-driven
import { loadGameplayConfig } from './data';
const { playerSpeed } = loadGameplayConfig();
```

## Testing

```bash
# Unit tests
pnpm test

# E2E gameplay tests
pnpm playwright test e2e/game.spec.ts
```

## See Also

- [WORLD.md](../WORLD.md) - 10-chapter story and gameplay progression
- [BRAND.md](../BRAND.md) - Enemy design requirements
- [render_agent.md](./render_agent.md) - Visual integration
