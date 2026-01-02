/**
 * Boss Procedural Renderer
 *
 * Renders boss enemies (Zephyros) with multi-phase visual states.
 *
 * @module rendering/boss-renderer
 */

/**
 * Draw a boss enemy
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} position - Position {x, y}
 * @param {string} bossType - Boss type (zephyros, etc.)
 * @param {number} phase - Current boss phase (1-3)
 * @param {number} facing - Facing direction (-1 = left, 1 = right)
 * @param {number} animFrame - Animation frame counter
 * @param {Object} state - Boss state {attacking, charging, stunned, enraged}
 */
export function drawBoss(ctx, position, bossType, phase, facing = 1, animFrame = 0, state = {}) {
  if (!ctx || !position || !bossType) {
    console.error('Invalid parameters to drawBoss');
    return;
  }

  ctx.save();
  ctx.translate(position.x, position.y);

  if (facing < 0) {
    ctx.scale(-1, 1);
  }

  switch (bossType.toLowerCase()) {
    case 'zephyros':
      drawZephyros(ctx, phase, animFrame, state);
      break;
    default:
      drawGenericBoss(ctx, phase, animFrame, state);
  }

  ctx.restore();
}

/**
 * Draw Zephyros (Chapter 8 boss - Storm Lord)
 * @private
 */
function drawZephyros(ctx, phase, animFrame, state) {
  const swirl = Math.sin(animFrame * 0.06) * 8;
  const pulse = Math.abs(Math.sin(animFrame * 0.08)) * 0.4 + 0.6;
  const enragedPulse = state.enraged ? Math.abs(Math.sin(animFrame * 0.15)) * 0.3 : 0;

  // Phase determines size and intensity
  const sizeMultiplier = 1 + (phase - 1) * 0.3; // Grows each phase
  const baseSize = 60 * sizeMultiplier;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, baseSize + 20, baseSize * 0.8, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Phase 1: Stormy form
  if (phase === 1) {
    drawZephyrosPhase1(ctx, baseSize, swirl, pulse, animFrame, state);
  }
  // Phase 2: Enraged storm
  else if (phase === 2) {
    drawZephyrosPhase2(ctx, baseSize, swirl, pulse, animFrame, state, enragedPulse);
  }
  // Phase 3: Desperate fury
  else {
    drawZephyrosPhase3(ctx, baseSize, swirl, pulse, animFrame, state, enragedPulse);
  }

  // Stunned stars
  if (state.stunned) {
    drawStunnedEffect(ctx, baseSize, animFrame);
  }

  // Charging attack indicator
  if (state.charging) {
    drawChargingEffect(ctx, baseSize, animFrame);
  }
}

/**
 * Draw Zephyros Phase 1 (Confident, controlled storms)
 * @private
 */
