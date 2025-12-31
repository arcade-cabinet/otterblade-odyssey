import { Coins } from 'lucide-react';
import { BIOMES } from '@/game/constants';
import { useStore } from '@/game/store';
import BossBar from './BossBar';
import Toast from './Toast';
function HeartIcon({ filled }) {
    return (React.createElement("svg", { className: `w-5 h-5 ${filled ? 'text-rose-500' : 'text-rose-900/50'}`, viewBox: "0 0 24 24", fill: filled ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true" },
        React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })));
}
export default function HUD() {
    const gameStarted = useStore((s) => s.gameStarted);
    const health = useStore((s) => s.health);
    const score = useStore((s) => s.score);
    const shards = useStore((s) => s.shards);
    const bankedShards = useStore((s) => s.bankedShards);
    const biomeIndex = useStore((s) => s.biomeIndex);
    const biome = BIOMES[biomeIndex % BIOMES.length];
    if (!gameStarted)
        return null;
    const maxHearts = 5;
    const hearts = [];
    for (let i = 0; i < maxHearts; i++) {
        hearts.push(React.createElement(HeartIcon, { key: i, filled: i < health }));
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "absolute top-0 left-0 w-full p-4 pointer-events-none select-none z-10", "data-testid": "hud-container" },
            React.createElement("div", { className: "flex justify-between items-start", style: { textShadow: '0 2px 4px rgba(0,0,0,0.8)' } },
                React.createElement("div", { className: "flex flex-col gap-2" },
                    React.createElement("div", { className: "flex gap-1", "data-testid": "health-hearts" }, hearts),
                    React.createElement("div", { className: "flex items-center gap-2 text-amber-400 text-sm font-medium" },
                        React.createElement("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
                            React.createElement("path", { d: "M12 2L9 9H2L7 14L5 22L12 17L19 22L17 14L22 9H15L12 2Z" })),
                        React.createElement("span", { "data-testid": "shard-count" }, shards),
                        bankedShards > 0 && (React.createElement("span", { className: "text-amber-600/80 text-xs" },
                            "(+",
                            bankedShards,
                            ")")))),
                React.createElement("div", { className: "text-right" },
                    React.createElement("div", { className: "text-amber-300 text-lg font-bold tracking-wide flex items-center gap-2" },
                        React.createElement(Coins, { className: "w-5 h-5" }),
                        React.createElement("span", { "data-testid": "score-display" }, score.toLocaleString())))),
            React.createElement("div", { className: "mt-3 text-center" },
                React.createElement("div", { className: "inline-block bg-stone-900/60 backdrop-blur-sm border border-amber-800/30 rounded px-4 py-1.5", "data-testid": "quest-message" },
                    React.createElement("span", { className: "text-amber-200/90 text-sm font-medium italic tracking-wide" }, biome.quest || biome.name))),
            React.createElement(BossBar, null)),
        React.createElement(Toast, null)));
}
