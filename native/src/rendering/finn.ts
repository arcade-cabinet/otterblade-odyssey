/**
 * Procedural Finn mesh using Babylon.js primitives
 * Otter warrior with sword - warm brown fur, tan chest
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
} from '@babylonjs/core';

// Brand colors from BRAND.md
const COLORS = {
  BODY: '#8B6F47',      // Warm brown otter fur
  CHEST: '#D4A574',     // Lighter tan belly
  NOSE: '#2C2C2C',      // Dark nose
  EYE: '#1a1a1a',       // Nearly black eyes
  BLADE: '#C0C0C0',     // Steel blade
  HANDLE: '#654321',    // Dark leather handle
};

export function createFinnMesh(scene: Scene): TransformNode {
  const root = new TransformNode('finn', scene);

  // Materials
  const bodyMat = new StandardMaterial('finn-body-mat', scene);
  bodyMat.diffuseColor = Color3.FromHexString(COLORS.BODY);

  const chestMat = new StandardMaterial('finn-chest-mat', scene);
  chestMat.diffuseColor = Color3.FromHexString(COLORS.CHEST);

  const eyeMat = new StandardMaterial('finn-eye-mat', scene);
  eyeMat.diffuseColor = Color3.FromHexString(COLORS.EYE);

  const noseMat = new StandardMaterial('finn-nose-mat', scene);
  noseMat.diffuseColor = Color3.FromHexString(COLORS.NOSE);

  const bladeMat = new StandardMaterial('blade-mat', scene);
  bladeMat.diffuseColor = Color3.FromHexString(COLORS.BLADE);
  bladeMat.specularColor = new Color3(1, 1, 1);
  bladeMat.specularPower = 64;

  const handleMat = new StandardMaterial('handle-mat', scene);
  handleMat.diffuseColor = Color3.FromHexString(COLORS.HANDLE);

  // Body - capsule shape
  const body = MeshBuilder.CreateCapsule('finn-body', {
    height: 0.7,
    radius: 0.18,
  }, scene);
  body.position.y = 0.35;
  body.parent = root;
  body.material = bodyMat;

  // Chest - slightly flattened sphere on front
  const chest = MeshBuilder.CreateSphere('finn-chest', {
    diameter: 0.28,
  }, scene);
  chest.position = new Vector3(0, 0.32, -0.06);
  chest.scaling = new Vector3(0.85, 1.1, 0.5);
  chest.parent = root;
  chest.material = chestMat;

  // Head - sphere
  const head = MeshBuilder.CreateSphere('finn-head', {
    diameter: 0.32,
  }, scene);
  head.position = new Vector3(0, 0.75, 0);
  head.parent = root;
  head.material = bodyMat;

  // Snout - elongated sphere
  const snout = MeshBuilder.CreateSphere('finn-snout', {
    diameter: 0.14,
  }, scene);
  snout.position = new Vector3(0, 0.7, -0.14);
  snout.scaling = new Vector3(0.9, 0.7, 1.3);
  snout.parent = root;
  snout.material = chestMat;

  // Nose - small dark sphere
  const nose = MeshBuilder.CreateSphere('finn-nose', {
    diameter: 0.05,
  }, scene);
  nose.position = new Vector3(0, 0.7, -0.2);
  nose.parent = root;
  nose.material = noseMat;

  // Eyes
  const eyeLeft = MeshBuilder.CreateSphere('finn-eye-left', { diameter: 0.06 }, scene);
  eyeLeft.position = new Vector3(-0.08, 0.78, -0.12);
  eyeLeft.parent = root;
  eyeLeft.material = eyeMat;

  const eyeRight = MeshBuilder.CreateSphere('finn-eye-right', { diameter: 0.06 }, scene);
  eyeRight.position = new Vector3(0.08, 0.78, -0.12);
  eyeRight.parent = root;
  eyeRight.material = eyeMat;

  // Ears - small cones
  const earLeft = MeshBuilder.CreateCylinder('finn-ear-left', {
    height: 0.1,
    diameterTop: 0,
    diameterBottom: 0.07,
  }, scene);
  earLeft.position = new Vector3(-0.1, 0.92, 0);
  earLeft.rotation.z = Math.PI / 6;
  earLeft.parent = root;
  earLeft.material = bodyMat;

  const earRight = MeshBuilder.CreateCylinder('finn-ear-right', {
    height: 0.1,
    diameterTop: 0,
    diameterBottom: 0.07,
  }, scene);
  earRight.position = new Vector3(0.1, 0.92, 0);
  earRight.rotation.z = -Math.PI / 6;
  earRight.parent = root;
  earRight.material = bodyMat;

  // Arms - simple cylinders
  const armLeft = MeshBuilder.CreateCylinder('finn-arm-left', {
    height: 0.25,
    diameter: 0.08,
  }, scene);
  armLeft.position = new Vector3(-0.22, 0.4, 0);
  armLeft.rotation.z = Math.PI / 4;
  armLeft.parent = root;
  armLeft.material = bodyMat;

  const armRight = MeshBuilder.CreateCylinder('finn-arm-right', {
    height: 0.25,
    diameter: 0.08,
  }, scene);
  armRight.position = new Vector3(0.22, 0.4, 0);
  armRight.rotation.z = -Math.PI / 4;
  armRight.parent = root;
  armRight.material = bodyMat;

  // Legs - simple cylinders
  const legLeft = MeshBuilder.CreateCylinder('finn-leg-left', {
    height: 0.2,
    diameter: 0.1,
  }, scene);
  legLeft.position = new Vector3(-0.1, 0.1, 0);
  legLeft.parent = root;
  legLeft.material = bodyMat;

  const legRight = MeshBuilder.CreateCylinder('finn-leg-right', {
    height: 0.2,
    diameter: 0.1,
  }, scene);
  legRight.position = new Vector3(0.1, 0.1, 0);
  legRight.parent = root;
  legRight.material = bodyMat;

  // Otterblade - sword
  const swordRoot = new TransformNode('otterblade', scene);
  swordRoot.position = new Vector3(0.35, 0.35, -0.05);
  swordRoot.rotation.z = -Math.PI / 4;
  swordRoot.parent = root;

  // Blade
  const blade = MeshBuilder.CreateBox('blade', {
    width: 0.04,
    height: 0.5,
    depth: 0.01,
  }, scene);
  blade.position.y = 0.3;
  blade.parent = swordRoot;
  blade.material = bladeMat;

  // Handle
  const handle = MeshBuilder.CreateCylinder('handle', {
    height: 0.12,
    diameter: 0.035,
  }, scene);
  handle.parent = swordRoot;
  handle.material = handleMat;

  // Guard
  const guard = MeshBuilder.CreateBox('guard', {
    width: 0.1,
    height: 0.02,
    depth: 0.02,
  }, scene);
  guard.position.y = 0.05;
  guard.parent = swordRoot;
  guard.material = handleMat;

  // Tail - tapered cylinder
  const tail = MeshBuilder.CreateCylinder('finn-tail', {
    height: 0.35,
    diameterTop: 0.03,
    diameterBottom: 0.08,
  }, scene);
  tail.position = new Vector3(0, 0.15, 0.18);
  tail.rotation.x = -Math.PI / 3;
  tail.parent = root;
  tail.material = bodyMat;

  return root;
}

/**
 * Animate Finn based on state
 */
export function animateFinn(
  finn: TransformNode,
  state: 'idle' | 'run' | 'jump' | 'attack',
  deltaTime: number,
  time: number
): void {
  // Breathing animation for idle
  if (state === 'idle') {
    const breathe = Math.sin(time * 2) * 0.01;
    finn.scaling.y = 1 + breathe;
  }

  // Bobbing for run
  if (state === 'run') {
    const bob = Math.abs(Math.sin(time * 10)) * 0.03;
    finn.position.y = bob;
  }
}
