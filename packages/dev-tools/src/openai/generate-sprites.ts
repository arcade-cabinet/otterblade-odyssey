#!/usr/bin/env tsx
/**
 * @fileoverview Player sprite sheet generation using OpenAI GPT-Image-1.
 * Generates a complete animated sprite sheet for the otter warrior character.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools generate:sprites
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  OUTPUT_DIR,
  PLAYER_SPRITE_CONFIG,
  createOpenAIClient,
  log,
  logError,
} from '../shared/config.js';
import { getPlayerSpritePrompt } from '../shared/prompts.js';

/**
 * Main entry point for player sprite generation.
 */
async function main(): Promise<void> {
  log('🎮', 'Otterblade Odyssey - Player Sprite Generator');
  log('📋', 'Using OpenAI GPT-Image-1 for generation');

  // Initialize OpenAI client
  const openai = createOpenAIClient();
  log('✅', 'OpenAI client initialized');

  // Ensure output directory exists
  const outputPath = path.resolve(process.cwd(), '..', '..', OUTPUT_DIR);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    log('📁', `Created output directory: ${outputPath}`);
  }

  // Generate the prompt
  const { columns, rows, frameWidth, frameHeight } = PLAYER_SPRITE_CONFIG;
  const prompt = getPlayerSpritePrompt(frameWidth, frameHeight, columns, rows);

  log('🎨', 'Generating player sprite sheet...');
  log('📐', `Size: ${frameWidth * columns}x${frameHeight * rows}px`);
  log('🔲', `Grid: ${columns}x${rows} frames (${frameWidth}x${frameHeight}px each)`);

  try {
    // Call OpenAI's image generation API
    // Using gpt-image-1 which is the latest model as of 2024
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024', // Will be resized/cropped as needed
      quality: 'high',
      response_format: 'b64_json',
    });

    if (!response.data?.[0]?.b64_json) {
      logError('No image data received from API', true);
      return;
    }

    // Save the generated image
    const imageData = response.data[0].b64_json;
    const outputFile = path.join(outputPath, 'player_sprite_sheet.png');

    const buffer = Buffer.from(imageData, 'base64');
    fs.writeFileSync(outputFile, buffer);

    log('✅', `Sprite sheet saved: ${outputFile}`);
    log('📊', `File size: ${(buffer.length / 1024).toFixed(1)} KB`);

    // Log next steps
    log('', '');
    log('📝', 'Next steps:');
    log('  1.', 'Review the generated sprite sheet for quality');
    log('  2.', 'Run analyze:sprite to validate with AI vision');
    log('  3.', 'If needed, regenerate with adjusted prompts');
    log('  4.', 'Update AnimatedSprite.tsx to use the new sheet');
  } catch (error) {
    if (error instanceof Error) {
      logError(`Generation failed: ${error.message}`, true);
    } else {
      logError('Unknown error during generation', true);
    }
  }
}

// Run the script
main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
