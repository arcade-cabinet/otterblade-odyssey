/**
 * @fileoverview Manifest-driven asset generation.
 * Routes generation to appropriate provider based on manifest configuration.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  GOOGLE_MODELS,
  createGoogleClient,
  createOpenAIClient,
  log,
  logError,
} from './shared/config.js';
import { STYLE_DIRECTIVE, FINN_DESCRIPTION } from './shared/prompts.js';

/** Asset manifest structure */
export interface AssetManifest {
  category: string;
  provider: 'openai' | 'google';
  model: string;
  outputDir: string;
  assets: Array<{
    id: string;
    name: string;
    filename: string;
    status: 'pending' | 'complete' | 'needs_regeneration';
    reason?: string;
    config: Record<string, unknown>;
    prompt: Record<string, string>;
    validation?: Record<string, unknown>;
  }>;
}

/**
 * Builds a complete prompt from manifest prompt fragments.
 */
function buildPrompt(
  category: string,
  promptData: Record<string, string>,
  config: Record<string, unknown>
): string {
  const parts: string[] = [];

  // Add category-specific header
  if (category === 'sprites' || category === 'enemy-sprites') {
    parts.push(`Create a pixel art sprite sheet.`);
    parts.push('');
    parts.push(`CHARACTER: ${promptData.subject || 'Character'}`);
    parts.push(promptData.description || '');
    if (promptData.faction) parts.push(`FACTION: ${promptData.faction}`);
    parts.push('');
    parts.push(`LAYOUT: ${promptData.layout || ''}`);
    parts.push('');

    // Add grid config
    const cols = config.columns as number;
    const rows = config.rows as number;
    const fw = config.frameWidth as number;
    const fh = config.frameHeight as number;
    parts.push(`SPRITE SHEET: ${cols}x${rows} grid, each frame ${fw}x${fh}px`);
    parts.push(`Total dimensions: ${cols * fw}x${rows * fh}px`);
    parts.push('');
    parts.push(`TECHNICAL: ${promptData.technical || 'Transparent PNG'}`);
  } else if (category === 'cinematics') {
    parts.push(`Create a cinematic video.`);
    parts.push('');
    parts.push(`SCENE: ${promptData.scene || ''}`);
    parts.push(`SETTING: ${promptData.setting || ''}`);
    parts.push(`ACTION: ${promptData.action || ''}`);
    parts.push(`MOOD: ${promptData.mood || ''}`);
    parts.push(`CAMERA: ${promptData.camera || ''}`);
    parts.push(`AUDIO: ${promptData.audio || ''}`);
    parts.push('');
    parts.push('PROTAGONIST:');
    parts.push(FINN_DESCRIPTION);
  } else if (category === 'scenes') {
    parts.push(`Create a game background scene.`);
    parts.push('');
    parts.push(`SCENE: ${promptData.scene || ''}`);
    parts.push(`SETTING: ${promptData.setting || ''}`);
    parts.push(`COMPOSITION: ${promptData.composition || ''}`);
    parts.push(`LIGHTING: ${promptData.lighting || ''}`);
    parts.push('');
    parts.push('NO characters - environment only.');
  }

  // Always add style directive
  parts.push('');
  parts.push(STYLE_DIRECTIVE);

  return parts.join('\n');
}

/**
 * Generates an asset using OpenAI.
 */
async function generateWithOpenAI(
  outputPath: string,
  prompt: string,
  config: Record<string, unknown>
): Promise<boolean> {
  const client = createOpenAIClient();

  const response = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: (config.size as '1024x1024') || '1024x1024',
    quality: (config.quality as 'high') || 'high',
    response_format: 'b64_json',
  });

  if (!response.data?.[0]?.b64_json) {
    return false;
  }

  const buffer = Buffer.from(response.data[0].b64_json, 'base64');
  fs.writeFileSync(outputPath, buffer);
  return true;
}

/**
 * Generates an image using Google Imagen.
 */
async function generateImageWithGoogle(
  outputPath: string,
  prompt: string,
  config: Record<string, unknown>
): Promise<boolean> {
  const client = createGoogleClient();

  const response = await client.models.generateImages({
    model: GOOGLE_MODELS.IMAGE,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: (config.aspectRatio as string) || '16:9',
      outputMimeType: (config.outputMimeType as string) || 'image/png',
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    return false;
  }

  const buffer = Buffer.from(image.image.imageBytes, 'base64');
  fs.writeFileSync(outputPath, buffer);
  return true;
}

/**
 * Generates a video using Google Veo.
 */
async function generateVideoWithGoogle(
  outputPath: string,
  prompt: string,
  config: Record<string, unknown>
): Promise<boolean> {
  const client = createGoogleClient();

  log('  ', 'Starting video generation (this may take several minutes)...');

  const response = await client.models.generateVideos({
    model: GOOGLE_MODELS.VIDEO,
    prompt,
    config: {
      aspectRatio: (config.aspectRatio as string) || '16:9',
      numberOfVideos: 1,
      durationSeconds: (config.duration as number) || 5,
    },
  });

  // Poll for completion
  let operation = response;
  let attempts = 0;
  const maxAttempts = 60; // 10 minutes max

  while (!operation.done && attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 10000)); // Wait 10s
    attempts++;

    operation = await client.operations.getVideosOperation({
      operation,
    });

    if (attempts % 6 === 0) {
      log('  ', `Still processing... (${attempts * 10}s elapsed)`);
    }
  }

  if (!operation.done) {
    logError('Video generation timed out');
    return false;
  }

  if (operation.error) {
    logError(`Video generation error: ${operation.error.message}`);
    return false;
  }

  const video = operation.response?.generatedVideos?.[0];
  if (!video?.video?.uri) {
    logError('No video URI in response');
    return false;
  }

  // Download the video
  const videoResponse = await fetch(video.video.uri);
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  fs.writeFileSync(outputPath, videoBuffer);

  return true;
}

/**
 * Generates an asset based on manifest configuration.
 * @returns The output file path if successful, null otherwise
 */
export async function generateAsset(
  basePath: string,
  manifest: AssetManifest,
  asset: AssetManifest['assets'][0]
): Promise<string | null> {
  const outputDir = path.join(basePath, manifest.outputDir);
  const outputPath = path.join(outputDir, asset.filename);

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Build the prompt
  const prompt = buildPrompt(manifest.category, asset.prompt, asset.config);

  try {
    let success = false;

    if (manifest.provider === 'openai') {
      success = await generateWithOpenAI(outputPath, prompt, asset.config);
    } else if (manifest.provider === 'google') {
      if (manifest.category === 'cinematics') {
        success = await generateVideoWithGoogle(outputPath, prompt, asset.config);
      } else {
        success = await generateImageWithGoogle(outputPath, prompt, asset.config);
      }
    }

    return success ? outputPath : null;
  } catch (error) {
    logError(`Generation error: ${error}`);
    return null;
  }
}
