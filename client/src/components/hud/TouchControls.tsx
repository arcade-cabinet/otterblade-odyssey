/**
 * @fileoverview Touch controls for mobile gameplay
 * Provides on-screen buttons for movement and actions
 */

import { useCallback, useEffect } from 'react';
import { useStore } from '@/game/store';

export default function TouchControls() {
  const setControl = useStore((s) => s.setControl);
  const gameStarted = useStore((s) => s.gameStarted);

  const handleTouchStart = useCallback(
    (control: 'left' | 'right' | 'jump' | 'attack' | 'slink') => (e: React.TouchEvent) => {
      e.preventDefault();
      setControl(control, true);
    },
    [setControl]
  );

  const handleTouchEnd = useCallback(
    (control: 'left' | 'right' | 'jump' | 'attack' | 'slink') => (e: React.TouchEvent) => {
      e.preventDefault();
      setControl(control, false);
    },
    [setControl]
  );

  const handleTouchCancel = useCallback(
    (control: 'left' | 'right' | 'jump' | 'attack' | 'slink') => (e: React.TouchEvent) => {
      e.preventDefault();
      setControl(control, false);
    },
    [setControl]
  );

  useEffect(() => {
    const preventGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches[0]?.clientY > 0) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-touch-control]')) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', preventGestures, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventGestures);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  if (!gameStarted || !('ontouchstart' in window)) return null;

  const buttonBase =
    'rounded-full backdrop-blur flex items-center justify-center font-bold transition-all duration-75 active:scale-90 shadow-lg select-none';
  const directionButton = `${buttonBase} w-16 h-16 bg-stone-900/60 border-2 border-amber-700/50 text-amber-200/90 active:bg-amber-900/40 active:border-amber-500`;
  const actionButton = `${buttonBase} w-[4.5rem] h-[4.5rem] text-sm`;

  return (
    <div
      className="absolute bottom-0 w-full h-56 flex justify-between px-6 pb-6 pt-4 pointer-events-auto select-none"
      style={{
        touchAction: 'none',
        background:
          'linear-gradient(to top, rgba(20,15,10,0.95) 0%, rgba(20,15,10,0.7) 60%, transparent 100%)',
      }}
      data-testid="touch-controls"
      data-touch-control="container"
    >
      {/* Left side: Direction buttons */}
      <div className="flex gap-4 items-end" data-touch-control="left-pad">
        <button
          type="button"
          data-testid="button-left"
          data-touch-control="left"
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
          onTouchCancel={handleTouchCancel('left')}
          className={directionButton}
          style={{ touchAction: 'none' }}
          aria-label="Move left"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          data-testid="button-right"
          data-touch-control="right"
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
          onTouchCancel={handleTouchCancel('right')}
          className={directionButton}
          style={{ touchAction: 'none' }}
          aria-label="Move right"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Right side: Diamond layout (Jump top, Attack right, Crouch bottom, Special left) */}
      <div className="relative w-44 h-44" data-touch-control="right-pad">
        {/* Jump - Top */}
        <button
          type="button"
          data-testid="button-jump"
          data-touch-control="jump"
          onTouchStart={handleTouchStart('jump')}
          onTouchEnd={handleTouchEnd('jump')}
          onTouchCancel={handleTouchCancel('jump')}
          className={`${actionButton} absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-900/60 border-2 border-emerald-600/70 text-emerald-300 active:bg-emerald-700/50 active:border-emerald-400`}
          style={{ touchAction: 'none' }}
        >
          JUMP
        </button>

        {/* Attack - Right */}
        <button
          type="button"
          data-testid="button-attack"
          data-touch-control="attack"
          onTouchStart={handleTouchStart('attack')}
          onTouchEnd={handleTouchEnd('attack')}
          onTouchCancel={handleTouchCancel('attack')}
          className={`${actionButton} absolute right-0 top-1/2 -translate-y-1/2 bg-amber-900/60 border-2 border-amber-600/70 text-amber-300 active:bg-amber-700/50 active:border-amber-400`}
          style={{ touchAction: 'none' }}
        >
          ATK
        </button>

        {/* Slink (go low on all fours) - Bottom */}
        <button
          type="button"
          data-testid="button-slink"
          data-touch-control="slink"
          onTouchStart={handleTouchStart('slink')}
          onTouchEnd={handleTouchEnd('slink')}
          onTouchCancel={handleTouchCancel('slink')}
          className={`${actionButton} absolute bottom-0 left-1/2 -translate-x-1/2 bg-stone-800/60 border-2 border-stone-500/70 text-stone-300 active:bg-stone-600/50 active:border-stone-400`}
          style={{ touchAction: 'none' }}
        >
          LOW
        </button>

        {/* Special/Interact - Left */}
        <button
          type="button"
          data-testid="button-special"
          data-touch-control="special"
          className={`${actionButton} absolute left-0 top-1/2 -translate-y-1/2 bg-sky-900/60 border-2 border-sky-600/70 text-sky-300 active:bg-sky-700/50 active:border-sky-400`}
          style={{ touchAction: 'none' }}
        >
          ACT
        </button>
      </div>
    </div>
  );
}
