/**
 * NPCs Component
 * Non-player characters with YUKA AI for idle behaviors
 */

import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useState } from 'react';

interface NPC {
  id: string;
  position: [number, number, number];
  name: string;
  role: string;
}

interface NPCData {
  id: string;
  name?: string;
  role?: string;
  position?: { x: number; y: number };
}

interface NPCsProps {
  chapterId: number;
}

export function NPCs({ chapterId }: NPCsProps) {
  const [npcs, setNpcs] = useState<NPC[]>([]);

  useEffect(() => {
    // Load NPCs from manifest
    fetch(`/data/manifests/chapters/chapter-${chapterId}.json`)
      .then((res) => res.json())
      .then((manifest) => {
        const npcData =
          manifest.npcs?.map((npc: NPCData) => ({
            id: `npc-${npc.id}`,
            position: [npc.position?.x || 0, npc.position?.y || 1, 0] as [number, number, number],
            name: npc.name || 'Unknown',
            role: npc.role || 'villager',
          })) || [];

        setNpcs(npcData);
      })
      .catch((err) => console.error('Failed to load NPCs:', err));
  }, [chapterId]);

  return (
    <group>
      {npcs.map((npc) => (
        <RigidBody key={npc.id} position={npc.position} type="fixed" colliders={false}>
          <CapsuleCollider args={[0.4, 0.4]} />

          {/* NPC mesh - procedural woodland creature */}
          <group>
            <mesh castShadow>
              <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
              <meshStandardMaterial color="#D4A574" />
            </mesh>
            <mesh castShadow position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial color="#D4A574" />
            </mesh>
          </group>
        </RigidBody>
      ))}
    </group>
  );
}
