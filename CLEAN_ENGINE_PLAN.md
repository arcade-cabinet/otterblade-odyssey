# Clean Engine Architecture - Decomposed POC

## The Plan: rm -rf and Build Proper Modular Engine

### What We're Throwing Away
```bash
rm -rf client/src/game/ecs/
rm -rf client/src/game/components/
rm client/src/game/Physics.tsx
rm client/src/game/Physics2D.tsx
rm client/src/game/Player.tsx
rm client/src/game/Level.tsx
```

**Why:** React Three Fiber + Rapier + ECS adds zero value. Proven by 267-line POC.

---

## Clean Modular Structure

```
client/src/engine/
├── core/
│   ├── Game.ts              # Main game loop
│   ├── Scene.ts             # Scene management
│   └── Camera.ts            # 2D camera follow
│
├── rendering/
│   ├── Renderer.ts          # Canvas 2D renderer
│   ├── ProceduralSprites.ts # Otter, enemies (POC code)
│   ├── Parallax.ts          # Background layers
│   └── Particles.ts         # Effects system
│
├── physics/
│   ├── PhysicsWorld.ts      # Simple AABB (NOT Rapier!)
│   ├── Collider.ts          # Box/circle colliders
│   └── RigidBody.ts         # Velocity, gravity
│
├── entities/
│   ├── Entity.ts            # Base entity (NOT ECS!)
│   ├── Player.ts            # Player entity
│   ├── Enemy.ts             # Enemy entity
│   └── Platform.ts          # Platform entity
│
├── ai/
│   ├── Pathfinding.ts       # YUKA integration
│   ├── FSM.ts               # Finite state machine
│   └── Behaviors.ts         # AI behaviors
│
├── ddl/
│   ├── ManifestLoader.ts    # Load chapter JSON
│   ├── LevelBuilder.ts      # Build level from DDL
│   ├── QuestSystem.ts       # Execute quests from DDL
│   └── StorySystem.ts       # Story beats from DDL
│
├── state/
│   ├── GameState.ts         # Zustand store
│   └── SaveSystem.ts        # localStorage persistence
│
└── input/
    ├── InputManager.ts      # Keyboard/gamepad
    └── Commands.ts          # Input → action mapping
```

---

## Module Breakdown

### 1. Core/Game.ts (Main Loop)
```typescript
export class Game {
  private renderer: Renderer;
  private physics: PhysicsWorld;
  private scene: Scene;
  private input: InputManager;
  
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.physics = new PhysicsWorld();
    this.scene = new Scene();
    this.input = new InputManager();
  }
  
  async loadChapter(id: number) {
    const manifest = await ManifestLoader.load(id);
    this.scene = LevelBuilder.build(manifest);
  }
  
  update(dt: number) {
    this.input.update();
    this.scene.update(dt);
    this.physics.step(dt, this.scene.entities);
  }
  
  render() {
    this.renderer.clear();
    this.renderer.renderScene(this.scene);
  }
  
  gameLoop() {
    const dt = performance.now() - this.lastTime;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}
```

### 2. Physics/PhysicsWorld.ts (Simple AABB, NOT Rapier)
```typescript
export class PhysicsWorld {
  private gravity = 0.6;
  
  step(dt: number, entities: Entity[]) {
    entities.forEach(entity => {
      if (!entity.rigidBody) return;
      
      // Apply gravity
      entity.rigidBody.velocity.y += this.gravity;
      
      // Move
      entity.position.x += entity.rigidBody.velocity.x;
      entity.position.y += entity.rigidBody.velocity.y;
      
      // Collide
      this.resolveCollisions(entity, entities);
    });
  }
  
  resolveCollisions(entity: Entity, others: Entity[]) {
    // Simple AABB collision
    // 20 lines, works perfectly
  }
}
```

### 3. Entities/Entity.ts (Simple Objects, NOT ECS)
```typescript
export class Entity {
  id: string;
  position: Vector2;
  rigidBody?: RigidBody;
  collider?: Collider;
  sprite?: ProceduralSprite;
  
  update(dt: number) {
    // Override in subclasses
  }
  
  render(renderer: Renderer) {
    if (this.sprite) {
      this.sprite.draw(renderer.ctx, this.position);
    }
  }
}

export class Player extends Entity {
  health = 5;
  facing = 1;
  state: 'idle' | 'walking' | 'attacking' = 'idle';
  
  update(dt: number) {
    // Handle input
    // Update animation state
  }
}
```

