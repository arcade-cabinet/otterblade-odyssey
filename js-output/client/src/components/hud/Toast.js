import { useEffect, useState } from 'react';
import { useStore } from '@/game/store';
export default function Toast() {
    const toast = useStore((s) => s.toast);
    const toastUntil = useStore((s) => s.toastUntil);
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (toast && toastUntil > performance.now()) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), toastUntil - performance.now());
            return () => clearTimeout(timer);
        }
        else {
            setShow(false);
        }
    }, [toast, toastUntil]);
    if (!toast)
        return null;
    return (React.createElement("div", { className: `absolute left-1/2 top-[18%] -translate-x-1/2 px-4 py-2 border border-white/20 bg-black/45 text-white/90 rounded-xl tracking-widest uppercase text-xs backdrop-blur-md transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`, style: { textShadow: '0 2px 0 rgba(0,0,0,1)' } }, toast));
}
