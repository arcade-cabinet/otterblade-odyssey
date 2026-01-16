# Otterblade Odyssey: AI Implementation Guide

> How YUKA powers enemies, NPCs, bosses, and automated tests in the Astro + Solid + Matter.js runtime.

## Quick Start

**For detailed code examples and complete implementations, see [AI_REFERENCE.md](./AI_REFERENCE.md).**

This document provides high-level concepts and integration patterns. AI_REFERENCE.md contains production-ready code extracted from `game/src/game/ai/` and `game/src/game/systems/AIManager.ts`.

## Quick Context

- **Runtime**: Astro + Solid islands with Matter.js physics and Canvas 2D rendering.
- **Data**: All authored behavior parameters live in `client/src/data/manifests/` (e.g., `enemies.json`, chapter manifests). Load them via async helpers in `game/src/ddl/`—never import JSON directly.
- **Language**: TypeScript (ES2022 target); keep functions small and composable.
- **Implementation Files**:
  - `game/src/game/ai/BossAI.ts` - Boss AI with fuzzy logic and phase system
  - `game/src/game/ai/PerceptionSystem.ts` - Vision, memory, and hearing systems
  - `game/src/game/systems/AIManager.ts` - FSM states, YUKA integration, pathfinding
  - `game/src/game/systems/EnemyStates.ts` - Detailed FSM state implementations

## Core Concepts

1. **Entity Management** – YUKA `EntityManager` drives AI entities inside the main game loop.
2. **State Machines (FSM)** – Small states per enemy type (idle, patrol, chase, attack, flee, hurt).
3. **Steering Behaviors** – Seek/flee/arrive/wander behaviors configured from manifest data.
4. **Perception & Memory** – Vision cones, memory system, and hearing for awareness.
5. **Path Planning** – Navigation mesh with A* pathfinding for complex movement.
6. **Fuzzy Logic** – Nuanced decision-making for boss behaviors.
7. **Goal-Driven Agents** – Multi-objective systems with priority-based selection.

## Wiring YUKA into the Game Loop

```javascript
import { EntityManager, Time } from 'yuka';
import { loadEnemyDefinitions } from '../ddl/loader.js';

const entityManager = new EntityManager();
const time = new Time();

/**
 * Updates all AI entities; call from the main game loop after physics.
 */
export function updateAI(deltaMs) {
  time.update();
  entityManager.update(time.getDelta());
}

export async function initializeAI() {
  const enemies = await loadEnemyDefinitions(); // pulls from client/src/data/manifests/enemies.json
  enemies.forEach((definition) => {
    const enemy = createEnemyFromDefinition(definition);
    entityManager.add(enemy);
  });
}
```

**Best Practices:**
- Keep YUKA updates deterministic by passing the same delta as the Matter.js step
- Store references to YUKA entities alongside physics bodies for coordinated cleanup
- Load all behavior parameters from manifests, not hardcoded values

## AI System Components

### 1. Finite State Machines (FSM)

Enemies use 6 states: **idle → patrol → chase → attack**, with **flee** and **hurt** as interrupts.

**Example state transitions:**
- `idle` → `patrol` (after timeout)
- `patrol` → `chase` (player detected)
- `chase` → `attack` (in range)
- `attack` → `chase` (target escapes)
- `any` → `hurt` (takes damage)
- `hurt` → `flee` (low health)

