# Otterblade Odyssey: Physics Implementation Guide

> Matter.js guidance for the Astro + Solid + Canvas runtime. Keep everything deterministic, data-driven, and small.

## Quick Reference
- Engine: **Matter.js 0.20**
- Target: **60fps** via `requestAnimationFrame`
- Gravity: **1.5** (POC-proven)
- Data: Body sizes, masses, and collision groups pulled from manifests/constant modules—not magic numbers

## Engine Setup

```javascript
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Events } = Matter;

export function createEngine() {
  const engine = Engine.create();
  engine.gravity.y = 1.5; // Otter weight, matches POC feel
  engine.positionIterations = 8;
  engine.velocityIterations = 6;
  return engine;
}

export function stepEngine(engine) {
  const STEP = 1000 / 60;
  Engine.update(engine, STEP);
}
```

- Call `stepEngine` once per frame after processing input and before rendering.
- Keep deterministic order: input → physics → AI → rendering.

## Collision Groups

Define collision groups centrally (e.g., `game/src/game/constants.js`) and reuse in body factories.

```javascript
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  PLATFORM: 0x0004,
  ITEM: 0x0008,
  TRIGGER: 0x0010,
  HAZARD: 0x0020,
};

export const COLLISION_MASKS = {
  PLAYER: COLLISION_GROUPS.PLATFORM | COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.ITEM | COLLISION_GROUPS.TRIGGER | COLLISION_GROUPS.HAZARD,
  ENEMY: COLLISION_GROUPS.PLATFORM | COLLISION_GROUPS.PLAYER,
  ITEM: COLLISION_GROUPS.PLAYER,
};
```

## Player Body (Compound)

```javascript
export function createPlayerBody(x, y) {
  const torso = Bodies.rectangle(0, 0, 28, 40, { label: 'player_torso' });
  const head = Bodies.circle(0, -20, 12, { label: 'player_head' });
  const feet = Bodies.rectangle(0, 24, 20, 8, { label: 'player_feet', isSensor: true });

  const body = Body.create({
    parts: [torso, head, feet],
    friction: 0.3,
    frictionAir: 0.02,
    restitution: 0,
    label: 'player',
  });

  body.collisionFilter = {
    category: COLLISION_GROUPS.PLAYER,
    mask: COLLISION_MASKS.PLAYER,
  };

  Body.setPosition(body, { x, y });
  return body;
}
```

- Keep sensors separate (feet, ledge checks) to avoid tunneling.
- Derive body dimensions from manifest-driven constants where possible.

## Platforms & Hazards

```javascript
export function createPlatform({ x, y, width, height, kind }) {
  return Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: `platform:${kind}`,
    friction: 0.9,
    collisionFilter: {
      category: COLLISION_GROUPS.PLATFORM,
      mask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
    },
  });
}

export function createHazard(rect) {
  return Bodies.rectangle(rect.x, rect.y, rect.width, rect.height, {
    isStatic: true,
    label: 'hazard',
    isSensor: true,
    collisionFilter: {
      category: COLLISION_GROUPS.HAZARD,
      mask: COLLISION_GROUPS.PLAYER,
    },
  });
}
```

## Collision Handling

Use a dedicated system (e.g., `game/src/game/systems/collision.js`) to register handlers.

```javascript
export function registerCollisionHandlers(engine, { onPlayerHit, onCollectItem }) {
  Events.on(engine, 'collisionStart', (event) => {
    for (const { bodyA, bodyB } of event.pairs) {
      if (isPlayer(bodyA) && isEnemy(bodyB)) onPlayerHit(bodyA, bodyB);
      if (isPlayer(bodyA) && isItem(bodyB)) onCollectItem(bodyB);
      // Add other pairs as needed
    }
  });
}
```

- Keep handlers pure; mutate game state through store/system functions, not inside the event loop.
- Normalize body labels (`player`, `enemy`, `item`) to simplify checks.

## Performance Tips
- Reuse bodies where possible; avoid creating/destroying every frame.
- Disable sleeping for player/enemies but allow it for far-off static bodies if performance requires.
- Keep platform counts modest; combine background scenery into non-colliding layers rendered via Canvas.
- Profile with Matter.js `Inspector` or custom stats during development.

## Testing
- Unit test body factories and collision filters with Vitest snapshots of body properties.
- Use Playwright automated playthroughs to validate that jumps, collisions, and triggers work per manifest.
- Record videos for tricky sections (sloped or moving platforms) to spot tunneling or jitter.
