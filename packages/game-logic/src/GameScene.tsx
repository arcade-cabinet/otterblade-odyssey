/**
 * React Three Fiber Game Scene
 * Main 3D game scene using R3F + Rapier physics
 */

import { HUD } from '@otterblade/ui';
import { OrbitControls, Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { Enemies } from './Enemies';
import { Level } from './Level';
import { NPCs } from './NPCs';
import { Player } from './Player';

interface GameSceneProps {
  chapterId: number;
  onComplete?: () => void;
}

export function GameScene({ chapterId }: GameSceneProps) {
  // Example game state - would come from game store in real implementation
  const gameState = {
    health: 5,
    maxHealth: 5,
    warmth: 75,
    maxWarmth: 100,
    shards: 3,
    chapterName: 'The Calling',
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 10], fov: 50 }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* HUD - Procedural 3D elements */}
        <HUD
          health={gameState.health}
          maxHealth={gameState.maxHealth}
          warmth={gameState.warmth}
          maxWarmth={gameState.maxWarmth}
          shards={gameState.shards}
          chapterId={chapterId}
          chapterName={gameState.chapterName}
        />

        <Physics gravity={[0, -9.81, 0]}>
          <Level chapterId={chapterId} />
          <Player />
          <Enemies chapterId={chapterId} />
          <NPCs chapterId={chapterId} />
        </Physics>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Suspense>
    </Canvas>
  );
}