### 4. DDL/ManifestLoader.ts (Use Your JSON!)
```typescript
export class ManifestLoader {
  private static cache = new Map<number, ChapterManifest>();
  
  static async load(chapterId: number): Promise<ChapterManifest> {
    if (this.cache.has(chapterId)) {
      return this.cache.get(chapterId)!;
    }
    
    const response = await fetch(
      `/src/data/manifests/chapters/chapter-${chapterId}-*.json`
    );
    const manifest = await response.json();
    this.cache.set(chapterId, manifest);
    return manifest;
  }
}
```

### 5. DDL/LevelBuilder.ts (DDL → Entities)
```typescript
export class LevelBuilder {
  static build(manifest: ChapterManifest): Scene {
    const scene = new Scene();
    
    // Create platforms from DDL boundaries
    manifest.levelDefinition.boundaries.forEach(boundary => {
      scene.addEntity(new Platform(
        boundary.x, boundary.y,
        boundary.width, boundary.height
      ));
    });
    
    // Spawn player from DDL
    const spawn = manifest.connections.transitionIn.playerSpawnPoint;
    scene.player = new Player(spawn.x, spawn.y);
    
    // Create enemies from DDL
    manifest.levelDefinition.enemySpawns?.forEach(spawn => {
      scene.addEntity(new Enemy(spawn.x, spawn.y, spawn.type));
    });
    
    return scene;
  }
}
```

---

## Why This is Better

### Old Way (What We're Deleting)
- React Three Fiber: 3D engine for 2.5D game
- Rapier: 3D physics engine with 2D compat mode
- Miniplex ECS: Complexity with zero benefit
- 50+ files, 20,000+ lines
- **Doesn't actually use DDL manifests**
- **Can't get past level 0**

### New Way (Clean Modules)
- Canvas 2D: Exactly what we need
- Simple AABB: 100 lines, works perfectly
- Plain entities: No ECS complexity
- ~15 modules, ~3,000 lines total
- **DDL-first from the start**
- **All 10 chapters working**

---

## Implementation Order

1. **Week 1: Core + Rendering**
   - Game loop
   - Canvas renderer
   - Procedural sprites (copy from POC)
   - Camera system

2. **Week 2: Physics + Entities**
   - AABB physics
   - Entity base classes
   - Player controller
   - Platform collision

3. **Week 3: DDL Integration**
   - Manifest loader
   - Level builder
   - Quest system
   - Story system

4. **Week 4: AI + Polish**
   - YUKA pathfinding
   - Enemy behaviors
   - Particles/effects
   - Audio system

5. **Week 5: All 10 Chapters**
   - Chapter transitions
   - Save system
   - Boss fights
   - Victory conditions

---

## Testing Strategy

```typescript
// Playwright can test this easily
test('Chapter 0 loads from DDL', async ({ page }) => {
  await page.goto('/');
  
  const game = await page.evaluate(() => window.__GAME_API__.getState());
  expect(game.chapter.name).toBe('The Calling');
  expect(game.chapter.quest).toBe('Answer the Call');
  expect(game.platforms.length).toBeGreaterThan(0);
});

test('Player can complete Chapter 0', async ({ page }) => {
  await page.keyboard.press('ArrowRight'); // Move right
  await page.keyboard.press('Space');      // Jump
  // ... navigate to exit
  
  const completed = await page.evaluate(() => 
    window.__GAME_API__.isChapterComplete(0)
  );
  expect(completed).toBe(true);
});
```

---

## Decision Time

**Option A: Chainsaw**
- Delete React Three Fiber/ECS/Rapier
- Build clean modular engine (plan above)
- Use DDL manifests properly
- Ship all 10 chapters in ~5 weeks

**Option B: Fix Existing**
- Prove R3F/Rapier/ECS adds value
- Make existing code actually use DDLs
- Get past level 0
- Timeline: Unknown (hasn't worked in months)

**My vote: Chainsaw. Proven approach beats unproven complexity.**
