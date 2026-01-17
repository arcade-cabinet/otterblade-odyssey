/**
 * Debug System
 *
 * Lightweight runtime debug overlay for development builds.
 */

import type { HazardSystem } from '../types/systems';

export interface DebugSystemConfig {
  enabled: boolean;
  getPlayerPosition: () => { x: number; y: number };
  toggleColliders: (enabled: boolean) => void;
  toggleTriggers: (enabled: boolean) => void;
  toggleAI: (enabled: boolean) => void;
  spawnParticleBurst: (position: { x: number; y: number }, style?: string) => void;
  hazardSystem?: HazardSystem;
}

export class DebugSystem {
  private config: DebugSystemConfig;
  private overlayVisible = false;
  private collidersVisible = false;
  private triggersVisible = false;
  private aiVisible = false;
  private keydownHandler?: (event: KeyboardEvent) => void;

  constructor(config: DebugSystemConfig) {
    this.config = config;
    if (this.config.enabled) {
      this.bindShortcuts();
    }
  }

  private bindShortcuts(): void {
    this.keydownHandler = (event: KeyboardEvent) => {
      if (!this.config.enabled) return;

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          this.toggleOverlay();
          break;
        case 'F2':
          event.preventDefault();
          this.toggleColliders();
          break;
        case 'F3':
          event.preventDefault();
          this.toggleTriggers();
          break;
        case 'F4':
          event.preventDefault();
          this.toggleAI();
          break;
        case 'F5':
          event.preventDefault();
          this.spawnBurstAtPlayer();
          break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Dispose of the debug system and clean up event listeners
   */
  dispose(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = undefined;
    }
  }

  private toggleOverlay(): void {
    this.overlayVisible = !this.overlayVisible;
  }

  private toggleColliders(): void {
    this.collidersVisible = !this.collidersVisible;
    this.config.toggleColliders(this.collidersVisible);
  }

  private toggleTriggers(): void {
    this.triggersVisible = !this.triggersVisible;
    this.config.toggleTriggers(this.triggersVisible);
  }

  private toggleAI(): void {
    this.aiVisible = !this.aiVisible;
    this.config.toggleAI(this.aiVisible);
  }

  private spawnBurstAtPlayer(): void {
    const pos = this.config.getPlayerPosition();
    this.config.spawnParticleBurst(pos, 'warm');
  }

  renderOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.overlayVisible) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(16, 16, 260, 140);
    ctx.fillStyle = '#F4D03F';
    ctx.font = '12px monospace';
    ctx.fillText('Debug Overlay (F1)', 28, 40);
    ctx.fillText(`Colliders: ${this.collidersVisible ? 'ON' : 'OFF'} (F2)`, 28, 60);
    ctx.fillText(`Triggers: ${this.triggersVisible ? 'ON' : 'OFF'} (F3)`, 28, 80);
    ctx.fillText(`AI Debug: ${this.aiVisible ? 'ON' : 'OFF'} (F4)`, 28, 100);
    ctx.fillText('Particle Burst (F5)', 28, 120);
    ctx.restore();
  }
}
