import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import abbeyExteriorBg from "../../assets/images/parallax/abbey_exterior_parallax_background.png";
import abbeyInteriorBg from "../../assets/images/parallax/abbey_interior_parallax_background.png";
import dungeonBg from "../../assets/images/parallax/dungeon_parallax_background.png";
import courtyardBg from "../../assets/images/parallax/courtyard_parallax_background.png";
import rooftopsBg from "../../assets/images/parallax/rooftops_parallax_background.png";
import outerRuinsBg from "../../assets/images/parallax/outer_ruins_parallax_background.png";

const BIOME_BACKGROUNDS = [
  outerRuinsBg,
  abbeyExteriorBg,
  abbeyExteriorBg,
  abbeyInteriorBg,
  abbeyInteriorBg,
  dungeonBg,
  courtyardBg,
  rooftopsBg,
  rooftopsBg,
  abbeyExteriorBg,
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
