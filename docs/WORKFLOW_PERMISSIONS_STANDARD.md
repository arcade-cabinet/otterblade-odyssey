# GitHub Actions Workflow Permissions Standard

## Overview
This document defines the standard permission pattern for all GitHub Actions workflows in this repository, particularly those using Claude/Anthropic and other AI agents.

## The Standard Pattern

### ✅ CORRECT: Workflow-Level Restriction, Job-Level Grants

```yaml
name: Example Workflow

on:
  pull_request:
    types: [opened, synchronize]

# Restrict at workflow level - no permissions by default
permissions: {}

jobs:
  job-one:
    name: First Job
    runs-on: ubuntu-latest
    # Grant minimal permissions needed for THIS job only
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      # ...

  job-two:
    name: Second Job  
    runs-on: ubuntu-latest
    # Different job, different permissions
    permissions:
      contents: write
      issues: write
      id-token: write
    steps:
      # ...
```

### ❌ WRONG: Workflow-Level Grants

```yaml
name: Bad Example

on:
  pull_request:
    types: [opened, synchronize]

# WRONG: Granting permissions at workflow level
# This gives ALL jobs these permissions, even if they don't need them
permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  job-one:
    # Inherits all workflow permissions (too broad!)
    runs-on: ubuntu-latest
    steps:
      # ...
```

## Why This Pattern?

### Security: Principle of Least Privilege
- Each job only gets the exact permissions it needs
- Compromised job can't affect other jobs or repo areas it shouldn't access
- Easier to audit what each job can do

### Maintainability
- Clear documentation of what each job does (permissions tell the story)
- Easy to add/remove jobs without affecting others
- No hidden permission inheritance to reason about

### Consistency
- Same pattern across all workflows
- Easy for new contributors to understand
- Reduces cognitive load when reviewing workflows

## Permission Guidelines by Job Type

### Read-Only Review Jobs
```yaml
permissions:
  contents: read
  pull-requests: write  # Can comment, but not merge/close
```

**Use for:** Initial code review, linting results, test reports

### Interactive AI Jobs (Claude/Anthropic)
```yaml
permissions:
  contents: write        # Can commit changes
  pull-requests: write   # Can comment and update PR
  id-token: write       # For OIDC authentication
```

**Use for:** Claude code changes, automated fixes, refactoring

### Issue Triage Jobs
```yaml
permissions:
  contents: read
  issues: write
```

**Use for:** Issue labeling, assignment, triage bots

### Delegation Jobs (Jules/Cursor)
```yaml
permissions:
  contents: read
  issues: write         # Can comment on issues
```

**Use for:** External agent delegation, session creation

### Detection/Status Jobs
```yaml
permissions:
  pull-requests: read
  checks: read
  actions: read
```

**Use for:** Detecting events, checking CI status, reading metadata

## Migration Checklist

When updating an existing workflow:

- [ ] Verify workflow has `permissions: {}` at top level
- [ ] Check each job has explicit `permissions:` block
- [ ] Grant only minimal permissions needed for job
- [ ] Validate YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('workflow.yml'))"`
- [ ] Test workflow runs successfully
- [ ] Document any special permission requirements in comments

## Common Permissions Reference

| Permission | Read | Write | What It Allows |
|------------|------|-------|----------------|
| `contents` | ✓ | | Read repo files, clone |
| `contents` | | ✓ | Commit, push changes |
| `pull-requests` | ✓ | | View PR details, read comments |
| `pull-requests` | | ✓ | Comment, approve, merge PRs |
| `issues` | ✓ | | View issues and comments |
| `issues` | | ✓ | Create/edit issues, comment, label |
| `checks` | ✓ | | View CI/CD status |
| `checks` | | ✓ | Create/update check runs |
| `actions` | ✓ | | View workflow runs |
| `actions` | | ✓ | Trigger workflow runs |
| `id-token` | | ✓ | Required for OIDC (Anthropic, etc) |

## Examples in This Repo

### ✅ Perfect Examples
- `claude-pr-manager.yml` - Workflow-level `{}`, job-level grants
- `claude-autoheal.yml` - Different permissions per job
- `ai-fixer.yml` - Complex multi-job with appropriate permissions

### ✅ Recently Fixed
- `ecosystem-reviewer.yml` - Migrated from workflow-level to job-level
- `ecosystem-delegator.yml` - Migrated from workflow-level to job-level  
- `review.yml` - Migrated from workflow-level to job-level

## Enforcement

To maintain this standard:

1. **Code Review**: All new/modified workflows must follow this pattern
2. **Documentation**: Keep this doc updated with new permission types
3. **Validation**: Use CI to check workflows have `permissions: {}` at top level
4. **Examples**: Reference good examples when adding new workflows

## Questions?

If you're unsure what permissions a job needs:
1. Start with `contents: read` only
2. Run the workflow and check for permission errors
3. Add only the specific permissions that failed
4. Document why each permission is needed in a comment

## Related Documents

- [WORKFLOW_FIXES.md](../WORKFLOW_FIXES.md) - History of permission fixes
- [GitHub Actions Permissions Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)
