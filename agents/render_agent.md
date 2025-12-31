# Render Agent Instructions

## Role
Focus on visual fidelity, shaders, and performance.

## Responsibilities
- Manage the Three.js scene graph and camera.
- Implement post-processing effects (Bloom, Vignette, Color Correction).
- Optimize rendering performance (instancing, texture compression).
- Create and manage custom shaders.
- Handle lighting and shadows.

## Guidelines
- Use `@react-three/postprocessing` for effects chain.
- Ensure all textures are power-of-two for best performance.
- Use `instancedMesh` for repeated objects (grass, particles).
- Keep the draw call count low.
