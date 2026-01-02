/**
 * @fileoverview Chapter plate component that displays chapter transitions
 *
 * TODO: Replace with procedural canvas/CSS rendering
 * This file currently imports static PNGs which have been removed from codebase.
 * See NEXT_SESSION_TODO.md for implementation plan.
 *
 * CRITICAL: This component is BROKEN until procedural generation is implemented.
 */

// REMOVED: Static PNG imports (legacy Replit junk)
// import abbeyApproachPlate from '@assets/generated_images/abbey_approach_chapter_plate.png';
// ... (10 PNG imports removed)

import { useEffect, useState } from 'react';
import { CHAPTERS } from '@/game/constants';
import { useStore } from '@/game/store';

/** Get chapter data for plate rendering */
function getChapterPlateData(chapterId: number) {
  const chapter = CHAPTERS[chapterId];
  if (!chapter) return null;

  return {
    // TODO: Generate procedural background or use CSS gradients
    title: chapter.name,
    subtitle: chapter.quest,
    setting: chapter.setting,
  };
}

/**
 * ChapterPlate displays a cinematic chapter transition overlay
 * Triggers when entering new biomes/chapters
 */
export default function ChapterPlate() {
  const biomeIndex = useStore((s) => s.biomeIndex);
  const gameStarted = useStore((s) => s.gameStarted);
  const [showPlate, setShowPlate] = useState(false);
  const [currentPlate, setCurrentPlate] = useState<ReturnType<typeof getChapterPlateData>>(null);
  const [lastShownBiome, setLastShownBiome] = useState(-1);

  useEffect(() => {
    if (!gameStarted) return;

    // Show chapter plate when entering a new biome
    if (biomeIndex !== lastShownBiome) {
      const plate = getChapterPlateData(biomeIndex);
      if (plate) {
        setCurrentPlate(plate);
        setShowPlate(true);
        setLastShownBiome(biomeIndex);

        const timer = setTimeout(() => {
          setShowPlate(false);
        }, 4000);

        return () => clearTimeout(timer);
      }
    }
  }, [biomeIndex, gameStarted, lastShownBiome]);

  if (!showPlate || !currentPlate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        animation: 'fadeInOut 4s ease-in-out forwards',
      }}
      data-testid="chapter-plate"
    >
      <div className="relative max-w-4xl w-full mx-8">
        {/* Chapter plate - TODO: Replace with procedural canvas rendering */}
        <div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.3)',
            // Temporary: CSS gradient placeholder until procedural generation implemented
            background: 'linear-gradient(135deg, #4a3728 0%, #2d1f16 50%, #1a120d 100%)',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* REMOVED: Static image (legacy Replit junk) */}
          {/* <img src={currentPlate.image} ... /> */}

          {/* Text overlay with storybook-style typography */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            {/* Chapter setting */}
            <p
              className="text-sm text-amber-400/80 uppercase tracking-[0.3em] mb-2"
              style={{
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              }}
            >
              {currentPlate.setting}
            </p>

            {/* Chapter title */}
            <h2
              className="text-4xl md:text-5xl font-serif text-amber-100 mb-3"
              style={{
                textShadow: '0 3px 12px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)',
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              {currentPlate.title}
            </h2>

            {/* Quest/subtitle */}
            <p
              className="text-lg md:text-xl text-amber-200/90 italic"
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              "{currentPlate.subtitle}"
            </p>
          </div>

          {/* Decorative border corners (storybook feel) */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-600/40" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-600/40" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-amber-600/40" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-600/40" />
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.95); }
          10% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
