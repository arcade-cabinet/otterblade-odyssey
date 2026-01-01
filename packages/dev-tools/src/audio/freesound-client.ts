/**
 * @fileoverview Freesound.org API client for game audio acquisition.
 * Uses freesound-client to search and download CC-licensed sounds.
 *
 * Freesound provides a massive library of Creative Commons sounds perfect
 * for game development - footsteps, ambient loops, impacts, UI sounds, etc.
 */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import Freesound from 'freesound-client';
import { z } from 'zod';
import { log, logError } from '../shared/config';

/**
 * Environment schema for Freesound API.
 * FREESOUND_CLIENT_SECRET functions as the API key for authentication.
 */
const FreesoundEnvSchema = z.object({
  FREESOUND_CLIENT_ID: z.string().optional(),
  FREESOUND_CLIENT_SECRET: z.string().optional(), // Also functions as API key
});

/**
 * Sound search result from Freesound API.
 */
export interface FreesoundResult {
  id: number;
  name: string;
  description: string;
  duration: number;
  license: string;
  username: string;
  tags: string[];
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
    'preview-hq-ogg': string;
    'preview-lq-ogg': string;
  };
  download: string;
  avgRating: number;
  numDownloads: number;
}

/**
 * Audio category definitions with search keywords.
 * Aligned with game brand (woodland, medieval, cozy-heroic).
 */
