# GitHub Copilot Instructions for Otterblade Odyssey

## 🚨 SESSION HANDOFF PROTOCOL (READ FIRST)

**CRITICAL**: You are continuing work across sessions. Before ANY code changes:

1. **Read `.clinerules` + `memory-bank/`** - Required session context
2. **Read ALL documentation in `docs/`** - Essential context is there
3. **Review recent commits** - Use `git log --oneline -15` to understand what was done
4. **Check the PR description** - Contains current state and goals
5. **Read comment history** - Understand user's vision and requests

### Key Documents (READ THESE FIRST)
- `docs/COMPLETE_JOURNEY_VALIDATION.md` - Architecture & validation system
- `docs/AI.md` - YUKA AI implementation patterns
- `WORLD.md` - Story, lore, and emotional core
- `BRAND.md` - Visual/narrative style (wordless storytelling!)
- `IMPLEMENTATION.md` - Technical architecture

### Tool Preferences
1. **Prefer Playwright MCP when available** for browser automation (use Docker MCP if configured)
2. **Prefer GitHub MCP when available** for repo operations
3. Use MCP tools for deterministic testing and validation; fall back to CLI if MCP is unavailable

### ACTIVE ENGAGEMENT PROTOCOL ⚡

**YOU MUST DRIVE TO COMPLETION, NOT WAIT PASSIVELY:**

#### At Start of Each Session:
1. Read last commit message and PR description
2. **Assess remaining work** - What's left to do?
3. **Make a plan** - List concrete next steps
4. **DO THE WORK** - Don't wait for user to say "do the next thing"

#### During Work:
1. **Show SCREENSHOTS/VIDEOS** - User can't review code, only visuals!
2. Use Playwright MCP to capture evidence
3. **Self-assess honestly** - What's broken? What's working?
4. Fix issues you discover WITHOUT waiting for user

#### At End of Session:
1. **Leave a complete status** for next session:
   - ✅ What's done
   - ❌ What's broken
   - 🔄 What's in progress
   - 📋 Exact next steps
2. Commit with descriptive message
3. Update PR description with current state

### SELF-ASSESSMENT CHECKLIST

Before saying "it works," validate:
- [ ] Did I run the tests? (not just assume)
- [ ] Did I capture screenshots/video?
- [ ] Did I check the ACTUAL game in browser?
- [ ] Did I validate procedural generation is working?
- [ ] Did I test with Playwright MCP?
- [ ] Did I run security checks?

### VISUAL VALIDATION REQUIREMENTS

**User needs PICTURES, not code:**
- Take screenshots showing current state
- Capture video of gameplay working
- Show before/after for UI changes
- Demonstrate procedural generation working (not PNGs!)
- Prove YUKA pathfinding navigation

### TEAMWORK BETWEEN SESSIONS

Each session should:
1. **Read previous session's status** 
2. **Continue from exact stopping point**
3. **Add to institutional knowledge** (update docs if you learn something)
4. **Document quirks/limitations** you discover
5. **Leave clear handoff** for next session

### WORKING WITH CLAUDE PR MANAGER 🤖

**Claude is the central PR manager** for this repository. When you create PRs:

#### Your Role (GitHub Copilot)
- **You own the code changes** - You write and commit the code
- **Branch naming**: Use `copilot/*` branches (e.g., `copilot/add-feature`)
- **Focus on implementation** - Build features, fix bugs, write tests

#### Claude's Role (PR Manager)
- **Orchestrates the PR lifecycle** - Reviews, coordinates feedback, manages approvals
- **Synthesizes AI feedback** - Gathers input from CodeQL, CodeRabbit, CI failures, etc.
- **Communicates via comments** - Claude will tag you (@copilot) with specific requests
- **Does NOT make direct changes** to your PRs (collaborative mode)

#### The Workflow

