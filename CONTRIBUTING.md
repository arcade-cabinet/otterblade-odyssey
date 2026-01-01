# Contributing to Otterblade Odyssey

Thank you for your interest in contributing to Otterblade Odyssey! This document provides guidelines and instructions for contributors.

---

## Code of Conduct

This project embraces the warmth and community spirit of Willowmere Hearthhold. Contributors are expected to:

- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Focus on the work, not the person
- Accept feedback gracefully and give it kindly

---

## Getting Started

### Prerequisites

- Node.js 25.x (see `.nvmrc`)
- pnpm 10.x (package manager)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/arcade-cabinet/otterblade-odyssey.git
cd otterblade-odyssey

# Install dependencies (MUST use pnpm)
pnpm install

# Start development server
pnpm dev
```

### Project Structure

```
otterblade-odyssey/
├── client/src/           # Main application source
│   ├── game/             # Game logic (ECS, physics, state)
│   ├── components/       # React components
│   ├── data/             # JSON data files and manifests
│   └── assets/           # Static assets
├── packages/             # Monorepo packages
│   └── dev-tools/        # Asset generation tools
├── tests/                # Unit tests
├── e2e/                  # End-to-end tests
└── docs/                 # Documentation
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Feature branches
git checkout -b feature/your-feature-name

# Bug fixes
git checkout -b fix/bug-description

# Documentation
git checkout -b docs/doc-topic
```

### 2. Make Changes

Follow the coding standards in [AGENTS.md](./AGENTS.md):

- Maximum 300 lines per file
- JSDoc on all exports
- TypeScript strict mode
- No `any` types
- Use pnpm, never npm/yarn

### 3. Test Your Changes

```bash
# Run linting
pnpm biome check .

# Run type checking
pnpm tsc --noEmit

# Run unit tests
pnpm test

# Run E2E tests
pnpm playwright test
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
# Good examples
git commit -m "feat(player): add wall-jump mechanic"
git commit -m "fix(physics): correct collision detection at corners"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(store): add tests for checkpoint system"

# Commit message format
<type>(<scope>): <description>

# Types: feat, fix, docs, style, refactor, test, chore
```

### 5. Push and Create PR

```bash
git push -u origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what and why
- Screenshots for visual changes
- Link to related issues

---

## Code Standards

### Required Tools

| Tool | Purpose | Command |
|------|---------|---------|
| Biome | Linting & formatting | `pnpm biome check .` |
| TypeScript | Type checking | `pnpm tsc --noEmit` |
| Vitest | Unit tests | `pnpm test` |
| Playwright | E2E tests | `pnpm playwright test` |

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `StartMenu.tsx` |
| Utilities | camelCase | `mathUtils.ts` |
| Data files | kebab-case | `chapters.json` |
| Tests | *.test.ts | `store.test.ts` |

### Import Aliases

```typescript
// Use aliases, not relative paths
import { useStore } from '@/game/store';
import chapterPlate from '@assets/images/chapter-plates/prologue.png';

// NOT
import { useStore } from '../../../game/store';
```

---

## Types of Contributions

### Bug Fixes

1. Search existing issues first
2. Create an issue if none exists
3. Reference the issue in your PR
4. Include test that reproduces the bug

### Features

1. Discuss in an issue before implementing
2. Keep PRs focused and reviewable
3. Add tests for new functionality
4. Update documentation as needed

### Documentation

- Fix typos and unclear explanations
- Add examples and use cases
- Keep consistent with existing style
- Update table of contents if needed

### Visual Assets

Asset contributions must follow [BRAND.md](./BRAND.md):

- Anthropomorphic woodland animals only
- Warm, storybook aesthetic
- No neon, sci-fi, or horror elements
- Consistent with Finn's design

---

## Asset Generation

### Using dev-tools

```bash
# Generate all missing assets
pnpm --filter @otterblade/dev-tools cli

# Dry run to preview
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Generate specific category
pnpm --filter @otterblade/dev-tools cli -- --category sprites
```

### Adding New Assets

1. Add entry to appropriate manifest in `client/src/data/manifests/`
2. Follow the manifest schema
3. Include brand-compliant prompt
4. Set status to `pending`
5. Run generation or submit for CI generation

---

## Pull Request Guidelines

### PR Checklist

Before submitting, ensure:

- [ ] Branch is up to date with main
- [ ] All tests pass locally
- [ ] Linting passes (`pnpm biome check .`)
- [ ] Types check (`pnpm tsc --noEmit`)
- [ ] Changes are documented
- [ ] Commit messages are clear
- [ ] PR description explains the change

### Review Process

1. **Automated checks** - CI runs tests and linting
2. **Code review** - Maintainer reviews the code
3. **Feedback** - Address any requested changes
4. **Approval** - Reviewer approves the PR
5. **Merge** - Maintainer merges to main

### What to Expect

- Initial response within 48 hours
- Constructive feedback focused on code quality
- Questions about design decisions
- Suggestions for improvements

---

## Development Tips

### Running the Dev Server

```bash
pnpm dev          # Start Vite dev server
pnpm dev:mobile   # Start with mobile preview
```

### Testing Changes

```bash
# Watch mode for rapid iteration
pnpm test:watch

# Run specific test file
pnpm test tests/unit/store.test.ts

# Debug E2E tests
pnpm playwright test --debug
```

### Debugging

```bash
# Enable verbose logging
DEBUG=* pnpm dev

# Check bundle size
pnpm build && pnpm analyze
```

---

## Documentation

### Required Documentation

All contributions should include:

1. **JSDoc comments** on exported functions/types
2. **README updates** for new features
3. **Code comments** for complex logic

### Documentation Files

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | AI agent instructions |
| [AGENTS.md](./AGENTS.md) | Quality standards |
| [BRAND.md](./BRAND.md) | Visual style guide |
| [WORLD.md](./WORLD.md) | World-building |
| [VISION.md](./VISION.md) | Project vision |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Code patterns |
| [TESTING.md](./TESTING.md) | Testing guide |

---

## Getting Help

### Resources

- **Documentation**: Start with the docs listed above
- **Issues**: Search existing issues for answers
- **Discussions**: Use GitHub Discussions for questions

### Reporting Issues

When reporting bugs, include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment (OS, browser, Node version)
5. Screenshots or error messages

---

## Recognition

Contributors are recognized in:

- Git commit history
- GitHub contributors page
- Release notes for significant contributions

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

*"The Everember burns brighter when we tend it together."*
