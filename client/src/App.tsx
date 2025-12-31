import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Game from "@/game/Game";
import HUD from "@/components/hud/HUD";
import StartMenu from "@/components/hud/StartMenu";
import GameOverMenu from "@/components/hud/GameOver";
import TouchControls from "@/components/hud/TouchControls";
import DamageFlash from "@/components/hud/DamageFlash";
import PostFX from "@/components/hud/PostFX";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <Game />
        <PostFX />
        <DamageFlash />
        <HUD />
        <StartMenu />
        <GameOverMenu />
        <TouchControls />
      </div>
    </QueryClientProvider>
  );
}

export default App;
