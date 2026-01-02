import { Coins } from 'lucide-react';
import { BIOMES } from '@/game/constants';
import { useStore } from '@/game/store';
import BossBar from './BossBar';
import Toast from './Toast';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${filled ? 'text-rose-500' : 'text-rose-900/50'}`}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function HUD() {
  const gameStarted = useStore((s) => s.gameStarted);
  const health = useStore((s) => s.health);
  const score = useStore((s) => s.score);
  const shards = useStore((s) => s.shards);
  const bankedShards = useStore((s) => s.bankedShards);
  const biomeIndex = useStore((s) => s.biomeIndex);
  const biome = BIOMES[biomeIndex % BIOMES.length];

  if (!gameStarted) return null;

  const maxHearts = 5;
  const hearts = [];
  for (let i = 0; i < maxHearts; i++) {
    hearts.push(<HeartIcon key={i} filled={i < health} />);
  }

  return (
    <>
      <header
        className="absolute top-0 left-0 w-full p-4 pointer-events-none select-none z-10"
        data-testid="hud-container"
        aria-label="Game HUD"
      >
        <h2 className="sr-only">Game Heads-Up Display</h2>
        {/* Top bar: Health left, Score right */}
        <div
          className="flex justify-between items-start"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {/* Left side: Hearts and Shards */}
          <div className="flex flex-col gap-2">
            <div
              className="flex gap-1"
              data-testid="health-hearts"
              role="status"
              aria-label={`Health: ${health} out of ${maxHearts}`}
            >
              {hearts}
            </div>
            <div
              className="flex items-center gap-2 text-amber-400 text-sm font-medium"
              role="status"
              aria-label={`Shards: ${shards}, Banked: ${bankedShards}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L9 9H2L7 14L5 22L12 17L19 22L17 14L22 9H15L12 2Z" />
              </svg>
              <span data-testid="shard-count">{shards}</span>
              {bankedShards > 0 && (
                <span className="text-amber-600/80 text-xs">(+{bankedShards})</span>
              )}
            </div>
          </div>

          {/* Right side: Score */}
          <div
            className="text-right"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Score: ${score}`}
          >
            <div className="text-amber-300 text-lg font-bold tracking-wide flex items-center gap-2">
              <Coins className="w-5 h-5" aria-hidden="true" />
              <span data-testid="score-display">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quest message ticker - storybook tone */}
        <div className="mt-3 text-center" role="status" aria-live="polite" aria-atomic="true">
          <div
            className="inline-block bg-stone-900/60 backdrop-blur-sm border border-amber-800/30 rounded px-4 py-1.5"
            data-testid="quest-message"
          >
            <span
              className="text-amber-200/90 text-sm font-medium italic tracking-wide"
              aria-label={`Current Quest: ${biome.quest || biome.name}`}
            >
              {biome.quest || biome.name}
            </span>
          </div>
        </div>

        <BossBar />
      </header>
      <Toast />
    </>
  );
}
