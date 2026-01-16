/**
 * Procedural Finn (Otter Protagonist) Rendering
 * Warm, brave otter warrior with Otterblade
 */

interface Position {
  x: number;
  y: number;
}

/**
 * Draw Finn the otter protagonist
 * @param ctx - Canvas context
 * @param position - Player position {x, y}
 * @param facing - Direction player is facing (1 or -1)
 * @param animFrame - Animation frame counter
 */
export function drawFinn(
  ctx: CanvasRenderingContext2D,
  position: Position,
  facing: 1 | -1,
  animFrame: number
): void {
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
