# AI Agent Guidelines for Otterblade Odyssey

## Project Goals
- Create a polished, production-grade React game.
- Maintain high code quality with strict linting and typing.
- Ensure 60fps performance on mobile and desktop.
- Support iterative development through isolated agent roles.

## Architecture Rules
1.  **State Management**: Use `zustand` for all game state (player health, score, level). access it via hooks.
2.  **Physics**: Use `@react-three/cannon` hooks (`useSphere`, `useBox`) for all physics bodies.
3.  **Rendering**: All 3D components must live within the `Canvas` context.
4.  **Components**: Keep components small and focused. One file per major component.
5.  **Styling**: Use Tailwind CSS for HUD/UI overlay.
6.  **Assets**: Use `@assets` alias for generated images.

## Testing Expectations
- **Unit Tests**: Write unit tests for complex logic (e.g., damage calculations, state updates) in `tests/unit`.
- **E2E Tests**: Write E2E tests for critical flows (start game, die, restart) in `tests/e2e`.
- **Run Tests**: Always run `npm run test` before committing significant changes.

## Gameplay Invariants
- Player must always have control unless in a cutscene.
- Gravity must be constant.
- Enemies must spawn off-screen or with a warning.
- Checkpoints must save state immediately on collision.

## How to Run Checks
- Lint: `npm run lint` (uses Biome)
- Typecheck: `npm run typecheck`
- Test: `npm run test`
