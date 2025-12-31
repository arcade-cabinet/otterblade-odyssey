import { Physics2DProvider } from './Physics2D';
export function PhysicsWrapper({ children }) {
    return React.createElement(Physics2DProvider, { gravity: { x: 0, y: -30 } }, children);
}
