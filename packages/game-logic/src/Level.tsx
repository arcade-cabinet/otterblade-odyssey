/**
 * Level Component
 * Generates 3D level geometry from manifest data
 */

import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useEffect, useState } from 'react';

interface LevelProps {
  chapterId: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Level({ chapterId }: LevelProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    // Load chapter manifest and extract platform data
    fetch(`/data/manifests/chapters/chapter-${chapterId}.json`)
      .then((res) => res.json())
      .then((manifest) => {
        const levelPlatforms = manifest.level?.segments?.flatMap((segment: any) =>
          segment.platforms?.map((p: any) => ({
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
          }))
        ) || [];
        setPlatforms(levelPlatforms);
      })
      .catch((err) => console.error('Failed to load level:', err));
  }, [chapterId]);

  return (
    <group>
      {/* Ground plane */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[100, 1, 100]} />
          <meshStandardMaterial color="#4A9D72" />
        </mesh>
      </RigidBody>

      {/* Platforms from manifest */}
      {platforms.map((platform) => (
        <RigidBody key={`platform-${platform.x}-${platform.y}-${platform.width}`} type="fixed" colliders={false}>
          <CuboidCollider
            args={[platform.width / 2, platform.height / 2, 1]}
            position={[platform.x, platform.y, 0]}
          />
          <mesh castShadow receiveShadow position={[platform.x, platform.y, 0]}>
            <boxGeometry args={[platform.width, platform.height, 2]} />
            <meshStandardMaterial color="#8C8C8C" />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
