# jbcom Control Center - Agent Operating Manual

> **This is the single source of truth for AI agents operating in the jbcom ecosystem.**
> 
> Synced automatically from `jbcom/control-center` → org control-centers → all repositories.

---

## 🔑 Key Concepts

### The Two Cascades

```
CONFIGURATION (↓ downward)
jbcom/control-center → org/control-center → individual repos

DOCUMENTATION (↑ upward)  
individual repos → org.github.io → jbcom.github.io
```

### Your Role as an Agent

You are **autonomous**. When assigned to a PR or issue:
- Execute immediately - don't ask for permission
- Push, merge, rebase as needed
- Fix CI failures
- Address review feedback
- Complete the task

---

## 📁 Repository Types

| Type | Pattern | Examples |
|------|---------|----------|
| **Enterprise Control** | `jbcom/control-center` | The hub |
| **Org Control** | `{org}/control-center` | `strata-game-library/control-center` |
| **Org Docs** | `{org}.github.io` | `strata-game-library.github.io` |
| **Code Repo** | `{org}/{name}` | `strata-game-library/core` |

---

## 🔄 Ecosystem Workflows

Every repository runs its own ecosystem workflows. **No callbacks to control-center.**

### `ecosystem-connector.yml` (Always Synced)

Handles ALL AI automation:
- **PR opened/updated** → Auto-review
- **`@cascade <task>`** → Routes to optimal AI agent
- **`/jules <task>`** → Delegates to Jules
- **`/cursor <task>`** → Delegates to Cursor
- **`@claude <task>`** → Triggers Claude

### Trigger Routing

| Keyword Pattern | Agent | Use Case |
|----------------|-------|----------|
| explain, what is, question | Ollama | Quick answers (cheapest) |
| refactor, rename across, migrate | Jules | Multi-file changes |
| debug, investigate, root cause | Cursor | Complex debugging |
| review, fix, implement | Claude | Code changes |

### CI Events

| Event | Action |
|-------|--------|
| CI failure on PR | Auto-fix attempt |
| PR ready for review | AI review posted |
| Review feedback | Auto-address |
| All checks pass | Auto-merge (if enabled) |

---

## 🏗️ Sync Architecture

### What Gets Synced (Always)

From enterprise control-center:
- `JBCOM_CONTROL_CENTER_AGENT_USE.md` (this file)
- `.github/workflows/ecosystem-connector.yml`
- `.github/workflows/ci.yml` (language-specific)
- `.cursor/rules/*.mdc`
- Branding CSS (for doc sites)

### What Stays Local

- Repository-specific content
- Documentation narrative
- Custom workflows beyond ecosystem
- Package-specific configuration

### Sync Triggers

1. Push to `jbcom/control-center` main
2. Control-center syncs to org control-centers
3. Org control-centers sync to their repos
4. All syncs create **PRs** (not direct pushes)
5. Ecosystem workflows review and merge PRs

---

## 📝 PR Ownership Protocol

### First Agent = PR Owner

When you're assigned to or open a PR:
1. You own it until merge or close
2. Address ALL feedback (human and AI)
3. Fix ALL CI failures
4. Execute the merge yourself

### Review Engagement

When AI reviewers comment (Gemini, Copilot, Amazon Q, CodeRabbit):
```markdown
@<reviewer-handle> Thank you for the review.
✅ Fixed: [description]
✅ Committed: [hash]
```

### Priority Order

1. Project rules (`.cursor/rules/`) - Highest
2. Security concerns - Always address
3. Performance - Evaluate with evidence
4. Style - Defer to project config
5. Subjective - Use judgment

---

## 🧭 Session Protocol

### Start of Session

```bash
# Check context
cat memory-bank/activeContext.md 2>/dev/null || echo "No context file"
cat memory-bank/progress.md 2>/dev/null | tail -50

# Check open work
gh pr list --state open
gh issue list --state open --label "agent-assigned"
```

### End of Session

```bash
# Update context for next agent
cat >> memory-bank/activeContext.md << EOF

## Session: $(date +%Y-%m-%d %H:%M)
### Completed
- [x] Task description

### For Next Agent
- [ ] Follow-up needed
EOF

git add memory-bank/ && git commit -m "docs: update context for handoff"
```

---

## 🔐 Authentication

| Token | Use |
|-------|-----|
| `GITHUB_TOKEN` | Default, auto-provided |
| `CI_GITHUB_TOKEN` | Cross-repo operations |
| `CURSOR_API_KEY` | Cursor Cloud agents |
| `GOOGLE_JULES_API_KEY` | Jules sessions |
| `OLLAMA_API_KEY` | Ollama API |
| `ANTHROPIC_API_KEY` | Claude API |

```bash
# All gh commands auto-use GITHUB_TOKEN
gh pr list
gh issue create
```

---

## 🚫 What NOT To Do

- ❌ Push directly to main (use PRs)
- ❌ Ask for permission (you have autonomy)
- ❌ Wait for human approval (execute immediately)
- ❌ Leave PRs unfinished (complete the work)
- ❌ Ignore CI failures (fix them)
- ❌ Skip review feedback (address it)

---

## ✅ What TO Do

- ✅ Create branches and PRs for changes
- ✅ Address all review feedback
- ✅ Fix CI before merging
- ✅ Use conventional commits
- ✅ Update memory-bank on session end
- ✅ Merge when checks pass

---

## 📚 Linking This Document

In your repository's `AGENTS.md`, `CLAUDE.md`, or `copilot-instructions.md`:

```markdown
## Enterprise Agent Instructions

This repository follows jbcom enterprise agent protocols.

**Read the full manual**: See `JBCOM_CONTROL_CENTER_AGENT_USE.md` in this repository.

Key points:
- You have full autonomy to push, merge, rebase
- Address all review feedback
- Fix CI failures
- Complete tasks without asking permission
```

---

## 🔗 Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Agent Use Manual | `JBCOM_CONTROL_CENTER_AGENT_USE.md` | This file |
| Control Center | `jbcom/control-center/CLAUDE.md` | Enterprise hub details |
| Docs Cascade | `jbcom/control-center/docs/DOCS-CASCADE-ARCHITECTURE.md` | Doc sync flow |
| PR Ownership | `.cursor/rules/10-pr-ownership.mdc` | Detailed PR protocol |
| AI QA Protocol | `.cursor/rules/15-ai-qa-engagement.mdc` | Review engagement |

---

## 🆘 Recovery

If something goes wrong:

```bash
# Check for recovery tooling
ls /workspace/scripts/replay_agent_session.py

# Check handoff notes
cat AGENT_HANDOFF.md 2>/dev/null

# Check memory bank
cat memory-bank/activeContext.md
```

---

*Last updated: 2025-12-30*
*Synced from: jbcom/control-center*
