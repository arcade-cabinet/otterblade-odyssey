import { Physics as CannonPhysics } from "@react-three/cannon";

interface PhysicsWrapperProps {
  children: React.ReactNode;
  debug?: boolean;
}

export function PhysicsWrapper({ children }: PhysicsWrapperProps) {
  return (
    <CannonPhysics
      gravity={[0, -30, 0]}
      defaultContactMaterial={{ friction: 0.1, restitution: 0 }}
      isPaused={false}
    >
      {children}
    </CannonPhysics>
  );
}
