/**
 * Environment Renderer
 * 
 * Renders parallax backgrounds, weather effects, particles, and environmental elements.
 * 
 * @module rendering/environment-renderer
 */

/**
 * Draw parallax background layers
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} camera - Camera object with x, y properties
 * @param {string} biome - Biome type (cottage, forest, abbey, storm)
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
export function drawParallaxBackground(ctx, camera, biome, canvasWidth, canvasHeight) {
  if (!ctx || !camera) {
    console.error('Invalid parameters to drawParallaxBackground');
    return;
  }

  ctx.save();

  switch (biome) {
    case 'cottage':
      drawCottageBackground(ctx, camera, canvasWidth, canvasHeight);
      break;
    case 'forest':
      drawForestBackground(ctx, camera, canvasWidth, canvasHeight);
      break;
    case 'abbey':
      drawAbbeyBackground(ctx, camera, canvasWidth, canvasHeight);
      break;
    case 'storm':
      drawStormBackground(ctx, camera, canvasWidth, canvasHeight);
      break;
    default:
      drawGenericBackground(ctx, camera, canvasWidth, canvasHeight);
  }

  ctx.restore();
}

/**
 * Draw cottage biome background (warm, homey)
 * @private
 */
function drawCottageBackground(ctx, camera, width, height) {
  // Sky (warm evening)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#F4A460'); // Sandy brown
  skyGradient.addColorStop(0.5, '#E67E22'); // Orange
  skyGradient.addColorStop(1, '#D35400'); // Darker orange

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Distant hills (layer 1 - slowest parallax)
  const hills1X = -(camera.x * 0.1) % (width * 2);
  ctx.fillStyle = '#8B4513';
  ctx.globalAlpha = 0.3;
  drawHills(ctx, hills1X, height * 0.6, width * 2, height * 0.3, 3);
  ctx.globalAlpha = 1;

  // Middle hills (layer 2)
  const hills2X = -(camera.x * 0.2) % (width * 1.5);
  ctx.fillStyle = '#A0522D';
  ctx.globalAlpha = 0.5;
  drawHills(ctx, hills2X, height * 0.7, width * 1.5, height * 0.25, 4);
  ctx.globalAlpha = 1;

  // Close grass (layer 3 - fastest parallax)
  const grassX = -(camera.x * 0.3) % (width * 1.2);
  ctx.fillStyle = '#8FBC8F';
  ctx.globalAlpha = 0.7;
  drawGrass(ctx, grassX, height * 0.85, width * 1.2, height * 0.15);
  ctx.globalAlpha = 1;
}

/**
 * Draw forest biome background (dense, mysterious)
 * @private
 */
function drawForestBackground(ctx, camera, width, height) {
  // Sky (filtered through canopy)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#4A5568'); // Blue-gray
  skyGradient.addColorStop(0.5, '#2D3748'); // Darker gray
  skyGradient.addColorStop(1, '#1A202C'); // Almost black

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Distant trees (layer 1)
  const trees1X = -(camera.x * 0.15) % (width * 2);
  ctx.fillStyle = '#2C5F2D';
  ctx.globalAlpha = 0.3;
  drawTrees(ctx, trees1X, height * 0.4, width * 2, height * 0.5, 8);
  ctx.globalAlpha = 1;

  // Middle trees (layer 2)
  const trees2X = -(camera.x * 0.25) % (width * 1.5);
  ctx.fillStyle = '#3D7C3F';
  ctx.globalAlpha = 0.5;
  drawTrees(ctx, trees2X, height * 0.5, width * 1.5, height * 0.4, 6);
  ctx.globalAlpha = 1;

  // Close undergrowth (layer 3)
  const undergrowthX = -(camera.x * 0.35) % (width * 1.2);
  ctx.fillStyle = '#4A7C59';
  ctx.globalAlpha = 0.7;
  drawUndergrowth(ctx, undergrowthX, height * 0.75, width * 1.2, height * 0.25);
  ctx.globalAlpha = 1;
}

/**
 * Draw abbey biome background (stone, majestic)
 * @private
 */
function drawAbbeyBackground(ctx, camera, width, height) {
  // Sky (clear day)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#87CEEB'); // Sky blue
  skyGradient.addColorStop(0.6, '#B0C4DE'); // Light steel blue
  skyGradient.addColorStop(1, '#D3D3D3'); // Light gray

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Distant abbey structures (layer 1)
  const structures1X = -(camera.x * 0.1) % (width * 2);
  ctx.fillStyle = '#8B7355';
  ctx.globalAlpha = 0.3;
  drawAbbeyStructures(ctx, structures1X, height * 0.3, width * 2, height * 0.4, 4);
  ctx.globalAlpha = 1;

  // Middle walls (layer 2)
  const walls2X = -(camera.x * 0.2) % (width * 1.5);
  ctx.fillStyle = '#A0826D';
  ctx.globalAlpha = 0.5;
  drawWalls(ctx, walls2X, height * 0.5, width * 1.5, height * 0.3);
  ctx.globalAlpha = 1;

  // Close courtyard (layer 3)
  const courtyardX = -(camera.x * 0.3) % (width * 1.2);
  ctx.fillStyle = '#8FBC8F';
  ctx.globalAlpha = 0.7;
  drawCourtyard(ctx, courtyardX, height * 0.8, width * 1.2, height * 0.2);
  ctx.globalAlpha = 1;
}

