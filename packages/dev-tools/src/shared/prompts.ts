/**
 * @fileoverview Brand-aligned prompts for AI image generation.
 * All prompts enforce the Willowmere Hearthhold aesthetic from BRAND.md.
 */

/**
 * Core style directive included in all generation prompts.
 * Enforces the woodland-epic storybook aesthetic.
 */
export const STYLE_DIRECTIVE = `
Style: Storybook pixel art, painterly, warm lighting, Redwall-inspired woodland-epic.
Aesthetic: Cozy-but-heroic, grounded materials (fur, cloth, leather, iron, stone).
Palette: Warm greens, honey gold, cool misty blues. Natural muted tones.
Magic: Subtle only - firefly motes, faint shimmer. NEVER laser beams or energy effects.

CRITICAL NEGATIVE PROMPTS (absolutely avoid):
- Neon colors, glowing energy, electric blues/purples
- Sci-fi elements, robots, futuristic technology
- Anime style, JRPG effects, over-stylized poses
- Grimdark, horror, demons, gore, skulls
- Glossy plastic, sterile minimalism
- Modern clothing, sunglasses, contemporary items
`.trim();

/**
 * Generates the prompt for player character sprite sheet.
 * @param frameWidth - Width of each frame in pixels
 * @param frameHeight - Height of each frame in pixels
 * @param columns - Number of columns in sheet
 * @param rows - Number of rows in sheet
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

CHARACTER DESIGN:
- Species: River otter standing upright on hind legs
- Build: Athletic but not bulky, agile adventurer physique
- Fur: Rich brown with lighter cream chest/muzzle
- Face: Determined expression, friendly but brave
- Outfit: Simple leather vest, cloth belt, no armor
- Weapon: Iron sword (NOT glowing, NOT magical) held in right paw
- Accessories: Small travel pouch on belt

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
- Smooth animation transitions between frames

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates the prompt for enemy sprite sheets.
 * @param enemyType - Type of enemy (skirmisher, shielded, etc.)
 * @param description - Enemy description from config
 * @param frameWidth - Width of each frame
 * @param frameHeight - Height of each frame
 * @param columns - Number of columns
 * @param rows - Number of rows
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
- Faction: Galeborn (followers of Zephyros, the cold wind spirit)
- Appearance: Weathered, cold-adapted, wearing practical gear
- Expression: Menacing but not demonic or horrific
- Equipment: Period-appropriate weapons (no guns, no energy weapons)
- Colors: Cool grays, dark blues, muted browns

SPRITE SHEET LAYOUT:
- Total size: ${totalWidth}x${totalHeight} pixels
- Grid: ${columns} columns x ${rows} rows
- Each frame: ${frameWidth}x${frameHeight} pixels
- Transparent background (PNG with alpha)

ANIMATION FRAMES:
Row 1: Idle (4 frames)
Row 2: Walk/Move (4 frames)
Row 3: Attack (4 frames)
Row 4: Hurt (2 frames) + Death (2 frames)

TECHNICAL REQUIREMENTS:
- Clean pixel art with defined outlines
- Consistent proportions across all frames
- Side-view profile (facing left - opposite to player)
- Clear attack telegraph poses
- Readable silhouette for gameplay clarity

${STYLE_DIRECTIVE}
`.trim();
}

/**
 * Generates prompt for sprite analysis.
 * @param context - Additional context about the sprite
 */
export function getSpriteAnalysisPrompt(context: string): string {
  return `
Analyze this sprite sheet for a 2D platformer game set in a woodland-epic world.

CONTEXT: ${context}

Please evaluate the following criteria and provide a detailed assessment:

1. STYLE CONSISTENCY
   - Does it match storybook/painterly pixel art aesthetic?
   - Are colors warm and natural (no neon or sci-fi elements)?
   - Is the design grounded (fur, cloth, leather, iron)?

2. ANIMATION QUALITY
   - Are frames properly aligned in the grid?
   - Do animations flow smoothly between frames?
   - Is the silhouette readable at small sizes?

3. TECHNICAL REQUIREMENTS
   - Is the background transparent?
   - Are proportions consistent across frames?
   - Are attack poses clearly telegraphed?

4. BRAND ALIGNMENT
   - Does it fit the "cozy-but-heroic" tone?
   - Are there any forbidden elements (neon, sci-fi, horror)?
   - Would it fit in a Redwall-inspired world?

5. RECOMMENDATIONS
   - What improvements would enhance quality?
   - Are any frames problematic?
   - Overall viability score (1-10)

Provide specific, actionable feedback.
`.trim();
}