**Implementation:** See [AI_REFERENCE.md#fsm-state-machines](./AI_REFERENCE.md#fsm-state-machines) for complete code examples.

### 2. Steering Behaviors

YUKA provides movement behaviors:

- **WanderBehavior** - Random patrol with configurable jitter, radius, distance
- **SeekBehavior** - Direct pursuit of target
- **FleeBehavior** - Escape from threat
- **ArriveBehavior** - Approach target and decelerate
- **FollowPathBehavior** - Navigate along waypoints

**Configuration from manifests:**
```javascript
// From enemies.json
{
  "type": "corsair_wolf",
  "aggroRadius": 200,
  "attackRange": 50,
  "patrolSpeed": 1.0,
  "chaseSpeed": 2.5
}
```

**Implementation:** See [AI_REFERENCE.md#steering-behaviors](./AI_REFERENCE.md#steering-behaviors) for detailed examples.

### 3. Perception Systems

Three-part perception system:

**Vision System**
- Field-of-view cone (angle + range)
- Line-of-sight checks using Matter.js collision
- Debug visualization available

**Memory System**
- Tracks entities for 3-5 seconds after losing sight
- Prevents instant state oscillation
- Threat scoring for target prioritization

**Hearing System**
- Sound event propagation (loudness × 150 pixel radius)
- Alert level increases based on proximity
- Investigation of suspicious sounds

**Implementation:** See [AI_REFERENCE.md#perception-systems](./AI_REFERENCE.md#perception-systems) for complete code.

### 4. Fuzzy Logic for Boss AI

Smooth decision-making using trapezoidal membership functions:

**Inputs:**
- Distance to player (close/medium/far)
- Player health (low/medium/high)
- Own health (low/medium/high)

**Output:**
- Aggression level (0.0 = retreat, 1.0 = aggressive)

**Rules:**
- IF close AND player low AND own high → aggressive
- IF far OR own low → retreat
- IF medium distance AND medium health → cautious

Defuzzifies using centroid method for smooth transitions.

**Implementation:** See [AI_REFERENCE.md#fuzzy-logic-for-nuanced-behavior](./AI_REFERENCE.md#fuzzy-logic-for-nuanced-behavior) for ThreatAssessment class.

### 5. Boss AI: Multi-Phase System

Zephyros boss implementation features:

**Phase System:**
- Phase 1: 100-60% health (Ice Slash, Frost Wave)
- Phase 2: 60-25% health (+ Blizzard Zone, Ice Pillar)
- Phase 3: <25% health (+ Absolute Zero ultimate)

**Attack Patterns:**
- Each pattern is a separate class inheriting from `BossPattern`
- Per-pattern cooldowns + global cooldown
- Async/await for timing and animations
- Fuzzy logic selects pattern based on context

**Implementation:** See [AI_REFERENCE.md#boss-ai-multi-phase-system](./AI_REFERENCE.md#boss-ai-multi-phase-system) for complete Zephyros implementation.

### 6. Goal-Driven Agents

Multi-objective AI with priority-based goal selection:

**Goals compete for execution:**
1. Flee (priority 10) - When hp < 25%
2. Attack (priority 7) - When in range
3. Chase (priority 5) - When player visible
4. Patrol (priority 1) - Default behavior

Each frame, evaluate all goals and execute highest-priority valid goal.

**Implementation:** See [AI_REFERENCE.md#goal-driven-agents](./AI_REFERENCE.md#goal-driven-agents) for GoalDrivenAgent class.

### 7. Path Planning & Navigation

YUKA NavMesh with A* pathfinding:

**Build navmesh from platforms:**
```javascript
const navMesh = buildNavMesh(platforms);
```

**Find path between points:**
```javascript
const path = findPath(navMesh, startPos, goalPos);
```

**Apply path to entity:**
```javascript
const followPath = new FollowPathBehavior(path, 5);
enemy.steering.behaviors.push(followPath);
```

**Best Practices:**
- Build navmesh once per chapter, cache it
- Share same navmesh between gameplay and automated tests
- Always provide fallback path (direct line)

**Implementation:** See [AI_REFERENCE.md#path-planning--navigation](./AI_REFERENCE.md#path-planning--navigation) for complete pathfinding code.

## NPC Patterns

NPCs use simpler behavior:

- **Idle**: Occasional look-around animations
- **Patrol**: Fixed waypoint routes
- **Follow**: Track player at configurable distance
- **Interact**: Wordless gestures (game is dialogue-free)

Story state transitions driven by quest triggers from chapter manifests.

## Testing AI Systems

### Unit Tests

Test AI helpers with deterministic inputs:

```javascript
import { describe, it, expect } from 'vitest';
import { ThreatAssessment } from '../game/ai/BossAI.ts';

describe('ThreatAssessment', () => {
  it('should return high aggression for close low-health player', () => {
    const assessment = new ThreatAssessment();
    const aggression = assessment.evaluate(50, 10, 100);
    expect(aggression).toBeGreaterThan(0.7);
  });
});
```

### E2E Tests

Automated playthroughs use AI player with same pathfinding:

```bash
pnpm test:playthroughs
```

AI player navigates levels using shared navmesh from chapter manifests.

**See:** `tests/factories/ai-player.ts` and `docs/COMPLETE_JOURNEY_VALIDATION.md`

## Maintenance Rules

✅ **DO:**
- Load behavior parameters from manifests
- Keep files small (<200 lines per system)
- Use JSDoc for complex functions
- Clean up behaviors in state `exit()` methods
- Test AI helpers with deterministic seeds

❌ **DON'T:**
- Hardcode magic numbers (use manifests or constants)
- Create TypeScript-only patterns (ES modules with JSDoc)
- Build giant monolithic AI classes
- Forget to remove listeners/behaviors on cleanup

## File Organization

```
game/src/game/ai/
├── BossAI.ts              # Fuzzy logic, phase system, attack patterns
├── PerceptionSystem.js    # Vision, memory, hearing systems

game/src/game/systems/
├── AIManager.js           # YUKA EntityManager, pathfinding, FSM setup
└── EnemyStates.js         # FSM state classes (idle, patrol, chase, etc.)

docs/
├── AI.md                  # This file - high-level guide
└── AI_REFERENCE.md        # Complete code examples and patterns
```

## Additional Resources

- **[AI_REFERENCE.md](./AI_REFERENCE.md)** - Complete implementation reference with production code
- **[IMPLEMENTATION.md](../IMPLEMENTATION.md)** - Overall game architecture
- **[PHYSICS.md](./PHYSICS.md)** - Matter.js integration patterns
- **[COMPLETE_JOURNEY_VALIDATION.md](./COMPLETE_JOURNEY_VALIDATION.md)** - Automated testing with AI player
- **[YUKA.js Documentation](https://mugen87.github.io/yuka/)** - Official YUKA library docs

## Quick Reference

| System | File | Key Classes |
|--------|------|-------------|
| FSM States | `systems/EnemyStates.js` | IdleState, PatrolState, ChaseState, AttackState, FleeState, HurtState |
| Boss AI | `ai/BossAI.ts` | ZephyrosAI, BossPattern, ThreatAssessment, FrostWavePattern |
| Perception | `ai/PerceptionSystem.js` | VisionSystem, MemorySystem, HearingSystem, PerceptiveEntity |
| AI Manager | `systems/AIManager.js` | AIManager, EnemyAI, NPCAI, pathfinding functions |

## Summary

Otterblade Odyssey uses YUKA.js for enemy AI, boss behaviors, NPC interactions, and automated testing. The system features:

- **6-state FSM** for enemies (idle, patrol, chase, attack, flee, hurt)
- **YUKA steering behaviors** (seek, flee, wander, arrive, follow path)
- **Perception systems** (vision cones, memory, hearing)
- **Fuzzy logic** for smooth boss decision-making
- **Multi-phase boss AI** with scripted attack patterns
- **Goal-driven agents** for complex multi-objective NPCs
- **NavMesh pathfinding** shared with automated tests

All behavior parameters load from JSON manifests. All state is deterministic for testing.

**For complete code examples, see [AI_REFERENCE.md](./AI_REFERENCE.md).**
