#!/usr/bin/env tsx
/**
 * @fileoverview Enemy sprite sheet generation using OpenAI GPT-Image-1.
 * Generates sprite sheets for all enemy archetypes defined in BRAND.md.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools generate:enemy-sprites
 * # Or generate a specific enemy type:
 * pnpm --filter @otterblade/dev-tools generate:enemy-sprites -- --type skirmisher
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ENEMY_SPRITE_CONFIGS,
  OUTPUT_DIR,
  createOpenAIClient,
  log,
  logError,
  type EnemyType,
} from './config.js';
import { getEnemySpritePrompt } from './prompts.js';

/**
 * Parses command line arguments.
 * @returns Parsed arguments
 */
function parseArgs(): { type?: EnemyType } {
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--type');

  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const type = args[typeIndex + 1] as EnemyType;
    if (!(type in ENEMY_SPRITE_CONFIGS)) {
      const validTypes = Object.keys(ENEMY_SPRITE_CONFIGS).join(', ');
      logError(`Invalid enemy type: ${type}. Valid types: ${validTypes}`, true);
    }
    return { type };
  }

  return {};
}

/**
 * Generates a single enemy sprite sheet.
 * @param openai - OpenAI client instance
 * @param enemyType - Type of enemy to generate
 * @param outputPath - Directory to save the sprite
 */
async function generateEnemy(
  openai: ReturnType<typeof createOpenAIClient>,
  enemyType: EnemyType,
  outputPath: string
): Promise<void> {
  const config = ENEMY_SPRITE_CONFIGS[enemyType];
  const { columns, rows, frameWidth, frameHeight, description } = config;

  const prompt = getEnemySpritePrompt(
    enemyType,
    description,
    frameWidth,
    frameHeight,
    columns,
    rows
  );

  log('🎨', `Generating ${enemyType} sprite sheet...`);
  log('📐', `Size: ${frameWidth * columns}x${frameHeight * rows}px`);

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'high',
    response_format: 'b64_json',
  });

  if (!response.data?.[0]?.b64_json) {
    logError(`No image data received for ${enemyType}`);
    return;
  }

  const imageData = response.data[0].b64_json;
  const outputFile = path.join(outputPath, `enemy_${enemyType}_sprite_sheet.png`);

  const buffer = Buffer.from(imageData, 'base64');
  fs.writeFileSync(outputFile, buffer);

  log('✅', `Saved: ${outputFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

/**
 * Main entry point for enemy sprite generation.
 */
async function main(): Promise<void> {
  log('🎮', 'Otterblade Odyssey - Enemy Sprite Generator');
  log('📋', 'Using OpenAI GPT-Image-1 for generation');

  const { type: specificType } = parseArgs();
  const openai = createOpenAIClient();
  log('✅', 'OpenAI client initialized');

  // Ensure output directory exists
  const outputPath = path.resolve(process.cwd(), '..', '..', OUTPUT_DIR);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    log('📁', `Created output directory: ${outputPath}`);
  }

  // Determine which enemies to generate
  const enemiesToGenerate: EnemyType[] = specificType
    ? [specificType]
    : (Object.keys(ENEMY_SPRITE_CONFIGS) as EnemyType[]);

  log('🎯', `Generating ${enemiesToGenerate.length} enemy type(s)`);
  log('', '');

  // Generate each enemy type
  for (const enemyType of enemiesToGenerate) {
    try {
      await generateEnemy(openai, enemyType, outputPath);
    } catch (error) {
      if (error instanceof Error) {
        logError(`Failed to generate ${enemyType}: ${error.message}`);
      }
    }
    log('', '');
  }

  log('🏁', 'Enemy sprite generation complete');
}

// Run the script
main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
