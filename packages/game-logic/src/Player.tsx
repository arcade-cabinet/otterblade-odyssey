/**
 * Player Character (Finn the Otter)
 * React Three Fiber + Rapier physics
 */

import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useRef, useState } from 'react';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export function Player() {
  const playerRef = useRef<RapierRigidBody>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 2, 0]);

  useFrame((state) => {
    if (!playerRef.current) return;

    // Get keyboard input
    const { keyboard } = state;
    const speed = 5;
    const jumpForce = 8;

    const velocity = playerRef.current.linvel();
    const newVelocity = new THREE.Vector3(velocity.x, velocity.y, velocity.z);

    // Movement
    if (keyboard?.KeyA) newVelocity.x = -speed;
    if (keyboard?.KeyD) newVelocity.x = speed;
    
    // Jump
    if (keyboard?.Space && Math.abs(velocity.y) < 0.1) {
      newVelocity.y = jumpForce;
    }

    playerRef.current.setLinvel(newVelocity, true);

    // Update camera to follow player
    const playerPos = playerRef.current.translation();
    state.camera.position.x = playerPos.x;
    state.camera.position.z = playerPos.z + 10;
  });

  return (
    <RigidBody
      ref={playerRef}
      position={position}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      angularDamping={1}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      
      {/* Finn the Otter - Procedural mesh */}
      <group>
        {/* Body */}
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
          <meshStandardMaterial color="#8B6F47" />
        </mesh>
        
        {/* Head */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#8B6F47" />
        </mesh>
        
        {/* Snout */}
        <mesh castShadow position={[0, 0.5, 0.3]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#D4A574" />
        </mesh>
        
        {/* Eyes */}
        <mesh castShadow position={[-0.1, 0.65, 0.25]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh castShadow position={[0.1, 0.65, 0.25]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Sword (Otterblade) */}
        <mesh castShadow position={[0.4, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </RigidBody>
  );
}
