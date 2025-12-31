import { useStore } from '@/game/store';
export default function BossBar() {
    const inBossFight = useStore((s) => s.inBossFight);
    const bossHp = useStore((s) => s.bossHp);
    const bossMax = useStore((s) => s.bossMax);
    const bossIndex = useStore((s) => s.bossIndex);
    if (!inBossFight || bossMax === 0)
        return null;
    const pct = (bossHp / bossMax) * 100;
    return (React.createElement("div", { className: "mx-4 mt-2 border border-white/20 bg-black/35 p-2 rounded-lg backdrop-blur-sm" },
        React.createElement("div", { className: "text-white/90 text-xs tracking-widest uppercase mb-1", style: { textShadow: '0 2px 0 rgba(0,0,0,1)' } },
            "Boss ",
            bossIndex + 1),
        React.createElement("div", { className: "h-2.5 rounded-md overflow-hidden bg-white/10 shadow-inner" },
            React.createElement("div", { className: "h-full transition-all duration-75 linear", style: {
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #f43f5e, #facc15)',
                } }))));
}
