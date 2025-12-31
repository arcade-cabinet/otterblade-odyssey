import RAPIER from '@dimforge/rapier2d-compat';
import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
const Physics2DContext = createContext({ world: null, rapier: null });
export function usePhysics2D() {
    return useContext(Physics2DContext);
}
export function Physics2DProvider({ children, gravity = { x: 0, y: -30 }, }) {
    const [ready, setReady] = useState(false);
    const worldRef = useRef(null);
    useEffect(() => {
        let mounted = true;
        const gravityVector = { x: gravity.x, y: gravity.y };
        RAPIER.init().then(() => {
            if (!mounted)
                return;
            worldRef.current = new RAPIER.World(gravityVector);
            setReady(true);
        });
        return () => {
            mounted = false;
            if (worldRef.current) {
                worldRef.current.free();
                worldRef.current = null;
            }
        };
    }, [gravity.x, gravity.y]);
    useFrame(() => {
        if (worldRef.current) {
            worldRef.current.step();
        }
    });
    if (!ready) {
        return null;
    }
    return (React.createElement(Physics2DContext.Provider, { value: { world: worldRef.current, rapier: RAPIER } }, children));
}
export { RAPIER };
