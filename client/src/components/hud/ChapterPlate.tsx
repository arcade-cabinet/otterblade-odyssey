import { useState, useEffect } from "react";
import { useStore } from "@/game/store";

import abbeyApproach from "@assets/generated_images/abbey_approach_chapter_plate.png";
import dungeonDescent from "@assets/generated_images/dungeon_descent_chapter_plate.png";

const CHAPTER_PLATES: Record<number, { image: string; title: string; subtitle: string }> = {
  0: {
    image: abbeyApproach,
    title: "The Approach",
    subtitle: "Dawn breaks over Redwall Abbey...",
  },
  2: {
    image: dungeonDescent,
    title: "The Descent",
    subtitle: "Into the depths below...",
  },
};

export default function ChapterPlate() {
  const biomeIndex = useStore((s) => s.biomeIndex);
  const gameStarted = useStore((s) => s.gameStarted);
  const [showPlate, setShowPlate] = useState(false);
  const [currentPlate, setCurrentPlate] = useState<typeof CHAPTER_PLATES[0] | null>(null);
  const [lastShownBiome, setLastShownBiome] = useState(-1);

  useEffect(() => {
    if (!gameStarted) return;
    
    const plate = CHAPTER_PLATES[biomeIndex];
    if (plate && biomeIndex !== lastShownBiome) {
      setCurrentPlate(plate);
      setShowPlate(true);
      setLastShownBiome(biomeIndex);

      const timer = setTimeout(() => {
        setShowPlate(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [biomeIndex, gameStarted, lastShownBiome]);

  if (!showPlate || !currentPlate) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        animation: "fadeInOut 3s ease-in-out forwards",
      }}
      data-testid="chapter-plate"
    >
      <div className="relative max-w-4xl w-full mx-8">
        {/* Chapter plate image */}
        <div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{
            boxShadow: "0 0 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.3)",
          }}
        >
          <img
            src={currentPlate.image}
            alt={currentPlate.title}
            className="w-full h-auto"
            style={{
              filter: "sepia(0.15) saturate(1.1)",
            }}
          />
          
          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
            <h2
              className="text-4xl font-serif text-amber-200 mb-2"
              style={{
                textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                fontFamily: "Georgia, serif",
              }}
            >
              {currentPlate.title}
            </h2>
            <p
              className="text-lg text-amber-100/80 italic"
              style={{
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                fontFamily: "Georgia, serif",
              }}
            >
              {currentPlate.subtitle}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.95); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
