/**
 * Character Rendering Module
 * Procedural Canvas 2D rendering functions for all game characters
 * - Finn (otter protagonist)
 * - Enemies (Galeborn soldiers)
 * - NPCs (friendly woodland creatures)
 * - Boss (Zephyros)
 */

/**
 * Draw Finn the otter protagonist
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {{x: number, y: number}} position - World position
 * @param {number} facing - Horizontal facing direction (1 or -1)
 * @param {number} animFrame - Animation frame counter
 */
export function drawFinn(ctx, position, facing, animFrame) {
  // Validate inputs
  if (!ctx || !position || typeof animFrame !== 'number') {
    console.error('Invalid parameters to drawFinn');
    return;
  }

  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.05) * 2;

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
  ctx.ellipse(0, 0 + breathe, 16, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest (lighter tan)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -20 + breathe * 0.5, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -18 + breathe * 0.5, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#4A3C2B';
  ctx.beginPath();
  ctx.arc(12, -18 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(3, -22 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(4, -23 + breathe * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-8, -28 + breathe * 0.5, 5, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(6, -28 + breathe * 0.5, 5, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Whiskers (subtle)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -18 + breathe * 0.5);
  ctx.lineTo(18, -20 + breathe * 0.5);
  ctx.moveTo(5, -16 + breathe * 0.5);
  ctx.lineTo(18, -16 + breathe * 0.5);
  ctx.moveTo(5, -14 + breathe * 0.5);
  ctx.lineTo(18, -12 + breathe * 0.5);
  ctx.stroke();

  // Arms
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-10, 5 + breathe * 0.8, 5, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(10, 5 + breathe * 0.8, 5, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Otterblade (simplified)
  ctx.fillStyle = '#C0C0C0';
  ctx.strokeStyle = '#7F8C8D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(12, -5);
  ctx.lineTo(11, -20);
  ctx.lineTo(9, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail (behind)
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#8B6F47';
  ctx.strokeStyle = '#6B5D4F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.quadraticCurveTo(-8, 25, -12, 30);
  ctx.quadraticCurveTo(-14, 32, -10, 34);
  ctx.quadraticCurveTo(-4, 28, 2, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  ctx.restore();
}

/**
 * Draw Galeborn enemy soldier
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} enemy - Enemy entity object
 * @param {number} _animFrame - Animation frame counter (unused)
 */
export function drawEnemy(ctx, enemy, _animFrame) {
  const x = enemy.position.x;
  const y = enemy.position.y;
  const facing = enemy.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (Galeborn soldier - dark blue-gray)
  ctx.fillStyle = '#2C3E50';
  ctx.strokeStyle = '#1C2833';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#34495E';
  ctx.strokeStyle = '#1C2833';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -18, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet
  ctx.fillStyle = '#7F8C8D';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -20, 10, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eyes (glowing menacing)
  ctx.fillStyle = '#E74C3C';
  ctx.shadowColor = '#E74C3C';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(-4, -18, 2, 0, Math.PI * 2);
  ctx.arc(4, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Weapon (spear)
  ctx.fillStyle = '#95A5A6';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(10, -5);
  ctx.lineTo(10, -25);
  ctx.lineTo(8, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spear tip
  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.moveTo(9, -25);
  ctx.lineTo(12, -30);
  ctx.lineTo(9, -27);
  ctx.lineTo(6, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw NPC (friendly woodland creature)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} npc - NPC entity object
 * @param {number} animFrame - Animation frame counter
 */
export function drawNPC(ctx, npc, animFrame) {
  const x = npc.position.x;
  const y = npc.position.y;
  const facing = npc.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const breathe = Math.sin(animFrame * 0.04) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (friendly woodland creature)
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0 + breathe, 15, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chest
  ctx.fillStyle = '#D4C4B0';
  ctx.beginPath();
  ctx.ellipse(2, 2 + breathe, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -18 + breathe * 0.5, 13, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#D4C4B0';
  ctx.beginPath();
  ctx.ellipse(7, -17 + breathe * 0.5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#5D4E37';
  ctx.beginPath();
  ctx.arc(10, -17 + breathe * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (kind and wise)
  ctx.fillStyle = '#4A3C2B';
  ctx.beginPath();
  ctx.arc(3, -20 + breathe * 0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(4, -21 + breathe * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#7F6A5A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-7, -26 + breathe * 0.5, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(6, -26 + breathe * 0.5, 5, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw Zephyros boss
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} boss - Boss entity object
 * @param {number} animFrame - Animation frame counter
 */
export function drawBoss(ctx, boss, animFrame) {
  const x = boss.position.x;
  const y = boss.position.y;
  const facing = boss.facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const pulse = Math.sin(animFrame * 0.08) * 3;

  // Shadow (larger)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 50, 45, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (Zephyros - frost giant badger)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0 + pulse, 35, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Frost aura
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#88CCFF';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0 + pulse, 40 + pulse * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Chest
  ctx.fillStyle = '#C5D9ED';
  ctx.beginPath();
  ctx.ellipse(5, 5 + pulse, 25, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (massive)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -35 + pulse * 0.5, 28, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#C5D9ED';
  ctx.beginPath();
  ctx.ellipse(15, -32 + pulse * 0.5, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(22, -32 + pulse * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (piercing blue)
  ctx.fillStyle = '#3498DB';
  ctx.shadowColor = '#3498DB';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(6, -38 + pulse * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye pupil
  ctx.fillStyle = '#1C2833';
  ctx.beginPath();
  ctx.arc(7, -38 + pulse * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ears (badger style)
  ctx.fillStyle = '#95B3D7';
  ctx.strokeStyle = '#6B8CAE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-15, -50 + pulse * 0.5, 8, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(12, -50 + pulse * 0.5, 8, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Claws (massive)
  ctx.fillStyle = '#7F8C8D';
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;

  // Left claw
  ctx.beginPath();
  ctx.moveTo(-25, 15 + pulse);
  ctx.lineTo(-28, 25 + pulse);
  ctx.lineTo(-26, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-22, 15 + pulse);
  ctx.lineTo(-25, 25 + pulse);
  ctx.lineTo(-23, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-19, 15 + pulse);
  ctx.lineTo(-22, 25 + pulse);
  ctx.lineTo(-20, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right claw
  ctx.beginPath();
  ctx.moveTo(25, 15 + pulse);
  ctx.lineTo(28, 25 + pulse);
  ctx.lineTo(26, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(22, 15 + pulse);
  ctx.lineTo(25, 25 + pulse);
  ctx.lineTo(23, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(19, 15 + pulse);
  ctx.lineTo(22, 25 + pulse);
  ctx.lineTo(20, 25 + pulse);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Health bar (boss)
  const barWidth = 80;
  const healthRatio = boss.hp / boss.maxHp;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-barWidth / 2, -65, barWidth, 5);

  ctx.fillStyle = healthRatio > 0.3 ? '#2ECC71' : '#E74C3C';
  ctx.fillRect(-barWidth / 2, -65, barWidth * healthRatio, 5);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-barWidth / 2, -65, barWidth, 5);

  // Phase indicator
  ctx.fillStyle = '#F4D03F';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Phase ${boss.phase}`, 0, -72);

  ctx.restore();
}
