import { Canvas } from "@react-three/fiber";
import { PhysicsWrapper } from "./Physics";
import { Level } from "./Level";
import { Player } from "./Player";
import { Suspense, useEffect } from "react";
import { useStore } from "./store";

function KeyboardControls() {
  const setControl = useStore((s) => s.setControl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") setControl("left", true);
      if (e.code === "KeyD" || e.code === "ArrowRight") setControl("right", true);
      if (e.code === "KeyW" || e.code === "ArrowUp") setControl("up", true);
      if (e.code === "KeyS" || e.code === "ArrowDown" || e.code === "ControlLeft")
        setControl("crouch", true);
      if (e.code === "Space") {
        e.preventDefault();
        setControl("jump", true);
      }
      if (e.code === "KeyK" || e.code === "KeyX") setControl("attack", true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") setControl("left", false);
      if (e.code === "KeyD" || e.code === "ArrowRight") setControl("right", false);
      if (e.code === "KeyW" || e.code === "ArrowUp") setControl("up", false);
      if (e.code === "KeyS" || e.code === "ArrowDown" || e.code === "ControlLeft")
        setControl("crouch", false);
      if (e.code === "Space") {
        e.preventDefault();
        setControl("jump", false);
      }
      if (e.code === "KeyK" || e.code === "KeyX") setControl("attack", false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setControl]);

  return null;
}

export default function Game() {
  return (
    <div className="w-full h-screen bg-black" data-testid="game-container">
      <KeyboardControls />
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={["#1a1a2e"]} />
        <Suspense fallback={null}>
          <PhysicsWrapper>
            <Player />
            <Level />
          </PhysicsWrapper>
        </Suspense>
      </Canvas>
    </div>
  );
}
