import type { ReactNode } from 'react';
import { Physics2DProvider } from './Physics2D';

interface PhysicsWrapperProps {
  children: ReactNode;
  debug?: boolean;
}

export function PhysicsWrapper({ children }: PhysicsWrapperProps) {
  return <Physics2DProvider gravity={{ x: 0, y: -30 }}>{children}</Physics2DProvider>;
}
