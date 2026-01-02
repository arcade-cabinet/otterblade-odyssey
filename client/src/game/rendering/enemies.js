/**
 * Procedural Enemy Rendering
 * Galeborn soldiers, NPCs, and Zephyros boss
 */

/**
 * Draw Galeborn enemy soldier
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} enemy - Enemy object with position, facing, hp
 * @param {number} animFrame - Animation frame counter
 */
export function drawEnemy(ctx, enemy, animFrame) {
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
 * Draw friendly NPC
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} npc - NPC object with position, facing
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
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} boss - Boss object with position, facing, hp, maxHp, phase
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
