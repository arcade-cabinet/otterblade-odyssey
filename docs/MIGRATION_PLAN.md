# Foundation-First Migration Plan: React Native + Babylon.js

> **Principle**: "Clean migrate FIRST, get a solid foundation the RIGHT way fully tested and viable, THEN integrate and migrate content."

This document outlines the technical plan for migrating Otterblade Odyssey from Astro + Solid.js + Matter.js to React Native + Expo + Babylon.js (Reactylon).

## Executive Summary

- **Current**: ~10,300 lines TypeScript (Astro + Solid.js + Matter.js)
- **Target**: React Native + Expo + Babylon.js
- **Approach**: Build clean foundation first, port content after foundation is proven
- **Timeline**: 7-9 weeks

---

## Reusability Matrix

### 100% REUSABLE (No Changes)

| Asset | Size | Notes |
|-------|------|-------|
| JSON Manifests (10 chapters) | ~3,000 lines | Just fetch from new paths |
| `npcs.json`, `enemies.json`, `sounds.json` | ~800 lines | Same JSON structure |
| `cinematics.json`, `scenes.json` | ~400 lines | Video/image asset refs |
| Zod validation schemas | ~600 lines | Works in any JS runtime |
| Audio track files | N/A | MP3/OGG unchanged |
| Brand assets (images, fonts) | N/A | Copy directly |
| Game design (10 chapters, story, quests) | N/A | All content unchanged |

### PORT WITH MODERATE CHANGES (~30% of code)

| System | Lines | Changes Needed |
|--------|-------|----------------|
| `store.ts` (Zustand) | 631 | Replace `webStorage` → AsyncStorage |
| `constants.ts` | 142 | Update import paths |
| DDL loaders | ~400 | Change `fetch` paths, keep logic |
| `chapter-loaders.ts` | 270 | Change import strategy |
| `npc-loaders.ts` | 158 | Minor path adjustments |
| Quest types/interfaces | ~200 | Copy directly |

### COMPLETE REWRITE REQUIRED (~70% of code)

| System | Lines | Babylon.js Replacement |
|--------|-------|------------------------|
| `PhysicsManager.ts` | 615 | Babylon.js Physics (Ammo.js) |
| `AIManager.ts` | 842 | Navigation Plugin V2 |
| `ProceduralRenderer.ts` | 379 | Babylon.js procedural meshes |
| `PlayerController.ts` | 210 | Character controller + RN gestures |
| `InputManager.ts` | 313 | React Native touch handling |
| `AudioManager.ts` | 357 | expo-av (simpler API) |
| `collision.ts` | ~250 | Babylon.js physics events |
| `gameLoop.ts` | ~200 | Babylon.js render loop |
| `rendering/*.ts` | ~500 | All Babylon.js mesh/material |
| `EnemyStates.js` (YUKA) | 311 | Navigation Plugin V2 states |

---

## Phase 1: Clean Foundation (Week 1-2)

**Goal**: Prove React Native + Babylon.js works E2E with a minimal vertical slice.

### 1.1 Project Setup

```bash
# Create new Expo project
npx create-expo-app@latest otterblade-native --template tabs
cd otterblade-native

# Install Babylon.js React Native
npx expo install @babylonjs/react-native @babylonjs/core @babylonjs/loaders

# Install supporting packages
npx expo install expo-av zustand @react-native-async-storage/async-storage

# Install physics
npm install ammo.js
```

### 1.2 Minimal Vertical Slice Components

1. **Single Babylon.js Scene** - Ground plane, camera, lighting
2. **Procedural Finn Mesh** - Using Babylon.js primitives
3. **Basic Physics** - Ammo.js via Babylon.js plugin
4. **Touch Joystick** - Virtual joystick for movement
5. **Zustand Store** - AsyncStorage persistence

### 1.3 Exit Criteria (Must Pass All)

- [ ] Finn mesh renders in 3D scene
- [ ] Finn moves left/right with physics
- [ ] Finn jumps with gravity
- [ ] State persists across app restart
- [ ] Runs on iOS Simulator
- [ ] Runs on Android Emulator
- [ ] No memory leaks after 5 minutes of play
- [ ] 60 FPS on modern device

---

## Phase 2: Port Core Systems (Week 2-4)

### 2.1 State Management

Port `store.ts` with AsyncStorage adapter:

