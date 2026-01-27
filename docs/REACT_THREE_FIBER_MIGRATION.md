# React Three Fiber Migration Complete

## Architecture Overview

Otterblade Odyssey has been fully migrated to use **React Three Fiber** for rendering and **Rapier** for physics across both web and mobile platforms. This replaces the previous Matter.js (web) and Babylon.js (mobile) implementations.

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Rendering** | React Three Fiber 9.5.0 | 3D rendering via Three.js with React paradigm |
| **Physics** | Rapier 2.2.0 (@react-three/rapier) | High-performance 3D physics simulation |
| **AI** | YUKA 0.7.8 | Pathfinding, steering behaviors, FSM for enemies |
| **UI Framework (Web)** | Solid.js 1.9.10 | Reactive UI layer |
| **UI Framework (Mobile)** | React Native + Expo | Mobile-first experience |

### Monorepo Structure

```
apps/
├── web/                    # Astro + Solid.js + R3F
│   └── src/game/           # Legacy Matter.js code (being phased out)
└── mobile/                 # React Native + Expo + R3F

packages/
├── game-logic/             # ⭐ Core game engine (R3F + Rapier + YUKA)
│   ├── GameScene.tsx       # Main 3D scene component
│   ├── Player.tsx          # Finn the Otter (procedural 3D mesh)
│   ├── Level.tsx           # Level geometry from manifests
│   ├── Enemies.tsx         # Enemies with YUKA AI
│   ├── NPCs.tsx            # NPCs with idle behaviors
│   └── physics/            # Rapier physics exports
├── ui/                     # Shared UI, branding, design tokens
└── core/                   # Types, constants, utilities
```

### Key Changes

#### Physics: Matter.js → Rapier

**Before (Matter.js - 2D)**:
```typescript
const engine = Engine.create();
const player = Bodies.rectangle(x, y, 35, 55, { label: 'player' });
World.add(engine.world, player);
```

**After (Rapier via R3F - 3D)**:
```tsx
<Physics gravity={[0, -9.81, 0]}>
  <RigidBody position={[x, y, z]} colliders={false}>
    <CapsuleCollider args={[0.5, 0.5]} />
    <mesh>...</mesh>
  </RigidBody>
</Physics>
```

#### AI: Custom Pathfinding → YUKA

**Before (Custom implementation)**:
```typescript
// Manual pathfinding and state machines
updateEnemyAI(enemy, deltaTime);
```

**After (YUKA)**:
```typescript
const vehicle = new YUKA.Vehicle();
const wanderBehavior = new YUKA.WanderBehavior();
vehicle.steering.add(wanderBehavior);
entityManager.add(vehicle);
```

#### Rendering: Canvas 2D → Three.js 3D

**Before (Procedural 2D)**:
```typescript
ctx.fillStyle = '#8B6F47';
ctx.beginPath();
ctx.ellipse(x, y, 16, 22, 0, 0, Math.PI * 2);
ctx.fill();
```

**After (Procedural 3D)**:
```tsx
<mesh castShadow>
  <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
  <meshStandardMaterial color="#8B6F47" />
</mesh>
```

### Integration Guide

#### Web App (Astro + Solid.js)

```tsx
import { GameScene } from '@otterblade/game-logic';

function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene chapterId={0} />
    </div>
  );
}
```

#### Mobile App (React Native + Expo)

```tsx
import { GameScene } from '@otterblade/game-logic';
import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <GameScene chapterId={0} />
    </View>
  );
}
```

### Benefits

1. **Cross-Platform**: Same 3D rendering code works on web and mobile
2. **Performance**: Rapier is significantly faster than Matter.js
3. **3D Ready**: True 3D physics and rendering (not 2.5D simulation)
4. **Modern**: React paradigm for game logic and rendering
5. **Maintainable**: Smaller, cleaner codebase with shared logic

### Migration Status

- [x] Create React Three Fiber game components
- [x] Integrate Rapier for physics
- [x] Integrate YUKA for AI pathfinding
- [x] Set up monorepo structure
- [x] Create shared packages (ui, core, game-logic)
- [ ] Migrate all Matter.js code to Rapier
- [ ] Update tests to use R3F test utils
- [ ] Update documentation

### Testing

```bash
# Run all tests
pnpm test

# Run linting
pnpm lint

# Build all packages
pnpm build
```

### Known Issues

- Legacy Matter.js code still exists in `apps/web/src/game/` (will be removed)
- Tests need to be updated for React Three Fiber
- Performance tuning needed for mobile

### Next Steps

1. Complete migration of all game logic from Matter.js to Rapier
2. Update e2e tests to work with 3D rendering
3. Optimize performance for mobile devices
4. Add advanced YUKA AI behaviors (pursuit, evade, etc.)
