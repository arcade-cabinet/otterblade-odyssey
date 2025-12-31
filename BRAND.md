# Otterblade Odyssey: Zephyros Rising - Brand Style Guide

## Overview

Otterblade Odyssey is a modern, polished 2.5D action platformer inspired by the woodland-epic adventures of Redwall. This guide ensures brand consistency across gameplay, visuals, UI/UX, cutscenes, and narrative progression.

---

## Brand DNA (Non-Negotiable)

### Emotional Tone
- **Classic woodland-epic adventure** in the spirit of Redwall
- **Warm, brave, hopeful, "cozy-but-heroic"**
- The world should feel **lived-in**: stone, wood, cloth, lantern light, moss, ivy, banners, carved details, paper maps

### What We Are NOT
- NOT grimdark or horror
- NOT high-fantasy bombast
- NOT sci-fi neon spectacle
- NOT generic AAA fantasy key-art

---

## Visual Aesthetic

### Production Values
- Premium modern production values (smooth animation, lighting, particles, subtle post-FX)
- **Grounded materials** - no glossy plastic or sterile minimalism
- **Painterly storybook realism**

### Visual Anchors
| Element | Description |
|---------|-------------|
| Architecture | Mossy abbey/castle (warm stone, arches, carvings) |
| Lighting | Lanterns, candles, hearthlight, dawn mist, god rays |
| Textures | Fur strands, cloth weave, wood grain, stone pitting, ironwork |
| Magic | Subtle and rare (firefly-like motes, faint rune shimmer) - **never "laser"** |

---

## Color Language

### Primary Palette
- **Warm greens** - Forest canopy, moss, growing things
- **Honey gold** - Candlelight, autumn leaves, warmth
- **Cool misty blues** - Dawn mist, shadows, mystery

### Controlled Biome Accents
Each biome has controlled accent colors that stay within the grounded storybook range.

| Biome | Primary | Accent | Fog |
|-------|---------|--------|-----|
| Abbey Exterior | Warm stone beige | Moss green | Morning mist blue |
| Abbey Interior | Warm amber | Candle gold | Dusty shadow |
| Dungeon/Catacombs | Deep stone gray | Torch orange | Damp blue |
| Courtyard/Gardens | Sunlit green | Banner crimson | Bright haze |
| Rooftops/Rafters | Slate gray | Bronze | Wind blue |
| Outer Ruins | Moss brown | Ancient green | River fog |

### Color DO's
- Warm, natural tones
- Muted highlights
- Atmospheric fog gradients
- Subtle color transitions

### Color DON'Ts
- Saturated neon gradients
- Electric blues/purples as defaults
- Glowing energy effects
- High-contrast cyberpunk palettes

---

## Player Character: Otter

### Design Requirements
- Physical, expressive, readable in side view
- Consistent silhouette across gameplay, cutscenes, and assets
- Practical gear: leather, cloth, iron sword - no energy weapons

### Body Articulation Zones
| Zone | Animation Purpose |
|------|-------------------|
| Lower body (legs/hips) | Run, stop, skid, crouch, slide, land compression |
| Upper body (torso/arms) | Sword-ready stance, swing arcs, parry/guard pose |
| Head/neck | Subtle follow-through, look direction, breathing/idle |
| Cloak/scarf | Secondary motion (wind, acceleration) |
| Fur | Visible strand-like detail, subtle ripple in motion |

### Movement Feel
- Tight, responsive controls with subtle weight
- **No floatiness**
- Jump buffering and coyote time
- Reliable grounding detection

---

## Enemy Design

### Design Philosophy
- Clear side-view silhouettes
- Belong to grounded woodland-epic tone
- NO demons, NO sci-fi robots
- Lived-in gear: leather, cloth, bone, iron

### Required Enemy Archetypes
| Type | Behavior | Design Notes |
|------|----------|--------------|
| Skirmisher | Fast, low HP, closes distance | Small predator (weasel, stoat) |
| Shielded/Armored | Slow, blocks frontal attacks | Badger or hedgehog with shield |
| Ranged | Throws stones/darts, telegraphs shots | Rat with sling, mouse with blowpipe |
| Flyer/Leaper | Engages vertical space | Crow, bat, or leaping ferret |
| Trap creature | Ambush from ground/walls | Snake, spider, mole |
| Elite | Miniboss with 2-3 move patterns | Armored fox or wolverine |

### Enemy Audio
- Subtle, non-cartoonish
- Distinct cues for each type
- Telegraphs before attacks

---

## Boss Design

### Philosophy
- Chapter moments, not HP sponges
- Pattern-based with punish windows
- Distinct phases (at least 2)

### Boss Requirements
- Clear arena setup (space, hazards, checkpoints)
- Telegraphs + punish windows
- A "signature" move that becomes learnable
- Cutscene beats: arrival (1-2 seconds), defeat epilogue (2-4 seconds)

### Example Boss Concepts (In Tone)
- A massive badger guardian corrupted by fear
- A siege beast battering abbey gates
- A silent duelist (mirror-otter or stoat champion)

