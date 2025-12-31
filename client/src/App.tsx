import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Game from "@/game/Game";
import HUD from "@/components/hud/HUD";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative w-full h-screen overflow-hidden">
        <HUD />
        <Switch>
          <Route path="/" component={Game} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