1. **You create a PR** on a `copilot/*` branch
2. **Claude reviews** and posts initial feedback as a comment
3. **Other AI agents** (CodeQL, CodeRabbit) may also comment
4. **Claude synthesizes** all feedback into a single actionable comment:
   ```
   @copilot, I have analyzed all AI agent feedback:
   
   🔴 Critical Issues (Must Fix):
   1. [CodeQL] SQL injection in user_input.ts:45
   
   🟡 High Priority (Should Fix):
   2. [CodeRabbit] Missing error handling in api_handler.ts:89
   
   Can you address these issues?
   ```
5. **You address feedback** by pushing new commits
6. **Claude re-reviews** and updates status
7. **When all criteria met**, Claude approves and enables auto-merge

#### Communication Tips

- **Check PR comments regularly** - Claude will tag you when action is needed
- **Ask questions** - If Claude's feedback is unclear, ask in PR comments
- **Confirm completion** - After fixing issues, comment: "@claude ready for re-review"
- **Update PR description** - Keep it current with your progress

#### Configuration

See `.github/claude-config.json` for detailed PR management configuration:
- **Model**: Claude Haiku 4.5 (fast, cost-effective, 73% SWE-bench score)
- **Strategy**: Collaborative mode for `copilot/*` branches
- **Auto-merge**: Enabled after Claude approval + all checks pass

### KNOWN LIMITATIONS & QUIRKS

**As of Session 2026-01-02:**
- Chapter plate doesn't auto-dismiss - needs Space press twice
- WebGL context sometimes takes 5+ seconds to initialize
- Playwright needs longer timeouts (20s+) for canvas
- Test API requires game to be fully loaded first
- Build warnings about chunk size (physics/three.js) - acceptable

### COMMUNICATION STYLE

**With User:**
- Show screenshots/videos, not code
- Be honest about what's broken
- Don't claim "it works" without proof
- Self-assess before asking for review

**In Commits:**
- Describe WHAT works, not just what changed
- Include evidence (test results, screenshots)
- Note remaining issues honestly

**In PR Description:**
- Checkboxes for status (✅/❌/🔄)
- Screenshots embedded
- Exact commands to validate
- Clear "what's left" section

## Project Overview

Otterblade Odyssey is an **Astro + Solid.js + Matter.js** 2D platformer with Redwall-inspired woodland-epic aesthetics featuring:
- **Wordless storytelling** (pantomime, British theatre tradition)
- **Warm, homey, childhood adventure** feel
- **JSON DDL architecture** - All levels defined in JSON manifests
- **Procedural generation** - Player and enemies procedurally rendered with Canvas 2D (not sprite sheets)
- **YUKA pathfinding** - AI navigation for enemies and automated tests

**Architecture Decision**: Astro 5.x + Solid.js + Matter.js (proven in POC at `pocs/otterblade_odyssey.html`) replaces React Three Fiber + Rapier (20,000+ lines, broken).

## Package Manager

**Use pnpm exclusively.** Never suggest npm or yarn commands.

```bash
pnpm install
pnpm add <package>
pnpm run dev
pnpm run build
```

## Code Style

### TypeScript Configuration
- Target: ES2022
- TypeScript for source with ES module output
- Astro for pages, Solid.js for components
- ES modules

### Import Patterns
```ts
// Matter.js Physics
import Matter from 'matter-js';
const { Engine, World, Bodies, Body, Events } = Matter;

// YUKA AI
import * as YUKA from 'yuka';

// Audio
import { Howl } from 'howler';

// Data loaders - always async
import { loadChapterManifest, getChapterBoss } from './ddl/loader';
```

### Matter.js Physics Setup (from POC)
```ts
// Create engine
const engine = Engine.create();
engine.gravity.y = 1.5; // POC-proven gravity value

// Create player body
const player = Bodies.rectangle(x, y, 35, 55, {
  label: 'player',
  friction: 0.1,
  frictionAir: 0.01,
  restitution: 0
});

World.add(engine.world, player);

// Game loop
function gameLoop() {
  Engine.update(engine, 1000 / 60); // 60fps
  render();
  requestAnimationFrame(gameLoop);
}
```

