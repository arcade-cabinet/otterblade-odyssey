import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import ChapterPlate from '@/components/hud/ChapterPlate';
import CinematicPlayer, { type CinematicType } from '@/components/hud/CinematicPlayer';
import DamageFlash from '@/components/hud/DamageFlash';
import GameOverMenu from '@/components/hud/GameOver';
import HUD from '@/components/hud/HUD';
import PostFX from '@/components/hud/PostFX';
import StartMenu from '@/components/hud/StartMenu';
import TouchControls from '@/components/hud/TouchControls';
import Game from '@/game/Game';
import { useStore } from '@/game/store';
import {
  initializeGameMode,
  loadGameData,
  onOrientationChange,
  saveGameData,
} from './lib/capacitor';
import { queryClient } from './lib/queryClient';
import otterbladeTheme from './lib/theme';

// Lazy load Asset Review page
const AssetReview = lazy(() => import('./pages/AssetReview'));

// Asset review is available until official launch
// Set VITE_DISABLE_ASSET_REVIEW=true to hide it in production
const isAssetReviewEnabled = import.meta.env.VITE_DISABLE_ASSET_REVIEW !== 'true';

/** Key for storing intro watched state */
const INTRO_WATCHED_KEY = 'otterblade_intro_watched';

function AppContent() {
  const [introWatched, setIntroWatched] = useState<boolean | null>(null);
  const [currentCinematic, setCurrentCinematic] = useState<CinematicType>(null);

  // Subscribe to game completion for outro cinematic
  const biomeIndex = useStore((s) => s.biomeIndex);
  const gameStarted = useStore((s) => s.gameStarted);

  // Load intro watched state on mount
  useEffect(() => {
    loadGameData(INTRO_WATCHED_KEY, false).then((watched) => {
      setIntroWatched(watched);
      // Show intro if not watched yet
      if (!watched) {
        setCurrentCinematic('intro');
      }
    });
  }, []);

  // Check for game completion (chapter 9 = epilogue)
  useEffect(() => {
    if (gameStarted && biomeIndex === 9) {
      // Show outro cinematic when reaching epilogue
      setCurrentCinematic('outro');
    }
  }, [biomeIndex, gameStarted]);

  // Handle cinematic completion
  const handleCinematicComplete = useCallback(async () => {
    if (currentCinematic === 'intro') {
      // Mark intro as watched
      await saveGameData(INTRO_WATCHED_KEY, true);
      setIntroWatched(true);
    }
    setCurrentCinematic(null);
  }, [currentCinematic]);

  // Initialize Capacitor and handle orientation changes
  useEffect(() => {
    // Initialize game mode (hide splash, status bar, etc.)
    initializeGameMode();

    // Listen for orientation changes (important for foldables)
    const unsubscribe = onOrientationChange(() => {
      // Trigger resize event to update canvas when orientation changes
      window.dispatchEvent(new Event('resize'));
    });

    return unsubscribe;
  }, []);

  // Wait for intro state to load
  if (introWatched === null) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-amber-200/60 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ touchAction: 'none' }}
    >
      <Game />
      <PostFX />
      <DamageFlash />
      <HUD />
      <ChapterPlate />
      <StartMenu />
      <GameOverMenu />
      <TouchControls />

      {/* Cinematic Player - renders on top of everything */}
      {currentCinematic && (
        <CinematicPlayer
          type={currentCinematic}
          onComplete={handleCinematicComplete}
          skippable={true}
        />
      )}
    </div>
  );
}

function App() {
  // Check for /assets route (available until official launch)
  const isAssetReviewRoute =
    isAssetReviewEnabled &&
    (window.location.pathname === '/assets' || window.location.pathname.endsWith('/assets'));

  return (
    <ThemeProvider theme={otterbladeTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {isAssetReviewRoute ? (
          <Suspense
            fallback={
              <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-amber-200/60 animate-pulse">Loading Asset Review...</div>
              </div>
            }
          >
            <AssetReview />
          </Suspense>
        ) : (
          <AppContent />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
