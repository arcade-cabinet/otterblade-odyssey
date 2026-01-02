# Workflow Orchestration Guide

## AI Review Pipeline Architecture

The Otterblade Odyssey repository uses a tiered AI review system that ensures efficient and effective code review:

### Tier 0: Automated Agents (Front-line Triage)
**Triggers:** PR open, PR sync
**Agents:** CodeRabbit, Gemini, Dependabot, Renovate

These agents run **first** and provide immediate feedback:
- CodeRabbit: Comprehensive code review with context awareness
- Gemini Code Assist: Google's AI code review
- Dependabot: Dependency security and updates
- Renovate: Automated dependency management

**Configuration:** `.coderabbit.yaml`

### Tier 1: Ollama Review (Fast, Cost-Effective)
**Triggers:** PR comments from automated agents, security events
**Tool:** control-center binary with Ollama backend

Ollama reviews run **after** automated agents complete and:
- Provide quick, AI-powered review
- Count suggestions for escalation decision
- Use local/cheap LLM models
- Escalate to Claude if >5 suggestions OR >500 lines changed

**Workflow:** `.github/workflows/ai-reviewer.yml`

### Tier 2: Claude Deep Review (Complex PRs)
**Triggers:** Escalation from Ollama (complex PRs)
**Tool:** Anthropic Claude via GitHub Action

Claude reviews provide:
- Deep semantic analysis
- Security vulnerability detection
- Performance optimization suggestions
- Architecture improvement recommendations

**Workflow:** `.github/workflows/ai-reviewer.yml` (claude-review job)

### Tier 3: Jules Refactor (Major Changes)
**Triggers:** >10 suggestions from Ollama
**Tool:** Google Jules API

Jules handles:
- Automated refactoring
- Creating follow-up PRs with fixes
- Addressing bulk review feedback

**Workflow:** `.github/workflows/ai-reviewer.yml` (jules-refactor job)

## Security Scanning

### CodeQL Analysis
**Triggers:** Push to main, PR open, scheduled daily, manual
**Tool:** GitHub CodeQL

CodeQL performs:
- SAST (Static Application Security Testing)
- Security vulnerability detection
- Code quality analysis
- Triggers AI review on security findings

**Workflow:** `.github/workflows/codeql.yml`

## CI/CD Pipeline

### CI (Fast Checks)
**Triggers:** Push, PR
**Jobs:**
1. Build & Lint
2. Unit Tests
3. Coverage Upload

**Workflow:** `.github/workflows/ci.yml`

### Release Gate (E2E Tests)
**Triggers:** Merge queue only
**Jobs:**
1. E2E Tests (with video capture)
2. AI Triage (on failure)

**Workflow:** `.github/workflows/release-gate.yml`

**Key Feature:** Video capture enabled for gameplay verification
- Videos saved to `test-results/` and `playwright-report/`
- Retained for 30 days
- Helps debug E2E test failures

### CD (Deployment)
**Triggers:** Push to main, release published, manual
**Jobs:**
1. Detect Stack (Node/Python/Rust/Go)
2. Build (Node.js/TypeScript)
   - Build client for GitHub Pages
   - Generate TypeDoc documentation
   - Upload artifacts
3. Deploy to GitHub Pages
4. Build Android APKs (arm64, arm32, x86_64)
5. Release Android APKs (on release events)
6. Sync Documentation to Org Portal

**Workflow:** `.github/workflows/cd.yml`

## Workflow Trigger Flow

```
PR Opened
    ↓
CodeRabbit/Gemini Review (Tier 0)
    ↓
[Automated Agent Comments]
    ↓
Ollama Review (Tier 1) ← Triggered by comments
    ↓
[Decision Point: Needs Escalation?]
    ├─ Yes → Claude Review (Tier 2)
    │           ↓
    │       [>10 suggestions?]
    │           ├─ Yes → Jules Refactor (Tier 3)
    │           └─ No → Done
    └─ No → Done

Parallel:
├─ CI: Build + Lint + Unit Tests
├─ CodeQL: Security Scanning
│     ↓
│  [Security Findings?]
│     └─ Yes → Trigger AI Review
└─ Done

Merge Queue Entered
    ↓
Release Gate: E2E Tests (with video)
    ↓
[Pass/Fail]
    ├─ Pass → Merge to main
    │           ↓
    │        CD: Deploy to GitHub Pages
    │           ↓
    │        [Game Live at: arcade-cabinet.github.io/otterblade-odyssey/]
    └─ Fail → Remove from queue
                ↓
             AI Fixer Triggered
```

## Environment Setup

### Secrets Required
- `GITHUB_TOKEN`: Automatic (provided by GitHub)
- `CI_GITHUB_TOKEN`: Personal access token for cross-repo operations
- `ANTHROPIC_API_KEY`: Claude API key (optional, for Tier 2)
- `OLLAMA_API_KEY`: Ollama API key (optional, for Tier 1)
- `GOOGLE_JULES_API_KEY`: Jules API key (optional, for Tier 3)

### Repository Settings
- **Branch Protection:** Main branch requires:
  - E2E Tests passing
  - Build & Lint passing
  - Merge queue enabled
  - Required deployment: release environment
- **Environments:**
  - `release`: Release gate E2E tests
  - `github-pages`: Production deployment

## Testing the Pipeline

### Local Testing
```bash
# Install dependencies
pnpm install

# Run linter
pnpm lint

# Run unit tests
pnpm test:unit

# Build for production
pnpm build:client

# Run E2E tests (headless)
pnpm test:e2e

# Run E2E tests with video capture
PLAYWRIGHT_MCP=true pnpm test:e2e
```

### CI Testing
1. Create a PR
2. Wait for CodeRabbit/Gemini to review
3. Add a comment (triggers Ollama if from automated agent)
4. Watch CI/CD pipeline execute
5. Add to merge queue
6. Watch release gate E2E tests
7. Merge completes → Deployment to GitHub Pages

## Maintenance

### Updating Workflows
1. Run `actionlint .github/workflows/*.yml` to validate syntax
2. Test changes in a PR before merging
3. Monitor workflow runs in Actions tab

### Monitoring
- Check Actions tab for workflow status
- Review CodeQL alerts in Security tab
- Check E2E test videos in artifacts
- Monitor deployment at arcade-cabinet.github.io/otterblade-odyssey/

## Troubleshooting

### AI Review Not Triggering
- Check that comment is from automated agent (coderabbitai, gemini-code-assist, etc.)
- Verify API keys are configured
- Check workflow run logs

### E2E Tests Failing
- Download video artifacts from workflow run
- Check `playwright-report/` for details
- Review console errors in test output
- Verify WebGL/GPU settings

### Deployment Failing
- Check build artifacts were uploaded
- Verify GitHub Pages is enabled in repo settings
- Check Pages deployment environment configuration
- Review CD workflow logs

## Best Practices

1. **Let automated agents run first** - CodeRabbit and Gemini provide fast, free feedback
2. **Use merge queue** - Ensures E2E tests pass before merge
3. **Review video artifacts** - Gameplay videos help debug issues
4. **Monitor security alerts** - CodeQL findings trigger AI review automatically
5. **Keep workflows updated** - Run actionlint regularly
