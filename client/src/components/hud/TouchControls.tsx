import { useStore } from "@/game/store";
import { ArrowLeft, ArrowRight, ArrowDown } from "lucide-react";

export default function TouchControls() {
  const setControl = useStore((s) => s.setControl);
  const gameStarted = useStore((s) => s.gameStarted);

  if (!gameStarted || !("ontouchstart" in window)) return null;

  return (
    <div className="absolute bottom-0 w-full h-52 flex justify-between px-7 py-4 pointer-events-auto bg-gradient-to-t from-black/90 to-transparent">
      <div className="flex gap-3 items-center">
        <button
          data-testid="button-left"
          onTouchStart={() => setControl("left", true)}
          onTouchEnd={() => setControl("left", false)}
          className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 backdrop-blur text-white flex items-center justify-center text-2xl transition-all duration-75 active:scale-90 active:bg-white/25 active:border-white/70 shadow-lg"
        >
          <ArrowLeft />
        </button>
        <button
          data-testid="button-right"
          onTouchStart={() => setControl("right", true)}
          onTouchEnd={() => setControl("right", false)}
          className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 backdrop-blur text-white flex items-center justify-center text-2xl transition-all duration-75 active:scale-90 active:bg-white/25 active:border-white/70 shadow-lg"
        >
          <ArrowRight />
        </button>
        <button
          data-testid="button-crouch"
          onTouchStart={() => setControl("crouch", true)}
          onTouchEnd={() => setControl("crouch", false)}
          className="w-16 h-16 rounded-full bg-white/10 border-2 border-slate-400/85 text-slate-400/95 backdrop-blur flex items-center justify-center text-2xl transition-all duration-75 active:scale-90 active:bg-white/25 active:border-white/70 shadow-lg"
        >
          <ArrowDown />
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <button
          data-testid="button-jump"
          onTouchStart={() => setControl("jump", true)}
          onTouchEnd={() => setControl("jump", false)}
          className="w-20 h-20 rounded-full bg-white/10 border-2 border-emerald-500 text-emerald-500 backdrop-blur flex items-center justify-center font-bold text-sm transition-all duration-75 active:scale-90 active:bg-white/25 active:border-white/70 shadow-xl"
        >
          JUMP
        </button>
        <button
          data-testid="button-attack"
          onTouchStart={() => setControl("attack", true)}
          onTouchEnd={() => setControl("attack", false)}
          className="w-20 h-20 rounded-full bg-white/10 border-2 border-amber-400 text-amber-400 backdrop-blur flex items-center justify-center font-bold text-sm transition-all duration-75 active:scale-90 active:bg-white/25 active:border-white/70 shadow-xl"
        >
          ATTACK
        </button>
      </div>
    </div>
  );
}
