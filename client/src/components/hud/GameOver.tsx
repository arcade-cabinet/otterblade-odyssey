/**
 * GameOver Menu - Brand-aligned game over screen
 *
 * Follows BRAND.md guidelines:
 * - Warm, woodland-epic aesthetic (NOT neon sci-fi)
 * - Storybook art style
 */

import { useEffect, useState } from 'react';
import { useStore } from '@/game/store';
import { hapticError, hapticMedium } from '@/lib/capacitor';

export default function GameOverMenu() {
  const gameOver = useStore((s) => s.gameOver);
  const score = useStore((s) => s.score);
  const distance = useStore((s) => s.distance);
  const bankedShards = useStore((s) => s.bankedShards);
  const checkpointSeen = useStore((s) => s.checkpointSeen);
  const respawn = useStore((s) => s.respawnFromCheckpoint);
  const startGame = useStore((s) => s.startGame);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => setIsVisible(true), 100); // Short delay for fade-in
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [gameOver]);

  if (!gameOver) return null;

  const canRespawn = checkpointSeen >= 0;

  const handleRespawn = async () => {
    await hapticMedium();
    respawn();
  };

  const handleNewRun = async () => {
    await hapticError(); // Intentional - emphasizes starting fresh
    startGame();
  };

  return (
    <div
      data-testid="game-over-menu"
      className={`fixed inset-0 bg-night-sky/95 flex flex-col items-center justify-center z-20 px-4 sm:px-6 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-labelledby="game-over-title"
      aria-modal="true"
    >
      <div className="flex flex-col items-center max-w-md w-full">
        {/* Title */}
        <h1
          id="game-over-title"
          className="text-4xl sm:text-5xl md:text-6xl text-center text-red-500 mb-2"
          style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 2px 4px rgba(0,0,0,0.8)' }}
        >
          Blade Broken
        </h1>

        {/* Subtitle */}
        <p className="text-amber-100 text-center mb-2">
          The otter warrior has fallen. Will you rise again?
        </p>

        <p className="text-amber-300/80 tracking-[0.2em] mb-6 text-sm uppercase">
          Journey Complete
        </p>

        {/* Stats Card */}
        <div
          className="px-6 py-5 bg-stone-800/60 backdrop-blur-md border border-amber-200/20 rounded-lg w-full mb-8"
          role="region"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="sr-only">
            Player Stats
          </h2>
          <div className="flex justify-between mb-3">
            <span className="text-amber-100">Score</span>
            <span className="text-amber-300 font-semibold">{score.toLocaleString()}</span>
          </div>

          <div className="flex justify-between mb-3">
            <span className="text-amber-100">Distance Traveled</span>
            <span className="text-amber-300 font-semibold">{Math.floor(distance)}m</span>
          </div>

          <div className="flex justify-between">
            <span className="text-amber-100">Shards Preserved</span>
            <span className="text-yellow-300 font-semibold">{bankedShards}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          {canRespawn && (
            <button
              type="button"
              onClick={handleRespawn}
              data-testid="button-respawn"
              className="px-6 py-3 bg-emerald-700/80 border border-emerald-500/90 text-white rounded-md hover:bg-emerald-600 hover:shadow-lg transition-all"
            >
              Return to Shrine
            </button>
          )}

          <button
            type="button"
            onClick={handleNewRun}
            data-testid="button-restart"
            className="px-6 py-3 border border-amber-400 text-amber-300 rounded-md hover:bg-amber-400/20 hover:shadow-lg transition-all"
          >
            Begin Anew
          </button>
        </div>

        {/* Penalty notice */}
        {canRespawn && (
          <p className="mt-6 text-red-500/80 text-xs">Shrine restoration costs 900 score</p>
        )}
      </div>
    </div>
  );
}
