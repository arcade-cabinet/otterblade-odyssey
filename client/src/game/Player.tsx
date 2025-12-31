import { RigidBody, BallCollider, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useStore } from "./store";
import "./materials/OtterFurMaterial";
import * as THREE from "three";

const SPEED = 10;
const JUMP_FORCE = 14;
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

  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const materialRef = useRef<any>(null);

  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpBufferTimer = useRef(0);
  const lastY = useRef(checkpointY);

  // Reset position when respawning
  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: checkpointX, y: checkpointY, z: 0 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      lastY.current = checkpointY;
    }
  }, [runId, checkpointX, checkpointY]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || gameOver) return;

    const time = state.clock.elapsedTime;
    const rb = rigidBodyRef.current;

    // Update shader time
    if (materialRef.current) {
      materialRef.current.uTime = time;
    }

    // Get current state
    const pos = rb.translation();
    const vel = rb.linvel();

    // Update store
    setPlayerPos(pos.x, pos.y);
    advanceScore(pos.x);

    // Ground detection - check if vertical velocity is near zero and we're not falling
    const wasGrounded = grounded.current;
    const verticalSpeed = Math.abs(vel.y);
    const isStable = verticalSpeed < 1.5;
    const yDelta = Math.abs(pos.y - lastY.current);
    grounded.current = isStable && yDelta < 0.1 && pos.y > -10;
    lastY.current = pos.y;

    // Coyote time - grace period after leaving ground
    if (grounded.current) {
      coyoteTimer.current = COYOTE_TIME;
    } else if (wasGrounded && vel.y < 0) {
      // Just left the ground, start coyote timer
      coyoteTimer.current = COYOTE_TIME;
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - delta);
    }

    // Jump buffering - queue jump input
    if (controls.jump) {
      jumpBufferTimer.current = JUMP_BUFFER;
    } else {
      jumpBufferTimer.current = Math.max(0, jumpBufferTimer.current - delta);
    }

    // Execute jump if buffered and within coyote time
    if (jumpBufferTimer.current > 0 && coyoteTimer.current > 0) {
      rb.setLinvel({ x: vel.x, y: JUMP_FORCE, z: 0 }, true);
      coyoteTimer.current = 0;
      jumpBufferTimer.current = 0;
    }

    // Horizontal movement
    let moveX = 0;
    if (controls.left) moveX = -1;
    if (controls.right) moveX = 1;

    if (moveX !== 0) {
      setPlayerFacing(moveX > 0);
    }

    // Apply horizontal velocity while preserving vertical
    rb.setLinvel({ x: moveX * SPEED, y: vel.y, z: 0 }, true);

    // Lock Z position
    if (Math.abs(pos.z) > 0.1) {
      rb.setTranslation({ x: pos.x, y: pos.y, z: 0 }, true);
    }

    // Fall death
    if (pos.y < -20) {
      hitPlayer(5);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[checkpointX, checkpointY, 0]}
      type="dynamic"
      colliders={false}
      lockRotations
      linearDamping={0.5}
      enabledTranslations={[true, true, false]}
    >
      <BallCollider args={[0.5]} friction={0.1} restitution={0} />
      <mesh castShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        {/* @ts-ignore */}
        <otterFurMaterial
          ref={materialRef}
          uColor={new THREE.Color("#38bdf8")}
          uRimColor={new THREE.Color("#e0f2fe")}
        />
      </mesh>
    </RigidBody>
  );
}
