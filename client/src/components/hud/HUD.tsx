import { useStore } from "@/game/store";
import { Heart, Coins } from "lucide-react";

export default function HUD() {
  const { health, score } = useStore();

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none select-none z-10">
      <div className="flex justify-between items-start max-w-4xl mx-auto">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md p-2 rounded-lg border border-slate-700">
            <Heart className="text-red-500 fill-red-500 w-6 h-6" />
            <div className="w-32 h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white">{health}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-900/50 backdrop-blur-md p-2 rounded-lg border border-amber-700">
          <Coins className="text-yellow-400 w-6 h-6" />
          <span className="font-mono font-bold text-xl text-yellow-400">
            {score.toString().padStart(6, "0")}
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-8 text-white/50 text-sm font-mono">
        Controls: WASD to Move, SPACE to Jump
      </div>
    </div>
  );
}
