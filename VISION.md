# Otterblade Odyssey: Zephyros Rising - Project Vision

*Strategic vision and roadmap for the Willowmere Hearthhold adventure*

---

## Executive Summary

**Otterblade Odyssey: Zephyros Rising** is a production-grade 2.5D action platformer that captures the emotional essence of woodland-epic adventures. Built with React, Three.js, and modern game development patterns, it delivers a heartfelt story of home, community, and quiet heroism.

### Core Promise

> "The warmth of hearth against encroaching cold—this is what we defend."

Players experience the journey of Finn Riverstone, a young otter warrior who must protect Willowmere Hearthhold from Zephyros and the Galeborn. The game balances challenging platforming with an emotionally resonant narrative that celebrates belonging, sacrifice, and the power of community.

---

## Design Pillars

### 1. Warmth Over Darkness

Every design decision asks: "Does this evoke warmth?" Even in danger, the game maintains hope. The Everember—the eternal fire at Willowmere's heart—symbolizes this: it can flicker, but it never truly dies as long as one heart remains to tend it.

**Implementation:**
- Color palettes shift from warm (safety) to cool (danger), never into horror
- Defeat shows creatures retreating, not dying grotesquely
- Checkpoints are hearth-fires that push back the cold

### 2. Earned Mastery

Controls should feel tight and fair. Players who invest time feel increasingly capable, not frustrated. The "Prince of Persia" school: every death teaches, every success builds confidence.

**Implementation:**
- Generous coyote time for jumps
- Clear telegraphs on all attacks
- Pattern-based bosses with learnable tells
- No arbitrary difficulty spikes

### 3. Place as Character

Willowmere Hearthhold isn't just a setting—it's what players are fighting to protect. Every biome should feel like part of a real, lived-in home worth defending.

**Implementation:**
- Hand-crafted level details that tell stories
- Environmental storytelling through props and architecture
- NPCs with personality and purpose
- Consistent visual language across all assets

### 4. Accessible Heroism

Everyone should be able to experience Finn's journey. The game accommodates various skill levels and input methods without compromising the core experience.

**Implementation:**
- Multiple difficulty options affecting enemy behavior, not just numbers
- Full touch control support for mobile
- Keyboard, gamepad, and gyroscope input methods
- Skip options for cutscenes after first viewing

---

## Target Experience

### The 30-Second Pitch

*A cozy-but-heroic platformer where you play as an otter warrior defending an ancient riverside sanctuary from forces of cold and isolation. Think Redwall meets Prince of Persia, with storybook visuals and tight, responsive controls.*

### Emotional Arc

| Chapter Range | Emotional Beat |
|---------------|----------------|
| 0-2 (Prologue → Gatehouse) | Departure, anticipation, crossing the threshold |
| 3-4 (Great Hall → Archives) | Wonder, learning, sense of ancient tradition |
| 5-6 (Cellars → Gardens) | Fear, then hope; isolation, then community |
| 7-8 (Bell Tower → Storm's Edge) | Urgency, climax, facing the storm |
| 9 (New Dawn) | Triumph, belonging, peace earned |

### Session Length Goals

- **Mobile sessions**: 5-15 minutes (1-2 levels)
- **Focused sessions**: 30-60 minutes (1 chapter)
- **Complete playthrough**: 3-4 hours

---

## Technical Vision

### Architecture Principles

1. **Data-Driven Design**: All content defined in JSON manifests, validated by Zod schemas
2. **Entity Component System**: Miniplex for flexible, composable game objects
3. **Render-Physics Separation**: Clean boundary between visual (Three.js) and simulation (Rapier2D)
4. **Progressive Enhancement**: Core gameplay works everywhere; enhanced features where supported

### Platform Targets

| Platform | Status | Priority |
|----------|--------|----------|
| Web (Desktop) | Primary | P0 |
| Web (Mobile PWA) | Primary | P0 |
| Android APK | Secondary | P1 |
| iOS (via Capacitor) | Future | P2 |

### Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 3s on 4G | Lighthouse |
| Time to Interactive | < 5s | Playwright |
| Frame Rate | 60fps sustained | Performance API |
| Memory | < 200MB | DevTools |
| Bundle Size | < 2MB gzipped | Build output |

---

## Content Roadmap

### Phase 1: Core Loop (Complete)

- [x] Player movement and physics
- [x] Basic combat mechanics
- [x] ECS architecture with Miniplex
- [x] State management with Zustand
- [x] Mobile touch controls
- [x] Chapter/biome data structure
- [x] Chapter plates and parallax backgrounds

### Phase 2: Content Pipeline (Current)

- [x] Manifest-driven asset generation
- [x] Cinematic player component
- [ ] Player sprite sheet (pending generation)
- [ ] Enemy sprite sheets (pending generation)
- [ ] Cinematic videos (needs regeneration for brand compliance)
- [ ] Audio system and sound effects
- [ ] Level definition files for all chapters

### Phase 3: Full Experience

- [ ] All 10 chapters playable with unique layouts
- [ ] 5 boss encounters with distinct patterns
- [ ] 12 NPC species with dialogue
- [ ] Scripted sequences (chases, escorts, hazards)
- [ ] Save/load system with cloud sync
- [ ] Achievement system

### Phase 4: Polish

- [ ] Visual effects and post-processing
- [ ] Particle systems for environment
- [ ] Screen shake and impact feedback
- [ ] Accessibility options menu
- [ ] Localization framework
- [ ] Analytics and telemetry

### Phase 5: Distribution

- [ ] App store submissions
- [ ] Marketing materials
- [ ] Community features
- [ ] Post-launch content updates

---

## Quality Standards

### Code Quality

All code must pass:
- `pnpm biome check .` - Linting and formatting
- `pnpm tsc --noEmit` - Type checking
- `pnpm test` - Unit tests
- `pnpm playwright test` - E2E tests

### Asset Quality

All visual assets must:
- Follow BRAND.md guidelines exactly
- Feature anthropomorphic woodland animals only
- Use warm, storybook-appropriate color palettes
- Maintain consistent otter protagonist design

### Testing Requirements

| Layer | Coverage Target | Tools |
|-------|-----------------|-------|
| Unit | 80% statements | Vitest |
| Integration | Key flows | Vitest |
| E2E | Critical paths | Playwright |
| Visual | Key screens | Playwright snapshots |

---

## Success Metrics

### Development Metrics

- All tests passing in CI
- Zero critical bugs in main branch
- Documentation coverage for all exports
- Asset manifests 100% complete

### Player Experience Metrics

- Average session length > 10 minutes
- Completion rate > 40% (reach chapter 5)
- Return player rate > 30%
- Touch control satisfaction > 4/5

---

## Guiding Principles

1. **Warmth First**: When in doubt, choose the warmer, more hopeful option
2. **Respect the Player**: Clear communication, fair challenges, no manipulation
3. **Quality Over Speed**: Ship when ready, not when convenient
4. **Community Over Isolation**: The game's theme extends to how we build it
5. **Craft Over Formula**: Make something meaningful, not just marketable

---

## Closing Thought

Otterblade Odyssey isn't about defeating evil—it's about protecting good. It's about the quiet heroism of tending a fire, of standing watch, of being there for those who depend on you. In a world that often celebrates conquest, we celebrate defense. In a genre full of darkness, we offer warmth.

The Everember burns. Let's keep it lit.

---

*"The Everember never dies, so long as one heart remains to tend it."*
— Inscription above the Great Hearth
