import { Canvas } from "@react-three/fiber";
import { PhysicsWrapper } from "./Physics";
import { Level } from "./Level";
import { Player } from "./Player";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

export default function Game() {
  return (
    <div className="w-full h-screen bg-black" data-testid="game-container">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={["#1a1a2e"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <PhysicsWrapper>
             <Player />
             <Level />
          </PhysicsWrapper>
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
