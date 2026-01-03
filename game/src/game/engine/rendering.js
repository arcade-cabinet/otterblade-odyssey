/**
 * Rendering System
 * Handles all game scene rendering
 */

import { drawBoss, drawEnemy, drawNPC } from '../rendering/enemies';
import { drawFinn } from '../rendering/finn';

/**
 * Create scene renderer
 * @param {Object} params - Renderer parameters
 * @returns {Function} - Render function
 */
export function createSceneRenderer(params) {
  const {
    manifest,
    player,
    platforms,
    walls,
    ceilings,
    interactions,
    waterZones,
    lanternSystem,
    bellSystem,
    hearthSystem,
    flowPuzzles,
    timingSequences,
    collectibles,
    aiManager,
  } = params;

  return function renderScene(ctx, camera, animFrame, playerFacing, bossAI) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const biome = manifest.level?.biome || 'abbey';
    const bgColors = {
      village: '#2C3E50',
      forest: '#1a3a1a',
      abbey: '#1a1a24',
      catacombs: '#0d0d15',
    };
    ctx.fillStyle = bgColors[biome] || '#1a1a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw platforms
    for (const platform of platforms) {
      const bounds = platform.body.bounds;
      const type = platform.def.type;
      ctx.fillStyle = type === 'wood' ? '#8B4513' : '#696969';
      ctx.strokeStyle = type === 'wood' ? '#654321' : '#505050';
      ctx.lineWidth = 2;
      ctx.fillRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
      ctx.strokeRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
    }

    // Draw walls
    for (const wall of walls) {
      const bounds = wall.body.bounds;
      ctx.fillStyle = '#5D4E37';
      ctx.strokeStyle = '#4A3C2B';
      ctx.lineWidth = 2;
      ctx.fillRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
      ctx.strokeRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
    }

    // Draw ceilings
    for (const ceiling of ceilings) {
      const bounds = ceiling.body.bounds;
      ctx.fillStyle = '#8B7355';
      ctx.strokeStyle = '#6B5A45';
      ctx.lineWidth = 2;
      ctx.fillRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
      ctx.strokeRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y
      );
    }

    // Draw interactions
    for (const interaction of interactions) {
      const pos = interaction.body.position;
      const type = interaction.def.type;

      ctx.save();
      ctx.translate(pos.x, pos.y);

      if (type === 'shrine' || type === 'hearth') {
        // Hearth with animated flame
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(0, 0, 20 + Math.sin(animFrame * 0.1) * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -5, 10 + Math.sin(animFrame * 0.15) * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'door') {
        // Door
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-25, -35, 50, 70);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(-25, -35, 50, 70);
      }

      ctx.restore();
    }

    // Draw water zones
    for (const waterZone of waterZones) {
      ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
      ctx.fillRect(
        waterZone.region.x,
        waterZone.region.y,
        waterZone.region.width,
        waterZone.region.height
      );
    }

    // Draw environmental systems
    lanternSystem.render(ctx, camera);
    bellSystem.render(ctx, camera);
    hearthSystem.render(ctx, camera);

    // Draw flow puzzles
    for (const puzzle of flowPuzzles) {
      puzzle.render(ctx, camera);
    }

    // Draw timing sequences
    for (const sequence of timingSequences) {
      sequence.render(ctx, camera);
    }

    // Draw collectibles
    for (const collectible of collectibles) {
      if (!collectible.collected) {
        const pos = collectible.body.position;
        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Rotating golden shard
        ctx.rotate(animFrame * 0.05);
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }
    }

    // Draw NPCs
    for (const npc of aiManager.npcs.values()) {
      drawNPC(ctx, npc, animFrame);
    }

    // Draw enemies
    for (const enemy of aiManager.enemies.values()) {
      if (enemy.hp > 0) {
        drawEnemy(ctx, enemy, animFrame);
      }
    }

    // Draw boss
    if (bossAI && !bossAI.isDead) {
      drawBoss(ctx, bossAI, animFrame);

      // Draw boss projectiles
      for (const proj of bossAI.projectiles) {
        ctx.save();
        ctx.translate(proj.x, proj.y);

        // Frost wave visual
        ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
        ctx.shadowColor = '#88CCFF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // Draw boss hazard zones
      for (const zone of bossAI.hazardZones) {
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Particle effects
        for (let i = 0; i < 5; i++) {
          const px = zone.x + Math.random() * zone.width;
          const py = zone.y + Math.random() * zone.height;
          ctx.fillStyle = 'rgba(180, 220, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw player (Finn)
    drawFinn(ctx, player.position, playerFacing, animFrame);

    ctx.restore();
  };
}