```typescript
// otterblade-native/src/store/gameStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const asyncStorageAdapter = {
  getItem: async (name: string) => await AsyncStorage.getItem(name),
  setItem: async (name: string, value: string) => await AsyncStorage.setItem(name, value),
  removeItem: async (name: string) => await AsyncStorage.removeItem(name),
};

// EXACT same state shape from current store.ts
interface PersistedState {
  bestScore: number;
  bestDistance: number;
  quality: number;
  musicVolume: number;
  sfxVolume: number;
  hapticEnabled: boolean;
  unlockedChapters: number[];
  completedChapters: number[];
  achievements: string[];
  totalEmberShards: number;
  totalHearthstones: number;
  bladeLevel: number;
}

interface RuntimeState {
  health: number;
  maxHealth: number;
  warmth: number;
  maxWarmth: number;
  shards: number;
  // ... rest of RuntimeState unchanged
}

export const useStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PERSISTED,
      ...DEFAULT_RUNTIME,

      // All actions copy directly from current store.ts
      takeDamage: (amount) => set((s) => ({ health: Math.max(0, s.health - amount) })),
      collectShard: () => set((s) => ({ shards: s.shards + 1, score: s.score + 180 })),
      // ...
    }),
    {
      name: 'otterblade-save',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state): PersistedState => ({
        // Same partialize logic
      }),
    }
  )
);
```

### 2.2 DDL Manifest Loaders

Two options for loading JSON manifests:

**Option A: Bundle with App (Recommended for MVP)**
```typescript
// otterblade-native/src/data/chapter-loaders.ts
import { ChapterManifest, ChapterManifestSchema } from './manifest-schemas';

// Static imports bundled with app
const CHAPTER_MANIFESTS: Record<number, unknown> = {
  0: require('../assets/manifests/chapters/chapter-0-the-calling.json'),
  1: require('../assets/manifests/chapters/chapter-1-river-path.json'),
  // ...
};

export function loadChapterManifest(chapterId: number): ChapterManifest {
  const rawData = CHAPTER_MANIFESTS[chapterId];
  if (!rawData) throw new Error(`Chapter ${chapterId} not found`);
  return ChapterManifestSchema.parse(rawData);
}
```

**Option B: Fetch from CDN (For OTA Updates)**
```typescript
const CDN_BASE = 'https://cdn.otterblade.game/manifests';

export async function loadChapterManifest(chapterId: number): Promise<ChapterManifest> {
  const response = await fetch(`${CDN_BASE}/chapters/chapter-${chapterId}.json`);
  const rawData = await response.json();
  return ChapterManifestSchema.parse(rawData);
}
```

### 2.3 Babylon.js Procedural Finn

Convert Canvas 2D drawing to Babylon.js meshes:

