export function drawParallax(ctx, camera, chapter) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Determine biome colors based on chapter
  let skyColor1, skyColor2, midColor, foreColor;
  
  if (chapter <= 1) {
    // Cottage biome - warm, homey
    skyColor1 = '#87CEEB';
    skyColor2 = '#FFD700';
    midColor = '#8FBC8F';
    foreColor = '#6B8E23';
  } else if (chapter <= 4) {
    // Forest biome - willow trees, moss
    skyColor1 = '#7B9EA8';
    skyColor2 = '#A8D5BA';
    midColor = '#6B8E23';
    foreColor = '#556B2F';
  } else if (chapter <= 7) {
    // Abbey biome - stone, torches
    skyColor1 = '#696969';
    skyColor2 = '#A9A9A9';
    midColor = '#8B7355';
    foreColor = '#5D4E37';
  } else {
    // Storm biome - dark, cold
    skyColor1 = '#2F4F4F';
    skyColor2 = '#4682B4';
    midColor = '#36454F';
    foreColor = '#1C1C1C';
  }
  
  // Sky background
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, skyColor1);
  skyGradient.addColorStop(1, skyColor2);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Far mountains/trees (slowest parallax)
  ctx.save();
  ctx.translate(-camera.x * 0.1, 0);
  ctx.fillStyle = midColor;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 5; i++) {
    const x = i * 300;
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + 75, height - 200);
    ctx.lineTo(x + 150, height);
    ctx.fill();
  }
  ctx.restore();
  
  // Mid-ground trees (medium parallax)
  ctx.save();
  ctx.translate(-camera.x * 0.3, 0);
  ctx.fillStyle = foreColor;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 10; i++) {
    const x = i * 150;
    ctx.fillRect(x + 50, height - 150, 15, 150);
    ctx.beginPath();
    ctx.arc(x + 57, height - 150, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  
  // Foreground details (fast parallax)
  ctx.save();
  ctx.translate(-camera.x * 0.5, 0);
  ctx.fillStyle = foreColor;
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 15; i++) {
    const x = i * 100;
    // Grass tufts
    ctx.fillRect(x + 20, height - 20, 5, 20);
    ctx.fillRect(x + 27, height - 15, 5, 15);
  }
  ctx.restore();
  
  ctx.globalAlpha = 1.0;
}
