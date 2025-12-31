import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useStore } from "./store";
import "./materials/OtterFurMaterial";
import * as THREE from "three";

const SPEED = 10;
const JUMP_FORCE = 12;
const COYOTE_TIME = 0.15;
const JUMP_BUFFER = 0.1;

export function Player() {
  const runId = useStore((s) => s.runId);
  const checkpointX = useStore((s) => s.checkpointX);
  const checkpointY = useStore((s) => s.checkpointY);
  const gameOver = useStore((s) => s.gameOver);
  const controls = useStore((s) => s.controls);
  const setPlayerPos = useStore((s) => s.setPlayerPos);
  const setPlayerFacing = useStore((s) => s.setPlayerFacing);
  const advanceScore = useStore((s) => s.advanceScore);
  const hitPlayer = useStore((s) => s.hitPlayer);

  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: [checkpointX, checkpointY, 0],
    fixedRotation: true,
    linearDamping: 0.5,
    args: [0.5],
  }));

  const velocity = useRef([0, 0, 0]);
  const position = useRef([checkpointX, checkpointY, 0]);
  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpBufferTimer = useRef(0);
  const materialRef = useRef<any>();

  // Reset position when respawning
  useEffect(() => {
    api.position.set(checkpointX, checkpointY, 0);
    api.velocity.set(0, 0, 0);
    position.current = [checkpointX, checkpointY, 0];
  }, [runId, checkpointX, checkpointY, api]);

  useEffect(() => {
    const unsubV = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubP = api.position.subscribe((p) => {
      position.current = p;
      setPlayerPos(p[0], p[1]);
      advanceScore(p[0]);
    });

    return () => {
      unsubV();
      unsubP();
    };
  }, [api, setPlayerPos, advanceScore]);

  useFrame((state, delta) => {
    if (gameOver) return;

    const time = state.clock.elapsedTime;

    // Update shader time
    if (materialRef.current) {
      materialRef.current.uTime = time;
    }

    // Simple ground check
    const wasGrounded = grounded.current;
    grounded.current = Math.abs(velocity.current[1]) < 0.5 && position.current[1] > -10;

    // Coyote time
    if (grounded.current) {
      coyoteTimer.current = COYOTE_TIME;
    } else if (wasGrounded) {
      coyoteTimer.current = COYOTE_TIME;
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - delta);
    }

    // Jump buffering
    if (controls.jump) {
      jumpBufferTimer.current = JUMP_BUFFER;
    } else {
      jumpBufferTimer.current = Math.max(0, jumpBufferTimer.current - delta);
    }

    // Execute jump
    if (jumpBufferTimer.current > 0 && coyoteTimer.current > 0) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, 0);
      coyoteTimer.current = 0;
      jumpBufferTimer.current = 0;
    }

    // Horizontal movement
    let x = 0;
    if (controls.left) x = -1;
    if (controls.right) x = 1;

    if (x !== 0) {
      setPlayerFacing(x > 0);
    }

    api.velocity.set(x * SPEED, velocity.current[1], 0);

    // Fall death
    if (position.current[1] < -20) {
      hitPlayer(5);
    }
  });

  return (
    <group ref={ref as any} position={[0, 0, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        {/* @ts-ignore */}
        <otterFurMaterial
          ref={materialRef}
          uColor={new THREE.Color("#38bdf8")}
          uRimColor={new THREE.Color("#e0f2fe")}
        />
      </mesh>
    </group>
  );
}
