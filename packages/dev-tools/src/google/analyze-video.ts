#!/usr/bin/env tsx
/**
 * @fileoverview Video analysis using Google Gemini 2.0.
 * Analyzes cinematics for brand compliance and visual consistency.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools analyze:video path/to/video.mp4
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { createGoogleClient, GOOGLE_MODELS, log, logError } from '../shared/config.js';
import { getVideoAnalysisPrompt } from '../shared/prompts.js';

/**
 * Reads a video file and converts to base64.
 */
function readVideoAsBase64(videoPath: string): string {
  const absolutePath = path.resolve(process.cwd(), videoPath);

  if (!fs.existsSync(absolutePath)) {
    logError(`File not found: ${absolutePath}`, true);
    return '';
  }

  const buffer = fs.readFileSync(absolutePath);
  return buffer.toString('base64');
}

/**
 * Determines MIME type from file extension.
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
  };
  return mimeTypes[ext] || 'video/mp4';
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  log('🎬', 'Otterblade Odyssey - Video Analyzer');
  log('📋', 'Using Google Gemini 2.0 for analysis');
  log('', '');

  const videoPath = process.argv[2];
  if (!videoPath) {
    logError('Usage: analyze:video <path-to-video.mp4>', true);
    return;
  }

  const client = createGoogleClient();
  log('✅', 'Google GenAI client initialized');

  log('🎬', `Analyzing: ${videoPath}`);
  const videoBase64 = readVideoAsBase64(videoPath);
  const mimeType = getMimeType(videoPath);

  // Determine context from filename
  const filename = path.basename(videoPath, path.extname(videoPath));
  let context = 'Game cinematic';
  if (filename.includes('intro')) {
    context = 'Opening cinematic - Finn leaving his village';
  } else if (filename.includes('outro')) {
    context = 'Victory cinematic - celebration in the Great Hall';
  } else if (filename.includes('chapter')) {
    const match = filename.match(/chapter_(\d+)/);
    if (match) {
      context = `Chapter ${match[1]} opening cinematic`;
    }
  } else if (filename.includes('boss')) {
    context = 'Boss arrival cinematic';
  }

  log('📝', `Context: ${context}`);
  log('', '');

  try {
    const response = await client.models.generateContent({
      model: GOOGLE_MODELS.ANALYSIS,
      contents: [
        {
          role: 'user',
          parts: [
            { text: getVideoAnalysisPrompt(context) },
            {
              inlineData: {
                mimeType,
                data: videoBase64,
              },
            },
          ],
        },
      ],
    });

    const analysis = response.text;
    if (!analysis) {
      logError('No analysis received from API', true);
      return;
    }

    log('📊', 'ANALYSIS RESULTS');
    log('', '═'.repeat(60));
    console.log(analysis);
    log('', '═'.repeat(60));

    // Save analysis
    const analysisPath = videoPath.replace(/\.[^.]+$/, '_analysis.txt');
    fs.writeFileSync(analysisPath, analysis);
    log('💾', `Analysis saved: ${analysisPath}`);
  } catch (error) {
    if (error instanceof Error) {
      logError(`Analysis failed: ${error.message}`, true);
    }
  }
}

main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