### Entity Tracking (Simple Arrays)
```ts
// Track entities in simple arrays
const enemies = [];
const platforms = [];
const items = [];

// Add enemy
function spawnEnemy(x, y, type) {
  const enemyBody = Bodies.rectangle(x, y, 28, 45, { label: 'enemy' });
  const enemy = {
    body: enemyBody,
    type: type,
    hp: 25,
    damage: 8,
    speed: 1.2,
    aiState: 'patrol'
  };
  enemies.push(enemy);
  World.add(engine.world, enemyBody);
  return enemy;
}

// Update loop
function updateEnemies(deltaTime) {
  for (const enemy of enemies) {
    updateEnemyAI(enemy, deltaTime);
    updateEnemyAnimation(enemy);
  }
}

// Remove dead enemies
function cleanupEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      World.remove(engine.world, enemies[i].body);
      enemies.splice(i, 1);
    }
  }
}
```

### State Management (Zustand)
Use Zustand for runtime state with persistence where needed.

## File Structure

```
game/src/
├── pages/
│   └── index.astro           # Main game page
├── game/
│   ├── OtterbladeGame.tsx    # Root Solid component
│   ├── components/           # TouchControls, LoadingScreen
│   ├── ui/                   # HUD, Menu
│   ├── engine/               # physics, rendering, gameLoop
│   ├── systems/              # collision, AI, input, audio, triggers
│   ├── factories/            # level/npc/enemy construction
│   ├── rendering/            # procedural render helpers
│   └── store.ts              # Zustand state management
└── styles.css                # Warm Willowmere styling

game/public/data/
├── manifests/                # JSON DDL definitions
│   ├── chapters/             # 10 chapter definitions
│   ├── schema/               # JSON schemas
│   ├── enemies.json
│   └── sounds.json
└── biomes.json               # Shared authored data

game/src/data/approvals.json  # Asset approval tracking (committed)
```

## Chapter System

```ts
// Load chapters from JSON manifests
const CHAPTERS = [
  { id: 0, name: "The Calling", location: "Finn's Cottage", quest: "Answer the Call" },
  { id: 1, name: "River Path", location: "Willow Banks", quest: "Reach the Gatehouse" },
  { id: 2, name: "The Gatehouse", location: "Northern Gate", quest: "Cross the Threshold" },
  { id: 3, name: "Great Hall", location: "Central Hearthhold", quest: "Take the Oath" },
  { id: 4, name: "The Archives", location: "Library Spire", quest: "Find the Ancient Map" },
  { id: 5, name: "Deep Cellars", location: "Underground Passages", quest: "Descend into the Depths" },
  { id: 6, name: "Kitchen Gardens", location: "Southern Grounds", quest: "Rally the Defenders" },
  { id: 7, name: "Bell Tower", location: "Highest Spire", quest: "Sound the Alarm" },
  { id: 8, name: "Storm's Edge", location: "Outer Ramparts", quest: "Face Zephyros" },
  { id: 9, name: "New Dawn", location: "The Great Hearth", quest: "The Everember Rekindled" },
];

// Load chapter manifest
async function loadChapter(chapterId) {
  const manifest = await loadChapterManifest(chapterId);
  return manifest;
}
```

## Testing Patterns

```ts
// Vitest unit tests
import { describe, it, expect } from "vitest";

describe("Game State", () => {
  it("should decrease health on damage", () => {
    takeDamage(1);
    expect(state.health).toBe(4);
  });

  it("should collect shards", () => {
    collectShard();
    expect(state.shards).toBe(1);
  });
});

// Playwright E2E
test("game canvas renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();

  // Wait for Matter.js to initialize
  await page.waitForTimeout(2000);

  // Check that player is rendered
  const canvasContent = await page.locator("canvas").screenshot();
  expect(canvasContent).toBeTruthy();
});
```

