# Otterblade Odyssey

A production-grade React platformer built with `react-three-fiber` and `cannon`.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    # or if you have pnpm v10
    pnpm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev:client
    ```

3.  **Build for Production**:
    ```bash
    npm run build:client
    ```

## Controls

-   **Desktop**:
    -   `WASD` / `Arrows`: Move & Crouch
    -   `Space`: Jump
    -   `K` or `Click`: Attack
    -   `Shift`: Dash/Slide
-   **Mobile**:
    -   Touch Joystick (Left): Move
    -   Tap (Right): Jump/Attack buttons

## Architecture

-   **Frontend**: React 18, Vite, TypeScript
-   **3D/Physics**: @react-three/fiber, @react-three/drei, @react-three/cannon
-   **State**: Zustand
-   **Styling**: Tailwind CSS v4
-   **Linting**: Biome

## Deployment

This project is configured to deploy to GitHub Pages via GitHub Actions.
-   Push to `main` triggers a build and deploy.
-   Artifacts are uploaded to the `gh-pages` branch.

## Testing

-   **Unit**: `npm run test` (Vitest)
-   **E2E**: `npm run test:e2e` (Playwright)
