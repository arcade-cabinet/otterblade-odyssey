import { useStore } from '@/game/store';

export default function GameOverMenu() {
  const gameOver = useStore((s) => s.gameOver);
  const score = useStore((s) => s.score);
  const distance = useStore((s) => s.distance);
  const bankedShards = useStore((s) => s.bankedShards);
  const checkpointSeen = useStore((s) => s.checkpointSeen);
  const respawn = useStore((s) => s.respawnFromCheckpoint);
  const startGame = useStore((s) => s.startGame);

  if (!gameOver) return null;

  const canRespawn = checkpointSeen >= 0;

  return (
    <div
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 px-6"
      data-testid="game-over-menu"
    >
      <h1
        className="text-4xl md:text-5xl font-bold text-sky-400 mb-2 tracking-wider"
        style={{ textShadow: '0 0 20px rgba(14,165,233,0.9)' }}
      >
        BLADE BROKEN
      </h1>
      <p className="text-slate-400 mb-4 text-center max-w-2xl leading-relaxed">
        The otter warrior has fallen. Will you rise again?
      </p>
      <div className="text-white/50 text-xs tracking-widest uppercase mb-4">RUN COMPLETE</div>

      <div className="border border-white/15 px-4 py-3 w-full max-w-2xl text-white/80 text-sm leading-relaxed bg-white/5 rounded-xl backdrop-blur-md mb-6">
        <div className="flex justify-between mb-1">
          <span>Score:</span>
          <span className="font-bold">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Distance:</span>
          <span className="font-bold">{Math.floor(distance)}m</span>
        </div>
        <div className="flex justify-between">
          <span>Shards Banked:</span>
          <span className="font-bold text-amber-400">{bankedShards}</span>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        {canRespawn && (
          <button
            type="button"
            onClick={respawn}
            data-testid="button-respawn"
            className="px-10 py-3 bg-transparent border-2 border-emerald-500 text-emerald-500 font-bold cursor-pointer transition-all duration-200 uppercase tracking-widest hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_22px_rgba(52,211,153,0.8)]"
          >
            Respawn at Shrine
          </button>
        )}
        <button
          type="button"
          onClick={startGame}
          data-testid="button-restart"
          className="px-10 py-3 bg-transparent border-2 border-sky-400 text-sky-400 font-bold cursor-pointer transition-all duration-200 uppercase tracking-widest hover:bg-sky-400 hover:text-black hover:shadow-[0_0_22px_rgba(56,189,248,0.8)]"
        >
          New Run
        </button>
      </div>

      {canRespawn && (
        <p className="text-rose-500 mt-4 tracking-widest uppercase text-xs">-900 Score Penalty</p>
      )}
    </div>
  );
}
