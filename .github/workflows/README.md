# Workflow Orchestration Guide (Astro Stack)

This repository is standardized around the Astro + Solid + Matter.js rebuild. CI/CD is optimized for fast feedback, automated fixes, and GitHub Pages deployment of the Astro site.

## Pipeline Overview

- **CI:** pnpm-based lint, type checks, unit tests, and build. Coverage is uploaded to **Coveralls**; quality signals flow to **SonarCloud**.
- **Auto-fix:** **Claude** (via `autoheal.yml`) diagnoses failed runs and can push patches back to the branch.
- **PR review:** `review.yml` runs an Ollama triage review with optional escalation to Claude; there are no CodeRabbit/Gemini/Jules tiers.
- **CD:** `cd.yml` builds the Astro site and deploys to **GitHub Pages** with artifacts attached for asset review.

## Continuous Integration (ci.yml)

**Triggers:** push to `main`, pull requests.  
**Jobs:**
- **Build & Lint:** `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, upload `dist/`.
- **Unit Tests:** `pnpm test:unit`, upload coverage to Coveralls (`coverage/lcov.info`). SonarCloud can consume the same reports for quality gates.

Artifacts from CI feed into downstream deploys and debugging.

## Quality Gates

- **Coveralls:** Receives LCOV from unit tests for coverage tracking.
- **SonarCloud:** Uses build + coverage output for code quality metrics; keep reports available in CI artifacts for ingestion.

## Auto-Fix (autoheal.yml)

- Listens for failed CI/build/test/lint workflows or can be called manually.
- Runs Claude against the failing logs; when authorized, it commits fixes to the PR branch.
- Skips untrusted forked contributions; respects branch protections.

## PR Review (review.yml)

- **Triage:** Ollama-powered review for quick feedback.
- **Escalation:** Claude deep review when suggestion/LOC thresholds are exceeded or when Ollama is unavailable.
- Results are posted as PR comments; no external tiers (CodeRabbit, Gemini, Jules) are involved.

## Release Gate (release-gate.yml)

- Executes E2E/acceptance checks before merge queue completion.
- Attaches videos and reports for debugging; failures can be handed to auto-fix.

## Continuous Deployment (cd.yml)

- Detects the Node/Astro stack and runs `pnpm build:client` (Astro build) with repo-aware base paths.
- Publishes the built site to **GitHub Pages** and mirrors generated assets for the review gallery.
- Documentation artifacts are uploaded alongside the build for optional portal syncs.

## Monitoring & Maintenance

- Use the Actions tab to watch CI/CD runs and artifact uploads.
- Keep `ANTHROPIC_API_KEY`, `CI_GITHUB_TOKEN`, and Coveralls/SonarCloud secrets configured.
- Validate workflow syntax with `actionlint .github/workflows/*.yml` before merging changes.
- When runs fail, check auto-fix comments and Claude patches before re-running CI.
