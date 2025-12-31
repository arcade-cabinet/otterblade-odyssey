import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { useStore } from "./store";
import { BIOMES, SEGMENT_LEN, CG } from "./constants";
import { hash1 } from "./utils";
import "./materials/ParallaxMaterial";
import * as THREE from "three";

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

  const [ref] = useBox(() => ({
    type: "Static",
    position,
    args,
    collisionFilterGroup: CG.WORLD,
    collisionFilterMask: CG.PLAYER | CG.ENEMY | CG.PROJECTILE,
  }));

  return (
    <mesh ref={ref as any} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
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

function ParallaxBackground() {
  const biomeIndex = useStore((s) => s.biomeIndex);
  const playerX = useStore((s) => s.playerX);
  const materialRef = useRef<any>();

  const biome = BIOMES[biomeIndex % BIOMES.length];

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uColorA = new THREE.Color(biome.sky1);
      materialRef.current.uColorB = new THREE.Color(biome.sky2);
    }
  });

  return (
    <mesh position={[playerX, 10, -15]}>
      <planeGeometry args={[200, 80]} />
      {/* @ts-ignore */}
      <parallaxMaterial ref={materialRef} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Level() {
  const playerX = useStore((s) => s.playerX);
  const setBiomeMeta = useStore((s) => s.setBiomeMeta);

  useFrame(() => {
    // Update biome based on player position
    const segmentProgress = playerX / SEGMENT_LEN;
    const idx = Math.floor(segmentProgress) % BIOMES.length;
    const biome = BIOMES[idx];
    setBiomeMeta(idx, biome.accent);
  });

  return (
    <>
      <ParallaxBackground />
      <ProceduralPlatforms />
      <ambientLight intensity={0.4} />
      <pointLight position={[playerX + 10, 15, 5]} intensity={0.8} castShadow />
    </>
  );
}
