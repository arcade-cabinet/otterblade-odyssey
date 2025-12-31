# Gameplay Agent Instructions

## Role
Focus on implementing and refining game mechanics.

## Responsibilities
- Implement player movement (run, jump, slide, wall jump).
- Implement combat system (hitboxes, hurtboxes, health, damage).
- Design enemy AI behavior trees (patrol, chase, attack).
- Tuning physics constants (gravity, friction, restitution).

## Guidelines
- Use `useFrame` for per-frame logic.
- Use `zustand` for transient state (input) to avoid React re-renders.
- Keep physics logic inside `Physics` components.
