/**
 * Canvas 2D Renderer - Procedural rendering from POC
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = { x: 0, y: 0 };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setCamera(x, y) {
    this.camera.x = x;
    this.camera.y = y;
  }

  /**
   * Draw procedural otter player (POC code)
   */
  drawPlayer(player, frame) {
    const { ctx } = this;
    const x = player.x - this.camera.x + this.canvas.width / 2;
    const y = player.y - this.camera.y + this.canvas.height / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(player.facing, 1);

    const breathe = Math.sin(frame * 0.1) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#8B6F47';
    ctx.strokeStyle = '#6B5330';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0 + breathe, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(0, 2 + breathe, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#8B6F47';
    ctx.beginPath();
    ctx.ellipse(0, -18 + breathe, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Snout
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(5, -15 + breathe, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(9, -15 + breathe, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(-3, -20 + breathe, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -20 + breathe, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye gleam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-4, -21 + breathe, 1, 1);
    ctx.fillRect(2, -21 + breathe, 1, 1);

    // Ears
    ctx.fillStyle = '#8B6F47';
    ctx.beginPath();
    ctx.arc(-7, -24 + breathe, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -24 + breathe, 4, 0, Math.PI * 2);
    ctx.fill();

    // Otterblade when attacking
    if (player.state === 'attacking') {
      this.drawOtterblade(ctx, breathe);
    }

    ctx.restore();
  }

  drawOtterblade(ctx, breathe) {
    ctx.save();
    ctx.translate(18, -8 + breathe);
    ctx.rotate(-Math.PI / 3);

    ctx.shadowBlur = 12;
    ctx.shadowColor = '#E67E22';

    // Blade
    const grad = ctx.createLinearGradient(0, -30, 0, 0);
    grad.addColorStop(0, '#ECF0F1');
    grad.addColorStop(0.5, '#BDC3C7');
    grad.addColorStop(1, '#95A5A6');
    ctx.fillStyle = grad;
    ctx.fillRect(-3, -30, 6, 30);

    // Gleam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-1, -30, 2, 30);

    // Everember glow
    ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
    ctx.fillRect(-2, -30, 4, 15);

    // Guard
    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(-6, 0, 12, 3);

    // Handle
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, 3, 4, 10);

    // Pommel
    ctx.fillStyle = '#F4D03F';
    ctx.beginPath();
    ctx.arc(0, 13, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw enemy (Galeborn)
   */
  drawEnemy(enemy, frame) {
    const { ctx } = this;
    const x = enemy.x - this.camera.x + this.canvas.width / 2;
    const y = enemy.y - this.camera.y + this.canvas.height / 2;

    ctx.save();
    ctx.translate(x, y);

    // Cold aura
    const coldGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
    coldGrad.addColorStop(0, 'rgba(93, 173, 226, 0.3)');
    coldGrad.addColorStop(1, 'rgba(93, 173, 226, 0)');
    ctx.fillStyle = coldGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (stoat)
    ctx.fillStyle = '#7F8C8D';
    ctx.strokeStyle = '#5D6D7E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -5, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.ellipse(0, -20, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cold eyes
    ctx.fillStyle = '#5DADE2';
    ctx.fillRect(-3, -21, 2, 3);
    ctx.fillRect(1, -21, 2, 3);

    ctx.restore();
  }

  /**
   * Draw platform
   */
  drawPlatform(platform) {
    const { ctx } = this;
    const x = platform.x - this.camera.x + this.canvas.width / 2;
    const y = platform.y - this.camera.y + this.canvas.height / 2;

    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(x, y, platform.width, platform.height);

    // Texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < platform.width; i += 20) {
      ctx.fillRect(x + i, y, 2, platform.height);
    }
  }

  /**
   * Draw parallax background
   */
  drawBackground(biome, scrollX) {
    const { ctx, canvas } = this;

    // Sky gradient
    const skyColors = this.getSkyColors(biome);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, skyColors.top);
    skyGrad.addColorStop(1, skyColors.bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Far mountains
    this.drawMountainLayer(scrollX * 0.1, '#34495E', 0.3);
    
    // Mid mountains
    this.drawMountainLayer(scrollX * 0.3, '#2C3E50', 0.5);
    
    // Tree silhouettes
    this.drawTreeLayer(scrollX * 0.6);
  }

  getSkyColors(biome) {
    const colors = {
      forest: { top: '#87CEEB', bottom: '#D4E6F1' },
      mountains: { top: '#5DADE2', bottom: '#AED6F1' },
      abbey: { top: '#F4D03F', bottom: '#F8E5B5' },
      dungeon: { top: '#2C3E50', bottom: '#34495E' },
    };
    return colors[biome] || colors.forest;
  }

  /**
   * Draw exit portal
   */
  drawExitPortal(portal) {
    const { ctx } = this;
    const x = portal.x - this.camera.x + this.canvas.width / 2;
    const y = portal.y - this.camera.y + this.canvas.height / 2;

    // Glowing portal effect
    const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Outer glow
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
    grad.addColorStop(0, `rgba(244, 208, 63, ${pulseAlpha})`);
    grad.addColorStop(1, 'rgba(244, 208, 63, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Portal ring
    ctx.strokeStyle = '#F4D03F';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner shine
    ctx.fillStyle = 'rgba(244, 208, 63, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Draw collectible
   */
  drawCollectible(collectible, frame) {
    const { ctx } = this;
    const x = collectible.x - this.camera.x + this.canvas.width / 2;
    const y = collectible.y - this.camera.y + this.canvas.height / 2;
    const bob = Math.sin(frame * 0.1) * 5;

    ctx.save();
    ctx.translate(x, y + bob);
    
    if (collectible.type === 'shard') {
      // Ember shard - glowing crystal
      const shardGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
      shardGrad.addColorStop(0, '#E67E22');
      shardGrad.addColorStop(0.5, '#D35400');
      shardGrad.addColorStop(1, 'rgba(230, 126, 34, 0)');
      
      ctx.fillStyle = shardGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Crystal shape
      ctx.fillStyle = '#E67E22';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      
      // Sparkle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (collectible.type === 'health') {
      // Health pickup - heart
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(-5, -5, 5, 0, Math.PI * 2);
      ctx.arc(5, -5, 5, 0, Math.PI * 2);
      ctx.moveTo(-8, -2);
      ctx.lineTo(0, 8);
      ctx.lineTo(8, -2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawMountainLayer(offset, color, alpha) {
    const { ctx, canvas } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.6);

    for (let x = 0; x < canvas.width + 200; x += 100) {
      const h = canvas.height * 0.4 + Math.sin((x + offset) * 0.01) * 50;
      ctx.lineTo(x, h);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawTreeLayer(offset) {
    const { ctx, canvas } = this;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#1A252F';

    for (let x = 0; x < canvas.width + 100; x += 80) {
      const treeX = x - (offset % (canvas.width + 100));
      const treeH = 100 + Math.sin(x * 0.1) * 30;
      const treeW = 20;

      ctx.beginPath();
      ctx.moveTo(treeX, canvas.height * 0.8);
      ctx.lineTo(treeX - treeW, canvas.height * 0.8);
      ctx.lineTo(treeX - treeW / 2, canvas.height * 0.8 - treeH);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}
