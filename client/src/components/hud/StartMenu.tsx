import { useStore } from "@/game/store";

export default function StartMenu() {
  const gameStarted = useStore((s) => s.gameStarted);
  const bestScore = useStore((s) => s.bestScore);
  const bestDistance = useStore((s) => s.bestDistance);
  const startGame = useStore((s) => s.startGame);

  if (gameStarted) return null;

  return (
    <div
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 px-6"
      data-testid="start-menu"
    >
      <h1
        className="text-5xl md:text-6xl font-bold text-sky-400 mb-3 tracking-wide text-center"
        style={{ textShadow: "0 0 20px rgba(14,165,233,0.9)" }}
      >
        Otterblade Odyssey
      </h1>
      <p className="text-slate-400 mb-5 text-center max-w-2xl leading-relaxed">
        A side-scrolling action-platformer where you play as a mystical otter warrior wielding an
        enchanted blade. Navigate treacherous biomes, defeat ancient guardians, and collect
        shimmering shards to unlock your destiny.
      </p>
      <div className="text-white/60 text-xs tracking-widest uppercase mb-5 text-center">
        Zephyros Rising · ALPHA BUILD
      </div>

      <button
        onClick={startGame}
        data-testid="button-start-game"
        className="px-10 py-4 bg-transparent border-2 border-sky-400 text-sky-400 font-bold cursor-pointer transition-all duration-200 uppercase tracking-widest text-lg hover:bg-sky-400 hover:text-black hover:shadow-[0_0_22px_rgba(56,189,248,0.8)]"
      >
        Begin Odyssey
      </button>

      {bestScore > 0 && (
        <div className="mt-6 border border-white/15 px-4 py-3 w-full max-w-2xl text-white/80 text-sm leading-relaxed bg-white/5 rounded-xl backdrop-blur-md">
          <div className="flex justify-between mb-1">
            <span>Best Score:</span>
            <span className="font-bold">{bestScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Best Distance:</span>
            <span className="font-bold">{Math.floor(bestDistance)}m</span>
          </div>
        </div>
      )}
    </div>
  );
}