```typescript
// otterblade-native/src/rendering/finn.ts
import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';

export function createFinnMesh(scene: Scene): TransformNode {
  const root = new TransformNode('finn', scene);

  // Body - warm brown otter (capsule)
  const body = MeshBuilder.CreateCapsule('finn-body', {
    height: 1.1,
    radius: 0.25,
  }, scene);
  body.parent = root;

  const bodyMat = new StandardMaterial('finn-body-mat', scene);
  bodyMat.diffuseColor = new Color3(0.545, 0.435, 0.278); // #8B6F47
  body.material = bodyMat;

  // Chest - lighter tan (ellipsoid front)
  const chest = MeshBuilder.CreateSphere('finn-chest', {
    diameter: 0.4,
  }, scene);
  chest.position = new Vector3(0.05, 0, -0.1);
  chest.scaling = new Vector3(0.8, 1.2, 0.5);
  chest.parent = root;

  const chestMat = new StandardMaterial('finn-chest-mat', scene);
  chestMat.diffuseColor = new Color3(0.831, 0.647, 0.455); // #D4A574
  chest.material = chestMat;

  // Head - sphere
  const head = MeshBuilder.CreateSphere('finn-head', {
    diameter: 0.5,
  }, scene);
  head.position = new Vector3(0, 0.65, 0);
  head.parent = root;
  head.material = bodyMat;

  // Snout - elongated sphere
  const snout = MeshBuilder.CreateSphere('finn-snout', {
    diameter: 0.2,
  }, scene);
  snout.position = new Vector3(0, 0.6, -0.2);
  snout.scaling = new Vector3(0.8, 0.6, 1.2);
  snout.parent = root;
  snout.material = chestMat;

  // Eyes - small black spheres
  const eyeLeft = MeshBuilder.CreateSphere('finn-eye-left', { diameter: 0.08 }, scene);
  eyeLeft.position = new Vector3(-0.1, 0.7, -0.18);
  eyeLeft.parent = root;

  const eyeRight = MeshBuilder.CreateSphere('finn-eye-right', { diameter: 0.08 }, scene);
  eyeRight.position = new Vector3(0.1, 0.7, -0.18);
  eyeRight.parent = root;

  const eyeMat = new StandardMaterial('finn-eye-mat', scene);
  eyeMat.diffuseColor = Color3.Black();
  eyeLeft.material = eyeMat;
  eyeRight.material = eyeMat;

  // Ears - small cones
  const earLeft = MeshBuilder.CreateCylinder('finn-ear-left', {
    height: 0.15,
    diameterTop: 0,
    diameterBottom: 0.1,
  }, scene);
  earLeft.position = new Vector3(-0.15, 0.85, 0);
  earLeft.rotation.z = Math.PI / 6;
  earLeft.parent = root;
  earLeft.material = bodyMat;

  const earRight = MeshBuilder.CreateCylinder('finn-ear-right', {
    height: 0.15,
    diameterTop: 0,
    diameterBottom: 0.1,
  }, scene);
  earRight.position = new Vector3(0.15, 0.85, 0);
  earRight.rotation.z = -Math.PI / 6;
  earRight.parent = root;
  earRight.material = bodyMat;

  // Otterblade - sword held in right paw
  const sword = createOtterblade(scene);
  sword.position = new Vector3(0.35, 0, -0.1);
  sword.parent = root;

  return root;
}

function createOtterblade(scene: Scene): Mesh {
  // Blade - flattened cylinder
  const blade = MeshBuilder.CreateCylinder('otterblade-blade', {
    height: 0.8,
    diameterTop: 0.02,
    diameterBottom: 0.08,
  }, scene);
  blade.rotation.z = Math.PI / 2;

  const bladeMat = new StandardMaterial('blade-mat', scene);
  bladeMat.diffuseColor = new Color3(0.7, 0.7, 0.8); // Steel
  bladeMat.specularColor = new Color3(1, 1, 1);
  blade.material = bladeMat;

  // Handle
  const handle = MeshBuilder.CreateCylinder('otterblade-handle', {
    height: 0.15,
    diameter: 0.04,
  }, scene);
  handle.position.x = -0.45;
  handle.rotation.z = Math.PI / 2;
  handle.parent = blade;

  const handleMat = new StandardMaterial('handle-mat', scene);
  handleMat.diffuseColor = new Color3(0.4, 0.25, 0.1); // Leather brown
  handle.material = handleMat;

  return blade;
}
```

### 2.4 Babylon.js Physics

Replace Matter.js with Ammo.js plugin:

```typescript
// otterblade-native/src/physics/physics-manager.ts
import {
  Scene,
  Vector3,
  PhysicsImpostor,
  Mesh,
  MeshBuilder,
} from '@babylonjs/core';
import { AmmoJSPlugin } from '@babylonjs/core/Physics/Plugins/ammoJSPlugin';

export async function setupPhysics(scene: Scene): Promise<void> {
  // Load Ammo.js
  const Ammo = await import('ammo.js');
  const ammo = await Ammo.default();

  // Enable physics with gravity
  scene.enablePhysics(
    new Vector3(0, -15, 0), // POC-proven gravity
    new AmmoJSPlugin(true, ammo)
  );
}

export function createPlayerPhysics(mesh: Mesh, scene: Scene): void {
  mesh.physicsImpostor = new PhysicsImpostor(
    mesh,
    PhysicsImpostor.CapsuleImpostor,
    {
      mass: 1,
      friction: 0.1,
      restitution: 0,
    },
    scene
  );
}

export function createPlatformPhysics(mesh: Mesh, scene: Scene): void {
  mesh.physicsImpostor = new PhysicsImpostor(
    mesh,
    PhysicsImpostor.BoxImpostor,
    {
      mass: 0, // Static
      friction: 0.5,
      restitution: 0,
    },
    scene
  );
}

export function createGroundPlane(scene: Scene): Mesh {
  const ground = MeshBuilder.CreateGround('ground', {
    width: 100,
    height: 20,
  }, scene);

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0 },
    scene
  );

  return ground;
}
```

---

## Phase 3: AI System (Week 4-5)

Replace YUKA entirely with Babylon.js Navigation Plugin V2.

### 3.1 Navigation Setup

