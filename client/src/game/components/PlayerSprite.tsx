/**
 * @fileoverview Player sprite component with animation state management.
 * Uses the AnimatedSprite system to render the otter warrior character.
 *
 * Until proper sprite sheets are created, this uses the single otter image
 * as a placeholder with a bobbing animation effect.
 */

// Import the otter warrior image
import otterSprite from '@assets/generated_images/pixel_art_otter_warrior_holding_a_glowing_sword.png';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

interface PlayerSpriteProps {
  position: [number, number, number];
}

/**
 * Renders the player character sprite with animation effects.
 * Currently uses a single sprite with procedural animation until sprite sheets are available.
 */
export function PlayerSprite({ position }: PlayerSpriteProps) {
  const texture = useTexture(otterSprite);
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const facingRight = useStore((s) => s.playerFacingRight);
  const controls = useStore((s) => s.controls);

  // Configure texture for pixel art
  useMemo(() => {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
  }, [texture]);

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

  return (
    <mesh ref={meshRef} position={position} scale={[facingRight ? 1 : -1, 1, 1]}>
      <planeGeometry args={[spriteWidth, spriteHeight]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}
