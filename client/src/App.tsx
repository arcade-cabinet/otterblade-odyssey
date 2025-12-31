import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import ChapterPlate from '@/components/hud/ChapterPlate';
import DamageFlash from '@/components/hud/DamageFlash';
import GameOverMenu from '@/components/hud/GameOver';
import HUD from '@/components/hud/HUD';
import PostFX from '@/components/hud/PostFX';
import StartMenu from '@/components/hud/StartMenu';
import TouchControls from '@/components/hud/TouchControls';
import Game from '@/game/Game';
import { initializeGameMode, onOrientationChange } from './lib/capacitor';
import { queryClient } from './lib/queryClient';
import otterbladeTheme from './lib/theme';

function App() {
  // Initialize Capacitor and handle orientation changes
  useEffect(() => {
    // Initialize game mode (hide splash, status bar, etc.)
    initializeGameMode();

    // Listen for orientation changes (important for foldables)
    const unsubscribe = onOrientationChange((orientation) => {
      console.log('Orientation changed:', orientation);
      // Trigger resize event to update canvas
      window.dispatchEvent(new Event('resize'));
    });

    return unsubscribe;
  }, []);

  return (
    <ThemeProvider theme={otterbladeTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
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
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
