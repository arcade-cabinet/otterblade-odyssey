/**
 * Interaction Factory
 * Builds interactions and collectibles from chapter manifests.
 */

import type * as Matter from 'matter-js';
import type { ChapterManifest } from '../data/manifest-schemas';
import { getMatterModules } from '../physics/matter-wrapper';

/**
 * Build interactions and collectibles for a chapter.
 */
export function buildInteractionsAndCollectibles(
  manifest: ChapterManifest,
  engine: Matter.Engine
): {
  interactions: Array<{ body: Matter.Body; def: ChapterManifest['interactions'][number]; state: string | null }>;
  collectibles: Array<{ body: Matter.Body; def: ChapterManifest['collectibles'][number]; collected: boolean }>;
} {
  const { World, Bodies } = getMatterModules();
  const interactions: Array<{ body: Matter.Body; def: ChapterManifest['interactions'][number]; state: string | null }> = [];
  const collectibles: Array<{ body: Matter.Body; def: ChapterManifest['collectibles'][number]; collected: boolean }> = [];

  if (manifest.interactions) {
    for (const interactionDef of manifest.interactions) {
      const interactionBody = Bodies.rectangle(
        interactionDef.position.x,
        interactionDef.position.y,
        interactionDef.activateRadius ? interactionDef.activateRadius * 2 : 60,
        interactionDef.activateRadius ? interactionDef.activateRadius * 2 : 60,
        {
          isStatic: true,
          label: `interaction_${interactionDef.type}`,
          isSensor: true,
        }
      );
      interactions.push({
        body: interactionBody,
        def: interactionDef,
        state: interactionDef.initialState ?? null,
      });
      World.add(engine.world, interactionBody);
    }
  }

  if (manifest.collectibles) {
    for (const collectibleDef of manifest.collectibles) {
      const collectibleBody = Bodies.rectangle(
        collectibleDef.position.x,
        collectibleDef.position.y,
        20,
        20,
        {
          isStatic: true,
          label: 'collectible',
          isSensor: true,
        }
      );
      collectibles.push({
        body: collectibleBody,
        def: collectibleDef,
        collected: false,
      });
      World.add(engine.world, collectibleBody);
    }
  }

  return { interactions, collectibles };
}
