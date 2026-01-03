# Otterblade Odyssey: AI Implementation Guide

> How YUKA powers enemies, NPCs, and automated tests in the Astro + Solid + Matter.js runtime.

## Quick Context
- **Runtime**: Astro + Solid islands with Matter.js physics and Canvas 2D rendering.
- **Data**: All authored behavior parameters live in `client/src/data/manifests/` (e.g., `enemies.json`, chapter manifests). Load them via async helpers in `game/src/ddl/`—never import JSON directly.
- **Language**: JavaScript (ES2022) with JSDoc for clarity; keep functions small and composable.

## Core Concepts

1. **Entity Management** – YUKA `EntityManager` drives AI entities inside the main game loop.
2. **State Machines (FSM)** – Small states per enemy type (idle, patrol, chase, attack, retreat).
3. **Steering Behaviors** – Seek/flee/arrive/wander behaviors configured from manifest data.
4. **Perception & Memory** – Vision cones plus lightweight timers to avoid thrashing.
5. **Path Planning** – Use navigation graphs derived from chapter manifests; avoid hardcoded paths.

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

- Keep YUKA updates deterministic by passing the same delta as the Matter.js step.
- Store references to YUKA entities alongside physics bodies for coordinated cleanup.

## State Machines (FSM)

Use small classes or objects to keep states readable. Avoid giant "god" states.

```javascript
import { State, StateMachine, Vector3 } from 'yuka';

class IdleState extends State {
  enter(enemy) {
    enemy.steering.clear();
    enemy.idleTimer = 0;
  }

  execute(enemy, delta) {
    enemy.idleTimer += delta;
    if (enemy.canSeePlayer()) {
      enemy.stateMachine.changeTo('chase');
      return;
    }

    if (enemy.idleTimer > enemy.behavior.maxIdleMs) {
      enemy.stateMachine.changeTo('patrol');
    }
  }
}

class ChaseState extends State {
  execute(enemy) {
    const target = enemy.getTargetPosition();
    enemy.seekBehavior.target = new Vector3(target.x, target.y, 0);
  }
}

export function buildEnemyStateMachine(enemy) {
  const fsm = new StateMachine(enemy);
  fsm.addState('idle', new IdleState());
  fsm.addState('chase', new ChaseState());
  fsm.changeTo('idle');
  return fsm;
}
```

- Behavior numbers (idle durations, aggro radii) come from manifests, not inline constants.
- Prefer 2–4 states per enemy type; compose variations via data rather than branching logic.

## Steering Behaviors

Apply only the behaviors you need per state to avoid unpredictable motion.

```javascript
import { SeekBehavior, ArriveBehavior, Vector3 } from 'yuka';

export function attachSteering(enemy, behaviorConfig) {
  const seek = new SeekBehavior(new Vector3());
  const arrive = new ArriveBehavior(new Vector3(), behaviorConfig.arriveDeceleration);

  enemy.steering.behaviors = [];
  enemy.seekBehavior = seek;
  enemy.arriveBehavior = arrive;

  enemy.steering.add(seek, behaviorConfig.seekWeight);
  enemy.steering.add(arrive, behaviorConfig.arriveWeight);
}
```

- Use `Seek` for chases, `Arrive` for patrol endpoints, and `Wander` for ambient NPCs.
- Turn down weights while airborne to keep physics authoritative.

## Perception

Keep perception deterministic and inexpensive:
- Use a simple vision cone (angle + distance) tied to enemy facing.
- Add a short memory timer so enemies do not oscillate between states every frame.
- Use Matter.js collision data for line-of-sight checks instead of ad-hoc raycasts.

```javascript
export function canSeePlayer(enemy, playerPosition) {
  const delta = playerPosition.clone().sub(enemy.position);
  const distance = delta.length();
  if (distance > enemy.behavior.visionRange) return false;

  const angle = enemy.forward.angleTo(delta.normalize());
  return angle <= enemy.behavior.visionAngle;
}
```

## Path Planning

Navigation graphs are derived from chapter manifests (platform nodes and links). Use them both for AI and automated tests to stay consistent.

- Build navigation graphs when a chapter loads and share them between AI systems and Playwright factories.
- Cache graphs per chapter to avoid rebuilding during gameplay.
- Keep jump heights and speeds in a constants module sourced from manifests.

## Boss & NPC Patterns

- Boss encounters: prefer phase-based FSMs (phase data from `chapter-*.json`) with explicit transitions.
- NPCs: lightweight wander + interact states driven by chapter trigger data; no dialogue trees (story is wordless).

## Testing

- Unit test AI helpers in `tests/unit/` with deterministic seeds.
- Automated playthroughs share the same navigation graphs via the Level Test Factory to catch regressions.
- Record videos for complex encounters to validate behavior visually.

## Maintenance Rules
- No TypeScript-only patterns in new runtime code; use ES modules with JSDoc.
- No hardcoded behavior numbers—pull from manifests or a constants module generated from them.
- Keep files small (<200 lines for systems) and split by responsibility (per enemy type if needed).
