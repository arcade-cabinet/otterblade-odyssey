/**
 * @fileoverview Brand-aligned prompts for AI image and video generation.
 * All prompts enforce the Willowmere Hearthhold aesthetic from BRAND.md.
 */

/**
 * Core style directive for all visual content.
 * Enforces the woodland-epic storybook aesthetic.
 */
export const STYLE_DIRECTIVE = `
Style: Storybook art, painterly, warm lighting, Redwall-inspired woodland-epic.
Aesthetic: Cozy-but-heroic, grounded materials (fur, cloth, leather, iron, stone).
Palette: Warm greens, honey gold, cool misty blues. Natural muted tones.
Magic: Subtle only - firefly motes, faint shimmer. NEVER laser beams or energy.

CRITICAL - MUST AVOID:
- Neon colors, glowing energy, electric blues/purples
- Sci-fi elements, robots, futuristic technology
- Anime style, JRPG effects, over-stylized poses
- Grimdark, horror, demons, gore, skulls
- Glossy plastic, sterile minimalism
- Modern clothing, sunglasses, contemporary items
- HUMAN characters - ALL characters must be ANTHROPOMORPHIC WOODLAND ANIMALS
`.trim();

/**
 * Character description for the otter protagonist.
 */
export const FINN_DESCRIPTION = `
PROTAGONIST - FINN RIVERSTONE:
- Species: River otter standing upright on hind legs
- Build: Athletic but not bulky, agile adventurer physique
- Fur: Rich brown with lighter cream chest and muzzle
- Face: Determined expression, friendly but brave, whiskers visible
- Outfit: Simple leather vest over cloth tunic, cloth belt with pouch
- Weapon: The Otterblade - an iron sword (NOT glowing), worn on back or held
- NO helmet, NO heavy armor - light and agile appearance
`.trim();

/**
 * Generates the prompt for player character sprite sheet.
 */
