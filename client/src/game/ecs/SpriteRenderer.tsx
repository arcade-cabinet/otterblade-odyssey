import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { ECS, queries, world } from "./world";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import abbeyExteriorBg from "@assets/generated_images/abbey_exterior_parallax_background.png";
import abbeyInteriorBg from "@assets/generated_images/abbey_interior_parallax_background.png";
import dungeonBg from "@assets/generated_images/dungeon_parallax_background.png";
import courtyardBg from "@assets/generated_images/courtyard_parallax_background.png";
import rooftopsBg from "@assets/generated_images/rooftops_parallax_background.png";
import outerRuinsBg from "@assets/generated_images/outer_ruins_parallax_background.png";

const BIOME_BACKGROUNDS = [
  abbeyExteriorBg,
  abbeyInteriorBg,
  dungeonBg,
  courtyardBg,
  rooftopsBg,
  outerRuinsBg,
];

interface ParallaxLayerProps {
  biomeIndex: number;
  playerX: number;
  layer: number;
  scrollFactor: number;
}

function ParallaxLayer({ biomeIndex, playerX, layer, scrollFactor }: ParallaxLayerProps) {
  const bgSrc = BIOME_BACKGROUNDS[biomeIndex % BIOME_BACKGROUNDS.length];
  const texture = useTexture(bgSrc);

  const offsetX = useMemo(() => {
    return (playerX * scrollFactor * 0.01) % 1;
  }, [playerX, scrollFactor]);

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = 2;
    texture.offset.x = -offsetX;
  }, [texture, offsetX]);

  return (
    <mesh position={[playerX, 5, -50 - layer * 5]}>
      <planeGeometry args={[200, 50]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1 - layer * 0.15}
        depthWrite={false}
      />
    </mesh>
  );
}

interface ParallaxBackgroundSystemProps {
  biomeIndex: number;
  playerX: number;
}

export function ParallaxBackgroundSystem({ biomeIndex, playerX }: ParallaxBackgroundSystemProps) {
  return (
    <group>
      <ParallaxLayer biomeIndex={biomeIndex} playerX={playerX} layer={0} scrollFactor={0.2} />
      <ParallaxLayer biomeIndex={biomeIndex} playerX={playerX} layer={1} scrollFactor={0.4} />
      <ParallaxLayer biomeIndex={biomeIndex} playerX={playerX} layer={2} scrollFactor={0.6} />
    </group>
  );
}

export function SpriteEntities() {
  return (
    <ECS.Entities in={queries.sprites}>
      {(entity) => (
        <ECS.Entity key={world.id(entity)} entity={entity}>
          <ECS.Component name="object3d">
            <SpriteRenderer entity={entity} />
          </ECS.Component>
        </ECS.Entity>
      )}
    </ECS.Entities>
  );
}

function SpriteRenderer({ entity }: { entity: typeof queries.sprites.entities[0] }) {
  const { sprite, position } = entity;
  const texture = useTexture(sprite.src);

  const scale = useMemo(() => {
    const aspect = sprite.width / sprite.height;
    return [aspect * 2, 2, 1] as [number, number, number];
  }, [sprite.width, sprite.height]);

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
