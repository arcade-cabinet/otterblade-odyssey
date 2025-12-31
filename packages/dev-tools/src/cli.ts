#!/usr/bin/env tsx
/**
 * @fileoverview Main CLI for idempotent asset generation.
 * Reads JSON manifests and generates only missing or outdated assets.
 *
 * @example
 * ```bash
 * # Generate all missing assets
 * pnpm --filter @otterblade/dev-tools cli
 *
 * # Generate specific category
 * pnpm --filter @otterblade/dev-tools cli -- --category sprites
 *
 * # Dry run (show what would be generated)
 * pnpm --filter @otterblade/dev-tools cli -- --dry-run
 *
 * # Force regeneration of specific asset
 * pnpm --filter @otterblade/dev-tools cli -- --force --id player_sprite_sheet
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { log, logError } from './shared/config.js';
import { generateAsset, type AssetManifest } from './manifest-generator.js';

/** CLI arguments schema */
const ArgsSchema = z.object({
  category: z.string().optional(),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
  id: z.string().optional(),
});

type Args = z.infer<typeof ArgsSchema>;

/**
 * Parses command line arguments.
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { dryRun: false, force: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--category' && args[i + 1]) {
      result.category = args[++i];
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--id' && args[i + 1]) {
      result.id = args[++i];
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

/**
 * Prints CLI help.
 */
function printHelp(): void {
  console.log(`
Otterblade Odyssey Asset Generator CLI

Usage: pnpm cli [options]

Options:
  --category <name>  Generate only assets from specific category
                     (sprites, enemies, cinematics, scenes)
  --dry-run          Show what would be generated without generating
  --force            Regenerate even if asset exists
  --id <asset-id>    Generate only specific asset by ID
  --help             Show this help message

Examples:
  pnpm cli                           # Generate all missing assets
  pnpm cli --category sprites        # Generate missing sprites only
  pnpm cli --dry-run                 # Preview what would be generated
  pnpm cli --force --id intro_cinematic  # Force regenerate intro
`);
}

/**
 * Loads all manifest files from the manifests directory.
 */
function loadManifests(basePath: string): AssetManifest[] {
  const manifestDir = path.join(basePath, 'client/src/data/manifests');
  const manifests: AssetManifest[] = [];

  if (!fs.existsSync(manifestDir)) {
    logError(`Manifest directory not found: ${manifestDir}`, true);
    return [];
  }

  const files = fs.readdirSync(manifestDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(manifestDir, file), 'utf-8');
      const manifest = JSON.parse(content) as AssetManifest;
      manifests.push(manifest);
      log('📄', `Loaded manifest: ${file} (${manifest.assets.length} assets)`);
    } catch (error) {
      logError(`Failed to parse ${file}: ${error}`);
    }
  }

  return manifests;
}

/**
 * Checks if an asset file exists.
 */
function assetExists(basePath: string, outputDir: string, filename: string): boolean {
  const fullPath = path.join(basePath, outputDir, filename);
  return fs.existsSync(fullPath);
}

/**
 * Determines if an asset needs generation.
 */
function needsGeneration(
  basePath: string,
  manifest: AssetManifest,
  asset: AssetManifest['assets'][0],
  force: boolean
): boolean {
  if (force) return true;
  if (asset.status === 'complete') return false;
  if (asset.status === 'needs_regeneration') return true;
  if (asset.status === 'pending') {
    return !assetExists(basePath, manifest.outputDir, asset.filename);
  }
  return false;
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  log('🎮', 'Otterblade Odyssey Asset Generator');
  log('📋', 'Idempotent manifest-driven generation');
  log('', '');

  const args = parseArgs();
  const basePath = path.resolve(process.cwd(), '..', '..');

  // Load all manifests
  const manifests = loadManifests(basePath);
  if (manifests.length === 0) {
    logError('No manifests found', true);
    return;
  }

  // Filter by category if specified
  const filteredManifests = args.category
    ? manifests.filter((m) => m.category === args.category)
    : manifests;

  if (filteredManifests.length === 0) {
    logError(`No manifests found for category: ${args.category}`, true);
    return;
  }

  // Collect assets to generate
  const toGenerate: Array<{
    manifest: AssetManifest;
    asset: AssetManifest['assets'][0];
  }> = [];

  for (const manifest of filteredManifests) {
    for (const asset of manifest.assets) {
      // Filter by ID if specified
      if (args.id && asset.id !== args.id) continue;

      if (needsGeneration(basePath, manifest, asset, args.force)) {
        toGenerate.push({ manifest, asset });
      }
    }
  }

  log('', '');
  log('📊', `Found ${toGenerate.length} asset(s) to generate`);

  if (toGenerate.length === 0) {
    log('✅', 'All assets are up to date!');
    return;
  }

  // List assets to generate
  for (const { manifest, asset } of toGenerate) {
    const status = asset.status === 'needs_regeneration' ? '🔄' : '🆕';
    log(status, `${asset.name} (${manifest.provider}/${manifest.model})`);
    if (asset.reason) {
      log('  ', `Reason: ${asset.reason}`);
    }
  }

  if (args.dryRun) {
    log('', '');
    log('🔍', 'Dry run complete. Use without --dry-run to generate.');
    return;
  }

  log('', '');
  log('🚀', 'Starting generation...');
  log('', '');

  // Track results
  const results = {
    success: 0,
    failed: 0,
    files: [] as string[],
  };

  // Generate each asset
  for (const { manifest, asset } of toGenerate) {
    try {
      log('⏳', `Generating: ${asset.name}`);
      const outputPath = await generateAsset(basePath, manifest, asset);

      if (outputPath) {
        results.success++;
        results.files.push(outputPath);
        log('✅', `Generated: ${outputPath}`);
      } else {
        results.failed++;
        logError(`Failed to generate: ${asset.name}`);
      }
    } catch (error) {
      results.failed++;
      logError(`Error generating ${asset.name}: ${error}`);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary
  log('', '');
  log('═'.repeat(50), '');
  log('📊', 'GENERATION SUMMARY');
  log('  ✅', `Success: ${results.success}`);
  log('  ❌', `Failed: ${results.failed}`);

  if (results.files.length > 0) {
    log('', '');
    log('📁', 'Generated files:');
    for (const file of results.files) {
      log('  •', file);
    }
  }

  // Exit with error if any failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
