export function drawFinn(ctx, playerState) {
  const { position, facing, state, frame } = playerState;
  const x = position.x;
  const y = position.y;
  
  ctx.save();
  ctx.translate(x, y);
  if (facing < 0) ctx.scale(-1, 1);
  
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Warmth glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  glow.addColorStop(0, 'rgba(230, 126, 34, 0.2)');
  glow.addColorStop(1, 'rgba(230, 126, 34, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-40, -40, 80, 80);
  
  // Tail with wag animation
  const tailWag = Math.sin(frame * 0.1) * 5;
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.moveTo(-15, 10);
  ctx.quadraticCurveTo(-20 + tailWag, 0, -25 + tailWag, -5);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#8B6F47';
  ctx.stroke();
  
  // Body
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Chest fur (lighter)
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(0, 5, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Vest
  ctx.fillStyle = '#5D4E37';
  ctx.fillRect(-12, -10, 24, 20);
  
  // Belt
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(-12, 8, 24, 4);
  ctx.fillStyle = '#F4D03F';
  ctx.fillRect(-2, 8, 4, 4);
  
  // Head
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(0, -15, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Snout
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(8, -12, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#2C1810';
  ctx.beginPath();
  ctx.arc(12, -12, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Whiskers
  ctx.strokeStyle = '#2C1810';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(8, -12 + i * 3);
    ctx.lineTo(18, -10 + i * 4);
    ctx.stroke();
  }
  
  // Eye
  ctx.fillStyle = '#2C1810';
  ctx.beginPath();
  ctx.arc(5, -18, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye gleam
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(6, -19, 1, 0, Math.PI * 2);
  ctx.fill();
  
  // Ear
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(-5, -22, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Arms
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(-10, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Otterblade sword (when attacking)
  if (state === 'attack') {
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.lineTo(30, -15);
    ctx.stroke();
    
    ctx.fillStyle = '#F4D03F';
    ctx.fillRect(13, -7, 4, 6);
  }
  
  ctx.restore();
}