/**
 * Draw storm biome background (dramatic, dangerous)
 * @private
 */
function drawStormBackground(ctx, camera, width, height) {
  // Sky (dark stormy)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#2C3E50'); // Dark slate
  skyGradient.addColorStop(0.4, '#34495E'); // Slate
  skyGradient.addColorStop(1, '#1C2833'); // Very dark

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Storm clouds (layer 1 - animated)
  const clouds1X = -(camera.x * 0.15 + Date.now() * 0.01) % (width * 2);
  ctx.fillStyle = '#4A5568';
  ctx.globalAlpha = 0.4;
  drawStormClouds(ctx, clouds1X, height * 0.2, width * 2, height * 0.3);
  ctx.globalAlpha = 1;

  // Lightning flashes (random)
  if (Math.random() < 0.02) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, width, height);
  }

  // Distant mountains in storm (layer 2)
  const mountains2X = -(camera.x * 0.2) % (width * 1.5);
  ctx.fillStyle = '#1A202C';
  ctx.globalAlpha = 0.6;
  drawMountains(ctx, mountains2X, height * 0.5, width * 1.5, height * 0.4);
  ctx.globalAlpha = 1;

  // Rain streaks (layer 3)
  drawRain(ctx, camera, width, height);
}

/**
 * Draw hills
 * @private
 */
