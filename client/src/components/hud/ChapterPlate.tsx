/**
 * @fileoverview Chapter plate component that displays chapter transitions
 * Uses the centralized chapters data and brand-aligned naming
 */

import abbeyApproachPlate from '@assets/generated_images/abbey_approach_chapter_plate.png';
import courtyardPlate from '@assets/generated_images/courtyard_rally_chapter_plate.png';
import dungeonPlate from '@assets/generated_images/dungeon_descent_chapter_plate.png';
import epiloguePlate from '@assets/generated_images/epilogue_victory_chapter_plate.png';
import finalAscentPlate from '@assets/generated_images/final_ascent_chapter_plate.png';
import gatehousePlate from '@assets/generated_images/gatehouse_bridge_chapter_plate.png';
import greatHallPlate from '@assets/generated_images/great_hall_oath_chapter_plate.png';
import libraryPlate from '@assets/generated_images/library_map_table_chapter_plate.png';
// Import chapter plate images
import prologuePlate from '@assets/generated_images/prologue_village_chapter_plate.png';
import rooftopPlate from '@assets/generated_images/rooftop_wind_chapter_plate.png';
import { useEffect, useState } from 'react';
import { CHAPTERS } from '@/game/constants';
import { useStore } from '@/game/store';

/** Map chapter IDs to their imported images */
const CHAPTER_PLATE_IMAGES: Record<number, string> = {
  0: prologuePlate,
  1: abbeyApproachPlate,
  2: gatehousePlate,
  3: greatHallPlate,
  4: libraryPlate,
  5: dungeonPlate,
  6: courtyardPlate,
  7: rooftopPlate,
  8: finalAscentPlate,
  9: epiloguePlate,
};

/** Get chapter data with plate image */
function getChapterPlateData(chapterId: number) {
  const chapter = CHAPTERS[chapterId];
  if (!chapter) return null;

  return {
    image: CHAPTER_PLATE_IMAGES[chapterId] || prologuePlate,
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
        {/* Chapter plate image */}
        <div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src={currentPlate.image}
            alt={currentPlate.title}
            className="w-full h-auto"
            style={{
              filter: 'sepia(0.1) saturate(1.05)',
            }}
          />

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
