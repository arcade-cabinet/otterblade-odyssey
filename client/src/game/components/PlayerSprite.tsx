/**
 * @fileoverview Player sprite component with procedural canvas rendering.
 * Implements the POC's drawFinn() function from pocs/otterblade_odyssey.html
 * Uses canvas-drawn procedural otter warrior matching warm, Redwall-inspired aesthetic.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

interface PlayerSpriteProps {
  position: [number, number, number];
}

/**
 * Generate procedural otter sprite on canvas (from POC)
 * Returns THREE.CanvasTexture with drawn otter
 */
function generateOtterTexture(facing: number, state: string, animFrame: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Center coordinates
  ctx.save();
  ctx.translate(64, 64);
  if (facing < 0) ctx.scale(-1, 1);

  const frame = Math.floor(animFrame / 10) % 4;
  const breathe = Math.sin(animFrame * 0.05) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  const tailWag = Math.sin(frame * Math.PI / 2) * 8;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(-20 + tailWag, 15, -25, 20);
  ctx.quadraticCurveTo(-28 + tailWag, 22, -25, 25);
  ctx.quadraticCurveTo(-15 + tailWag, 20, -8, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Back leg
  ctx.fillStyle = '#8B6F47';
  if (state === 'walking') {
    const legSwing = Math.sin(frame * Math.PI / 2 + Math.PI) * 8;
    ctx.fillRect(-12 - legSwing, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(-8 - legSwing, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-12, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(-8, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body (otter torso)
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest fur (lighter)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leather vest
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.moveTo(-10, -8 + breathe);
  ctx.lineTo(-8, 8 + breathe);
  ctx.lineTo(8, 8 + breathe);
  ctx.lineTo(10, -8 + breathe);
  ctx.closePath();
  ctx.fill();

  // Belt
  ctx.fillStyle = '#5D4E37';
  ctx.fillRect(-10, 8 + breathe, 20, 4);
  ctx.fillStyle = '#F4D03F';
  ctx.fillRect(-2, 8 + breathe, 4, 4);

  // Front leg
  ctx.fillStyle = '#8B6F47';
  if (state === 'walking') {
    const legSwing = Math.sin(frame * Math.PI / 2) * 8;
    ctx.fillRect(5 + legSwing, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(8 + legSwing, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(5, 12, 7, 16);
    ctx.beginPath();
    ctx.arc(8, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -18 + breathe, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -16 + breathe, 6, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(12, -16 + breathe, 2, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(8, -16 + i * 2 + breathe);
    ctx.lineTo(18, -15 + i * 2 + breathe);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(-3, -20 + breathe, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -20 + breathe, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye gleam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(-4, -21 + breathe, 1, 1);
  ctx.fillRect(2, -21 + breathe, 1, 1);

  // Ears
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(-7, -24 + breathe, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -24 + breathe, 4, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.fillStyle = '#8B6F47';
  const armAngle = state === 'walking' ? Math.sin(frame * Math.PI / 2) * 0.3 : 0;
  ctx.save();
  ctx.translate(-10, -5 + breathe);
  ctx.rotate(armAngle);
  ctx.fillRect(-3, 0, 6, 15);
  ctx.beginPath();
  ctx.arc(0, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Renders the procedurally-drawn player otter character
 * Matches POC aesthetic: warm browns, honey golds, Redwall-inspired
 */
export function PlayerSprite({ position }: PlayerSpriteProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const animFrameRef = useRef(0);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const facingRight = useStore((s) => s.playerFacingRight);
  const controls = useStore((s) => s.controls);
  const health = useStore((s) => s.health);

  // Determine animation state
  const getAnimationState = () => {
    if (controls.left || controls.right) return 'walking';
    if (controls.jump) return 'jumping';
    return 'idle';
  };

  // Initial texture generation
  useMemo(() => {
    textureRef.current = generateOtterTexture(facingRight ? 1 : -1, 'idle', 0);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !textureRef.current) return;

    timeRef.current += delta;
    animFrameRef.current += 1;
    const mesh = meshRef.current;
    const state = getAnimationState();

    // Regenerate texture every few frames for animation
    if (animFrameRef.current % 5 === 0) {
      const newTexture = generateOtterTexture(facingRight ? 1 : -1, state, animFrameRef.current);
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.map = newTexture;
        mesh.material.needsUpdate = true;
      }
      textureRef.current.dispose();
      textureRef.current = newTexture;
    }

    // Subtle position animation
    const isMoving = controls.left || controls.right;
    const isJumping = controls.jump;

    if (isMoving && !isJumping) {
      const bobAmount = Math.sin(timeRef.current * 12) * 0.02;
      mesh.position.y = position[1] + bobAmount;
    } else {
      mesh.position.y = position[1];
    }

    mesh.position.x = position[0];
    mesh.position.z = position[2];
  });

  const spriteWidth = 1.8;
  const spriteHeight = 2.0;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[spriteWidth, spriteHeight]} />
      <meshBasicMaterial
        map={textureRef.current}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
