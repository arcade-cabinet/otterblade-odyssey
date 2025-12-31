#!/usr/bin/env tsx
/**
 * @fileoverview Sprite sheet analysis using OpenAI GPT-4 Vision.
 * Validates sprite quality, style consistency, and brand alignment.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools analyze:sprite path/to/sprite.png
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { createOpenAIClient, log, logError } from './config.js';
import { getSpriteAnalysisPrompt } from './prompts.js';

/**
 * Reads an image file and converts it to base64.
 * @param imagePath - Path to the image file
 * @returns Base64 encoded image data
 */
function readImageAsBase64(imagePath: string): string {
  const absolutePath = path.resolve(process.cwd(), imagePath);

  if (!fs.existsSync(absolutePath)) {
    logError(`File not found: ${absolutePath}`, true);
    return '';
  }

  const buffer = fs.readFileSync(absolutePath);
  return buffer.toString('base64');
}

/**
 * Determines the MIME type from file extension.
 * @param filePath - Path to the file
 * @returns MIME type string
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/png';
}

/**
 * Main entry point for sprite analysis.
 */
async function main(): Promise<void> {
  log('🔍', 'Otterblade Odyssey - Sprite Analyzer');
  log('📋', 'Using OpenAI GPT-4 Vision for analysis');

  // Parse command line arguments
  const imagePath = process.argv[2];
  if (!imagePath) {
    logError('Usage: pnpm analyze:sprite <path-to-sprite.png>', true);
    return;
  }

  // Initialize OpenAI client
  const openai = createOpenAIClient();
  log('✅', 'OpenAI client initialized');

  // Read and encode the image
  log('📷', `Analyzing: ${imagePath}`);
  const imageBase64 = readImageAsBase64(imagePath);
  const mimeType = getMimeType(imagePath);

  // Determine context from filename
  const filename = path.basename(imagePath, path.extname(imagePath));
  let context = 'General sprite sheet';
  if (filename.includes('player')) {
    context = 'Player character (otter warrior) sprite sheet';
  } else if (filename.includes('enemy')) {
    context = `Enemy character sprite sheet (${filename.replace('enemy_', '').replace('_sprite_sheet', '')})`;
  }

  log('📝', `Context: ${context}`);
  log('', '');

  try {
    // Call GPT-4 Vision for analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: getSpriteAnalysisPrompt(context),
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const analysis = response.choices[0]?.message?.content;
    if (!analysis) {
      logError('No analysis received from API', true);
      return;
    }

    // Display the analysis
    log('📊', 'ANALYSIS RESULTS');
    log('', '═'.repeat(60));
    console.log(analysis);
    log('', '═'.repeat(60));

    // Save analysis to file
    const analysisPath = imagePath.replace(/\.[^.]+$/, '_analysis.txt');
    fs.writeFileSync(analysisPath, analysis);
    log('💾', `Analysis saved: ${analysisPath}`);
  } catch (error) {
    if (error instanceof Error) {
      logError(`Analysis failed: ${error.message}`, true);
    } else {
      logError('Unknown error during analysis', true);
    }
  }
}

// Run the script
main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
