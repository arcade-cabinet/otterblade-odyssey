import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { PlayerSprite } from './components/PlayerSprite';
import { type RAPIER, usePhysics2D } from './Physics2D';
import { useStore } from './store';

const SPEED = 10;
const JUMP_FORCE = 14;
const COYOTE_TIME = 0.15;
const JUMP_BUFFER = 0.1;

export function Player() {
  const { world, rapier } = usePhysics2D();

  const _runId = useStore((s) => s.runId);
  const checkpointX = useStore((s) => s.checkpointX);
  const checkpointY = useStore((s) => s.checkpointY);
  const gameOver = useStore((s) => s.gameOver);
  const controls = useStore((s) => s.controls);
  const setPlayerPos = useStore((s) => s.setPlayerPos);
  const setPlayerFacing = useStore((s) => s.setPlayerFacing);
  const advanceScore = useStore((s) => s.advanceScore);
  const hitPlayer = useStore((s) => s.hitPlayer);

  const rigidBodyRef = useRef<RAPIER.RigidBody | null>(null);
  const spritePosition = useRef<[number, number, number]>([checkpointX, checkpointY, 0.5]);

  const grounded = useRef(false);
  const coyoteTimer = useRef(0);
  const jumpBufferTimer = useRef(0);
  const lastY = useRef(checkpointY);

  useEffect(() => {
    if (!world || !rapier) return;

    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(checkpointX, checkpointY)
      .lockRotations();
    bodyDesc.linearDamping = 0.5;

    const body = world.createRigidBody(bodyDesc);

    const colliderDesc = rapier.ColliderDesc.ball(0.5).setFriction(0.1).setRestitution(0);
    world.createCollider(colliderDesc, body);

    rigidBodyRef.current = body;

    return () => {
      if (world && rigidBodyRef.current) {
        world.removeRigidBody(rigidBodyRef.current);
        rigidBodyRef.current = null;
      }
    };
  }, [world, rapier, checkpointX, checkpointY]);

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: checkpointX, y: checkpointY }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0 }, true);
      lastY.current = checkpointY;
    }
  }, [checkpointX, checkpointY]);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || gameOver) return;

    const rb = rigidBodyRef.current;
    const pos = rb.translation();
    const vel = rb.linvel();

    // Update sprite position (offset slightly for visual centering)
    spritePosition.current = [pos.x, pos.y + 0.5, 0.5];

    setPlayerPos(pos.x, pos.y);
    advanceScore(pos.x);

    const wasGrounded = grounded.current;
    const verticalSpeed = Math.abs(vel.y);
    const isStable = verticalSpeed < 1.5;
    const yDelta = Math.abs(pos.y - lastY.current);
    grounded.current = isStable && yDelta < 0.1 && pos.y > -10;
    lastY.current = pos.y;

    if (grounded.current) {
      coyoteTimer.current = COYOTE_TIME;
    } else if (wasGrounded && vel.y < 0) {
      coyoteTimer.current = COYOTE_TIME;
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - delta);
    }

    if (controls.jump) {
      jumpBufferTimer.current = JUMP_BUFFER;
    } else {
      jumpBufferTimer.current = Math.max(0, jumpBufferTimer.current - delta);
    }

    if (jumpBufferTimer.current > 0 && coyoteTimer.current > 0) {
      rb.setLinvel({ x: vel.x, y: JUMP_FORCE }, true);
      coyoteTimer.current = 0;
      jumpBufferTimer.current = 0;
    }

    let moveX = 0;
    if (controls.left) moveX = -1;
    if (controls.right) moveX = 1;

    if (moveX !== 0) {
      setPlayerFacing(moveX > 0);
    }

    rb.setLinvel({ x: moveX * SPEED, y: vel.y }, true);

    if (pos.y < -20) {
      hitPlayer(5);
    }
  });

  if (!world || !rapier) {
    return null;
  }

  return <PlayerSprite position={spritePosition.current} />;
}
