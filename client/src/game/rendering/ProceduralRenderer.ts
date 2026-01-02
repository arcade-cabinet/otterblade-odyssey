/**
 * Procedural Renderer - Canvas 2D rendering system from POC
 * Renders player, enemies, and environments procedurally (no sprite sheets)
 */

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  frame: number;
  time: number;
}

export interface CharacterState {
  state: 'idle' | 'walking' | 'attacking' | 'rolling' | 'jumping';
  facing: 1 | -1;
  position: { x: number; y: number };
}

export class ProceduralRenderer {
  private animFrame = 0;

  constructor() {}

  /**
   * Draw Finn (the player otter) - from POC lines 650-818
   */
  drawPlayer(ctx: CanvasRenderingContext2D, player: CharacterState, frame: number): void {
    ctx.save();
    ctx.translate(player.position.x, player.position.y);
    ctx.scale(player.facing, 1);

    const { state } = player;
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

    // Muzzle
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.ellipse(5, -15 + breathe, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(9, -15 + breathe, 2, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#6B5330';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(9, -17 + i * 2 + breathe);
      ctx.lineTo(18, -17 + i * 2 + breathe);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, -15 + i * 2 + breathe);
      ctx.lineTo(18, -15 + i * 2 + breathe);
      ctx.stroke();
    }

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

    // Back arm
    const armAngle = state === 'walking' ? Math.sin(frame * Math.PI / 2 + Math.PI) * 0.3 : 0;
    ctx.save();
    ctx.translate(-10, -5 + breathe);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(-3, 0, 6, 15);
    ctx.beginPath();
    ctx.arc(0, 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The Otterblade (when attacking)
    if (state === 'attacking') {
      this.drawOtterblade(ctx, breathe);
    }

    // Front arm
    const frontArmAngle = state === 'walking' ? Math.sin(frame * Math.PI / 2) * 0.3 :
                          state === 'attacking' ? -Math.PI / 4 : 0;
    ctx.save();
    ctx.translate(10, -5 + breathe);
    ctx.rotate(frontArmAngle);
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(-3, 0, 6, 15);
    ctx.beginPath();
    ctx.arc(0, 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Roll indicator
    if (state === 'rolling') {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#5DADE2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /**
   * Draw the Otterblade - from POC lines 739-791
   */
  private drawOtterblade(ctx: CanvasRenderingContext2D, breathe: number): void {
    ctx.save();
    ctx.translate(18, -8 + breathe);
    ctx.rotate(-Math.PI / 3);

    // Blade glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#E67E22';

    // Blade
    const bladeGradient = ctx.createLinearGradient(0, -30, 0, 0);
    bladeGradient.addColorStop(0, '#ECF0F1');
    bladeGradient.addColorStop(0.5, '#BDC3C7');
    bladeGradient.addColorStop(1, '#95A5A6');
    ctx.fillStyle = bladeGradient;
    ctx.fillRect(-3, -30, 6, 30);

    // Blade edge gleam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(-1, -30, 2, 30);

    // Everember glow on blade
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

    // Legacy marks
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-1, 5 + i * 2);
      ctx.lineTo(1, 5 + i * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draw Galeborn enemy - from POC lines 820-950
   */
  drawEnemy(ctx: CanvasRenderingContext2D, enemy: { position: { x: number; y: number }; enemyType: string }, frame: number): void {
    ctx.save();
    ctx.translate(enemy.position.x, enemy.position.y);

    // Cold aura
    const coldGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
    coldGradient.addColorStop(0, 'rgba(93, 173, 226, 0.3)');
    coldGradient.addColorStop(1, 'rgba(93, 173, 226, 0)');
    ctx.fillStyle = coldGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.enemyType === 'scout') {
      // Galeborn Scout (Stoat/Weasel)
      ctx.fillStyle = '#7F8C8D';
      ctx.strokeStyle = '#5D6D7E';
      ctx.lineWidth = 2;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, -5, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(0, -20, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ears
      ctx.beginPath();
      ctx.arc(-5, -26, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -26, 3, 0, Math.PI * 2);
      ctx.fill();

      // Cold eyes
      ctx.fillStyle = '#5DADE2';
      ctx.fillRect(-3, -21, 2, 3);
      ctx.fillRect(1, -21, 2, 3);

      // Frost breath
      ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(8 + i * 4, -18 + Math.random() * 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Draw procedural parallax background layers
   * Simple gradient layers that look good and work immediately
   */
  drawParallaxBackground(ctx: CanvasRenderingContext2D, biome: string, scrollOffset: number, frame: number): void {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Sky gradient (changes by biome)
    const skyColors = this.getSkyColors(biome);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, skyColors.top);
    skyGradient.addColorStop(1, skyColors.bottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Far mountains (slowest parallax)
    this.drawMountainLayer(ctx, width, height, scrollOffset * 0.1, '#34495E', 0.3);

    // Mid mountains
    this.drawMountainLayer(ctx, width, height, scrollOffset * 0.3, '#2C3E50', 0.5);

    // Tree silhouettes (faster parallax)
    this.drawTreeLayer(ctx, width, height, scrollOffset * 0.6, '#1A252F', 0.7);
  }

  private getSkyColors(biome: string): { top: string; bottom: string } {
    switch (biome) {
      case 'forest':
        return { top: '#87CEEB', bottom: '#D4E6F1' };
      case 'mountains':
        return { top: '#5DADE2', bottom: '#AED6F1' };
      case 'abbey':
        return { top: '#F4D03F', bottom: '#F8E5B5' };
      default:
        return { top: '#87CEEB', bottom: '#D4E6F1' };
    }
  }

  private drawMountainLayer(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number, color: string, alpha: number): void {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-offset % width, height * 0.6);

    for (let x = 0; x < width + 200; x += 100) {
      const peakHeight = height * 0.4 + Math.sin((x + offset) * 0.01) * 50;
      ctx.lineTo(x - (offset % width), peakHeight);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawTreeLayer(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number, color: string, alpha: number): void {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    for (let x = 0; x < width + 100; x += 80) {
      const treeX = x - (offset % (width + 100));
      const treeHeight = 100 + Math.sin(x * 0.1) * 30;
      const treeWidth = 20;

      // Simple triangle tree
      ctx.beginPath();
      ctx.moveTo(treeX, height * 0.8);
      ctx.lineTo(treeX - treeWidth, height * 0.8);
      ctx.lineTo(treeX - treeWidth / 2, height * 0.8 - treeHeight);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}

export const proceduralRenderer = new ProceduralRenderer();
