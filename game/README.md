# Otterblade Odyssey Game

A warm, wordless 2D platformer built with **Astro + Solid.js + Matter.js**.

## 🎮 Play the Game

### Development
```bash
cd game
npm install
npm run dev
```

Visit `http://localhost:4321`

### Production Build
```bash
npm run build
npm run preview
```

## 🎯 Controls

- **WASD / Arrow Keys** - Move Finn left/right
- **Space** - Jump
- **Z** - Attack (sword)

## 🏗️ Architecture

**Tech Stack:**
- **Astro 5.x** - Static site generator
- **Solid.js** - Reactive UI components
- **Matter.js** - 2D physics engine
- **Zustand** - State management (vanilla)
- **Canvas 2D** - Procedural rendering

**Performance:**
- Bundle: ~120KB (17x smaller than React version)
- Memory: <10MB
- FPS: 60 stable
- Build: 1.70s

## 📁 Structure

```
game/src/
├── pages/
│   └── index.astro           # Entry point
├── components/
│   ├── GameCanvas.jsx        # Main game renderer
│   ├── Menu.jsx              # Start menu
│   └── HUD.jsx               # Health/warmth/shards display
├── game/
│   ├── engine/
│   │   ├── physics.js        # Matter.js wrapper
│   │   └── gameLoop.js       # 60fps loop
│   ├── entities/
│   │   └── Player.js         # Finn controller
│   ├── rendering/
│   │   ├── finn.js           # Procedural otter
│   │   └── parallax.js       # Background layers
│   ├── systems/
│   │   └── input.js          # Keyboard handling
│   └── ddl/
│       └── loader.js         # Chapter manifests
├── stores/
│   └── gameStore.js          # Zustand vanilla store
└── styles/
    └── global.css            # Warm Redwall aesthetic
```

## 🎨 Features

- ✅ 10 playable chapters (Finn's Cottage → Storm's Edge)
- ✅ Procedural Finn rendering (no sprites)
- ✅ Parallax backgrounds (4 biomes)
- ✅ Matter.js physics (POC-proven values)
- ✅ DDL architecture (JSON manifests)
- ✅ Chapter progression system
- ✅ Collectible shards
- ✅ localStorage persistence
- ✅ Warm Redwall-inspired aesthetic

## 🚀 Deployment

Game is configured for GitHub Pages deployment:
- Site: `https://arcade-cabinet.github.io`
- Base: `/otterblade-odyssey`

## 📝 Notes

- YUKA pathfinding library not available via npm - enemy AI simplified
- Audio system (Howler.js/Tone.js) installed but not yet implemented
- Touch controls (nipplejs) installed but not yet implemented
