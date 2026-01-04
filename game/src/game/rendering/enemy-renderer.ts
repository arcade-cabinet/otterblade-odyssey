/**
 * Enemy Procedural Renderer
 *
 * Renders various enemy types (Galeborn, Stormcrow, Thornguard, etc.)
 * using Canvas 2D procedural generation.
 *
 * @module rendering/enemy-renderer
 */

/**
 * Draw an enemy based on type
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} position - Position {x, y}
 * @param {string} enemyType - Enemy type (galeborn, stormcrow, thornguard, etc.)
 * @param {number} facing - Facing direction (-1 = left, 1 = right)
 * @param {number} animFrame - Animation frame counter
 * @param {Object} state - Enemy state {attacking, alerted, damaged}
 */
export function drawEnemy(ctx, position, enemyType, facing = 1, animFrame = 0, state = {}) {
  if (!ctx || !position || !enemyType) {
    console.error('Invalid parameters to drawEnemy');
    return;
  }

  ctx.save();
  ctx.translate(position.x, position.y);

  if (facing < 0) {
    ctx.scale(-1, 1);
  }

  switch (enemyType.toLowerCase()) {
    case 'galeborn':
      drawGaleborn(ctx, animFrame, state);
      break;
    case 'stormcrow':
      drawStormcrow(ctx, animFrame, state);
      break;
    case 'thornguard':
      drawThornguard(ctx, animFrame, state);
      break;
    case 'iceshard':
      drawIceshard(ctx, animFrame, state);
      break;
    default:
      drawGenericEnemy(ctx, animFrame, state);
  }

  ctx.restore();
}

/**
 * Draw Galeborn enemy (wind elemental)
 * @private
 */
function drawGaleborn(ctx, animFrame, state) {
  const swirl = Math.sin(animFrame * 0.08) * 5;
  const pulse = Math.abs(Math.sin(animFrame * 0.1)) * 0.3 + 0.7;

  // Shadowy form
  ctx.fillStyle = state.alerted ? 'rgba(100, 120, 140, 0.8)' : 'rgba(80, 100, 120, 0.7)';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + animFrame * 0.05;
    const r = 20 * pulse + Math.sin(angle * 3 + animFrame * 0.1) * 5;
    const x = Math.cos(angle) * r + swirl;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Wind trails
  ctx.strokeStyle = 'rgba(150, 180, 200, 0.6)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-15 + swirl, -10 + i * 8);
    ctx.lineTo(-25 + swirl, -8 + i * 8);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = state.attacking ? '#FF4500' : '#87CEEB';
  ctx.beginPath();
  ctx.arc(-6 + swirl * 0.5, -5, 3, 0, Math.PI * 2);
  ctx.arc(6 + swirl * 0.5, -5, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw Stormcrow enemy (aerial foe)
 * @private
 */
function drawStormcrow(ctx, animFrame, state) {
  const flap = Math.sin(animFrame * 0.2) * 15;
  const hover = Math.sin(animFrame * 0.1) * 3;

  // Body
  ctx.fillStyle = '#2C2C3E';
  ctx.strokeStyle = '#1A1A24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, hover, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wings
  ctx.fillStyle = state.attacking ? '#4A4A6E' : '#3A3A5E';
  ctx.beginPath();
  // Left wing
  ctx.moveTo(-5, -5 + hover);
  ctx.quadraticCurveTo(-15, -15 + hover - flap, -25, -10 + hover - flap);
  ctx.quadraticCurveTo(-20, -5 + hover, -5, 0 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  // Right wing
  ctx.moveTo(5, -5 + hover);
  ctx.quadraticCurveTo(15, -15 + hover + flap, 25, -10 + hover + flap);
  ctx.quadraticCurveTo(20, -5 + hover, 5, 0 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#2C2C3E';
  ctx.beginPath();
  ctx.arc(0, -15 + hover, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beak
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -15 + hover);
  ctx.lineTo(8, -13 + hover);
  ctx.lineTo(0, -11 + hover);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = state.alerted ? '#FF0000' : '#FFD700';
  ctx.beginPath();
  ctx.arc(-3, -17 + hover, 2, 0, Math.PI * 2);
  ctx.arc(3, -17 + hover, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw Thornguard enemy (armored ground unit)
 * @private
 */
function drawThornguard(ctx, animFrame, state) {
  const step = Math.abs(Math.sin(animFrame * 0.12)) * 3;

  // Shield
  ctx.fillStyle = '#5C4033';
  ctx.strokeStyle = '#3D2817';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-15, 0, 18, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.stroke();

  // Shield emblem
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(-15, -8);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-15, 8);
  ctx.lineTo(-18, 0);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#3D2817';
  ctx.strokeStyle = '#2C1F12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(3, -step, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Armor plates
  ctx.fillStyle = '#5C4033';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(3, -10 + i * 6 - step, 6, 0, Math.PI);
    ctx.fill();
  }

  // Helmet
  ctx.fillStyle = '#4A4A4A';
  ctx.strokeStyle = '#2C2C2C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(3, -22 - step, 10, Math.PI, 0);
  ctx.lineTo(13, -22 - step);
  ctx.lineTo(13, -18 - step);
  ctx.lineTo(-7, -18 - step);
  ctx.lineTo(-7, -22 - step);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Visor slit
  ctx.fillStyle = state.attacking ? '#FF0000' : '#FFD700';
  ctx.fillRect(-5, -22 - step, 16, 2);

  // Spear
  if (state.attacking) {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(35, -10);
    ctx.stroke();

    ctx.fillStyle = '#A9A9A9';
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, -10);
    ctx.lineTo(40, -12);
    ctx.lineTo(38, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Draw Iceshard enemy (frost creature)
 * @private
 */
function drawIceshard(ctx, animFrame, state) {
  const float = Math.sin(animFrame * 0.08) * 4;
  const shimmer = Math.abs(Math.sin(animFrame * 0.15));

  // Main crystal body
  ctx.fillStyle = `rgba(200, 230, 255, ${0.7 + shimmer * 0.3})`;
  ctx.strokeStyle = '#ADD8E6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -25 + float);
  ctx.lineTo(15, -5 + float);
  ctx.lineTo(10, 15 + float);
  ctx.lineTo(-10, 15 + float);
  ctx.lineTo(-15, -5 + float);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner glow
  ctx.fillStyle = state.attacking ? 'rgba(135, 206, 250, 0.8)' : 'rgba(176, 224, 230, 0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -20 + float);
  ctx.lineTo(10, -5 + float);
  ctx.lineTo(5, 10 + float);
  ctx.lineTo(-5, 10 + float);
  ctx.lineTo(-10, -5 + float);
  ctx.closePath();
  ctx.fill();

  // Frost particles
  ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + animFrame * 0.05;
    const r = 25 + Math.sin(animFrame * 0.1 + i) * 5;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r + float;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = state.alerted ? '#00CED1' : '#87CEEB';
  ctx.beginPath();
  ctx.arc(-5, -10 + float, 3, 0, Math.PI * 2);
  ctx.arc(5, -10 + float, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw generic enemy (fallback)
 * @private
 */
function drawGenericEnemy(ctx, animFrame, state) {
  const pulse = Math.abs(Math.sin(animFrame * 0.1)) * 0.2 + 0.8;

  // Body
  ctx.fillStyle = state.alerted ? '#8B0000' : '#A52A2A';
  ctx.strokeStyle = '#5C1A1A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(-5, -3, 3, 0, Math.PI * 2);
  ctx.arc(5, -3, 3, 0, Math.PI * 2);
  ctx.fill();
}