### Boss DON'Ts
- Lava demon
- Neon dragon
- Cosmic monster

---

## Biomes

### Design Philosophy
- Biomes must feel like **contiguous places**, not random theme parks
- Transitions should be elegant and emotionally coherent

### Biome Set (Anchored to Story Progression)
1. **Abbey Exterior** - Forest approach, bridge, gatehouse
2. **Abbey Interior** - Great hall, library, cloisters, kitchens
3. **Dungeon/Catacombs** - Stone, torchlight, damp, roots
4. **Courtyard/Gardens** - Sunlight, banners, training yard
5. **Rooftops/Rafters** - Wind, height, bells, shingles
6. **Outer Ruins/River Path** - Mossy remnants, fog

### Transition Requirements
- Fade-based chapter plates (storybook cutscenes) with subtle parallax drift
- Gameplay transition zones: light shifts, particles change, materials change gradually
- Parallax layers: foreground foliage/props, midground platforms, deep background architecture/forest haze

---

## Cutscenes & Chapter Plates

### Style
- **Storybook plates**: warm, noble, quiet courage
- Minimal or no text
- Consistent otter design throughout

### Required Chapter Plates
1. **Approach** - Outside abbey walls at dawn; otter arriving with cloak and sword
2. **Gatehouse** - Lantern-lit bridge and gate; banners stirring; threshold moment
3. **Great Hall Oath** - Candle-lit interior, otter resolves to defend
4. **Library/Map Table** - Parchment map, relics, quiet planning moment
5. **Dungeon Descent** - Torchlight, roots, damp stone, danger below
6. **Courtyard Rally** - Sunlight, training yard, allies implied
7. **Rooftop Wind** - Higher stakes, bells/rafters, wind in fur
8. **Final Ascent** - Toward Zephyros / high keep / sanctuary

### Plate Requirements
- Practical gear, grounded materials
- Soft volumetric lighting, mist, fireflies
- Subtle magic only
- Consistent otter design (face shape, cloak, sword silhouette)
- Options for textless and text-integrated variants

---

## UI/UX

### Mobile-First Design
- Full-screen immersive experience
- No browser gestures interrupting gameplay

### Input Capture Requirements
- Prevent page scroll, pull-to-refresh, overscroll, double-tap zoom
- Use `touch-action: none` and prevent default where needed
- Handle cancel/out events when finger slides off button

### HUD Layout
| Position | Content |
|----------|---------|
| Top-left | Health (hearts), shards |
| Top-right | Score |
| Top-center | Optional biome name, quest message ticker |
| Hidden during cutscenes | Fade HUD out |

### Quest Message Style
- Short, storybook tone
- Examples: "Reach the Gatehouse", "Find the Abbey Key", "Defend the Great Hall"

### Mobile Control Layout
| Side | Controls |
|------|----------|
| Left | Two-button pad: Left / Right (large, thumb-friendly) |
| Right | Four-button diamond: Jump, Attack, Crouch/Slide, Special/Interact |

### Button Style
- Semi-transparent
- Tactile press feedback
- No hover dependency
- Accessible sizing

---

## Game Loop & Progression

### Teaching Philosophy (Classic Wisdom)
1. Teach mechanics safely: movement → jump → crouch → attack → enemies → traps → miniboss → boss
2. Place checkpoints before major difficulty spikes
3. Risk/reward with shards (spend at abbey shrines for upgrades)
4. Maintain fairness: clear telegraphs, readable collisions, consistent physics

---

## Consistency Checklist

Before declaring work complete, verify:

- [ ] Otter silhouette is consistent across gameplay, cutscenes, and generated assets
- [ ] Biome palette stays within grounded storybook range (no neon drift)
- [ ] Animations support crouch, leap, attack with clear hitboxes
- [ ] Enemies are varied, readable, and fair; bosses have phases and telegraphs
- [ ] Mobile controls are robust; browser gestures do not disrupt play
- [ ] Transitions between levels are emotionally coherent and visually consistent

---

## Negative Guidance (Enforce These DON'Ts)

### Visual DON'Ts
- Glowing energy swords
- Neon sci-fi lighting
- Floating futuristic castles
- Anime posing
- Over-stylized JRPG effects
- Grimdark gore
- Demon aesthetics
- Horror tone
- Glossy plastic look
- Sterile minimalism

### Visual DO's
- Moss, stone, lantern light
- Cloth and leather
- Quiet heroism
- Storybook realism
- Warm, grounded materials
- Subtle, rare magic

---

## Asset Naming Conventions

### Textures
- `tex_[biome]_[material]_[variant].png`
- Example: `tex_abbey_stone_moss.png`

### Characters
- `char_[species]_[role]_[state].png`
- Example: `char_otter_hero_idle.png`

### Environments
- `env_[biome]_[layer]_[element].png`
- Example: `env_dungeon_bg_torchwall.png`

### Audio
- `sfx_[category]_[action].wav`
- Example: `sfx_player_sword_swing.wav`

---

*This style guide is a living document. Update it as the game evolves while maintaining the core Redwall-inspired woodland-epic identity.*
