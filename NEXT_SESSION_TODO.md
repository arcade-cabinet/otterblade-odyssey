# Next Session TODO - CRITICAL WORK REQUIRED

**Last Updated:** 2026-01-02 by @copilot  
**Branch:** `copilot/fix-workflows-and-automation`  
**Status:** Infrastructure done, CRITICAL issue discovered

---

## 🚨 THE CRITICAL PROBLEM

**User spotted it immediately from screenshots:** The game is using **REPLIT JUNK PNG/MP4 ASSETS** instead of **PROCEDURAL GENERATION** as proven in the POC.

### Evidence
- User saw screenshot showing `pixel_art_otter_warrior_holding_a_glowing_sword.png`
- User knows what POC otter looks like vs Replit junk otter
- Current game = wrong otter, wrong everything

### What's Wrong
```
❌ client/src/game/components/PlayerSprite.tsx
   Line 10: import otterSprite from '@assets/generated_images/...'
   
❌ client/src/components/hud/ChapterPlate.tsx
   Imports 10 PNG chapter plate images
   
❌ client/src/components/hud/CinematicPlayer.tsx
   Imports MP4 video files
   
❌ All of attached_assets/
   Replit junk to be deleted
```

---

## ✅ What's Done (Infrastructure)

- [x] Workflow orchestration fixed
- [x] Test API integrated (`client/src/game/test-api.ts`)
- [x] Copilot instructions updated with session handoff protocol
- [x] Active engagement protocol documented
- [x] 161 unit tests passing
- [x] Build successful
- [x] Security: 0 CodeQL alerts
- [x] Dev server working (port 5174)

---

## 📋 YOUR ACTION PLAN

### Step 1: Understand POC (15 minutes)

1. Open `pocs/otterblade_odyssey.html` in browser
2. Look at lines 200-500 showing procedural rendering
3. See how player/enemies are drawn with canvas (NO PNGs)
4. Understand Matter.js bodies → canvas rendering pipeline

**Key POC Code:**
```javascript
// Around line 300-400
function drawOtter(ctx, body) {
  // Draws otter procedurally using canvas
  // Head, body, limbs, tail - all canvas shapes
  // NO sprite loading, NO PNGs
}
```

### Step 2: Replace Player Sprite (30 minutes)

**File:** `client/src/game/components/PlayerSprite.tsx`

**Current (WRONG):**
```typescript
import otterSprite from '@assets/generated_images/...png';
// Uses texture mapping to PNG
```

**Should Be:**
```typescript
// Use Canvas2D or THREE.js shapes to draw otter procedurally
// Like POC but adapted to React Three Fiber
// OR use canvas texture generated procedurally
```

### Step 3: Replace Chapter Plates (20 minutes)

**File:** `client/src/components/hud/ChapterPlate.tsx`

**Current (WRONG):**
```typescript
import prologuePlate from '@assets/generated_images/...png';
// 10 PNG imports
```

**Should Be:**
```typescript
// Render text + decorative elements on canvas
// Or use CSS/SVG for text overlays
// NO static image imports
```

### Step 4: Replace Cinematics (20 minutes)

**File:** `client/src/components/hud/CinematicPlayer.tsx`

**Current (WRONG):**
```typescript
import introVideo from '@assets/videos/...mp4';
```

**Should Be:**
```typescript
// Canvas-based animation sequence
// Procedural transitions between scenes
// NO video files
```

### Step 5: Clean Up Junk (5 minutes)

```bash
# Delete Replit junk
rm -rf attached_assets/generated_images/
rm -rf attached_assets/generated_videos/

# Update .gitignore to prevent re-adding
echo "attached_assets/generated_*" >> .gitignore
```

### Step 6: Validate and Show Proof (30 minutes)

1. Start dev server: `pnpm run dev:client`
2. Open in Playwright MCP
3. **Take screenshots** showing procedural otter
4. Compare to POC otter (should match style)
5. **User will know immediately if correct!**

### Step 7: Run Journey Tests (30 minutes)

```bash
pnpm test:journey:mcp
```

Capture video showing procedural generation working through all chapters.

---

## 🎯 Success Criteria

You'll know it's working when:

1. **Visual Test:** Otter looks like POC, NOT like Replit PNG
2. **Code Test:** No PNG/MP4 imports in game code
3. **User Test:** User sees screenshots and says "THAT'S the POC otter!"
4. **Performance:** Faster load (no large assets)
5. **Video Test:** Complete journey captured showing procedural rendering

---

## 🔍 How to Verify Procedural Generation

### In POC (`pocs/otterblade_odyssey.html`):
- Line ~350: `drawOtterBody()` - procedural shapes
- Line ~400: `drawOtterHead()` - procedural shapes
- Line ~450: `drawOtterLimbs()` - procedural animation

### Should Look Like:
- Canvas-drawn shapes forming otter silhouette
- Smooth animation (procedural interpolation)
- Warm colors (browns, golds)
- Redwall-inspired aesthetic

### Should NOT Look Like:
- Pixelated PNG sprite
- Static image with texture filtering
- Generic game asset style

---

## 📝 Commit Strategy

After each major component replaced:

```bash
git add -A
git commit -m "Replace [component] with procedural generation from POC

- Remove PNG/MP4 imports
- Implement canvas-based rendering
- Match POC visual style
- User-validated with screenshot proof"

git push
```

---

## ⚠️ Watch Out For

1. **Three.js vs Canvas2D:** POC uses Canvas2D, game uses Three.js - adapt accordingly
2. **React patterns:** POC is vanilla JS, need React hooks (useFrame, useRef)
3. **Performance:** Procedural drawing should be cached/optimized
4. **Texture generation:** Can create procedural texture once, reuse
5. **Animation state:** POC uses simple state machine, adapt to game store

---

## 📞 If You Get Stuck

1. **Look at POC code** - It's working proof of concept
2. **Show user screenshots** - They'll tell you if it looks right
3. **Test incrementally** - Replace one component at a time
4. **Commit often** - Easy to rollback if needed

---

## 🎉 When Complete

Update PR description with:
- ✅ All static assets removed
- ✅ Procedural generation validated
- 📸 Screenshots showing POC-style otter
- 🎥 Video of complete journey with procedural rendering

**User will be able to SEE immediately that it's working!**

---

**Remember:** User can't review code, only screenshots/videos. Show visual proof!
