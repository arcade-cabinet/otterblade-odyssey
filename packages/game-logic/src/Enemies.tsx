/**
 * Enemies Component
 * Uses YUKA for AI pathfinding and behavior
 */

import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import type { RapierRigidBody } from '@react-three/rapier';
import * as YUKA from 'yuka';

interface Enemy {
  id: string;
  position: [number, number, number];
  type: string;
  vehicle: YUKA.Vehicle;
}

interface EnemiesProps {
  chapterId: number;
}

export function Enemies({ chapterId }: EnemiesProps) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const entityManager = useRef(new YUKA.EntityManager());
  const time = useRef(new YUKA.Time());

  useEffect(() => {
    // Load enemies from manifest
    fetch(`/data/manifests/chapters/chapter-${chapterId}.json`)
      .then((res) => res.json())
      .then((manifest) => {
        const enemyData = manifest.level?.segments?.flatMap((segment: any) =>
          segment.enemies?.map((e: any) => {
            const vehicle = new YUKA.Vehicle();
            vehicle.position.set(e.x, e.y || 1, 0);
            vehicle.maxSpeed = 2;
            
            // Add wander behavior
            const wanderBehavior = new YUKA.WanderBehavior();
            vehicle.steering.add(wanderBehavior);
            
            entityManager.current.add(vehicle);
            
            return {
              id: `enemy-${e.x}-${e.y}`,
              position: [e.x, e.y || 1, 0] as [number, number, number],
              type: e.type || 'default',
              vehicle,
            };
          })
        ) || [];
        
        setEnemies(enemyData);
      })
      .catch((err) => console.error('Failed to load enemies:', err));

    return () => {
      entityManager.current.clear();
    };
  }, [chapterId]);

  useFrame((state, delta) => {
    time.current.update();
    entityManager.current.update(time.current.getDelta());
  });

  return (
    <group>
      {enemies.map((enemy) => (
        <EnemyMesh key={enemy.id} enemy={enemy} />
      ))}
    </group>
  );
}

function EnemyMesh({ enemy }: { enemy: Enemy }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (!rigidBodyRef.current) return;
    
    // Sync physics body with YUKA vehicle position
    const yukPos = enemy.vehicle.position;
    rigidBodyRef.current.setTranslation(
      { x: yukPos.x, y: yukPos.y, z: yukPos.z },
      true
    );
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={enemy.position}
      colliders={false}
      enabledRotations={[false, true, false]}
    >
      <CapsuleCollider args={[0.4, 0.4]} />
      
      {/* Enemy mesh - procedural */}
      <group>
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#B91C1C" />
        </mesh>
        <mesh castShadow position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#B91C1C" />
        </mesh>
      </group>
    </RigidBody>
  );
}