```typescript
// otterblade-native/src/ai/navigation-manager.ts
import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import { RecastJSPlugin } from '@babylonjs/core/Navigation/Plugins/recastJSPlugin';
import Recast from 'recast-detour';

export class NavigationManager {
  private plugin: RecastJSPlugin;
  private crowd: any;

  async initialize(scene: Scene): Promise<void> {
    const recast = await Recast();
    this.plugin = new RecastJSPlugin(recast);
  }

  buildNavMesh(groundMesh: Mesh, platformMeshes: Mesh[]): void {
    this.plugin.createNavMesh(
      [groundMesh, ...platformMeshes],
      {
        cs: 0.2,           // Cell size
        ch: 0.2,           // Cell height
        walkableSlopeAngle: 45,
        walkableHeight: 2,
        walkableClimb: 0.5,
        walkableRadius: 0.3,
        maxEdgeLen: 12,
        maxSimplificationError: 1.3,
        minRegionArea: 8,
        mergeRegionArea: 20,
        maxVertsPerPoly: 6,
        detailSampleDist: 6,
        detailSampleMaxError: 1,
      }
    );

    // Create crowd for enemy agents
    this.crowd = this.plugin.createCrowd(50, 0.5, scene);
  }

  addAgent(position: Vector3, params: AgentParams): number {
    return this.crowd.addAgent(position, {
      radius: params.radius ?? 0.3,
      height: params.height ?? 1.5,
      maxAcceleration: params.maxAcceleration ?? 4.0,
      maxSpeed: params.maxSpeed ?? 1.5,
      collisionQueryRange: params.collisionQueryRange ?? 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0,
    });
  }

  setAgentTarget(agentIndex: number, target: Vector3): void {
    this.crowd.agentGoto(agentIndex, this.plugin.getClosestPoint(target));
  }

  getAgentPosition(agentIndex: number): Vector3 {
    return this.crowd.getAgentPosition(agentIndex);
  }

  update(deltaTime: number): void {
    this.crowd.update(deltaTime);
  }
}
```

### 3.2 Enemy State Machine

```typescript
// otterblade-native/src/ai/enemy-states.ts
import { Vector3 } from '@babylonjs/core';
import { NavigationManager } from './navigation-manager';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'hurt';

export interface EnemyAI {
  agentIndex: number;
  state: EnemyState;
  hp: number;
  maxHp: number;
  target: Vector3 | null;
  aggroRadius: number;
  attackRange: number;
  patrolSpeed: number;
  chaseSpeed: number;
}

export function updateEnemyAI(
  enemy: EnemyAI,
  playerPosition: Vector3,
  navManager: NavigationManager,
  deltaTime: number
): void {
  const enemyPos = navManager.getAgentPosition(enemy.agentIndex);
  const distToPlayer = Vector3.Distance(enemyPos, playerPosition);

  switch (enemy.state) {
    case 'idle':
      // Check for player in aggro range
      if (distToPlayer < enemy.aggroRadius) {
        enemy.state = 'chase';
        enemy.target = playerPosition;
      }
      break;

    case 'patrol':
      // Wander within patrol zone
      if (distToPlayer < enemy.aggroRadius) {
        enemy.state = 'chase';
        enemy.target = playerPosition;
      }
      break;

    case 'chase':
      // Pursue player
      navManager.setAgentTarget(enemy.agentIndex, playerPosition);

      if (distToPlayer > enemy.aggroRadius * 1.5) {
        enemy.state = 'patrol';
        enemy.target = null;
      } else if (distToPlayer < enemy.attackRange) {
        enemy.state = 'attack';
      }
      break;

    case 'attack':
      // Stop and attack
      if (distToPlayer > enemy.attackRange * 1.5) {
        enemy.state = 'chase';
      }
      break;

    case 'flee':
      // Run from player when low HP
      const fleeDirection = enemyPos.subtract(playerPosition).normalize();
      const fleeTarget = enemyPos.add(fleeDirection.scale(10));
      navManager.setAgentTarget(enemy.agentIndex, fleeTarget);

      if (distToPlayer > enemy.aggroRadius * 2 || enemy.hp > enemy.maxHp * 0.5) {
        enemy.state = 'patrol';
      }
      break;

    case 'hurt':
      // Stagger, then decide next state
      if (enemy.hp < enemy.maxHp * 0.25) {
        enemy.state = 'flee';
      } else if (enemy.target) {
        enemy.state = 'chase';
      } else {
        enemy.state = 'patrol';
      }
      break;
  }
}
```

---

## Phase 4: Content Migration (Week 5-7)

### 4.1 Copy JSON Manifests

```bash
# Copy all manifests to React Native project
mkdir -p otterblade-native/assets/manifests/chapters
cp game/public/data/manifests/chapters/*.json otterblade-native/assets/manifests/chapters/
cp game/public/data/manifests/npcs.json otterblade-native/assets/manifests/
cp game/public/data/manifests/enemies.json otterblade-native/assets/manifests/
cp game/public/data/manifests/sounds.json otterblade-native/assets/manifests/
cp game/public/data/manifests/cinematics.json otterblade-native/assets/manifests/
```

### 4.2 Level Factory

