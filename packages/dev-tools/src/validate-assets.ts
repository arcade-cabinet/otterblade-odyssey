#!/usr/bin/env tsx
/**
 * @fileoverview Asset validation script for Otterblade Odyssey.
 * Validates that all required assets exist and meet specifications.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools validate:assets
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { log, logError } from './shared/config.js';

/** Asset category with required files */
interface AssetCategory {
  name: string;
  directory: string;
  required: string[];
  optional?: string[];
}

/**
 * Required assets by category.
 * Based on BRAND.md and assets.json specifications.
 */
const REQUIRED_ASSETS: AssetCategory[] = [
  {
    name: 'Chapter Plates',
    directory: 'game/src/assets/images/chapter-plates',
    required: [
      'prologue_village_chapter_plate.png',
      'abbey_approach_chapter_plate.png',
      'gatehouse_bridge_chapter_plate.png',
      'great_hall_oath_chapter_plate.png',
      'library_map_table_chapter_plate.png',
      'dungeon_descent_chapter_plate.png',
      'courtyard_rally_chapter_plate.png',
      'rooftop_wind_chapter_plate.png',
      'final_ascent_chapter_plate.png',
      'epilogue_victory_chapter_plate.png',
    ],
  },
  {
    name: 'Parallax Backgrounds',
    directory: 'game/src/assets/images/parallax',
    required: [
      'village_morning_parallax_background.png',
      'abbey_exterior_parallax_background.png',
      'abbey_interior_parallax_background.png',
      'dungeon_parallax_background.png',
      'courtyard_parallax_background.png',
      'rooftops_parallax_background.png',
      'outer_ruins_parallax_background.png',
      'new_dawn_hall_parallax_background.png',
    ],
  },
  {
    name: 'Sprite Sheets',
    directory: 'attached_assets/generated_images/sprites',
    required: ['player_sprite_sheet.png'],
    optional: [
      'enemy_skirmisher_sprite_sheet.png',
      'enemy_shielded_sprite_sheet.png',
      'enemy_ranged_sprite_sheet.png',
      'enemy_flyer_sprite_sheet.png',
      'enemy_elite_sprite_sheet.png',
    ],
  },
  {
    name: 'Cinematics',
    directory: 'game/src/assets/videos',
    required: ["intro_cinematic_otter's_journey.mp4", 'outro_victory_sunrise_scene.mp4'],
  },
];

/** Validation result for a single asset */
interface AssetResult {
  file: string;
  exists: boolean;
  size?: number;
  error?: string;
}

/** Validation result for a category */
interface CategoryResult {
  name: string;
  passed: number;
  failed: number;
  optional: number;
  assets: AssetResult[];
}

/**
 * Validates assets in a single category.
 * @param category - Asset category to validate
 * @param basePath - Base path for resolution
 * @returns Validation results
 */
function validateCategory(category: AssetCategory, basePath: string): CategoryResult {
  const results: AssetResult[] = [];
  let passed = 0;
  let failed = 0;
  let optionalCount = 0;

  const dirPath = path.resolve(basePath, category.directory);

  // Check required assets
  for (const file of category.required) {
    const filePath = path.join(dirPath, file);
    const exists = fs.existsSync(filePath);

    if (exists) {
      const stats = fs.statSync(filePath);
      results.push({ file, exists: true, size: stats.size });
      passed++;
    } else {
      results.push({ file, exists: false, error: 'File not found' });
      failed++;
    }
  }

  // Check optional assets
  if (category.optional) {
    for (const file of category.optional) {
      const filePath = path.join(dirPath, file);
      const exists = fs.existsSync(filePath);

      if (exists) {
        const stats = fs.statSync(filePath);
        results.push({ file, exists: true, size: stats.size });
        optionalCount++;
      }
    }
  }

  return { name: category.name, passed, failed, optional: optionalCount, assets: results };
}

/**
 * Main entry point for asset validation.
 */
async function main(): Promise<void> {
  log('🔍', 'Otterblade Odyssey - Asset Validator');
  log('', '');

  const basePath = path.resolve(process.cwd(), '..', '..');
  const results: CategoryResult[] = [];

  // Validate each category
  for (const category of REQUIRED_ASSETS) {
    const result = validateCategory(category, basePath);
    results.push(result);
  }

  // Display results
  let totalPassed = 0;
  let totalFailed = 0;
  let totalOptional = 0;

  for (const result of results) {
    const status = result.failed === 0 ? '✅' : '❌';
    log(status, `${result.name}: ${result.passed}/${result.passed + result.failed} required`);

    if (result.optional > 0) {
      log('  ', `+ ${result.optional} optional assets found`);
    }

    // Show failed assets only (use --verbose for all)
    for (const asset of result.assets) {
      if (!asset.exists) {
        log('  ❌', `Missing: ${asset.file}`);
      }
    }

    totalPassed += result.passed;
    totalFailed += result.failed;
    totalOptional += result.optional;
    log('', '');
  }

  // Summary
  log('═'.repeat(50), '');
  log('📊', 'SUMMARY');
  log('  ✅', `Passed: ${totalPassed}`);
  log('  ❌', `Failed: ${totalFailed}`);
  log('  📦', `Optional: ${totalOptional}`);
  log('', '');

  if (totalFailed > 0) {
    logError(`${totalFailed} required asset(s) missing!`);
    log('💡', 'Run generate:sprites to create missing sprite sheets');
    process.exit(1);
  } else {
    log('✅', 'All required assets validated successfully!');
  }
}

// Run the script
main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
