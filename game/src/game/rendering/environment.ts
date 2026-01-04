/**
 * Environment Rendering Module
 * Procedural Canvas 2D rendering functions for level geometry and objects
 * - Platforms, walls, ceilings
 * - Interactive objects (doors, shrines)
 * - Water zones
 * - Collectibles (shards)
 * - Boss projectiles and hazard zones
 */

/**
 * Draw platforms with appropriate material styling
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} platforms - Array of platform objects
 */
export function drawPlatforms(ctx, platforms) {
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
}

/**
 * Draw walls with stone texture styling
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} walls - Array of wall objects
 */
export function drawWalls(ctx, walls) {
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
}

/**
 * Draw ceilings with wood beam styling
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} ceilings - Array of ceiling objects
 */
export function drawCeilings(ctx, ceilings) {
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
}

/**
 * Draw interactive objects (doors, shrines, hearths)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} interactions - Array of interaction objects
 * @param {number} animFrame - Animation frame counter for animated effects
 */
export function drawInteractions(ctx, interactions, animFrame) {
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
}

/**
 * Draw water zones with transparency
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} waterZones - Array of water zone objects
 */
export function drawWaterZones(ctx, waterZones) {
  for (const waterZone of waterZones) {
    ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.fillRect(
      waterZone.region.x,
      waterZone.region.y,
      waterZone.region.width,
      waterZone.region.height
    );
  }
}

/**
 * Draw collectible shards with rotation animation
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} collectibles - Array of collectible objects
 * @param {number} animFrame - Animation frame counter
 */
export function drawCollectibles(ctx, collectibles, animFrame) {
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
}

/**
 * Draw environmental systems (lanterns, bells, hearths)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} systems - Object containing environmental system instances
 * @param {Object} camera - Camera position for culling
 */
export function drawEnvironmentalSystems(ctx, systems, camera) {
  if (systems.lanternSystem) {
    systems.lanternSystem.render(ctx, camera);
  }
  if (systems.bellSystem) {
    systems.bellSystem.render(ctx, camera);
  }
  if (systems.hearthSystem) {
    systems.hearthSystem.render(ctx, camera);
  }
}

/**
 * Draw flow puzzles (directional current zones)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} flowPuzzles - Array of flow puzzle objects
 * @param {Object} camera - Camera position for culling
 */
export function drawFlowPuzzles(ctx, flowPuzzles, camera) {
  for (const puzzle of flowPuzzles) {
    puzzle.render(ctx, camera);
  }
}

/**
 * Draw timing sequences (gates, platforms with timed behavior)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} timingSequences - Array of timing sequence objects
 * @param {Object} camera - Camera position for culling
 */
export function drawTimingSequences(ctx, timingSequences, camera) {
  for (const sequence of timingSequences) {
    sequence.render(ctx, camera);
  }
}

/**
 * Draw boss projectiles (frost waves)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} bossAI - Boss AI instance
 */
export function drawBossProjectiles(ctx, bossAI) {
  if (!bossAI || bossAI.isDead) return;

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
}

/**
 * Draw boss hazard zones with particle effects
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} bossAI - Boss AI instance
 */
export function drawBossHazardZones(ctx, bossAI) {
  if (!bossAI || bossAI.isDead) return;

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

/**
 * Draw biome-appropriate background
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} biome - Biome type (village, forest, abbey, catacombs)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function drawBackground(ctx, biome, width, height) {
  const bgColors = {
    village: '#2C3E50',
    forest: '#1a3a1a',
    abbey: '#1a1a24',
    catacombs: '#0d0d15',
  };
  ctx.fillStyle = bgColors[biome] || '#1a1a24';
  ctx.fillRect(0, 0, width, height);
}
