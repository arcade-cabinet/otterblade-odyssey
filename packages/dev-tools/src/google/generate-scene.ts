#!/usr/bin/env tsx
/**
 * @fileoverview Scene/background image generation using Google Imagen 3.
 * Generates parallax backgrounds and chapter plates.
 *
 * @see https://ai.google.dev/gemini-api/docs/imagen
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools generate:scene -- --type parallax --biome village
 * pnpm --filter @otterblade/dev-tools generate:scene -- --type chapter-plate --chapter 0
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { createGoogleClient, GOOGLE_MODELS, log, logError } from '../shared/config.js';
import { getScenePrompt } from '../shared/prompts.js';

/** Scene definitions for parallax backgrounds */
const PARALLAX_SCENES = {
  village: {
    name: 'village_morning_parallax_background',
    description: "Finn's cottage village at dawn, cozy riverside hamlet with thatched roofs",
  },
  willowbanks: {
    name: 'willow_banks_parallax_background',
    description: 'River path lined with willow trees, morning mist on the water',
  },
  abbey_exterior: {
    name: 'abbey_exterior_parallax_background',
    description: 'Willowmere Hearthhold exterior - ancient stone walls with moss and ivy',
  },
  abbey_interior: {
    name: 'abbey_interior_parallax_background',
    description: 'Great Hall interior with the Everember hearth, warm candlelight',
  },
  dungeon: {
    name: 'dungeon_parallax_background',
    description: 'Deep Cellars - damp stone passages with torch sconces, roots overhead',
  },
  courtyard: {
    name: 'courtyard_parallax_background',
    description: 'Kitchen Gardens - sunlit vegetable plots, herb spirals, training yard',
  },
  rooftops: {
    name: 'rooftops_parallax_background',
    description: 'Bell Tower and rooftops - slate tiles, wind-worn banners, high vistas',
  },
  outer_ruins: {
    name: 'outer_ruins_parallax_background',
    description: 'Storm-damaged outer ramparts with fog rolling in',
  },
  new_dawn: {
    name: 'new_dawn_hall_parallax_background',
    description: 'Great Hall at sunrise after victory, golden light streaming in',
  },
} as const;

/** Chapter plate definitions */
const CHAPTER_PLATES = {
  0: {
    name: 'prologue_village_chapter_plate',
    description: 'Finn the otter leaving his cottage, Otterblade on his back, dawn light',
  },
  1: {
    name: 'abbey_approach_chapter_plate',
    description: 'Finn walking the River Path toward distant Willowmere walls',
  },
  2: {
    name: 'gatehouse_bridge_chapter_plate',
    description: 'Finn at the Northern Gate, lantern-lit bridge, moment of decision',
  },
  3: {
    name: 'great_hall_oath_chapter_plate',
    description: 'Finn before the Everember, paw on the Otterblade, taking the oath',
  },
  4: {
    name: 'library_map_table_chapter_plate',
    description: 'Finn studying ancient maps by candlelight in the Archives',
  },
  5: {
    name: 'dungeon_descent_chapter_plate',
    description: 'Finn descending stone stairs into darkness, torch in paw',
  },
  6: {
    name: 'courtyard_rally_chapter_plate',
    description: 'Finn rallying woodland creature allies in the sunlit gardens',
  },
  7: {
    name: 'rooftop_wind_chapter_plate',
    description: 'Finn climbing toward the Bell Tower, wind in his fur',
  },
  8: {
    name: 'final_ascent_chapter_plate',
    description: 'Finn facing the storm on the outer ramparts, Zephyros visible above',
  },
  9: {
    name: 'epilogue_victory_chapter_plate',
    description: 'Dawn celebration in the Great Hall, Finn among friends',
  },
} as const;

type ParallaxKey = keyof typeof PARALLAX_SCENES;
type ChapterKey = keyof typeof CHAPTER_PLATES;

/**
 * Parses command line arguments.
 */
function parseArgs(): {
  type?: 'parallax' | 'chapter-plate';
  biome?: ParallaxKey;
  chapter?: ChapterKey;
} {
  const args = process.argv.slice(2);
  const typeIdx = args.indexOf('--type');
  const biomeIdx = args.indexOf('--biome');
  const chapterIdx = args.indexOf('--chapter');

  const result: ReturnType<typeof parseArgs> = {};

  if (typeIdx !== -1) {
    result.type = args[typeIdx + 1] as 'parallax' | 'chapter-plate';
  }
  if (biomeIdx !== -1) {
    result.biome = args[biomeIdx + 1] as ParallaxKey;
  }
  if (chapterIdx !== -1) {
    result.chapter = Number(args[chapterIdx + 1]) as ChapterKey;
  }

  if (!result.type) {
    log('📖', 'Usage: generate:scene --type <parallax|chapter-plate> [options]');
    log('', '');
    log('  ', 'Parallax: --type parallax --biome <name>');
    log('  ', 'Chapter:  --type chapter-plate --chapter <0-9>');
    log('', '');
    log('  ', 'Available biomes:');
    for (const key of Object.keys(PARALLAX_SCENES)) {
      log('    ', key);
    }
    process.exit(0);
  }

  return result;
}

/**
 * Generates an image using Imagen 3.
 */
async function generateImage(
  client: ReturnType<typeof createGoogleClient>,
  prompt: string,
  outputFile: string
): Promise<void> {
  const response = await client.models.generateImages({
    model: GOOGLE_MODELS.IMAGE,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '16:9', // Wide format for parallax
      outputMimeType: 'image/png',
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    logError('No image data in response');
    return;
  }

  const buffer = Buffer.from(image.image.imageBytes, 'base64');
  fs.writeFileSync(outputFile, buffer);
  log('✅', `Saved: ${outputFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  log('🎨', 'Otterblade Odyssey - Scene Generator');
  log('📋', 'Using Google Imagen 3 for image generation');
  log('', '');

  const { type, biome, chapter } = parseArgs();
  const client = createGoogleClient();
  log('✅', 'Google GenAI client initialized');

  const basePath = path.resolve(process.cwd(), '..', '..');

  if (type === 'parallax') {
    const outputDir = path.join(basePath, 'client/src/assets/images/parallax');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const scenes = biome ? [biome] : (Object.keys(PARALLAX_SCENES) as ParallaxKey[]);

    for (const key of scenes) {
      const scene = PARALLAX_SCENES[key];
      log('🖼️', `Generating: ${scene.name}`);

      const prompt = getScenePrompt(scene.name, scene.description);
      const outputFile = path.join(outputDir, `${scene.name}.png`);

      await generateImage(client, prompt, outputFile);
      log('', '');
    }
  } else if (type === 'chapter-plate') {
    const outputDir = path.join(basePath, 'client/src/assets/images/chapter-plates');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const chapters =
      chapter !== undefined ? [chapter] : (Object.keys(CHAPTER_PLATES).map(Number) as ChapterKey[]);

    for (const ch of chapters) {
      const plate = CHAPTER_PLATES[ch];
      log('🖼️', `Generating chapter ${ch}: ${plate.name}`);

      const prompt = getScenePrompt(plate.name, plate.description);
      const outputFile = path.join(outputDir, `${plate.name}.png`);

      await generateImage(client, prompt, outputFile);
      log('', '');
    }
  }

  log('🏁', 'Scene generation complete');
}

main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
