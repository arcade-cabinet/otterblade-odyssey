import { QueryClientProvider } from '@tanstack/react-query';
import ChapterPlate from '@/components/hud/ChapterPlate';
import DamageFlash from '@/components/hud/DamageFlash';
import GameOverMenu from '@/components/hud/GameOver';
import HUD from '@/components/hud/HUD';
import PostFX from '@/components/hud/PostFX';
import StartMenu from '@/components/hud/StartMenu';
import TouchControls from '@/components/hud/TouchControls';
import Game from '@/game/Game';
import { queryClient } from './lib/queryClient';

function App() {
  return (
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
  );
}

export default App;
