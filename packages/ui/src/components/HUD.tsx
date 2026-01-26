/**
 * HUD Components using React Three Fiber
 * Procedural UI elements following BRAND.md aesthetics
 */

import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

interface HealthDisplayProps {
  current: number;
  max: number;
}

/**
 * Health Hearts - Procedural 3D hearts following warm, storybook aesthetic
 */
export function HealthDisplay({ current, max }: HealthDisplayProps) {
  return (
    <group position={[-8, 7, 0]}>
      {Array.from({ length: max }, (_, i) => (
        <HeartMesh key={`heart-${i}`} filled={i < current} index={i} />
      ))}
    </group>
  );
}

function HeartMesh({ filled, index }: { filled: boolean; index: number }) {
  const { scale } = useSpring({
    scale: filled ? 1 : 0.8,
    config: { tension: 300, friction: 20 },
  });

  // Create heart shape using Three.js Shape
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.5);
  heartShape.bezierCurveTo(0, 0.8, -0.5, 0.8, -0.5, 0.5);
  heartShape.bezierCurveTo(-0.5, 0.2, 0, -0.2, 0, -0.8);
  heartShape.bezierCurveTo(0, -0.2, 0.5, 0.2, 0.5, 0.5);
  heartShape.bezierCurveTo(0.5, 0.8, 0, 0.8, 0, 0.5);

  const extrudeSettings = {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
  };

  return (
    <animated.mesh
      position={[index * 0.7, 0, 0]}
      scale={scale}
      castShadow
    >
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshStandardMaterial
        color={filled ? '#B91C1C' : '#4B5563'}
        roughness={0.4}
        metalness={0.2}
      />
    </animated.mesh>
  );
}

interface WarmthBarProps {
  current: number;
  max: number;
}

/**
 * Warmth Bar - Procedural lantern-glow aesthetic
 */
export function WarmthBar({ current, max }: WarmthBarProps) {
  const percentage = current / max;
  
  const { fillWidth } = useSpring({
    fillWidth: percentage * 3,
    config: { tension: 200, friction: 25 },
  });

  return (
    <group position={[-8, 6, 0]}>
      {/* Background bar */}
      <mesh position={[1.5, 0, -0.05]}>
        <boxGeometry args={[3, 0.3, 0.1]} />
        <meshStandardMaterial color="#2C2C2C" roughness={0.6} />
      </mesh>
      
      {/* Fill bar with warm glow */}
      <animated.mesh position={[fillWidth.to((w) => w / 2), 0, 0]}>
        <boxGeometry args={[fillWidth, 0.25, 0.08]} />
        <meshStandardMaterial
          color="#FFBF00"
          emissive="#FF8C00"
          emissiveIntensity={0.5}
          roughness={0.3}
        />
      </animated.mesh>
      
      {/* Label */}
      <Html position={[-0.5, 0, 0]} transform occlude>
        <div
          style={{
            color: '#D4A574',
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: '14px',
            fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          Warmth
        </div>
      </Html>
    </group>
  );
}

interface ShardsDisplayProps {
  count: number;
}

/**
 * Shards Display - Procedural crystal gems
 */
export function ShardsDisplay({ count }: ShardsDisplayProps) {
  return (
    <group position={[7, 7, 0]}>
      <ShardMesh />
      <Html position={[0.5, 0, 0]} transform occlude>
        <div
          style={{
            color: '#FFBF00',
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: '20px',
            fontWeight: 700,
            textShadow: '0 2px 6px rgba(255, 191, 0, 0.5)',
          }}
        >
          ×{count}
        </div>
      </Html>
    </group>
  );
}

function ShardMesh() {
  return (
    <mesh castShadow>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color="#FFBF00"
        emissive="#FFD700"
        emissiveIntensity={0.3}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

interface ChapterDisplayProps {
  chapterId: number;
  chapterName: string;
}

/**
 * Chapter Display - Storybook page aesthetic
 */
export function ChapterDisplay({ chapterId, chapterName }: ChapterDisplayProps) {
  return (
    <Html position={[0, 8, 0]} center transform occlude>
      <div
        style={{
          backgroundColor: 'rgba(44, 44, 44, 0.8)',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '2px solid #8C8C8C',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            color: '#D4A574',
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: '18px',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          Chapter {chapterId}: {chapterName}
        </div>
      </div>
    </Html>
  );
}

/**
 * Complete HUD - Combines all HUD elements
 */
interface HUDProps {
  health: number;
  maxHealth: number;
  warmth: number;
  maxWarmth: number;
  shards: number;
  chapterId: number;
  chapterName: string;
}

export function HUD({
  health,
  maxHealth,
  warmth,
  maxWarmth,
  shards,
  chapterId,
  chapterName,
}: HUDProps) {
  return (
    <group>
      <ChapterDisplay chapterId={chapterId} chapterName={chapterName} />
      <HealthDisplay current={health} max={maxHealth} />
      <WarmthBar current={warmth} max={maxWarmth} />
      <ShardsDisplay count={shards} />
    </group>
  );
}
