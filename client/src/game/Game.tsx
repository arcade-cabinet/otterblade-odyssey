/**
 * Game.tsx - React wrapper for the game component
 *
 * TODO: This is a stub component. The actual game implementation is in OtterbladeGame.jsx (Solid.js).
 * The architecture needs to be clarified:
 * - Option 1: Mount Solid.js app in a separate container
 * - Option 2: Use iframe to embed the Solid.js game
 * - Option 3: Convert the entire app to Solid.js
 *
 * For now, this stub ensures the build passes while the architecture is finalized.
 */

import { useEffect, useRef } from 'react';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const disposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (containerRef.current && !disposeRef.current) {
      // Dynamically import and mount Solid.js component to avoid JSX type conflicts
      import('solid-js/web').then(({ render }) => {
        import('./OtterbladeGame').then((module) => {
          const OtterbladeGame = module.default;
          if (containerRef.current) {
            // Use any to avoid JSX type conflicts between React and Solid
            disposeRef.current = render(OtterbladeGame as any, containerRef.current);
          }
        });
      });
    }

    return () => {
      // Cleanup Solid.js component when React component unmounts
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      data-testid="solid-game-container"
    />
  );
}
