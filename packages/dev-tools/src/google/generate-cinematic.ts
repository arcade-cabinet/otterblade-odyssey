#!/usr/bin/env tsx
/**
 * @fileoverview Cinematic video generation using Google Veo 3.1.
 * Generates high-fidelity videos with native audio for game cutscenes.
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools generate:cinematic
 * # Or generate a specific cinematic:
 * pnpm --filter @otterblade/dev-tools generate:cinematic -- --name intro
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATICS,
  GOOGLE_MODELS,
  VIDEO_OUTPUT_DIR,
  createGoogleClient,
  log,
  logError,
} from '../shared/config.js';
import { getCinematicPrompt } from '../shared/prompts.js';

type CinematicKey = keyof typeof CINEMATICS;

/**
 * Parses command line arguments.
 */
function parseArgs(): { name?: CinematicKey; all?: boolean } {
  const args = process.argv.slice(2);
  const nameIndex = args.indexOf('--name');

  if (args.includes('--all')) {
    return { all: true };
  }

  if (nameIndex !== -1 && args[nameIndex + 1]) {
    const name = args[nameIndex + 1] as CinematicKey;
    if (!(name in CINEMATICS)) {
      const validNames = Object.keys(CINEMATICS).join(', ');
      logError(`Invalid cinematic: ${name}. Valid: ${validNames}`, true);
    }
    return { name };
  }

  // Default to showing help
  log('📖', 'Usage: generate:cinematic [--name <cinematic>] [--all]');
  log('', '');
  log('  ', 'Available cinematics:');
  for (const [key, value] of Object.entries(CINEMATICS)) {
    log('    ', `${key}: ${value.description}`);
  }
  process.exit(0);
}

/**
 * Generates a single cinematic video using Veo 3.1.
 */
async function generateCinematic(
  client: ReturnType<typeof createGoogleClient>,
  key: CinematicKey,
  outputPath: string
): Promise<void> {
  const cinematic = CINEMATICS[key];
  const prompt = getCinematicPrompt(
    cinematic.name,
    cinematic.description,
    cinematic.duration
  );

  log('🎬', `Generating: ${cinematic.name}`);
  log('📝', `Description: ${cinematic.description}`);
  log('⏱️', `Duration: ${cinematic.duration}s`);

  try {
    // Use Veo 3.1 for video generation
    // The API returns an operation that we need to poll
    const response = await client.models.generateVideos({
      model: GOOGLE_MODELS.VIDEO,
      prompt,
      config: {
        aspectRatio: '16:9',
        numberOfVideos: 1,
        durationSeconds: cinematic.duration,
      },
    });

    // Poll for completion
    log('⏳', 'Video generation started, polling for completion...');

    let operation = response;
    let pollCount = 0;
    while (!operation.done && pollCount < 60) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10s
      pollCount++;
      operation = await client.operations.getVideosOperation({ operation });
      log('  ', `Progress: polling... (${pollCount * 10}s elapsed)`);
    }

    if (operation.error) {
      logError(`Generation failed: ${operation.error.message}`);
      return;
    }

    // Save the video
    const video = operation.response?.generatedVideos?.[0];
    if (!video?.video?.uri) {
      logError('No video data in response');
      return;
    }

    const videoUrl = video.video.uri;
    const outputFile = path.join(outputPath, `${cinematic.name}.mp4`);

    // Download the video
    log('💾', `Downloading video to: ${outputFile}`);
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    fs.writeFileSync(outputFile, videoBuffer);

    log('✅', `Saved: ${outputFile} (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
  } catch (error) {
    if (error instanceof Error) {
      logError(`Failed: ${error.message}`);
    }
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  log('🎬', 'Otterblade Odyssey - Cinematic Generator');
  log('📋', 'Using Google Veo 3.1 for video generation');
  log('', '');

  const { name, all } = parseArgs();
  const client = createGoogleClient();
  log('✅', 'Google GenAI client initialized');

  // Ensure output directory exists
  const outputPath = path.resolve(process.cwd(), '..', '..', VIDEO_OUTPUT_DIR);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const cinematicsToGenerate: CinematicKey[] = all
    ? (Object.keys(CINEMATICS) as CinematicKey[])
    : name
      ? [name]
      : [];

  for (const key of cinematicsToGenerate) {
    await generateCinematic(client, key, outputPath);
    log('', '');
  }

  log('🏁', 'Cinematic generation complete');
}

main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