export const AUDIO_CATEGORIES = {
  // Player sounds
  player_footstep: {
    keywords: ['footstep', 'walking', 'grass', 'stone', 'wood'],
    filters: { duration: '[0 TO 1]' },
    description: 'Player footstep sounds on various surfaces',
  },
  player_jump: {
    keywords: ['jump', 'whoosh', 'leap', 'soft'],
    filters: { duration: '[0 TO 0.5]' },
    description: 'Jump and landing sounds',
  },
  player_attack: {
    keywords: ['sword', 'blade', 'slash', 'swing', 'metal'],
    filters: { duration: '[0 TO 1]' },
    description: 'Melee attack swings and impacts',
  },
  player_hurt: {
    keywords: ['pain', 'grunt', 'impact', 'hit'],
    filters: { duration: '[0 TO 1]' },
    description: 'Player damage and pain sounds',
  },
  player_roll: {
    keywords: ['roll', 'tumble', 'cloth', 'rustle'],
    filters: { duration: '[0 TO 1]' },
    description: 'Dodge roll and evasion sounds',
  },

  // Combat sounds
  combat_hit_flesh: {
    keywords: ['punch', 'impact', 'hit', 'thud'],
    filters: { duration: '[0 TO 0.5]' },
    description: 'Impacts on enemies',
  },
  combat_hit_metal: {
    keywords: ['metal', 'clang', 'shield', 'block'],
    filters: { duration: '[0 TO 0.5]' },
    description: 'Blocked attacks and metal impacts',
  },
  combat_death: {
    keywords: ['death', 'defeat', 'collapse', 'fall'],
    filters: { duration: '[0 TO 2]' },
    description: 'Enemy defeat sounds',
  },

  // Environment sounds
  env_fire: {
    keywords: ['fire', 'hearth', 'crackle', 'flame', 'burning'],
    filters: { duration: '[0 TO 10]' },
    description: 'Fire and hearth crackling',
  },
  env_water: {
    keywords: ['water', 'stream', 'river', 'flowing'],
    filters: { duration: '[0 TO 30]' },
    description: 'Water and stream sounds',
  },
  env_wind: {
    keywords: ['wind', 'breeze', 'howling', 'gust'],
    filters: { duration: '[0 TO 30]' },
    description: 'Wind and weather sounds',
  },
  env_birds: {
    keywords: ['birds', 'songbird', 'forest', 'morning'],
    filters: { duration: '[0 TO 60]' },
    description: 'Bird songs and forest ambience',
  },
  env_rain: {
    keywords: ['rain', 'rainfall', 'storm', 'dripping'],
    filters: { duration: '[0 TO 60]' },
    description: 'Rain and storm sounds',
  },

  // Interaction sounds
  interact_door: {
    keywords: ['door', 'creak', 'wooden', 'open', 'close'],
    filters: { duration: '[0 TO 3]' },
    description: 'Door opening and closing',
  },
  interact_chest: {
    keywords: ['chest', 'treasure', 'lid', 'wooden', 'creak'],
    filters: { duration: '[0 TO 2]' },
    description: 'Chest opening sounds',
  },
  interact_lever: {
    keywords: ['lever', 'mechanism', 'click', 'switch'],
    filters: { duration: '[0 TO 1]' },
    description: 'Lever and switch sounds',
  },
  interact_pickup: {
    keywords: ['pickup', 'collect', 'coin', 'gem', 'sparkle'],
    filters: { duration: '[0 TO 1]' },
    description: 'Collectible pickup sounds',
  },

  // UI sounds
  ui_click: {
    keywords: ['click', 'button', 'interface', 'select'],
    filters: { duration: '[0 TO 0.3]' },
    description: 'Menu button clicks',
  },
  ui_confirm: {
    keywords: ['confirm', 'success', 'positive', 'accept'],
    filters: { duration: '[0 TO 1]' },
    description: 'Confirmation sounds',
  },
  ui_cancel: {
    keywords: ['cancel', 'back', 'negative', 'error'],
    filters: { duration: '[0 TO 0.5]' },
    description: 'Cancel/back sounds',
  },
  ui_pause: {
    keywords: ['pause', 'menu', 'open'],
    filters: { duration: '[0 TO 0.5]' },
    description: 'Game pause sound',
  },

  // Ambient loops
  ambient_forest: {
    keywords: ['forest', 'nature', 'ambient', 'outdoors', 'peaceful'],
    filters: { duration: '[10 TO 120]' },
    description: 'Forest ambience loop',
  },
  ambient_dungeon: {
    keywords: ['dungeon', 'cave', 'dripping', 'underground', 'dark'],
    filters: { duration: '[10 TO 120]' },
    description: 'Underground/dungeon ambience',
  },
  ambient_hall: {
    keywords: ['hall', 'interior', 'echo', 'stone', 'medieval'],
    filters: { duration: '[10 TO 120]' },
    description: 'Great hall interior ambience',
  },
  ambient_storm: {
    keywords: ['storm', 'thunder', 'wind', 'rain', 'tempest'],
    filters: { duration: '[10 TO 120]' },
    description: 'Storm ambience for boss fights',
  },

  // Special sounds
  special_bell: {
    keywords: ['bell', 'church', 'tower', 'alarm', 'ringing'],
    filters: { duration: '[0 TO 10]' },
    description: 'Bell tower sounds',
  },
  special_ice: {
    keywords: ['ice', 'frost', 'freeze', 'crack', 'shatter'],
    filters: { duration: '[0 TO 3]' },
    description: 'Ice and frost magic sounds',
  },
  special_warmth: {
    keywords: ['warm', 'healing', 'magic', 'glow', 'ember'],
    filters: { duration: '[0 TO 2]' },
    description: 'Warmth restoration sounds',
  },
  special_ember: {
    keywords: ['sparkle', 'magic', 'collect', 'shimmer', 'twinkle'],
    filters: { duration: '[0 TO 1]' },
    description: 'Ember shard collection',
  },

  // Music stingers
  stinger_victory: {
    keywords: ['victory', 'fanfare', 'triumph', 'win', 'success'],
    filters: { duration: '[1 TO 5]' },
    description: 'Victory music stinger',
  },
  stinger_discovery: {
    keywords: ['discovery', 'reveal', 'mystery', 'secret'],
    filters: { duration: '[1 TO 4]' },
    description: 'Secret discovery stinger',
  },
  stinger_danger: {
    keywords: ['danger', 'warning', 'alert', 'tension'],
    filters: { duration: '[1 TO 3]' },
    description: 'Danger/alert stinger',
  },
} as const;

export type AudioCategory = keyof typeof AUDIO_CATEGORIES;

/**
 * Creates and configures the Freesound client.
 * Uses FREESOUND_CLIENT_SECRET as the API key (client secret doubles as API key).
 */
export function createFreesoundClient(): Freesound {
  const env = FreesoundEnvSchema.parse(process.env);

  // Client secret functions as the API key for Freesound
  const apiKey = env.FREESOUND_CLIENT_SECRET;

  if (!apiKey) {
    logError('FREESOUND_CLIENT_SECRET environment variable is required for audio search');
    logError('Get your API credentials at: https://freesound.org/apiv2/apply/', true);
  }

  const client = new Freesound();
  client.setToken(apiKey as string);

  log('🔊', `Freesound client initialized (Client ID: ${env.FREESOUND_CLIENT_ID ?? 'not set'})`);

  return client;
}

/**
 * Search for sounds in a category.
 */
