import { Physics } from "@react-three/rapier";
import type { ReactNode } from "react";

interface PhysicsWrapperProps {
  children: ReactNode;
  debug?: boolean;
}

export function PhysicsWrapper({ children }: PhysicsWrapperProps) {
  return (
    <Physics gravity={[0, -30, 0]} timeStep="vary">
      {children}
    </Physics>
  );
}
