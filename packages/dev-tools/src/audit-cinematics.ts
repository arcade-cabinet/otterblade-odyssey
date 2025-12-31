#!/usr/bin/env tsx
/**
 * @fileoverview Audit all existing cinematics for brand compliance.
 * Identifies videos with humans, wrong visual style, or other violations.
 *
 * @example
 * ```bash
 * pnpm --filter @otterblade/dev-tools audit:cinematics
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  createGoogleClient,
  GOOGLE_MODELS,
  log,
  logError,
  VIDEO_OUTPUT_DIR,
} from './shared/config.js';

/** Quick analysis prompt for batch processing */
const QUICK_AUDIT_PROMPT = `
Analyze this game cinematic video quickly for CRITICAL brand violations.

This is for "Otterblade Odyssey" - a woodland-epic game where ALL characters 
MUST be anthropomorphic woodland animals (otters, mice, badgers, etc).

CHECK FOR THESE VIOLATIONS (respond YES/NO for each):
1. HUMANS_PRESENT: Are there ANY human characters visible?
2. HUMAN_KNIGHT: Is there a human knight or armored human?
3. WRONG_PROTAGONIST: Is the main character NOT an otter?
4. SCI_FI_ELEMENTS: Any neon, lasers, or futuristic elements?
5. HORROR_ELEMENTS: Any demons, gore, or horror imagery?

Then provide:
- VIOLATION_SCORE: 0-10 (0=perfect, 10=completely wrong)
- BRIEF_DESCRIPTION: One sentence describing what you see
- NEEDS_REGENERATION: YES/NO

Respond in this exact format:
HUMANS_PRESENT: YES/NO
HUMAN_KNIGHT: YES/NO
WRONG_PROTAGONIST: YES/NO
SCI_FI_ELEMENTS: YES/NO
HORROR_ELEMENTS: YES/NO
VIOLATION_SCORE: X/10
BRIEF_DESCRIPTION: ...
NEEDS_REGENERATION: YES/NO
`;

interface AuditResult {
  file: string;
  humansPresent: boolean;
  humanKnight: boolean;
  wrongProtagonist: boolean;
  sciFiElements: boolean;
  horrorElements: boolean;
  violationScore: number;
  description: string;
  needsRegeneration: boolean;
  error?: string;
}

/**
 * Parses the audit response into structured data.
 */
function parseAuditResponse(response: string): Omit<AuditResult, 'file'> {
  const lines = response.split('\n');
  const getValue = (key: string): string => {
    const line = lines.find((l) => l.startsWith(key));
    return line?.split(':')[1]?.trim() || '';
  };

  const isYes = (value: string): boolean => value.toUpperCase() === 'YES';

  const scoreMatch = getValue('VIOLATION_SCORE').match(/(\d+)/);

  return {
    humansPresent: isYes(getValue('HUMANS_PRESENT')),
    humanKnight: isYes(getValue('HUMAN_KNIGHT')),
    wrongProtagonist: isYes(getValue('WRONG_PROTAGONIST')),
    sciFiElements: isYes(getValue('SCI_FI_ELEMENTS')),
    horrorElements: isYes(getValue('HORROR_ELEMENTS')),
    violationScore: scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 0,
    description: getValue('BRIEF_DESCRIPTION'),
    needsRegeneration: isYes(getValue('NEEDS_REGENERATION')),
  };
}

/**
 * Audits a single video file.
 */
async function auditVideo(
  client: ReturnType<typeof createGoogleClient>,
  videoPath: string
): Promise<AuditResult> {
  const filename = path.basename(videoPath);

  try {
    const buffer = fs.readFileSync(videoPath);
    const videoBase64 = buffer.toString('base64');

    const response = await client.models.generateContent({
      model: GOOGLE_MODELS.ANALYSIS,
      contents: [
        {
          role: 'user',
          parts: [
            { text: QUICK_AUDIT_PROMPT },
            {
              inlineData: {
                mimeType: 'video/mp4',
                data: videoBase64,
              },
            },
          ],
        },
      ],
    });

    const analysis = response.text || '';
    const result = parseAuditResponse(analysis);

    return { file: filename, ...result };
  } catch (error) {
    return {
      file: filename,
      humansPresent: false,
      humanKnight: false,
      wrongProtagonist: false,
      sciFiElements: false,
      horrorElements: false,
      violationScore: -1,
      description: '',
      needsRegeneration: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  log('🔍', 'Otterblade Odyssey - Cinematic Audit');
  log('📋', 'Checking all videos for brand compliance');
  log('', '');

  const client = createGoogleClient();
  log('✅', 'Google GenAI client initialized');

  const videoDir = path.resolve(process.cwd(), '..', '..', VIDEO_OUTPUT_DIR);

  if (!fs.existsSync(videoDir)) {
    logError(`Video directory not found: ${videoDir}`, true);
    return;
  }

  const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.mp4'));

  log('📁', `Found ${videoFiles.length} videos to audit`);
  log('', '');

  const results: AuditResult[] = [];
  const needsRegeneration: string[] = [];

  for (const file of videoFiles) {
    const videoPath = path.join(videoDir, file);
    log('🎬', `Auditing: ${file}`);

    const result = await auditVideo(client, videoPath);
    results.push(result);

    if (result.error) {
      log('  ❌', `Error: ${result.error}`);
    } else {
      const status = result.needsRegeneration ? '⚠️' : '✅';
      log(`  ${status}`, `Score: ${result.violationScore}/10`);
      log('  ', result.description);

      if (result.humansPresent) log('  🚨', 'HUMANS DETECTED');
      if (result.humanKnight) log('  🚨', 'HUMAN KNIGHT DETECTED');
      if (result.wrongProtagonist) log('  ⚠️', 'Wrong protagonist');
      if (result.sciFiElements) log('  ⚠️', 'Sci-fi elements');
      if (result.horrorElements) log('  ⚠️', 'Horror elements');

      if (result.needsRegeneration) {
        needsRegeneration.push(file);
      }
    }
    log('', '');

    // Rate limiting - wait between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Summary
  log('═'.repeat(60), '');
  log('📊', 'AUDIT SUMMARY');
  log('', '');
  log('  ', `Total videos: ${results.length}`);
  log('  ✅', `Compliant: ${results.length - needsRegeneration.length}`);
  log('  ⚠️', `Need regeneration: ${needsRegeneration.length}`);
  log('', '');

  if (needsRegeneration.length > 0) {
    log('📝', 'Videos requiring regeneration:');
    for (const file of needsRegeneration) {
      log('  •', file);
    }
  }

  // Save report
  const reportPath = path.join(videoDir, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log('💾', `Report saved: ${reportPath}`);
}

main().catch((error) => {
  logError(`Unhandled error: ${error}`, true);
});