export async function searchSounds(
  client: Freesound,
  category: AudioCategory,
  options: {
    maxResults?: number;
    minRating?: number;
    sortBy?: 'rating_desc' | 'downloads_desc' | 'duration_asc' | 'created_desc';
  } = {}
): Promise<FreesoundResult[]> {
  const { maxResults = 10, minRating = 3, sortBy = 'rating_desc' } = options;
  const categoryConfig = AUDIO_CATEGORIES[category];

  log('🔍', `Searching for: ${category} (${categoryConfig.description})`);

  const query = categoryConfig.keywords.join(' OR ');

  try {
    const response = await client.textSearch(query, {
      page_size: maxResults,
      sort: sortBy,
      filter: categoryConfig.filters.duration
        ? `duration:${categoryConfig.filters.duration}`
        : undefined,
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

    log('✅', `Found ${results.length} sounds for ${category}`);
    return results;
  } catch (error) {
    logError(`Failed to search for ${category}: ${error}`);
    return [];
  }
}

/**
 * Download a sound preview (no auth required).
 */
export async function downloadPreview(
  sound: FreesoundResult,
  outputDir: string,
  quality: 'hq' | 'lq' = 'hq'
): Promise<string | null> {
  const previewUrl = sound.previews[`preview-${quality}-mp3`];
  if (!previewUrl) {
    logError(`No ${quality} preview available for: ${sound.name}`);
    return null;
  }

  const filename = `${sound.id}_${sanitizeFilename(sound.name)}.mp3`;
  const outputPath = join(outputDir, filename);

  // Ensure directory exists
  if (!existsSync(dirname(outputPath))) {
    mkdirSync(dirname(outputPath), { recursive: true });
  }

  // Skip if already exists
  if (existsSync(outputPath)) {
    log('⏭️', `Already exists: ${filename}`);
    return outputPath;
  }

  log('⬇️', `Downloading: ${sound.name} (${sound.duration.toFixed(1)}s)`);

  try {
    const response = await fetch(previewUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const fileStream = createWriteStream(outputPath);
    await finished(
      Readable.fromWeb(response.body as import('stream/web').ReadableStream).pipe(fileStream)
    );

    log('✅', `Downloaded: ${filename}`);
    return outputPath;
  } catch (error) {
    logError(`Failed to download ${sound.name}: ${error}`);
    return null;
  }
}

/**
 * Download a full sound (requires OAuth - for production use).
 * For now, we use previews which are sufficient for most game SFX.
 */
export async function downloadFullSound(
  _client: Freesound,
  sound: FreesoundResult,
  outputDir: string
): Promise<string | null> {
  // OAuth flow required for full downloads
  // For MVP, we'll use previews which are 128kbps MP3 - good enough for games
  // The _client parameter is reserved for future OAuth implementation
  log('⚠️', 'Full downloads require OAuth. Using preview instead.');
  return downloadPreview(sound, outputDir, 'hq');
}

/**
 * Generate a complete audio manifest entry from a Freesound result.
 */
export function soundToManifestEntry(sound: FreesoundResult, category: AudioCategory): object {
  return {
    id: `sfx_${category}_${sound.id}`,
    name: sound.name,
    category: category.split('_')[0], // e.g., 'player', 'env', 'ui'
    status: 'complete',
    source: `audio/sfx/${category}/${sound.id}_${sanitizeFilename(sound.name)}.mp3`,
    freesoundId: sound.id,
    freesoundUser: sound.username,
    license: sound.license,
    duration: sound.duration,
    tags: sound.tags.slice(0, 10),
    variants: [],
    volume: 1.0,
    pitch: { base: 1.0, variance: 0 },
  };
}

/**
 * Sanitize a filename for safe filesystem use.
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50);
}

/**
 * Get attribution text for a sound (required by CC licenses).
 */
export function getAttribution(sound: FreesoundResult): string {
  return `"${sound.name}" by ${sound.username} (freesound.org/${sound.id}) - ${sound.license}`;
}

/**
 * Generate an ATTRIBUTION.md file for all downloaded sounds.
 */
export function generateAttributionFile(sounds: FreesoundResult[]): string {
  const header = `# Audio Attribution

This game uses sounds from Freesound.org under Creative Commons licenses.
Thank you to the following creators for their contributions:

---

`;

  const entries = sounds
    .map(
      (sound) =>
        `- **${sound.name}** by [${sound.username}](https://freesound.org/people/${sound.username}/)
  - Source: https://freesound.org/s/${sound.id}
  - License: ${sound.license}
  - Duration: ${sound.duration.toFixed(1)}s
`
    )
    .join('\n');

  return header + entries;
}
