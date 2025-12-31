import { useBox } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import groundTextureUrl from "@assets/generated_images/stone_tile_texture_for_game_ground.png";
import bgTextureUrl from "@assets/generated_images/fantasy_forest_background_for_platformer_game.png";
import * as THREE from "three";

function Ground() {
  const [ref] = useBox(() => ({
    type: "Static",
    position: [0, -2, 0],
    args: [100, 4, 10],
    material: { friction: 1 },
  }));

  const texture = useTexture(groundTextureUrl);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 2);

  return (
    <mesh ref={ref as any}>
      <boxGeometry args={[100, 4, 10]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function Platform({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  const [ref] = useBox(() => ({
    type: "Static",
    position,
    args,
  }));

  return (
    <mesh ref={ref as any}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  );
}

function Background() {
  const texture = useTexture(bgTextureUrl);
  return (
    <mesh position={[0, 10, -10]}>
      <planeGeometry args={[100, 50]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

export function Level() {
  return (
    <>
      <Ground />
      <Platform position={[10, 2, 0]} args={[5, 1, 2]} />
      <Platform position={[20, 5, 0]} args={[5, 1, 2]} />
      <Platform position={[-8, 3, 0]} args={[4, 1, 2]} />
      <Background />
    </>
  );
}
