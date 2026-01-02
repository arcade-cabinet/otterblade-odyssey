/**
 * @fileoverview Player sprite component with animation state management.
 *
 * TODO: Replace with procedural canvas rendering like POC (pocs/otterblade_odyssey.html)
 * This file currently imports static PNG which has been removed from codebase.
 * See NEXT_SESSION_TODO.md for implementation plan.
 *
 * CRITICAL: This component is BROKEN until procedural generation is implemented.
 */

// REMOVED: Static asset import (legacy Replit junk)
// import otterSprite from '@assets/generated_images/pixel_art_otter_warrior_holding_a_glowing_sword.png';
// import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

interface PlayerSpriteProps {
  position: [number, number, number];
}

/**
 * Renders the player character sprite with animation effects.
 * TODO: Implement procedural canvas rendering (see POC for reference)
 */
export function PlayerSprite({ position }: PlayerSpriteProps) {
  // REMOVED: Static texture loading (legacy Replit junk)
  // const texture = useTexture(otterSprite);
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const facingRight = useStore((s) => s.playerFacingRight);
  const controls = useStore((s) => s.controls);

  // TODO: Generate procedural texture or use canvas-drawn geometry
  // For now, return a placeholder colored box so game doesn't crash

  // Procedural animation effects (until sprite sheets are available)
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    const mesh = meshRef.current;

    // Determine animation state
    const isMoving = controls.left || controls.right;
    const isJumping = controls.jump;

    // Bobbing animation for running
    if (isMoving && !isJumping) {
      const bobAmount = Math.sin(timeRef.current * 12) * 0.05;
      mesh.position.y = position[1] + bobAmount;

      // Slight tilt during run
      mesh.rotation.z = Math.sin(timeRef.current * 12) * 0.03;
    } else if (isJumping) {
      // Squash and stretch for jumping
      mesh.scale.y = 1.1;
      mesh.scale.x = facingRight ? 0.9 : -0.9;
      mesh.rotation.z = 0;
    } else {
      // Idle breathing
      const breathe = 1 + Math.sin(timeRef.current * 2) * 0.02;
      mesh.scale.y = breathe;
      mesh.scale.x = facingRight ? 1 : -1;
      mesh.position.y = position[1];
      mesh.rotation.z = 0;
    }

    // Update position
    mesh.position.x = position[0];
    mesh.position.z = position[2];
  });

  // Sprite size in world units (adjust based on character design)
  const spriteWidth = 1.8;
  const spriteHeight = 2.0;

  // TEMPORARY: Placeholder box until procedural rendering implemented
  return (
    <mesh ref={meshRef} position={position} scale={[facingRight ? 1 : -1, 1, 1]}>
      <planeGeometry args={[spriteWidth, spriteHeight]} />
      <meshBasicMaterial
        color="#8B6914"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
      {/* TODO: Replace with procedural canvas texture or geometry */}
    </mesh>
  );
}
