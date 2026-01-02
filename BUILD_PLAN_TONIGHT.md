# BUILD THE ENTIRE GAME TONIGHT

## The Mission
6 hours. Full production game. All 10 chapters. Vanilla JavaScript. Playwright tested. Ship it.

## Hour 1: Core Engine (Rendering + Physics)
- [ ] Game loop with requestAnimationFrame
- [ ] Canvas 2D renderer with camera follow
- [ ] Procedural sprite rendering (copy from POC)
- [ ] Simple AABB physics (gravity, collision)
- [ ] Input manager (keyboard + touch)
- [ ] TEST: Character moves and jumps

## Hour 2: DDL Integration + Level System
- [ ] Manifest loader (reads all 10 chapter JSONs)
- [ ] Level builder (creates platforms from DDL boundaries)
- [ ] Scene management (load/unload chapters)
- [ ] Chapter transitions (plates with quest text)
- [ ] Exit triggers (portal to next chapter)
- [ ] TEST: Can load and play Chapter 0

## Hour 3: Entities + Combat
- [ ] Player entity (health, attack, roll)
- [ ] Enemy entity (Galeborn scouts)
- [ ] Platform entity (solid collision)
- [ ] Collectible entity (ember shards)
- [ ] Combat system (sword attack, damage)
- [ ] TEST: Can fight enemies and collect shards

## Hour 4: UI + State + Save System
- [ ] HUD (health, shards, quest)
- [ ] Start menu (new game, continue, chapters)
- [ ] Chapter plates (cinematics)
- [ ] Game over screen
- [ ] Victory screen
- [ ] State management + localStorage
- [ ] TEST: UI responds to game state

## Hour 5: YUKA AI + All 10 Chapters
- [ ] YUKA pathfinding integration
- [ ] Enemy AI behaviors (patrol, chase, attack)
- [ ] Boss enemy variants
- [ ] Load ALL 10 chapter manifests
- [ ] Quest system (track objectives)
- [ ] TEST: Can complete all 10 chapters

## Hour 6: Polish + E2E Testing
- [ ] Parallax backgrounds for each biome
- [ ] Particle effects (attacks, collectibles)
- [ ] Sound effects (placeholder or procedural)
- [ ] Mobile touch controls
- [ ] Playwright E2E tests for all chapters
- [ ] Performance optimization
- [ ] BUILD: Production bundle with esbuild
- [ ] TEST: Complete journey validation

## File Structure
```
client/src/game-v2/           # NEW clean implementation
├── index.html
├── main.js
├── engine/
│   ├── Game.js
│   ├── Renderer.js
│   ├── Physics.js
│   └── Camera.js
├── entities/
│   ├── Entity.js
│   ├── Player.js
│   ├── Enemy.js
│   └── Platform.js
├── ddl/
│   ├── loader.js
│   └── builder.js
├── ui/
│   ├── hud.js
│   ├── menu.js
│   └── plates.js
├── state/
│   └── store.js
└── ai/
    └── pathfinding.js
```

## Success Criteria
- [ ] All 10 chapters playable
- [ ] Procedural otter rendering (POC style)
- [ ] DDL-driven levels from manifests
- [ ] YUKA pathfinding working
- [ ] Combat system functional
- [ ] Save/load working
- [ ] Complete E2E test passing
- [ ] Production build < 100KB
- [ ] Memory usage < 20MB
- [ ] 60fps stable

## Let's BUILD.
