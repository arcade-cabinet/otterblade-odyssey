# Asset Generation Agent Instructions

## Role

Focus on generating, validating, and maintaining all visual assets for Otterblade Odyssey using the manifest-driven pipeline.

## Responsibilities

- Generate missing assets using `@otterblade/dev-tools` CLI
- Validate assets against brand guidelines (BRAND.md)
- Update manifest status fields after generation
- Audit cinematics for brand violations
- Maintain consistency across all visual content
- **Respect approved assets** - never regenerate assets marked as approved

---

## Asset Approval Workflow (CRITICAL)

### How Idempotency Works

Assets are considered **idempotent** (won't regenerate) when:
1. The asset exists AND has `approval.approved: true` in the manifest
2. OR the asset ID appears in `client/src/data/approvals.json`

### Workflow Steps

```
1. GENERATE  → pnpm --filter @otterblade/dev-tools cli
2. DEPLOY    → Push to main, CD builds and deploys to GitHub Pages
3. REVIEW    → Visit https://jbdevprimary.github.io/otterblade-odyssey/assets
4. APPROVE   → Select assets, click "Approve Selected"
5. CREATE PR → Click "🚀 Create PR on GitHub" (opens GitHub with content pre-filled)
6. COMMIT    → Create new branch, commit → PR is created automatically
7. MERGE     → Approved assets are now locked (idempotent)
```

### Before Generating Assets

Always check approval status:

```typescript
// Pseudo-code for generation logic
if (asset.approval?.approved === true) {
  console.log(`Skipping ${asset.id} - already approved`);
  continue;
}

if (approvalsJson.approvals.find(a => a.id === asset.id)) {
  console.log(`Skipping ${asset.id} - in approvals.json`);
  continue;
}

// Only generate if not approved
await generateAsset(asset);
```

### Asset Review Gallery

Available at: `https://jbdevprimary.github.io/otterblade-odyssey/assets`

Features:
- Grid view of all assets by category
- Click to preview (video player, sprite animator)
- Checkbox selection (single, batch, all)
- Approve/Reject buttons
- **"Create PR on GitHub"** button → Opens GitHub with approvals pre-filled
- LocalStorage persistence for selections

## Critical Brand Rules (ENFORCE ALWAYS)

### REQUIRED

- **Anthropomorphic woodland animals ONLY** - Every character must be an animal
- **Protagonist: Finn the otter warrior** - Brown fur, cream chest, leather vest, iron sword
- **Warm storybook aesthetic** - Moss, stone, lantern light, cloth, leather
- **Willowmere Hearthhold setting** - Ancient riverside sanctuary

### FORBIDDEN (Flag as `needs_regeneration`)

- Human characters of ANY kind (knights, villagers, soldiers)
- Neon, electric, or glowing energy effects
- Sci-fi or futuristic elements
- Horror, grimdark, or demonic imagery
- Anime or JRPG styling
- Modern objects or clothing

## Manifest System

### File Locations

```
client/src/data/manifests/
├── sprites.json      # Player sprite sheet (OpenAI)
├── enemies.json      # 5 enemy types (OpenAI)
├── cinematics.json   # 10 chapter videos (Google Veo)
└── scenes.json       # 8 parallax backgrounds (Google Imagen)
```

### Status Workflow

```
pending → [generate] → complete
              ↓
      needs_regeneration → [regenerate] → complete
```

### Updating Status

After validating an asset, update its status in the manifest:

```json
{
  "id": "intro_cinematic",
  "status": "needs_regeneration",
  "reason": "Contains human characters instead of anthropomorphic animals"
}
```

## Commands Reference

### Generation

```bash
# Generate all missing
pnpm --filter @otterblade/dev-tools cli

# Generate by category
pnpm --filter @otterblade/dev-tools cli -- --category sprites
pnpm --filter @otterblade/dev-tools cli -- --category enemies
pnpm --filter @otterblade/dev-tools cli -- --category cinematics
pnpm --filter @otterblade/dev-tools cli -- --category scenes

# Preview only
pnpm --filter @otterblade/dev-tools cli -- --dry-run

# Force regeneration
pnpm --filter @otterblade/dev-tools cli -- --force --id <asset_id>

# Rate limit (cost control)
pnpm --filter @otterblade/dev-tools cli -- --max-items 3
```

### Validation

```bash
# Check all assets exist
pnpm validate:assets

# Audit cinematics for brand violations
pnpm audit:cinematics

# Analyze sprite quality
pnpm analyze:sprite path/to/sprite.png

# Analyze video compliance
pnpm analyze:video path/to/video.mp4
```

## Provider Selection

| Asset Type | Provider | Model | Reason |
|------------|----------|-------|--------|
| Sprites | OpenAI | gpt-image-1 | Transparency, grid layout, masking |
| Enemies | OpenAI | gpt-image-1 | Consistent style matching player |
| Cinematics | Google | veo-3.1 | Native audio, longer duration |
| Scenes | Google | imagen-3.0 | Painterly style, wide format |

## GitHub Actions Workflow

The `assets.yml` workflow automates generation:

1. Trigger: `workflow_dispatch` (manual from Actions tab)
2. Inputs:
   - `category`: sprites, enemies, cinematics, scenes, or empty for all
   - `force`: Regenerate existing assets
   - `dry_run`: Preview only
   - `max_items`: Limit for cost control
3. Creates PR with generated assets
4. PR includes brand compliance checklist

## Cost Awareness

| Category | Estimated Cost |
|----------|----------------|
| Sprites (1 item) | ~$0.04-0.08 |
| Enemies (5 items) | ~$0.20-0.40 |
| Cinematics (10 items) | ~$2.50 |
| Scenes (8 items) | ~$0.24 |

Always use `--dry-run` first to preview costs.

## Key Files

| File | Purpose |
|------|---------|
| `packages/dev-tools/src/cli.ts` | Main CLI entry point |
| `packages/dev-tools/src/manifest-generator.ts` | Generation logic |
| `packages/dev-tools/src/shared/prompts.ts` | Brand-aligned prompts |
| `packages/dev-tools/src/shared/config.ts` | API clients, model IDs |
| `packages/dev-tools/src/validate-assets.ts` | Asset validation |
| `packages/dev-tools/src/audit-cinematics.ts` | Brand compliance audit |

## Prompt Engineering

All prompts in `prompts.ts` include:

1. **STYLE_DIRECTIVE**: Core storybook aesthetic rules
2. **FINN_DESCRIPTION**: Consistent protagonist description
3. **Category-specific builders**: `getPlayerSpritePrompt()`, `getCinematicPrompt()`, etc.

When updating prompts, always maintain:
- The NO HUMANS requirement
- Anthropomorphic woodland animals emphasis
- Warm, grounded material descriptions
- Willowmere Hearthhold context

## See Also

- [BRAND.md](../BRAND.md) - Complete visual style guide
- [WORLD.md](../WORLD.md) - World-building and lore
- [packages/dev-tools/README.md](../packages/dev-tools/README.md) - CLI documentation
