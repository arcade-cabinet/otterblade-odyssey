/**
 * @fileoverview Sound effect generation/acquisition from Freesound.
 * Searches Freesound for game-appropriate sounds and downloads previews.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { log, logError } from '../shared/config';
import {
  AUDIO_CATEGORIES,
  type AudioCategory,
  createFreesoundClient,
  downloadPreview,
  type FreesoundResult,
  generateAttributionFile,
  searchSounds,
  soundToManifestEntry,
} from './freesound-client';

const AUDIO_OUTPUT_DIR = 'client/public/audio/sfx';
const MANIFEST_OUTPUT = 'client/src/data/manifests/sounds-generated.json';

/**
 * Generate/acquire all sound effects for the game.
 */
export async function generateAllSFX(options: {
  dryRun?: boolean;
  categories?: AudioCategory[];
  maxPerCategory?: number;
}): Promise<void> {
  const { dryRun = false, categories, maxPerCategory = 5 } = options;

  log('🎵', 'Starting audio acquisition from Freesound.org');

  if (dryRun) {
    log('🔍', 'DRY RUN - No files will be downloaded');
  }

  const client = createFreesoundClient();
  const allSounds: FreesoundResult[] = [];
  const manifestEntries: object[] = [];
  const categoriesToProcess = categories || (Object.keys(AUDIO_CATEGORIES) as AudioCategory[]);

  for (const category of categoriesToProcess) {
    log('📂', `Processing category: ${category}`);

    const sounds = await searchSounds(client, category, {
      maxResults: maxPerCategory,
      minRating: 3.5,
      sortBy: 'rating_desc',
    });

    if (sounds.length === 0) {
      log('⚠️', `No sounds found for ${category}`);
      continue;
    }

    // Download previews and create manifest entries
    const categoryDir = join(AUDIO_OUTPUT_DIR, category);

    for (const sound of sounds) {
      if (!dryRun) {
        const downloaded = await downloadPreview(sound, categoryDir, 'hq');
        if (downloaded) {
          allSounds.push(sound);
          manifestEntries.push(soundToManifestEntry(sound, category));
        }
      } else {
        log(
          '  📋',
          `Would download: ${sound.name} (${sound.duration.toFixed(1)}s, ⭐${sound.avgRating.toFixed(1)})`
        );
        manifestEntries.push(soundToManifestEntry(sound, category));
      }
    }

    // Rate limiting - Freesound allows 60 requests/minute
    await sleep(500);
  }

  // Generate manifest file
  const manifest = {
    $schema: './manifest-schema.json',
    version: '1.0.0',
    category: 'sounds',
    description: 'Sound effects acquired from Freesound.org',
    generatedAt: new Date().toISOString(),
    soundCount: manifestEntries.length,
    sounds: manifestEntries,
  };

  if (!dryRun) {
    const manifestDir = join(process.cwd(), 'client/src/data/manifests');
    if (!existsSync(manifestDir)) {
      mkdirSync(manifestDir, { recursive: true });
    }
    writeFileSync(join(process.cwd(), MANIFEST_OUTPUT), JSON.stringify(manifest, null, 2));
    log('📝', `Generated manifest: ${MANIFEST_OUTPUT}`);

    // Generate attribution file
    const attributionPath = join(process.cwd(), AUDIO_OUTPUT_DIR, 'ATTRIBUTION.md');
    const attributionDir = join(process.cwd(), AUDIO_OUTPUT_DIR);
    if (!existsSync(attributionDir)) {
      mkdirSync(attributionDir, { recursive: true });
    }
    writeFileSync(attributionPath, generateAttributionFile(allSounds));
    log('📝', `Generated attribution: ${attributionPath}`);
  }

  log('✅', `Audio acquisition complete! ${manifestEntries.length} sounds processed.`);
}

/**
 * Search for sounds matching game-specific needs.
 */
export async function searchGameSounds(
  query: string,
  options: {
    maxDuration?: number;
    minRating?: number;
    maxResults?: number;
  } = {}
): Promise<FreesoundResult[]> {
  const { maxDuration = 10, minRating = 3.5, maxResults = 20 } = options;

  const client = createFreesoundClient();

  log('🔍', `Searching for: "${query}"`);

  try {
    const response = await client.textSearch(query, {
      page_size: maxResults,
      sort: 'rating_desc',
      filter: `duration:[0 TO ${maxDuration}]`,
      fields:
        'id,name,description,duration,license,username,tags,previews,download,avg_rating,num_downloads',
    });

    const results: FreesoundResult[] = response.results
      .filter((sound: { avg_rating: number }) => sound.avg_rating >= minRating)
      .map(
        (sound: {
          id: number;
          name: string;
          description: string;
          duration: number;
          license: string;
          username: string;
          tags: string[];
          previews: FreesoundResult['previews'];
          download: string;
          avg_rating: number;
          num_downloads: number;
        }) => ({
          id: sound.id,
          name: sound.name,
          description: sound.description,
          duration: sound.duration,
          license: sound.license,
          username: sound.username,
          tags: sound.tags,
          previews: sound.previews,
          download: sound.download,
          avgRating: sound.avg_rating,
          numDownloads: sound.num_downloads,
        })
      );

    log('✅', `Found ${results.length} sounds`);

    for (const sound of results.slice(0, 10)) {
      log(
        '  🎵',
        `${sound.name} (${sound.duration.toFixed(1)}s) by ${sound.username} - ⭐${sound.avgRating.toFixed(1)}`
      );
    }

    return results;
  } catch (error) {
    logError(`Search failed: ${error}`);
    return [];
  }
}

/**
 * Download specific sounds by Freesound ID.
 */
export async function downloadSoundsByIds(ids: number[], outputDir: string): Promise<string[]> {
  const client = createFreesoundClient();
  const downloaded: string[] = [];

  for (const id of ids) {
    try {
      const sound = await client.getSound(id);
      const result: FreesoundResult = {
        id: sound.id,
        name: sound.name,
        description: sound.description,
        duration: sound.duration,
        license: sound.license,
        username: sound.username,
        tags: sound.tags,
        previews: sound.previews,
        download: sound.download,
        avgRating: sound.avg_rating,
        numDownloads: sound.num_downloads,
      };

      const path = await downloadPreview(result, outputDir, 'hq');
      if (path) {
        downloaded.push(path);
      }
    } catch (error) {
      logError(`Failed to get sound ${id}: ${error}`);
    }

    await sleep(200); // Rate limiting
  }

  return downloaded;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
