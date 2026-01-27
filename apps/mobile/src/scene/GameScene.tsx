/**
 * Main Babylon.js game scene
 * Renders the 2.5D platformer world
 */

import {
  ArcRotateCamera,
  type Camera,
  Color3,
  Color4,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { EngineView, useEngine } from '@babylonjs/react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { animateFinn, createFinnMesh } from '../rendering/finn';
import { useStore } from '../store/gameStore';

export function GameScene() {
  const engine = useEngine();
  const [camera, setCamera] = useState<Camera>();
  const finnRef = useRef<any>(null);
  const timeRef = useRef(0);
  const sceneRef = useRef<Scene | null>(null);

  const setPlayerPosition = useStore((s) => s.setPlayerPosition);

  useEffect(() => {
    if (engine) {
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // Clear color - warm evening sky
      scene.clearColor = new Color4(0.1, 0.12, 0.18, 1);

      // Camera - fixed 2.5D side view
      const cam = new ArcRotateCamera(
        'camera',
        -Math.PI / 2, // Alpha - side view
        Math.PI / 2.5, // Beta - slight angle from above
        8, // Radius
        new Vector3(0, 1, 0),
        scene
      );
      cam.lowerRadiusLimit = 5;
      cam.upperRadiusLimit = 15;
      setCamera(cam);

      // Lighting - warm hearthlight feel
      const light = new HemisphericLight('light', new Vector3(0.3, 1, -0.5), scene);
      light.intensity = 0.9;
      light.groundColor = new Color3(0.3, 0.25, 0.2);

      // Ground plane
      const ground = MeshBuilder.CreateGround(
        'ground',
        {
          width: 20,
          height: 6,
        },
        scene
      );
      ground.position.y = 0;

      const groundMat = new StandardMaterial('ground-mat', scene);
      groundMat.diffuseColor = new Color3(0.25, 0.35, 0.25);
      ground.material = groundMat;

      // Create Finn
      const finn = createFinnMesh(scene);
      finn.position = new Vector3(0, 0, 0);
      finnRef.current = finn;

      // Test platforms
      createPlatform(scene, -3, 0.5, 2, 0.3);
      createPlatform(scene, 3, 1, 2.5, 0.3);
      createPlatform(scene, 0, 1.8, 1.5, 0.3);

      // Update player position in store
      setPlayerPosition(finn.position.x, finn.position.y);

      // Animation loop
      scene.registerBeforeRender(() => {
        const deltaTime = scene.getEngine().getDeltaTime() / 1000;
        timeRef.current += deltaTime;

        if (finnRef.current) {
          animateFinn(finnRef.current, 'idle', deltaTime, timeRef.current);
        }
      });

      return () => {
        scene.dispose();
      };
    }
  }, [engine, setPlayerPosition]);

  return (
    <View style={styles.container}>
      <EngineView camera={camera} style={styles.engine} />
    </View>
  );
}

function createPlatform(scene: Scene, x: number, y: number, width: number, height: number): void {
  const platform = MeshBuilder.CreateBox(
    `platform-${x}-${y}`,
    {
      width: width,
      height: height,
      depth: 2,
    },
    scene
  );
  platform.position = new Vector3(x, y, 0);

  const mat = new StandardMaterial(`platform-mat-${x}-${y}`, scene);
  mat.diffuseColor = new Color3(0.4, 0.35, 0.3);
  platform.material = mat;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  engine: {
    flex: 1,
  },
});
