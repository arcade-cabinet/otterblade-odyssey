import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useMemo, useEffect } from "react";
import { useStore } from "./store";
import { BIOMES, SEGMENT_LEN } from "./constants";
import { hash1 } from "./utils";
import { ProceduralSky, GrassInstances, RockInstances, VolumetricFogMesh, createTimeOfDay } from "@jbcom/strata";

interface PlatformProps {
  id: string;
  position: [number, number, number];
  args: [number, number, number];
  kind?: string;
}

function Platform({ id, position, args, kind = "plain" }: PlatformProps) {
  const register = useStore((s) => s.registerPlatform);
  const unregister = useStore((s) => s.unregisterPlatform);

  const color = useMemo(() => {
    if (kind === "boss") return "#0b1020";
    if (kind === "bridge") return "#060912";
    return "#090b12";
  }, [kind]);

  useEffect(() => {
    const [x, y] = position;
    const [w, h] = args;
    register(id, { minX: x - w / 2, maxX: x + w / 2, topY: y + h / 2 });
    return () => unregister(id);
  }, [id, position, args, register, unregister]);

  const halfExtents: [number, number, number] = [args[0] / 2, args[1] / 2, args[2] / 2];

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={halfExtents} friction={0.1} restitution={0} />
      <mesh receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

function ProceduralPlatforms() {
  const platforms = useMemo(() => {
    const result: Array<{
      id: string;
      position: [number, number, number];
      args: [number, number, number];
    }> = [];

    // Ground
    for (let i = -2; i < 50; i++) {
      result.push({
        id: `ground-${i}`,
        position: [i * 20, -2, 0],
        args: [20, 4, 10],
      });
    }

    // Procedural platforms
    for (let i = 0; i < 40; i++) {
      const x = i * 12 + hash1(i * 0.5) * 8;
      const y = 2 + hash1(i * 0.7) * 6;
      const w = 4 + hash1(i * 1.2) * 3;
      result.push({
        id: `plat-${i}`,
        position: [x, y, 0],
        args: [w, 1, 2],
      });
    }

    return result;
  }, []);

  return (
    <>
      {platforms.map((p) => (
        <Platform key={p.id} id={p.id} position={p.position} args={p.args} />
      ))}
    </>
  );
}

function StrataEnvironment() {
  const biomeIndex = useStore((s) => s.biomeIndex);
  const biome = BIOMES[biomeIndex % BIOMES.length];

  // Calculate time of day based on biome (each biome has different lighting)
  const timeOfDay = useMemo(() => {
    const hours = [14, 10, 18, 6]; // Verdant=afternoon, Crystal=morning, Magma=sunset, Aether=dawn
    return createTimeOfDay(hours[biomeIndex % hours.length]);
  }, [biomeIndex]);

  return (
    <>
      <ProceduralSky timeOfDay={timeOfDay} size={[200, 100]} distance={50} />
      <VolumetricFogMesh density={0.015} color={biome.fog} />
    </>
  );
}

function BiomeVegetation() {
  const playerX = useStore((s) => s.playerX);
  const biomeIndex = useStore((s) => s.biomeIndex);

  // Only show grass in VERDANT biome (index 0)
  if (biomeIndex !== 0) return null;

  return (
    <group position={[playerX, 0, -5]}>
      <GrassInstances count={2000} areaSize={50} />
      <RockInstances count={30} areaSize={40} />
    </group>
  );
}

export function Level() {
  const playerX = useStore((s) => s.playerX);
  const setBiomeMeta = useStore((s) => s.setBiomeMeta);

  useFrame(() => {
    const segmentProgress = playerX / SEGMENT_LEN;
    const idx = Math.floor(segmentProgress) % BIOMES.length;
    const biome = BIOMES[idx];
    setBiomeMeta(idx, biome.accent);
  });

  return (
    <>
      <StrataEnvironment />
      <BiomeVegetation />
      <ProceduralPlatforms />
      <ambientLight intensity={0.4} />
      <pointLight position={[playerX + 10, 15, 5]} intensity={0.8} castShadow />
    </>
  );
}
