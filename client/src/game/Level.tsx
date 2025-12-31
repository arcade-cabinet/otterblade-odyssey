import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BIOMES, SEGMENT_LEN } from './constants';
import { ParallaxBackgroundSystem } from './ecs/SpriteRenderer';
import { type RAPIER, usePhysics2D } from './Physics2D';
import { useStore } from './store';
import { hash1 } from './utils';

interface PlatformProps {
  id: string;
  position: [number, number];
  size: [number, number];
  kind?: string;
}

function Platform({ id, position, size, kind = 'plain' }: PlatformProps) {
  const { world, rapier } = usePhysics2D();
  const register = useStore((s) => s.registerPlatform);
  const unregister = useStore((s) => s.unregisterPlatform);
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);

  const color = useMemo(() => {
    if (kind === 'boss') return '#0b1020';
    if (kind === 'bridge') return '#060912';
    return '#090b12';
  }, [kind]);

  useEffect(() => {
    if (!world || !rapier) return;

    const [x, y] = position;
    const [w, h] = size;

    register(id, { minX: x - w / 2, maxX: x + w / 2, topY: y + h / 2 });

    const bodyDesc = rapier.RigidBodyDesc.fixed().setTranslation(x, y);
    const body = world.createRigidBody(bodyDesc);

    const colliderDesc = rapier.ColliderDesc.cuboid(w / 2, h / 2)
      .setFriction(0.1)
      .setRestitution(0);
    world.createCollider(colliderDesc, body);

    bodyRef.current = body;

    return () => {
      unregister(id);
      if (world && bodyRef.current) {
        world.removeRigidBody(bodyRef.current);
        bodyRef.current = null;
      }
    };
  }, [world, rapier, id, position, size, register, unregister]);

  const [x, y] = position;
  const [w, h] = size;

  return (
    <mesh position={[x, y, 0]} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function ProceduralPlatforms() {
  const platforms = useMemo(() => {
    const result: Array<{
      id: string;
      position: [number, number];
      size: [number, number];
    }> = [];

    for (let i = -2; i < 50; i++) {
      result.push({
        id: `ground-${i}`,
        position: [i * 20, -2],
        size: [20, 4],
      });
    }

    for (let i = 0; i < 40; i++) {
      const x = i * 12 + hash1(i * 0.5) * 8;
      const y = 2 + hash1(i * 0.7) * 6;
      const w = 4 + hash1(i * 1.2) * 3;
      result.push({
        id: `plat-${i}`,
        position: [x, y],
        size: [w, 1],
      });
    }

    return result;
  }, []);

  return (
    <>
      {platforms.map((p) => (
        <Platform key={p.id} id={p.id} position={p.position} size={p.size} />
      ))}
    </>
  );
}

function SimpleEnvironment() {
  const biomeIndex = useStore((s) => s.biomeIndex);
  const biome = BIOMES[biomeIndex % BIOMES.length];

  const fogColor = useMemo(() => new THREE.Color(biome.fog), [biome.fog]);
  const skyColor = useMemo(() => new THREE.Color(biome.sky1), [biome.sky1]);

  return (
    <>
      <fog attach="fog" args={[fogColor, 20, 80]} />
      <color attach="background" args={[skyColor]} />
    </>
  );
}

export function Level() {
  const playerX = useStore((s) => s.playerX);
  const biomeIndex = useStore((s) => s.biomeIndex);
  const setBiomeMeta = useStore((s) => s.setBiomeMeta);

  useFrame(() => {
    const segmentProgress = playerX / SEGMENT_LEN;
    const idx = Math.abs(Math.floor(segmentProgress)) % BIOMES.length;
    const biome = BIOMES[idx];
    if (biome) {
      setBiomeMeta(idx, biome.accent);
    }
  });

  return (
    <>
      <ParallaxBackgroundSystem biomeIndex={biomeIndex} playerX={playerX} />
      <SimpleEnvironment />
      <ProceduralPlatforms />
      <ambientLight intensity={0.4} />
      <pointLight position={[playerX + 10, 15, 5]} intensity={0.8} castShadow />
    </>
  );
}
