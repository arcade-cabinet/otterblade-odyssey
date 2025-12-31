import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useTexture, SpriteAnimator } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "./store";
import otterTextureUrl from "@assets/generated_images/pixel_art_otter_warrior_holding_a_glowing_sword.png";

const SPEED = 10;
const JUMP_FORCE = 12;

export function Player() {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: [0, 5, 0],
    fixedRotation: true,
    linearDamping: 0.5,
    args: [0.5],
  }));

  const { camera } = useThree();
  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 0]);
  const [grounded, setGrounded] = useState(false);
  const otterTexture = useTexture(otterTextureUrl);

  // Input state
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Space" && grounded) {
        api.velocity.set(velocity.current[0], JUMP_FORCE, 0);
        setGrounded(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Subscribe to cannon api
    const unsubV = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubP = api.position.subscribe((p) => (position.current = p));

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      unsubV();
      unsubP();
    };
  }, [grounded, api]);

  // Ground check raycast (simple version using velocity check or contact)
  // For now, let's assume if vertical velocity is near 0 and we are low, we are grounded.
  // Better: useCollision events on the body.
  // Re-subscribing to collision events inside useEffect if possible.

  useFrame(() => {
    const { KeyW, KeyA, KeyS, KeyD, ArrowLeft, ArrowRight } = keys.current;

    let x = 0;
    if (KeyA || ArrowLeft) x = -1;
    if (KeyD || ArrowRight) x = 1;

    api.velocity.set(x * SPEED, velocity.current[1], 0);

    // Camera follow
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, position.current[0], 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, position.current[1] + 2, 0.1);
    camera.lookAt(position.current[0], position.current[1], 0);

    // Simple ground check approximation
    if (Math.abs(velocity.current[1]) < 0.1) {
      setGrounded(true);
    } else {
      setGrounded(false);
    }
  });

  return (
    <group ref={ref as any}>
       <mesh>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial map={otterTexture} transparent side={THREE.DoubleSide} />
       </mesh>
    </group>
  );
}