function drawZephyrosPhase1(ctx, baseSize, swirl, pulse, animFrame, state) {
  // Main body (storm cloud form)
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
  gradient.addColorStop(0, 'rgba(100, 120, 160, 0.9)');
  gradient.addColorStop(0.5, 'rgba(60, 80, 120, 0.8)');
  gradient.addColorStop(1, 'rgba(40, 60, 100, 0.6)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + animFrame * 0.03;
    const r = baseSize * pulse + Math.sin(angle * 3 + animFrame * 0.05) * (baseSize * 0.2);
    const x = Math.cos(angle) * r + swirl * Math.sin(i);
    const y = Math.sin(angle) * r + swirl * Math.cos(i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Wind swirls
  ctx.strokeStyle = 'rgba(150, 180, 220, 0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const offset = (animFrame * 0.05 + i * 0.4) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 0.7, offset, offset + Math.PI / 3);
    ctx.stroke();
  }

  // Eyes (cold, calculating)
  ctx.fillStyle = state.attacking ? '#4169E1' : '#87CEEB';
  ctx.shadowColor = '#87CEEB';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(-baseSize * 0.3, -baseSize * 0.2, baseSize * 0.15, 0, Math.PI * 2);
  ctx.arc(baseSize * 0.3, -baseSize * 0.2, baseSize * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Crown/horns of lightning
  drawLightningCrown(ctx, baseSize, animFrame, 3);
}

/**
 * Draw Zephyros Phase 2 (Enraged, more chaotic)
 * @private
 */
function drawZephyrosPhase2(ctx, baseSize, swirl, pulse, animFrame, state, enragedPulse) {
  // More chaotic storm form
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
  gradient.addColorStop(0, 'rgba(120, 100, 180, 0.95)');
  gradient.addColorStop(0.5, 'rgba(80, 60, 140, 0.85)');
  gradient.addColorStop(1, 'rgba(60, 40, 120, 0.7)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + animFrame * 0.05;
    const r =
      baseSize * pulse * (1 + enragedPulse) +
      Math.sin(angle * 4 + animFrame * 0.08) * (baseSize * 0.3);
    const x = Math.cos(angle) * r + swirl * Math.sin(i * 2);
    const y = Math.sin(angle) * r + swirl * Math.cos(i * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Violent wind swirls
  ctx.strokeStyle = 'rgba(180, 150, 240, 0.8)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const offset = (animFrame * 0.08 + i * 0.3) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 0.8, offset, offset + Math.PI / 4);
    ctx.stroke();
  }

  // Eyes (fierce, glowing)
  ctx.fillStyle = '#8B00FF';
  ctx.shadowColor = '#8B00FF';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(-baseSize * 0.3, -baseSize * 0.2, baseSize * 0.18, 0, Math.PI * 2);
  ctx.arc(baseSize * 0.3, -baseSize * 0.2, baseSize * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // More aggressive lightning crown
  drawLightningCrown(ctx, baseSize, animFrame, 5);

  // Lightning bolts
  if (state.attacking) {
    drawLightningBolts(ctx, baseSize, animFrame);
  }
}

/**
 * Draw Zephyros Phase 3 (Desperate, maximum chaos)
 * @private
 */
function drawZephyrosPhase3(ctx, baseSize, swirl, pulse, animFrame, _state, enragedPulse) {
  // Unstable, crackling storm form
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
  gradient.addColorStop(0, 'rgba(200, 50, 50, 0.95)');
  gradient.addColorStop(0.3, 'rgba(140, 60, 180, 0.9)');
  gradient.addColorStop(0.7, 'rgba(80, 60, 140, 0.85)');
  gradient.addColorStop(1, 'rgba(40, 40, 100, 0.7)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + animFrame * 0.08;
    const chaos = Math.sin(animFrame * 0.1 + i) * (baseSize * 0.4);
    const r =
      baseSize * pulse * (1 + enragedPulse * 1.5) +
      Math.sin(angle * 5 + animFrame * 0.1) * (baseSize * 0.35) +
      chaos;
    const x = Math.cos(angle) * r + swirl * Math.sin(i * 3);
    const y = Math.sin(angle) * r + swirl * Math.cos(i * 3);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Chaotic wind swirls
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 12; i++) {
    const offset = (animFrame * 0.12 + i * 0.2) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 0.9, offset, offset + Math.PI / 3);
    ctx.stroke();
  }

  // Eyes (wild, desperate)
  ctx.fillStyle = '#FF0000';
  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(-baseSize * 0.3, -baseSize * 0.2, baseSize * 0.2, 0, Math.PI * 2);
  ctx.arc(baseSize * 0.3, -baseSize * 0.2, baseSize * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Maximum lightning crown
  drawLightningCrown(ctx, baseSize, animFrame, 8);

  // Continuous lightning
  drawLightningBolts(ctx, baseSize, animFrame);

  // Electrical discharge
  drawElectricalDischarge(ctx, baseSize, animFrame);
}

/**
 * Draw lightning crown
 * @private
 */
function drawLightningCrown(ctx, baseSize, animFrame, count) {
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const startX = Math.cos(angle) * baseSize * 0.6;
    const startY = Math.sin(angle) * baseSize * 0.6 - baseSize * 0.4;

    const zigzag = Math.sin(animFrame * 0.1 + i) * baseSize * 0.15;
    const endX = Math.cos(angle) * baseSize * 1.2 + zigzag;
    const endY = Math.sin(angle) * baseSize * 1.2 - baseSize * 0.6;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX * 0.5, endY * 0.5 + zigzag);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

/**
 * Draw lightning bolts
 * @private
 */
function drawLightningBolts(ctx, baseSize, animFrame) {
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15;

  for (let i = 0; i < 4; i++) {
    if (Math.floor(animFrame / 5 + i) % 2 === 0) continue; // Flicker

    const angle = (i / 4) * Math.PI * 2 + animFrame * 0.05;
    const startX = Math.cos(angle) * baseSize * 0.5;
    const startY = Math.sin(angle) * baseSize * 0.5;
    const endX = Math.cos(angle) * baseSize * 2;
    const endY = Math.sin(angle) * baseSize * 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Zigzag
    for (let j = 1; j < 6; j++) {
      const t = j / 6;
      const x = startX + (endX - startX) * t + (Math.random() - 0.5) * baseSize * 0.3;
      const y = startY + (endY - startY) * t + (Math.random() - 0.5) * baseSize * 0.3;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

/**
 * Draw electrical discharge
 * @private
 */
function drawElectricalDischarge(ctx, baseSize, _animFrame) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;

  for (let i = 0; i < 20; i++) {
    if (Math.random() > 0.5) continue; // Random sparks

    const angle = Math.random() * Math.PI * 2;
    const startR = baseSize * 0.7;
    const endR = baseSize * 1.5;

    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
    ctx.lineTo(
      Math.cos(angle) * endR + (Math.random() - 0.5) * 20,
      Math.sin(angle) * endR + (Math.random() - 0.5) * 20
    );
    ctx.stroke();
  }
}

/**
 * Draw stunned effect
 * @private
 */
function drawStunnedEffect(ctx, baseSize, animFrame) {
  const starPositions = [
    { angle: 0, distance: baseSize * 1.3 },
    { angle: (Math.PI * 2) / 3, distance: baseSize * 1.3 },
    { angle: (Math.PI * 4) / 3, distance: baseSize * 1.3 },
  ];

  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = 2;

  for (let i = 0; i < starPositions.length; i++) {
    const rotation = animFrame * 0.1 + (i * Math.PI * 2) / 3;
    const pos = starPositions[i];
    const x = Math.cos(pos.angle + rotation) * pos.distance;
    const y = Math.sin(pos.angle + rotation) * pos.distance - baseSize * 0.8;

    drawStar(ctx, x, y, 5, baseSize * 0.15, baseSize * 0.075);
  }
}

/**
 * Draw charging effect
 * @private
 */
function drawChargingEffect(ctx, baseSize, animFrame) {
  const chargeRings = 3;

  for (let i = 0; i < chargeRings; i++) {
    const progress = (animFrame * 0.08 + i * 0.3) % 1;
    const radius = baseSize * (0.5 + progress * 1.5);
    const alpha = 1 - progress;

    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
    ctx.lineWidth = 4 * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Draw a star shape
 * @private
 */
function drawStar(ctx, x, y, points, outerRadius, innerRadius) {
  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw generic boss (fallback)
 * @private
 */
function drawGenericBoss(ctx, phase, animFrame, state) {
  const pulse = Math.abs(Math.sin(animFrame * 0.1)) * 0.3 + 0.7;
  const baseSize = 50 + phase * 15;

  // Body
  ctx.fillStyle = state.enraged ? '#8B0000' : '#A52A2A';
  ctx.strokeStyle = '#5C1A1A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, baseSize * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes
  ctx.fillStyle = state.attacking ? '#FF0000' : '#FFFF00';
  ctx.beginPath();
  ctx.arc(-baseSize * 0.3, -baseSize * 0.2, baseSize * 0.15, 0, Math.PI * 2);
  ctx.arc(baseSize * 0.3, -baseSize * 0.2, baseSize * 0.15, 0, Math.PI * 2);
  ctx.fill();
}
