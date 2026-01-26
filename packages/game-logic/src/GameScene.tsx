/**
 * React Three Fiber Game Scene
 * Main 3D game scene using R3F + Rapier physics
 */

import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, Sky } from '@react-three/drei';
import { Suspense } from 'react';
import { Player } from './Player';
import { Level } from './Level';
import { Enemies } from './Enemies';
import { NPCs } from './NPCs';

interface GameSceneProps {
  chapterId: number;
  onComplete?: () => void;
}

export function GameScene({ chapterId, onComplete }: GameSceneProps) {
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