export function getPlayerSpritePrompt(
  frameWidth: number,
  frameHeight: number,
  columns: number,
  rows: number
): string {
  const totalWidth = frameWidth * columns;
  const totalHeight = frameHeight * rows;

  return `
Create a pixel art sprite sheet for an otter warrior character.

${FINN_DESCRIPTION}

SPRITE SHEET LAYOUT:
- Total size: ${totalWidth}x${totalHeight} pixels
- Grid: ${columns} columns x ${rows} rows
- Each frame: ${frameWidth}x${frameHeight} pixels
- Transparent background (PNG with alpha)

ANIMATION FRAMES (left to right, top to bottom):
Row 1: Idle (4 frames) + Run start (2 frames)
Row 2: Run cycle (4 frames) + Jump (2 frames)
Row 3: Fall (2 frames) + Attack swing (4 frames)
Row 4: Hurt (2 frames) + Crouch (2 frames) + empty

TECHNICAL REQUIREMENTS:
- Clean pixel art with defined outlines
- Consistent proportions across all frames
- Side-view profile (facing right)
- Readable silhouette at small sizes
- Smooth animation transitions

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates the prompt for enemy sprite sheets.
 */
export function getEnemySpritePrompt(
  enemyType: string,
  description: string,
  frameWidth: number,
  frameHeight: number,
  columns: number,
  rows: number
): string {
  const totalWidth = frameWidth * columns;
  const totalHeight = frameHeight * rows;

  return `
Create a pixel art sprite sheet for a "${enemyType}" enemy character.

CHARACTER DESIGN:
- Type: ${description}
- Faction: Galeborn (followers of Zephyros the storm hawk)
- Species: MUST be an anthropomorphic woodland animal (NOT human)
- Appearance: Weathered, cold-adapted, practical worn gear
- Expression: Menacing but not demonic
- Equipment: Period-appropriate (leather, iron, bone) - NO guns

SPRITE SHEET LAYOUT:
- Total size: ${totalWidth}x${totalHeight} pixels
- Grid: ${columns} columns x ${rows} rows
- Each frame: ${frameWidth}x${frameHeight} pixels
- Transparent background

ANIMATION FRAMES:
Row 1: Idle (4 frames)
Row 2: Walk/Move (4 frames)
Row 3: Attack (4 frames)
Row 4: Hurt (2 frames) + Death (2 frames)

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates prompt for sprite analysis.
 */
export function getSpriteAnalysisPrompt(context: string): string {
  return `
Analyze this sprite sheet for a 2D platformer game.

CONTEXT: ${context}

Evaluate:
1. STYLE - Does it match storybook/painterly pixel art? No neon/sci-fi?
2. ANIMATION - Frames aligned? Smooth flow? Readable silhouette?
3. TECHNICAL - Transparent background? Consistent proportions?
4. BRAND - Cozy-but-heroic tone? NO humans, only woodland animals?
5. SCORE - Overall viability (1-10) with specific recommendations.
`.trim();
}

/**
 * Generates prompt for cinematic video generation using Veo 3.1.
 */
export function getCinematicPrompt(
  cinematicName: string,
  description: string,
  duration: number
): string {
  return `
Create a ${duration}-second cinematic for "${cinematicName}".

SCENE: ${description}

WORLD: Willowmere Hearthhold - an ancient riverside sanctuary built into 
moss-covered cliffs. Stone walls, warm lanterns, winding paths, the great 
Everember fire at its heart.

CHARACTERS:
${FINN_DESCRIPTION}

CRITICAL CHARACTER REQUIREMENTS:
- ALL characters MUST be ANTHROPOMORPHIC WOODLAND ANIMALS
- The protagonist is an OTTER named Finn
- Enemies are Galeborn - rats, weasels, stoats, crows (all anthropomorphic)
- NO HUMANS whatsoever - not even in the background
- NO human knights, soldiers, or villagers

VISUAL STYLE:
- Storybook illustration come to life
- Warm, inviting color palette (greens, golds, warm browns)
- Soft volumetric lighting, lantern glow, firefly motes
- Hand-painted texture quality
- Dawn/dusk atmospheric lighting

CAMERA:
- Cinematic compositions, slow deliberate movements
- Parallax depth with foreground elements
- Focus on character emotion and environment mood

AUDIO:
- Warm orchestral undertones
- Environmental sounds (crackling fire, flowing water, birdsong)
- NO dialogue, purely atmospheric

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates prompt for scene/background image generation.
 */
export function getScenePrompt(sceneName: string, description: string): string {
  return `
Create a parallax background scene for "${sceneName}".

SCENE: ${description}

WORLD: Willowmere Hearthhold aesthetic - warm, cozy, lived-in spaces with 
ancient stone, moss, lanterns, and natural materials.

COMPOSITION:
- Wide horizontal format suitable for parallax scrolling
- Clear depth layers (foreground, midground, background)
- Platform-friendly - clear ground/floor areas
- Atmospheric perspective (more haze in distance)

LIGHTING:
- Warm lantern/hearth light sources
- Soft god rays through windows/canopy
- Subtle ambient glow
- Time of day appropriate to scene

NO characters in the scene - environment only.

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates prompt for video analysis.
 */
export function getVideoAnalysisPrompt(context: string): string {
  return `
Analyze this cinematic video for a woodland-epic game.

CONTEXT: ${context}

Check for these CRITICAL issues:
1. Are ALL characters anthropomorphic woodland animals? (NO humans)
2. Does the protagonist match Finn the otter warrior?
3. Is the visual style warm/storybook (not neon/sci-fi)?
4. Are there any modern/contemporary elements?
5. Does the audio match the cozy-heroic tone?

BRAND VIOLATIONS to flag:
- Any human characters (knights, villagers, etc.)
- Glowing energy weapons or magic effects
- Neon or sci-fi lighting
- Horror or grimdark elements
- Modern objects or clothing

Provide a detailed report with timestamps for any issues.
`.trim();
}