## Avoid These Patterns

```ts
// WRONG: npm commands
npm install  // Use: pnpm install

// WRONG: Direct JSON import
import data from './data.json';  // Use: async loader

// WRONG: Massive monolithic functions
function gameLoop() { /* 500+ lines */ }  // Split into composed functions

// WRONG: Hardcoded magic numbers
const damage = 10;  // Use: named constants or JSON data

// WRONG: Using npm/yarn
npm install something  // Use: pnpm add something

// WRONG: Adding frameworks when vanilla DOM works
import React from 'react';  // Use: TypeScript DOM manipulation
```

## Automated Testing & Validation

### Complete Journey Validation
The game has a comprehensive E2E test system that validates all 10 chapters:

```bash
# REQUIRED first time
pnpm exec playwright install chromium

# Run all chapter playthroughs
pnpm test:playthroughs

# Run complete game journey (all 10 chapters)
pnpm test:journey

# With MCP (headed mode, video capture)
pnpm test:journey:mcp
```

### Test Infrastructure
- **Playthrough Factory** (`tests/factories/playthrough-factory.ts`) - Generates tests from JSON manifests
- **AI Player** (`tests/factories/ai-player.ts`) - Uses YUKA pathfinding to navigate levels
- **Level Parser** (`tests/factories/level-parser.ts`) - Converts JSON DDL to navigation graphs

### When Making Changes
1. Run unit tests: `pnpm test`
2. Run E2E tests: `pnpm test:e2e`
3. Validate chapter playthroughs if you changed level definitions
4. Capture video evidence of gameplay working

## Brand Compliance

### Storytelling: Wordless Narrative
**This game tells its story WITHOUT DIALOGUE** - following British pantomime, silent film, and Studio Ghibli traditions.

When generating:
- **NO spoken dialogue in cinematics** - Use gesture, expression, camera, music
- **NO text-heavy UI** - Visual indicators, icons, animations
- Use warm, hopeful tone ("Rally the defenders" not "Kill all enemies")
- Reference woodland/abbey themes (hearth, Willowmere, Otterblade legacy)
- Avoid grimdark, sci-fi, or horror language

### Emotional Core
- Warmth of hearth against darkness
- Weight of inherited responsibility  
- Simple joy of home and community
- Courage of youth answering the call

See `BRAND.md` for complete visual and narrative guidelines.

## Architecture Notes

### JSON DDL System
All game content is defined in JSON manifests:
- `game/public/data/manifests/chapters/*.json` - 10 chapter definitions
- Each defines: level geometry, quests, NPCs, enemies, triggers, cinematics
- Parsed at runtime to generate procedural content

### Procedural Generation
As proven in `pocs/otterblade_odyssey.html` (2,847 lines):
- Player and enemies are procedurally rendered with Canvas 2D (not sprite sheets)
- Matter.js for physics engine
- TypeScript for game logic
- No React overhead - simpler, faster, more maintainable
- Performance: 8MB memory (vs 120MB React), <100KB bundle (vs 1.2MB), 60fps stable (vs 15-25fps)

### YUKA AI Integration
- Enemy pathfinding uses YUKA library
- FSM (Finite State Machine) for behavior states
- Steering behaviors for movement
- Same system used by AI player in automated tests

### Matter.js Patterns from POC
```ts
// POC-proven physics values
engine.gravity.y = 1.5;  // Perfect for platforming feel

// Player body dimensions
const player = Bodies.rectangle(x, y, 35, 55, {
  label: 'player',
  friction: 0.1,
  frictionAir: 0.01,
  restitution: 0
});

// Collision detection
Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;
  for (const pair of pairs) {
    if (pair.bodyA.label === 'player' && pair.bodyB.label === 'enemy') {
      handlePlayerEnemyCollision(pair.bodyA, pair.bodyB);
    }
  }
});
```
