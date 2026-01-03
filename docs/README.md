# Otterblade Odyssey - Documentation

Welcome to the comprehensive documentation for Otterblade Odyssey! This directory contains all technical documentation organized by topic.

## Quick Start

**New to the project?** Start here:
1. Read the [root README](../README.md) for project overview
2. Check [BRAND.md](../BRAND.md) for visual style guidelines
3. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture
4. See [AGENTS.md](../AGENTS.md) for AI agent instructions

### Directory Responsibilities

- `game/` — Astro + Solid.js application, Matter.js/Canvas runtime. **All new runtime work goes here.**
- `client/` — Legacy React/Vite runtime is frozen; only JSON data in `client/src/data/` remains authoritative while migration completes.

## Documentation Structure

### Core Documentation (Root Level)

These files are in the repository root for easy access:

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Project overview, setup, quick start | Everyone |
| `BRAND.md` | Visual identity, color palette, art direction | Designers, AI agents |
| `CLAUDE.md` | Claude Code agent instructions | AI assistants |
| `AGENTS.md` | Universal AI agent guidelines | All AI agents |
| `docs/IMPLEMENTATION.md` | Astro/Solid/Matter implementation guide | Developers |

### Technical Documentation (docs/)

Detailed technical guides:

| File | Purpose | Audience |
|------|---------|----------|
| [TESTING.md](./TESTING.md) | Complete testing guide | Developers, QA |
| [AI.md](./AI.md) | AI systems (YUKA, steering behaviors) | AI developers |
| [PHYSICS.md](./PHYSICS.md) | Physics engine documentation | Physics developers |

### Coming Soon

- `docs/ARCHITECTURE.md` - System architecture deep dive
- `docs/AUDIO.md` - Audio system and generation
- `docs/RENDERING.md` - Canvas 2D rendering pipeline
- `docs/STATE.md` - State management patterns
- `docs/MOBILE.md` - Capacitor mobile integration
- `docs/DEPLOYMENT.md` - CI/CD and deployment guide

## Documentation Conventions

### File Naming

- **ALL CAPS** - Core documentation (BRAND.md, AGENTS.md)
- **PascalCase.md** - Technical deep dives (Testing.md, Physics.md)
- **kebab-case.md** - Guides and tutorials (getting-started.md)

### Structure

Every documentation file should include:

1. **Title** - Clear, descriptive H1 heading
2. **Table of Contents** - For documents > 200 lines
3. **Quick Reference** - TL;DR section at top
4. **Detailed Sections** - Organized by topic
5. **Examples** - Code samples with explanations
6. **Troubleshooting** - Common issues and solutions

### Code Examples

Use proper syntax highlighting:

```typescript
// Always include comments explaining the code
function example(): void {
  // Implementation
}
```

### Cross-References

Link to related docs:

```markdown
See [TESTING.md](./TESTING.md) for test infrastructure.
```

## Documentation Maintenance

### When to Update Docs

**Always update documentation when:**
- Adding new features or systems
- Changing existing behavior
- Fixing bugs that others might encounter
- Adding new tools or workflows

**Update within same PR** - Don't defer documentation to "later"

### Documentation Review Checklist

Before merging documentation changes:

- [ ] Spelling and grammar checked
- [ ] All code examples tested and working
- [ ] Cross-references verified (no broken links)
- [ ] Table of contents updated
- [ ] Examples follow brand guidelines
- [ ] Clear and concise explanations

## Getting Help

### For Developers

- Check [IMPLEMENTATION.md](../IMPLEMENTATION.md) first
- See [TESTING.md](./TESTING.md) for test infrastructure
- Review [AGENTS.md](../AGENTS.md) for AI assistance

### For AI Agents

- Start with [AGENTS.md](../AGENTS.md)
- Check [CLAUDE.md](../CLAUDE.md) for Claude-specific instructions
- Follow [BRAND.md](../BRAND.md) for visual consistency

### For Designers

- Read [BRAND.md](../BRAND.md) thoroughly
- Check asset manifests in `client/src/data/manifests/`
- See [AGENTS.md](../AGENTS.md) for generation prompts

## Contributing to Documentation

### Adding New Documentation

1. Choose appropriate location (root vs docs/)
2. Follow naming conventions
3. Include table of contents for long docs
4. Add entry to this README
5. Cross-reference from related docs

### Improving Existing Documentation

1. Update the doc file
2. Update cross-references if structure changed
3. Update this README if file was renamed/moved
4. Test all code examples

### Documentation Style Guide

**Voice:** Second person ("you"), present tense
**Tone:** Professional but approachable, technical but clear
**Length:** As long as necessary, as short as possible
**Examples:** Concrete and runnable, not abstract
**Formatting:** Markdown with semantic headers, lists, code blocks

---

## Documentation Standards

### Required Sections

Every technical doc must have:

1. **Purpose Statement** - One paragraph explaining why this doc exists
2. **Prerequisites** - What you need to know/install first
3. **Quick Start** - Minimal example to get started
4. **Detailed Guide** - Step-by-step instructions
5. **Reference** - API docs, configuration options
6. **Troubleshooting** - Common issues and fixes
7. **Further Reading** - Links to related docs

### Optional Sections

Include as appropriate:

- **Architecture Diagrams** - Visual system overviews
- **Performance Considerations** - Optimization tips
- **Security Notes** - Security best practices
- **Migration Guide** - Upgrading from old versions
- **FAQ** - Frequently asked questions

---

## Document Index

### By Topic

**Testing & Quality**
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [COMPLETE_JOURNEY_VALIDATION.md](./COMPLETE_JOURNEY_VALIDATION.md) - Deterministic chapter and journey validation

**AI & Automation**
- [AI.md](./AI.md) - YUKA AI systems
- [AGENTS.md](../AGENTS.md) - AI agent instructions

**Game Systems**
- [PHYSICS.md](./PHYSICS.md) - Physics engine
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Full implementation guide

**Visual Design**
- [BRAND.md](../BRAND.md) - Brand guidelines

### By Audience

**Developers:**
- IMPLEMENTATION.md - Architecture and implementation
- TESTING.md - Test infrastructure
- PHYSICS.md - Physics systems
- AI.md - AI behaviors

**AI Agents:**
- AGENTS.md - Universal instructions
- CLAUDE.md - Claude-specific instructions
- BRAND.md - Visual guidelines

**Designers:**
- BRAND.md - Complete visual identity
- AGENTS.md - Asset generation prompts

**QA/Testing:**
- TESTING.md - Test infrastructure and automation

---

*"Documentation is the foundation of collaboration. Clear docs enable every contributor."*