```typescript
// otterblade-native/src/factories/level-factory.ts
import { Scene, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { loadChapterManifest } from '../data/chapter-loaders';
import { createPlatformPhysics } from '../physics/physics-manager';

export async function buildLevel(chapterId: number, scene: Scene) {
  const manifest = loadChapterManifest(chapterId);
  const platforms: Mesh[] = [];

  // Create platforms from manifest
  for (const platform of manifest.level.platforms) {
    const mesh = MeshBuilder.CreateBox(`platform-${platform.id}`, {
      width: platform.width,
      height: platform.height,
      depth: 10, // 2.5D depth
    }, scene);

    mesh.position.x = platform.x + platform.width / 2;
    mesh.position.y = platform.y - platform.height / 2;

    // Material based on biome
    const mat = new StandardMaterial(`platform-mat-${platform.id}`, scene);
    mat.diffuseColor = Color3.FromHexString(manifest.environment.groundColor);
    mesh.material = mat;

    createPlatformPhysics(mesh, scene);
    platforms.push(mesh);
  }

  return { platforms, manifest };
}
```

### 4.3 UI Layer (React Native)

```typescript
// otterblade-native/src/components/HUD.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/gameStore';

export function HUD() {
  const health = useStore((s) => s.health);
  const maxHealth = useStore((s) => s.maxHealth);
  const warmth = useStore((s) => s.warmth);
  const shards = useStore((s) => s.shards);
  const bladeLevel = useStore((s) => s.bladeLevel);

  return (
    <View style={styles.container}>
      {/* Health Hearts */}
      <View style={styles.healthRow}>
        {Array.from({ length: maxHealth }).map((_, i) => (
          <Text key={i} style={styles.heart}>
            {i < health ? '❤️' : '🖤'}
          </Text>
        ))}
      </View>

      {/* Warmth Bar */}
      <View style={styles.warmthContainer}>
        <Text style={styles.label}>Warmth</Text>
        <View style={styles.warmthBar}>
          <View style={[styles.warmthFill, { width: `${warmth}%` }]} />
        </View>
      </View>

      {/* Shards */}
      <Text style={styles.shards}>✨ {shards}</Text>

      {/* Blade Level */}
      <Text style={styles.blade}>⚔️ Lv.{bladeLevel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
  },
  healthRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  heart: {
    fontSize: 20,
    marginRight: 4,
  },
  warmthContainer: {
    marginBottom: 10,
  },
  label: {
    color: '#F4D03F',
    fontSize: 12,
    marginBottom: 4,
  },
  warmthBar: {
    width: 100,
    height: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#F4D03F',
    borderRadius: 2,
  },
  warmthFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  shards: {
    color: '#F4D03F',
    fontSize: 16,
    marginBottom: 5,
  },
  blade: {
    color: '#C0C0C0',
    fontSize: 14,
  },
});
```

---

## Phase 5: Polish & Release (Week 7-9)

### 5.1 EAS Build Setup

```json
// otterblade-native/eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 5.2 E2E Testing with Maestro

```yaml
# otterblade-native/.maestro/game-flow.yaml
appId: com.otterblade.odyssey
---
- launchApp
- assertVisible: "Begin Journey"
- tapOn: "Begin Journey"
- assertVisible: "Chapter 0"
- swipeRight:
    from: 10%, 50%
    to: 90%, 50%
- assertVisible:
    id: "finn-mesh"
- tapOn:
    point: 90%, 80%  # Jump button
```

### 5.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60 | Babylon.js Inspector |
| Memory | < 150 MB | Xcode Instruments |
| Load Time | < 3s | Cold start |
| Bundle Size | < 50 MB | EAS build output |

---

## Summary

### What Changes

| Aspect | Current | New |
|--------|---------|-----|
| Framework | Astro + Solid.js | React Native + Expo |
| Rendering | Canvas 2D | Babylon.js 3D |
| Physics | Matter.js | Babylon.js Ammo.js |
| AI | YUKA | Navigation Plugin V2 |
| State | Zustand + localStorage | Zustand + AsyncStorage |
| Build | Vite | EAS Build |
| Platform | Web only | iOS + Android + Web |

### What Stays The Same

- All 10 chapters and story content
- JSON manifest structure
- Zod validation schemas
- Zustand state management logic
- Game design and mechanics
- Brand assets and styling

---

## References

- [Babylon.js React Native](https://www.babylonjs.com/reactnative/)
- [Navigation Plugin V2](https://doc.babylonjs.com/features/featuresDeepDive/crowdNavigation/createNavMesh)
- [Expo SDK 54](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [POC Reference](../pocs/otterblade_odyssey.html)
