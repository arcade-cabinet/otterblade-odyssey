/**
 * Finn Procedural Renderer
 *
 * Renders Finn the otter using Canvas 2D procedural generation.
 * No sprites - fully procedural with animations.
 *
 * @module rendering/finn-renderer
 */

/**
 * Draw Finn (the otter protagonist) procedurally
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} position - Position {x, y}
 * @param {number} facing - Facing direction (-1 = left, 1 = right)
 * @param {number} animFrame - Animation frame counter
 * @param {Object} state - Player state {attacking, jumping, moving}
 */
export function drawFinn(ctx, position, facing = 1, animFrame = 0, state = {}) {
  // Input validation
  if (!ctx || !position || typeof animFrame !== 'number') {
    console.error('Invalid parameters to drawFinn');
    return;
  }

  ctx.save();
  ctx.translate(position.x, position.y);

  // Flip sprite based on facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }

  const breathe = Math.sin(animFrame * 0.05) * 2;
  const bounce = state.moving ? Math.abs(Math.sin(animFrame * 0.15)) * 3 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (warm brown otter)
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe - bounce, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe - bounce, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20 + breathe * 0.5 - bounce, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(6, -18 + breathe * 0.5 - bounce, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.arc(10, -19 + breathe * 0.5 - bounce, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.arc(-4, -24 + breathe * 0.5 - bounce, 2.5, 0, Math.PI * 2);
  ctx.arc(4, -24 + breathe * 0.5 - bounce, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye gleam
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-3, -25 + breathe * 0.5 - bounce, 1, 0, Math.PI * 2);
  ctx.arc(5, -25 + breathe * 0.5 - bounce, 1, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#4A4A4A';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const y = -20 + i * 3 + breathe * 0.5 - bounce;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(20, y - 2 + i);
    ctx.stroke();
  }

  // Tail (animated wag)
  const tailWag = Math.sin(animFrame * 0.1) * 5;
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-16 + tailWag, 8 + breathe, 8, 14, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Vest (Redwall abbey style)
  ctx.fillStyle = '#7F4F24';
  ctx.strokeStyle = '#5C3D1A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -8 + breathe - bounce);
  ctx.lineTo(8, -8 + breathe - bounce);
  ctx.lineTo(8, 8 + breathe - bounce);
  ctx.lineTo(-8, 8 + breathe - bounce);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#3D2817';
  ctx.fillRect(-10, 6 + breathe - bounce, 20, 4);

  // Belt buckle
  ctx.fillStyle = '#DAA520';
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-2, 6 + breathe - bounce, 4, 4);
  ctx.fill();
  ctx.stroke();

  // Otterblade sword (when attacking)
  if (state.attacking) {
    drawOtterblade(ctx, animFrame, breathe, bounce);
  }

  ctx.restore();
}

/**
 * Draw the Otterblade sword
 *
 * @private
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} animFrame - Animation frame
 * @param {number} breathe - Breathing animation offset
 * @param {number} bounce - Bounce animation offset
 */
function drawOtterblade(ctx, animFrame, breathe, bounce) {
  const swingAngle = Math.sin(animFrame * 0.3) * 0.5;

  ctx.save();
  ctx.translate(12, -10 + breathe - bounce);
  ctx.rotate(swingAngle - 0.5);

  // Blade (silver with blue tint)
  const gradient = ctx.createLinearGradient(0, -20, 0, 0);
  gradient.addColorStop(0, '#B0C4DE');
  gradient.addColorStop(0.5, '#E0E0E0');
  gradient.addColorStop(1, '#A9A9A9');

  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#696969';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -20);
  ctx.lineTo(0, -25);
  ctx.lineTo(2, -20);
  ctx.lineTo(2, 0);
  ctx.lineTo(-2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blade gleam
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-1, -24);
  ctx.lineTo(-1, -15);
  ctx.stroke();

  // Hilt (bronze)
  ctx.fillStyle = '#CD7F32';
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-3, 0, 6, 4);
  ctx.fill();
  ctx.stroke();

  // Pommel (blue gem)
  ctx.fillStyle = '#4169E1';
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
