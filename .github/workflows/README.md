# Workflow Orchestration Guide

## 🤖 Claude PR Manager System (NEW)

**The Otterblade Odyssey repository now uses Claude as the central PR manager** that orchestrates all AI agent feedback and manages the PR lifecycle.

### Architecture Overview

```
PR Opened
    ↓
Claude Initial Review (claude-review.yml)
    ↓
AI Agents Post Feedback (CodeQL, CodeRabbit, CI failures, etc.)
    ↓
Claude Auto-Heal (claude-autoheal.yml)
    ↓
Claude PR Manager (claude-pr-manager.yml)
    ↓
Approval & Auto-Merge
```

### Core Workflows

#### 1. Claude PR Manager (`.github/workflows/claude-pr-manager.yml`)
**The central orchestrator** for all PRs.

**Triggers:**
- PR opened, synchronized, reopened, ready for review
- Issue comments on PRs
- PR reviews submitted
- PR review comments

**Modes:**
- **Collaborative Mode** (for `copilot/*` and `jules/*` branches):
  - Claude coordinates via comments
  - Tags the creating agent (@copilot or @jules)
  - Does NOT make direct code changes
  - Synthesizes all AI feedback into actionable items
  - Approves only when agent confirms fixes
  
- **Autonomous Mode** (for all other PRs):
  - Claude has full authority to make changes
  - Directly fixes issues found by AI agents
  - Continuously iterates until all checks pass
  - Approves and enables auto-merge when ready

**Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- 73% SWE-bench score (matches Sonnet 4)
- $1/$5 per million tokens (5x cheaper than Opus 4.5)
- 2x faster than Sonnet

#### 2. Claude Auto-Heal (`.github/workflows/claude-autoheal.yml`)
**Continuous healing** when AI agents post feedback.

**Triggers:**
- Issue comments on PRs (from CodeRabbit, Gemini, etc.)
- PR reviews submitted
- Check runs fail
- Workflow runs fail

**Actions:**
- Detects AI agent feedback automatically
- Determines PR strategy (collaborative vs autonomous)
- Responds appropriately:
  - **Collaborative**: Posts synthesized feedback for agent
  - **Autonomous**: Implements fixes directly

**Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

#### 3. Claude Initial Review (`.github/workflows/claude-review.yml`)
**Fast initial review** when PR is opened.

**Triggers:**
- PR opened (not draft)

**Focus Areas:**
- Code quality & best practices
- Security vulnerabilities
- Performance implications
- Test coverage
- Documentation completeness

**Output:**
- Inline comments for specific issues
- Summary comment with overall assessment

**Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

### Configuration

**File:** `.github/claude-config.json`

Key settings:
- **Models:** All workflows use Claude Haiku 4.5 for optimal cost/performance
- **Branch strategies:** Collaborative for `copilot/*` and `jules/*`, autonomous for others
- **Auto-merge:** Enabled after all success criteria met
- **Healing:** Continuous, max 50 iterations, 45min timeout
- **Trusted AI agents:** CodeQL, CodeRabbit, Gemini, Copilot, Jules, Dependabot, Renovate

### Required Secrets

To enable Claude PR Manager, configure these repository secrets:

1. **`ANTHROPIC_API_KEY`** (Required)
   - Your Anthropic API key for Claude access
   - Get from: https://console.anthropic.com/
   - Permissions: All workflows need this

2. **`CI_GITHUB_TOKEN`** (Required)
   - Synced Personal Access Token with enhanced permissions
   - Needed for: Cross-repo operations, enhanced API access, workflow execution
   - This is a required synced PAT and must be configured

### Success Criteria

Before Claude approves and merges a PR:
- ✅ All workflows passing (CI, Build, Test)
- ✅ All AI agent feedback addressed
- ✅ No security vulnerabilities (Critical or High)
- ✅ Code quality standards met
- ✅ No merge conflicts

### Working with Claude PR Manager

#### For GitHub Copilot

When you create PRs on `copilot/*` branches:
1. Claude reviews and posts initial feedback
2. Other AI agents may also comment
3. Claude synthesizes all feedback and tags you: `@copilot`
4. You address the feedback with new commits
5. Comment when done: `@claude ready for re-review`
6. Claude re-reviews and approves when ready

See `.github/copilot-instructions.md` for detailed guidance.

#### For Standard PRs

On non-agent branches, Claude operates autonomously:
1. Claude reviews the PR
2. Gathers feedback from all AI agents
3. Implements fixes directly
4. Iterates until all criteria met
5. Approves and enables auto-merge

### Legacy Workflows (Deprecated)

The following workflows have been **removed** and replaced by Claude PR Manager:
- ~~`ai-curator.yml`~~ → Use Claude PR Manager
- ~~`ai-delegator.yml`~~ → Use Claude PR Manager
- ~~`ai-fixer.yml`~~ → Use Claude Auto-Heal
- ~~`ai-reviewer.yml`~~ → Use Claude Initial Review
- ~~`autoheal.yml`~~ → Use Claude Auto-Heal
- ~~`delegator.yml`~~ → Use Claude PR Manager

The following ecosystem workflows remain but **defer to Claude** for PR management:
- `ecosystem-merge.yml` - Follows Claude's merge decisions
- `ecosystem-control.yml` - Handles non-PR @cascade commands
- `ecosystem-fixer.yml` - Legacy, superseded by Claude Auto-Heal
- `ecosystem-reviewer.yml` - Legacy, superseded by Claude reviews
- `ecosystem-agents.yml` - Scheduled maintenance (not PR-specific)

---

## AI Review Pipeline Architecture (Legacy - Pre-Claude Manager)

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
