/**
 * Canvas rendering type definitions
 * Type-safe interfaces for procedural rendering with Canvas 2D API
 */

/**
 * Canvas context with type safety
 */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio?: number;
}

/**
 * Camera for following player
 */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
  
  /** Follow target entity */
  follow(targetX: number, targetY: number): void;
  
  /** Convert world to screen coordinates */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number };
  
  /** Convert screen to world coordinates */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number };
}

/**
 * Rendering layer for depth sorting
 */
export type RenderLayer = 
  | 'background'    // Parallax backgrounds
  | 'platforms'     // Ground and platforms
  | 'entities'      // Players, enemies, NPCs
  | 'particles'     // Visual effects
  | 'ui';           // HUD elements

/**
 * Drawable entity interface
 */
export interface Drawable {
  /** Position in world */
  x: number;
  y: number;
  
  /** Rotation in radians */
  rotation?: number;
  
  /** Scale factor */
  scale?: number;
  
  /** Render layer for depth sorting */
  layer: RenderLayer;
  
  /** Draw this entity to canvas */
  draw(ctx: CanvasRenderingContext2D, camera: Camera): void;
}

/**
 * Procedural character rendering configuration
 * Based on POC drawOtter() function
 */
export interface CharacterRenderConfig {
  /** Character position */
  x: number;
  y: number;
  
  /** Character dimensions */
  width: number;
  height: number;
  
  /** Direction facing (1 = right, -1 = left) */
  facing: number;
  
  /** Animation state */
  animationState?: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hurt';
  
  /** Animation frame (0-based) */
  animationFrame?: number;
  
  /** Primary color */
  primaryColor?: string;
  
  /** Secondary color */
  secondaryColor?: string;
  
  /** Accent color */
  accentColor?: string;
}

/**
 * Particle effect configuration
 */
export interface ParticleConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  size: number;
  lifetime: number;
  gravity?: number;
  friction?: number;
}

/**
 * Particle emitter configuration
 */
export interface ParticleEmitterConfig {
  x: number;
  y: number;
  rate: number;              // Particles per second
  particleLifetime: number;  // Seconds
  velocityRange: {
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
  sizeRange: { min: number; max: number };
  colors: string[];
}

/**
 * Parallax layer for background scrolling
 */
export interface ParallaxLayer {
  /** Layer depth (0 = furthest, 1 = closest) */
  depth: number;
  
  /** Drawing function for this layer */
  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
}

/**
 * Procedural rendering functions type
 */
export interface ProceduralRenderer {
  /** Draw player character (Finn the otter) */
  drawPlayer(ctx: CanvasRenderingContext2D, config: CharacterRenderConfig): void;
  
  /** Draw enemy character */
  drawEnemy(ctx: CanvasRenderingContext2D, config: CharacterRenderConfig, enemyType: string): void;
  
  /** Draw NPC character */
  drawNPC(ctx: CanvasRenderingContext2D, config: CharacterRenderConfig, npcRole: string): void;
  
  /** Draw platform */
  drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void;
  
  /** Draw item/collectible */
  drawItem(ctx: CanvasRenderingContext2D, x: number, y: number, itemType: string): void;
}

/**
 * Animation state for frame-based animations
 */
export interface AnimationState {
  /** Current animation name */
  currentAnimation: string;
  
  /** Current frame index */
  currentFrame: number;
  
  /** Frame duration (milliseconds) */
  frameDuration: number;
  
  /** Time elapsed in current frame */
  frameTimer: number;
  
  /** Is animation looping? */
  loop: boolean;
  
  /** Update animation state */
  update(deltaTime: number): void;
}

/**
 * Brand color palette from BRAND.md
 */
export const BRAND_COLORS = {
  // Warm colors
  FOREST_GREEN: '#4a7c59',
  MOSS_GREEN: '#6b8e23',
  HONEY_GOLD: '#daa520',
  AUTUMN_LEAF: '#d2691e',
  
  // Cool colors
  DAWN_MIST: '#b0c4de',
  SHADOW_BLUE: '#4682b4',
  
  // Neutral colors
  STONE_GRAY: '#708090',
  WARM_BROWN: '#8b4513',
  
  // UI colors
  UI_BACKGROUND: 'rgba(42, 42, 42, 0.85)',
  UI_TEXT: '#f5f5dc',
  UI_BORDER: '#daa520',
  
  // Effect colors
  GLOW_BLUE: '#87ceeb',
  GLOW_GOLD: '#ffd700',
} as const;

/**
 * Rendering constants from POC
 */
export const RENDER_CONSTANTS = {
  /** Canvas pixel ratio for crisp rendering */
  PIXEL_RATIO: window.devicePixelRatio || 1,
  
  /** Target canvas size */
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  
  /** Line width for shapes */
  LINE_WIDTH: 2,
  
  /** Shadow blur for effects */
  SHADOW_BLUR: 10,
} as const;
