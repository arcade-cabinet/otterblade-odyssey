import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import RAPIER from "@dimforge/rapier2d-compat";

interface Physics2DContextType {
  world: RAPIER.World | null;
  rapier: typeof RAPIER | null;
}

const Physics2DContext = createContext<Physics2DContextType>({ world: null, rapier: null });

export function usePhysics2D() {
  return useContext(Physics2DContext);
}

interface Physics2DProviderProps {
  children: ReactNode;
  gravity?: { x: number; y: number };
}

export function Physics2DProvider({ children, gravity = { x: 0, y: -30 } }: Physics2DProviderProps) {
  const [ready, setReady] = useState(false);
  const worldRef = useRef<RAPIER.World | null>(null);

  useEffect(() => {
    let mounted = true;

    RAPIER.init().then(() => {
      if (!mounted) return;
      worldRef.current = new RAPIER.World(gravity);
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

  return (
    <Physics2DContext.Provider value={{ world: worldRef.current, rapier: RAPIER }}>
      {children}
    </Physics2DContext.Provider>
  );
}

export { RAPIER };
