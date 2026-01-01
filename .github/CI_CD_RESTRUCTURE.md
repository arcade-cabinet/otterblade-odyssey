# CI/CD Restructure - E2E Testing Strategy

## Overview

This document describes the restructured CI/CD pipeline that separates fast unit tests from comprehensive E2E tests, with E2E tests running once before merge in a protected environment.

## Changes Made

### 1. Control Center Coordination

**PR**: https://github.com/arcade-cabinet/control-center/pull/3

Moved `ci.yml` and `cd.yml` from `always-sync` to `initial-only` in the control center. This allows game repositories to customize their CI/CD workflows without being overridden by control center syncs.

### 2. CI Workflow (`ci.yml`)

**Before**: Ran lint, typecheck, unit tests, build, AND E2E tests on every push/PR

**After**: Only runs fast unit tests (lint, typecheck, unit tests, build)

- ✅ Fast feedback loop for developers
- ✅ Runs on every push/PR
- ✅ No E2E tests (moved to release-e2e.yml)

### 3. Release E2E Workflow (`release-e2e.yml`)

**Purpose**: Run comprehensive E2E tests once before merge to main

**Triggers**:
- PR events: `opened`, `synchronize`, `reopened`, `ready_for_review`
- Manual dispatch

**Features**:
- Runs in custom `release` environment (requires approval)
- Builds once, runs E2E tests
- Binary pass/fail result
- Automatically triggers `e2e-fixer.yml` on failure

**Environment**: `release`
- Custom environment with branch protection
- Only allows deployments from PRs targeting main
- Requires manual approval (can be configured)

### 4. Environment Sync Workflow (`environment-sync.yml`)

**Purpose**: Idempotently set up branch protection and custom environments

**Triggers**:
- Daily schedule (2 AM UTC)
- Manual dispatch
- Push to main (when workflow file changes)

**Actions**:
- Creates/updates `release` environment
- Applies branch protection rules to `main`:
  - Requires CI and Release E2E Tests to pass
  - Requires 1 PR approval
  - Requires conversation resolution
  - Prevents force pushes

**Idempotent**: Safe to run multiple times

### 5. E2E Fixer Workflow (`e2e-fixer.yml`)

**Purpose**: AI-powered assessment, triage, and auto-fixes for E2E failures

**Triggers**: Automatically by `release-e2e.yml` on failure

**Process**:
1. **Assess**: Downloads test artifacts, analyzes failures
2. **Triage**: Creates assessment comment on PR
3. **Fix**: Attempts automatic fixes (AI integration TODO)
4. **Retest**: Triggers `release-e2e.yml` on fix branch
5. **Update**: Comments on PR with results
6. **Reopen**: Reopens PR if still failing, adds labels

**Current Status**: Framework in place, AI fixer integration TODO

## Workflow Diagram

```
┌─────────────────┐
│   PR Created    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   CI Workflow   │────▶│  Unit Tests Only │
│   (Fast)        │     │  (Lint/Type/Build)│
└─────────────────┘     └──────────────────┘
         │
         │ PR Ready
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Release E2E     │────▶│  E2E Tests       │
│ (Release Env)   │     │  (Once, Protected)│
└────────┬────────┘     └──────────────────┘
         │
         │ Failure
         ▼
┌─────────────────┐     ┌──────────────────┐
│  E2E Fixer      │────▶│  AI Assessment   │
│  (Auto-fix)     │     │  Auto-fix/Retest  │
└─────────────────┘     └──────────────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│   Merge to Main │
└─────────────────┘
```

## Required Secrets

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `CI_GITHUB_TOKEN` | GitHub API access | All workflows (environment setup, PR comments, workflow dispatch) |
| `GITHUB_TOKEN` | Default GitHub token | Standard Actions operations |

**Note**: `CI_GITHUB_TOKEN` must have:
- `repo` scope (full repository access)
- `workflow` scope (trigger workflows)
- `write:packages` (if needed)

## Branch Protection Rules

The `main` branch is protected with:

- ✅ Required status checks:
  - `CI / Build & Lint`
  - `Release E2E Tests / E2E Tests (Release Environment)`
- ✅ Required PR reviews: 1 approval
- ✅ Conversation resolution required
- ✅ No force pushes
- ✅ No deletions

Applied idempotently by `environment-sync.yml`.

## Custom Environment: `release`

- **Name**: `release`
- **Purpose**: Gate E2E tests before merge
- **Branch Policy**: Custom (allows PRs targeting main)
- **Reviewers**: Configurable (empty by default)
- **Wait Timer**: 0 (no delay)

## Testing Strategy

### Unit Tests (Fast)
- **When**: Every push/PR
- **Duration**: ~1-2 minutes
- **Purpose**: Quick feedback on code quality
- **Location**: `ci.yml`

### E2E Tests (Comprehensive)
- **When**: Once before merge (PR ready for review)
- **Duration**: ~5-10 minutes
- **Purpose**: Full integration testing
- **Location**: `release-e2e.yml`
- **Environment**: `release` (protected)

## Next Steps

1. ✅ Control center PR created
2. ✅ CI workflow updated (unit tests only)
3. ✅ Release E2E workflow created
4. ✅ Environment sync workflow created
5. ✅ E2E fixer workflow created
6. ⏳ Merge control center PR
7. ⏳ Run `environment-sync.yml` to set up environment
8. ⏳ Test E2E workflow on a PR
9. ⏳ Integrate AI fixer into `e2e-fixer.yml` (TODO)

## AI Fixer Integration (TODO)

The `e2e-fixer.yml` workflow has a placeholder for AI-powered fixes. To integrate:

1. Add AI service (Claude API, GPT-4, or local Ollama)
2. Analyze test failures and code changes
3. Generate fixes
4. Apply fixes to code
5. Validate fixes don't break existing code
6. Commit and push fixes
7. Retest automatically

See `ai-fixer.yml` for reference pattern.

## Troubleshooting

### Environment not found
Run `environment-sync.yml` manually to create it.

### Branch protection not applied
Run `environment-sync.yml` manually to apply rules.

### E2E tests not running
Check that PR is targeting `main` and is in `ready_for_review` state.

### Fixer workflow not triggered
Check that `CI_GITHUB_TOKEN` has `actions: write` permission.

## References

- Control Center PR: https://github.com/arcade-cabinet/control-center/pull/3
- GitHub Environments: https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
- Branch Protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