function drawHills(ctx, x, y, width, height, count) {
  ctx.beginPath();
  ctx.moveTo(x, y + height);

  for (let i = 0; i < count; i++) {
    const hillX = x + (i / count) * width;
    const hillY = y + Math.sin(i * 2) * (height * 0.5);
    const controlX = hillX + width / count / 2;
    const controlY = hillY - height * 0.3;

    ctx.quadraticCurveTo(controlX, controlY, hillX + width / count, hillY);
  }

  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw grass
 * @private
 */
function drawGrass(ctx, x, y, width, height) {
  ctx.fillRect(x, y, width, height);

  // Add grass blades
  ctx.strokeStyle = '#7DA87D';
  ctx.lineWidth = 2;
  for (let i = 0; i < 50; i++) {
    const bladeX = x + (i / 50) * width;
    const bladeHeight = Math.random() * height * 0.5 + height * 0.2;

    ctx.beginPath();
    ctx.moveTo(bladeX, y + height);
    ctx.lineTo(bladeX + Math.random() * 5 - 2.5, y + height - bladeHeight);
    ctx.stroke();
  }
}

/**
 * Draw trees
 * @private
 */
function drawTrees(ctx, x, y, width, height, count) {
  for (let i = 0; i < count; i++) {
    const treeX = x + (i / count) * width;
    const treeHeight = height * (0.6 + Math.random() * 0.4);
    const treeWidth = treeHeight * 0.6;

    // Trunk
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(treeX - treeWidth * 0.1, y + height - treeHeight, treeWidth * 0.2, treeHeight * 0.4);

    // Canopy
    ctx.fillStyle = '#3A5F3A'; // Forest green
    ctx.beginPath();
    ctx.ellipse(treeX, y + height - treeHeight * 0.7, treeWidth * 0.5, treeHeight * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw undergrowth
 * @private
 */
function drawUndergrowth(ctx, x, y, width, height) {
  ctx.fillRect(x, y, width, height);

  // Add bushes
  for (let i = 0; i < 20; i++) {
    const bushX = x + (i / 20) * width;
    const bushRadius = Math.random() * height * 0.3 + height * 0.2;

    ctx.beginPath();
    ctx.arc(bushX, y + height - bushRadius, bushRadius, 0, Math.PI);
    ctx.fill();
  }
}

/**
 * Draw abbey structures
 * @private
 */
function drawAbbeyStructures(ctx, x, y, width, height, count) {
  for (let i = 0; i < count; i++) {
    const buildingX = x + (i / count) * width;
    const buildingWidth = width / count * 0.7;
    const buildingHeight = height * (0.7 + Math.random() * 0.3);

    // Building
    ctx.fillRect(buildingX, y + height - buildingHeight, buildingWidth, buildingHeight);

    // Tower
    if (Math.random() > 0.5) {
      const towerWidth = buildingWidth * 0.3;
      const towerHeight = buildingHeight * 0.5;
      ctx.fillRect(
        buildingX + buildingWidth * 0.35,
        y + height - buildingHeight - towerHeight,
        towerWidth,
        towerHeight
      );
    }
  }
}

/**
 * Draw walls
 * @private
 */
function drawWalls(ctx, x, y, width, height) {
  ctx.fillRect(x, y, width, height);

  // Add battlements
  const battlementWidth = 30;
  for (let i = 0; i < width / battlementWidth; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(x + i * battlementWidth, y, battlementWidth * 0.8, height * 0.2);
    }
  }
}

/**
 * Draw courtyard
 * @private
 */
function drawCourtyard(ctx, x, y, width, height) {
  // Stone floor
  ctx.fillStyle = '#A9A9A9';
  ctx.fillRect(x, y, width, height);

  // Cobblestones
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 3; j++) {
      const stoneX = x + (i / 10) * width;
      const stoneY = y + (j / 3) * height;
      const stoneSize = width / 12;

      ctx.strokeRect(stoneX, stoneY, stoneSize, stoneSize);
    }
  }
}

/**
 * Draw storm clouds
 * @private
 */
function drawStormClouds(ctx, x, y, width, height) {
  for (let i = 0; i < 8; i++) {
    const cloudX = x + (i / 8) * width;
    const cloudWidth = width / 6;
    const cloudHeight = height * 0.6;

    ctx.beginPath();
    ctx.ellipse(cloudX, y + height / 2, cloudWidth / 2, cloudHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw mountains
 * @private
 */
function drawMountains(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, y + height);

  for (let i = 0; i < 5; i++) {
    const peakX = x + (i / 5) * width + width / 10;
    const peakY = y + Math.random() * height * 0.3;

    ctx.lineTo(peakX, peakY);
  }

  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw rain
 * @private
 */
function drawRain(ctx, _camera, width, height) {
  ctx.strokeStyle = 'rgba(174, 214, 241, 0.5)';
  ctx.lineWidth = 1;

  const rainCount = 100;
  const time = Date.now() * 0.01;

  for (let i = 0; i < rainCount; i++) {
    const x = ((i * 123 + time * 50) % width);
    const y = ((i * 456 + time * 200) % height);
    const length = 20 + Math.random() * 10;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + length);
    ctx.stroke();
  }
}

/**
 * Draw generic background
 * @private
 */
function drawGenericBackground(ctx, _camera, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw particle effect
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} particle - Particle object
 * @param {Object} camera - Camera object
 */
export function drawParticle(ctx, particle, camera) {
  if (!ctx || !particle) return;

  const screenX = particle.x - camera.x;
  const screenY = particle.y - camera.y;

  ctx.save();
  ctx.globalAlpha = particle.alpha || 1;

  switch (particle.type) {
    case 'spark':
      drawSparkParticle(ctx, screenX, screenY, particle);
      break;
    case 'smoke':
      drawSmokeParticle(ctx, screenX, screenY, particle);
      break;
    case 'leaf':
      drawLeafParticle(ctx, screenX, screenY, particle);
      break;
    case 'snow':
      drawSnowParticle(ctx, screenX, screenY, particle);
      break;
    case 'ember':
      drawEmberParticle(ctx, screenX, screenY, particle);
      break;
    default:
      drawGenericParticle(ctx, screenX, screenY, particle);
  }

  ctx.restore();
}

/**
 * Draw spark particle
 * @private
 */
function drawSparkParticle(ctx, x, y, particle) {
  ctx.fillStyle = particle.color || '#FFD700';
  ctx.shadowColor = particle.color || '#FFD700';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(x, y, particle.size || 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw smoke particle
 * @private
 */
function drawSmokeParticle(ctx, x, y, particle) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size || 10);
  gradient.addColorStop(0, `rgba(100, 100, 100, ${particle.alpha || 0.5})`);
  gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, particle.size || 10, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw leaf particle
 * @private
 */
function drawLeafParticle(ctx, x, y, particle) {
  ctx.fillStyle = particle.color || '#8FBC8F';
  ctx.strokeStyle = '#6B8E6B';
  ctx.lineWidth = 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(particle.rotation || 0);

  ctx.beginPath();
  ctx.ellipse(0, 0, particle.size || 4, (particle.size || 4) * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw snow particle
 * @private
 */
function drawSnowParticle(ctx, x, y, particle) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 5;

  ctx.beginPath();
  ctx.arc(x, y, particle.size || 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw ember particle
 * @private
 */
function drawEmberParticle(ctx, x, y, particle) {
  ctx.fillStyle = particle.color || '#E67E22';
  ctx.shadowColor = particle.color || '#E67E22';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.arc(x, y, particle.size || 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw generic particle
 * @private
 */
function drawGenericParticle(ctx, x, y, particle) {
  ctx.fillStyle = particle.color || '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, particle.size || 2, 0, Math.PI * 2);
  ctx.fill();
}
