import { useStore } from "@/game/store";
import { Heart, Coins } from "lucide-react";
import Toast from "./Toast";
import BossBar from "./BossBar";
import { BIOMES } from "@/game/constants";

export default function HUD() {
  const gameStarted = useStore((s) => s.gameStarted);
  const health = useStore((s) => s.health);
  const score = useStore((s) => s.score);
  const shards = useStore((s) => s.shards);
  const bankedShards = useStore((s) => s.bankedShards);
  const distance = useStore((s) => s.distance);
  const biomeIndex = useStore((s) => s.biomeIndex);
  const biome = BIOMES[biomeIndex % BIOMES.length];

  if (!gameStarted) return null;

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none select-none z-10">
        <div
          className="flex justify-between font-bold uppercase tracking-widest"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,1)" }}
        >
          <div className="text-amber-400 text-base">
            <Coins className="inline w-4 h-4 mr-1" />
            Score: {score.toLocaleString()}
          </div>
          <div className="text-rose-500 text-base text-right">
            <Heart className="inline w-4 h-4 mr-1 fill-rose-500" />
            HP: {health}
          </div>
        </div>

        <div className="flex justify-between text-white/60 text-xs tracking-widest uppercase mt-1.5 flex-wrap gap-2">
          <span className="opacity-90">
            Shards: {shards} (+{bankedShards} banked)
          </span>
          <span className="opacity-90">Distance: {Math.floor(distance)}m</span>
          <span className="opacity-90">Biome: {biome.name}</span>
        </div>

        <BossBar />
      </div>
      <Toast />
    </>
  );
}
