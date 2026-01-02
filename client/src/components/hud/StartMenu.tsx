/**
 * StartMenu - Brand-aligned main menu for Otterblade Odyssey
 *
 * Follows BRAND.md guidelines:
 * - Warm, woodland-epic aesthetic (NOT neon sci-fi)
 * - Storybook art style with lantern glow
 * - Practical, grounded materials
 * - FULLSCREEN immersion on game start
 */

import { useEffect, useState } from 'react';
// Import the prologue chapter plate as splash image
import splashImage from '@/assets/images/chapter-plates/prologue_village_chapter_plate.png';
import { useStore } from '@/game/store';
import { hapticMedium } from '@/lib/capacitor';
import { enterImmersiveMode, isFullscreenSupported } from '@/lib/fullscreen';

export default function StartMenu() {
  const gameStarted = useStore((s) => s.gameStarted);
  const bestScore = useStore((s) => s.bestScore);
  const bestDistance = useStore((s) => s.bestDistance);
  const startGame = useStore((s) => s.startGame);

  const [showContent, setShowContent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Fade in content after a short delay
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (gameStarted) return null;

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);

    await hapticMedium();

    // Enter fullscreen immersive mode - MUST be triggered by user interaction
    if (isFullscreenSupported()) {
      await enterImmersiveMode();
    }

    // Small delay for fullscreen transition to feel smooth
    setTimeout(() => {
      startGame();
    }, 100);
  };

  return (
    <div
      data-testid="start-menu"
      className="absolute inset-0 flex flex-col items-center justify-end z-20 overflow-hidden"
      role="dialog"
      aria-labelledby="start-menu-title"
      aria-describedby="start-menu-description"
    >
      {/* Background Image - Prologue Chapter Plate */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${splashImage})`, filter: 'brightness(0.7)' }}
        aria-hidden="true"
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(10, 8, 12, 0.6) 100%), linear-gradient(to bottom, transparent 40%, rgba(10, 8, 12, 0.9) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div
        className={`relative z-10 flex flex-col items-center w-full max-w-md px-4 sm:px-8 pb-8 sm:pb-12 transition-opacity duration-1000 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Title */}
        <h1
          id="start-menu-title"
          className="text-4xl sm:text-5xl md:text-6xl text-center text-amber-100 mb-2 leading-tight"
          style={{
            textShadow:
              '0 0 30px rgba(252, 211, 77, 0.4), 0 2px 4px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.4)',
          }}
        >
          Otterblade Odyssey
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-amber-200/90 tracking-[0.25em] mb-6 opacity-90 uppercase">
          Zephyros Rising
        </p>

        {/* Description */}
        <p
          id="start-menu-description"
          className="text-base sm:text-lg text-amber-50/95 text-center max-w-lg mb-8 leading-relaxed"
        >
          A woodland-epic adventure awaits. Play as Finn, a brave otter warrior wielding the
          legendary Otterblade, defending Willowmere Hearthhold against the storm hawk Zephyros.
        </p>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStartGame}
          data-testid="button-start-game"
          className="px-6 sm:px-8 py-3 text-lg sm:text-xl border-2 border-amber-400 text-amber-100 rounded-md bg-stone-900/70 backdrop-blur-md transition-all duration-300 ease-in-out hover:border-amber-200 hover:bg-amber-400/20 hover:shadow-lg hover:scale-105 active:scale-100"
        >
          Begin Your Odyssey
        </button>

        {/* Best Score Display */}
        {bestScore > 0 && (
          <div
            className={`mt-8 px-6 py-4 bg-stone-800/70 backdrop-blur-md border border-amber-200/20 rounded-lg w-full max-w-xs transition-opacity duration-500 ${
              showContent ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="block text-center text-amber-200/70 mb-3 text-xs tracking-[0.15em]">
              Previous Journey
            </p>

            <div className="flex justify-between mb-2">
              <span className="text-amber-100">Best Score</span>
              <span className="text-amber-300 font-semibold">{bestScore.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-amber-100">Furthest Distance</span>
              <span className="text-amber-300 font-semibold">{Math.floor(bestDistance)}m</span>
            </div>
          </div>
        )}

        {/* Version tag */}
        <p className="mt-6 text-amber-200/50 text-xs opacity-70">Alpha Build · v1.0.0</p>
      </div>
    </div>
  );
}
