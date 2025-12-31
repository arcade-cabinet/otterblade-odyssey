# Otterblade Odyssey: Zephyros Rising

A production-grade 2.5D action platformer inspired by the woodland-epic adventures of Redwall. Play as a mystical otter warrior navigating treacherous biomes, defeating bosses, and collecting shards.

![Game Preview](attached_assets/generated_images/chapter_plate_abbey_approach.png)

## Features

- **6 Unique Biomes** - Abbey Exterior, Interior, Dungeon, Courtyard, Rooftops, and Outer Ruins
- **Redwall-Inspired Art Style** - Warm storybook aesthetic with painterly backgrounds
- **Responsive Controls** - Keyboard/mouse on desktop, touch controls on mobile
- **Entity Component System** - Miniplex ECS for efficient game entity management
- **Rapier Physics** - Smooth, responsive 2.5D platforming physics
- **Procedural Generation** - Dynamic level creation with parallax backgrounds
- **Chapter Plate Cutscenes** - Storybook-style narrative transitions

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/otterblade-odyssey.git
cd otterblade-odyssey

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The game will be available at `http://localhost:5000`

### Production Build

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Controls

### Desktop
| Key | Action |
|-----|--------|
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `Space` / `W` | Jump |
| `S` / `↓` | Crouch |
| `K` / Click | Attack |
| `Shift` | Special/Dash |

### Mobile
- **Left Side**: Left/Right movement buttons
- **Right Side**: Diamond layout (Jump, Attack, Crouch, Special)

## Architecture

```
otterblade-odyssey/
├── client/src/
│   ├── game/
│   │   ├── ecs/           # Miniplex entity management
│   │   ├── Player.tsx     # Player controller
│   │   ├── Level.tsx      # Level generation
│   │   ├── store.ts       # Zustand state
│   │   └── constants.ts   # Game constants
│   ├── components/
│   │   ├── hud/           # HUD, menus, touch controls
│   │   └── ui/            # Reusable UI components
│   └── pages/             # Route pages
├── server/                # Express backend
├── shared/                # Shared schemas
└── attached_assets/       # Generated images
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript |
| 3D Rendering | @react-three/fiber, Three.js |
| Physics | @react-three/rapier |
| ECS | Miniplex + miniplex-react |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix |
| Backend | Express.js |
| Database | PostgreSQL (optional) |

## Biomes

| Biome | Description | Quest |
|-------|-------------|-------|
| Abbey Exterior | Forest approach, bridge, gatehouse | "Reach the Gatehouse" |
| Abbey Interior | Great hall, library, cloisters | "Defend the Great Hall" |
| Dungeon | Stone, torchlight, damp, roots | "Descend into the Depths" |
| Courtyard | Sunlight, banners, training yard | "Rally the Defenders" |
| Rooftops | Wind, height, bells, shingles | "Ascend to the Bells" |
| Outer Ruins | Mossy remnants, fog, river | "Follow the River Path" |

## Testing

```bash
# Run unit tests
pnpm run test

# Run E2E tests
pnpm run test:e2e
```

## Development

### Code Style
- Use Biome for linting and formatting
- Follow ECS patterns for game entities
- Keep components small and focused
- Use Zustand for all game state

### Adding New Features
1. Define entity types in `client/src/game/ecs/world.ts`
2. Create systems in `client/src/game/ecs/systems.ts`
3. Add UI components in `client/src/components/`
4. Update state in `client/src/game/store.ts`

### Brand Guidelines
See `BRAND.md` for complete visual style guide including:
- Redwall-inspired woodland-epic aesthetic
- Color palettes per biome
- Character and enemy design requirements
- UI/UX mobile-first guidelines

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Brian Jacques' Redwall series
- Built with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- Physics powered by [Rapier](https://rapier.rs/)
- ECS architecture with [Miniplex](https://github.com/hmans/miniplex)
