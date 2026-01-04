/**
 * Canvas 2D rendering type definitions
 * 
 * Provides type-safe interfaces for procedural rendering system.
 * All entities are rendered procedurally (no sprite sheets).
 */

/**
 * Rendering context
 */
export interface RenderContext {
  /** Canvas 2D context */
  ctx: CanvasRenderingContext2D;
  
  /** Canvas element */
  canvas: HTMLCanvasElement;
  
  /** Camera offset */
  camera: Camera;
  
  /** Debug rendering enabled? */
  debug: boolean;
}

/**
 * Camera configuration
 */
export interface Camera {
  /** Camera X position */
  x: number;
  
  /** Camera Y position */
  y: number;
  
  /** Zoom level (1.0 = normal) */
  zoom: number;
  
  /** Viewport width */
  viewportWidth: number;
  
  /** Viewport height */
  viewportHeight: number;
  
  /** Camera bounds (if constrained) */
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Renderable entity
 */
export interface Renderable {
  /** Entity position */
  position: { x: number; y: number };
  
  /** Entity rotation (radians) */
  rotation: number;
  
  /** Entity scale */
  scale: { x: number; y: number };
  
  /** Render priority (higher = front) */
  zIndex: number;
  
  /** Is entity visible? */
  visible: boolean;
  
  /** Render function */
  render(ctx: RenderContext): void;
}

/**
 * Color palette for Redwall aesthetic
 */
export interface ColorPalette {
  /** Primary character colors */
  primary: string;
  
  /** Secondary accent colors */
  secondary: string;
  
  /** Highlight color */
  highlight: string;
  
  /** Shadow color */
  shadow: string;
  
  /** Outline color */
  outline: string;
}

/**
 * Finn (player) color palette
 */
export const FINN_PALETTE: ColorPalette = {
  primary: '#8B5A3C',    // Warm brown fur
  secondary: '#D4A574',  // Light tan chest
  highlight: '#F5DEB3', // Wheat highlights
  shadow: '#5C3A24',     // Dark brown shadows
  outline: '#2C1810',    // Dark outline
};

/**
 * Enemy color palettes by type
 */
export const ENEMY_PALETTES = {
  scout: {
    primary: '#4A5568',
    secondary: '#718096',
    highlight: '#A0AEC0',
    shadow: '#2D3748',
    outline: '#1A202C',
  },
  warrior: {
    primary: '#742A2A',
    secondary: '#9B2C2C',
    highlight: '#FC8181',
    shadow: '#521C1C',
    outline: '#2D0B0B',
  },
  boss: {
    primary: '#1A202C',
    secondary: '#2D3748',
    highlight: '#4A5568',
    shadow: '#000000',
    outline: '#000000',
  },
} as const;

/**
 * Procedural rendering options
 */
export interface ProceduralRenderOptions {
  /** Color palette */
  palette: ColorPalette;
  
  /** Animation frame */
  animationFrame: number;
  
  /** Facing direction (1 = right, -1 = left) */
  facingDirection: 1 | -1;
  
  /** Current animation */
  animation: string;
  
  /** Is entity hurt? */
  isHurt?: boolean;
  
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Finn procedural rendering state
 */
export interface FinnRenderState {
  /** Head position offset */
  headOffset: { x: number; y: number };
  
  /** Tail position offset */
  tailOffset: { x: number; y: number };
  
  /** Tail angle */
  tailAngle: number;
  
  /** Arm angles */
  armAngles: { left: number; right: number };
  
  /** Leg positions */
  legPositions: { left: { x: number; y: number }; right: { x: number; y: number } };
  
  /** Blade angle (when attacking) */
  bladeAngle?: number;
}

/**
 * Enemy procedural rendering state
 */
export interface EnemyRenderState {
  /** Body color pulse (when hurt) */
  colorPulse: number;
  
  /** Size scale (breathing animation) */
  sizeScale: number;
  
  /** Weapon offset (for warriors) */
  weaponOffset?: { x: number; y: number };
  
  /** Wing positions (for scouts) */
  wingAngles?: { left: number; right: number };
}

/**
 * Parallax layer configuration
 */
export interface ParallaxLayer {
  /** Layer image/pattern */
  pattern: CanvasPattern | CanvasGradient | string;
  
  /** Parallax speed (0-1, 0 = static, 1 = moves with camera) */
  speed: number;
  
  /** Layer offset */
  offset: { x: number; y: number };
  
  /** Layer opacity */
  opacity: number;
  
  /** Layer z-index */
  zIndex: number;
}

/**
 * Particle rendering data
 */
export interface ParticleRenderData {
  /** Particle position */
  position: { x: number; y: number };
  
  /** Particle velocity */
  velocity: { x: number; y: number };
  
  /** Particle color */
  color: string;
  
  /** Particle size */
  size: number;
  
  /** Particle lifetime (0-1) */
  life: number;
  
  /** Particle shape */
  shape: 'circle' | 'square' | 'triangle' | 'line';
}

/**
 * Text rendering options
 */
export interface TextRenderOptions {
  /** Text content */
  text: string;
  
  /** Font family */
  font: string;
  
  /** Font size */
  fontSize: number;
  
  /** Text color */
  color: string;
  
  /** Text alignment */
  align: CanvasTextAlign;
  
  /** Text baseline */
  baseline: CanvasTextBaseline;
  
  /** Text outline */
  outline?: {
    color: string;
    width: number;
  };
  
  /** Text shadow */
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

/**
 * UI element rendering
 */
export interface UIElement {
  /** Element position */
  position: { x: number; y: number };
  
  /** Element size */
  size: { width: number; height: number };
  
  /** Background color */
  backgroundColor?: string;
  
  /** Border */
  border?: {
    color: string;
    width: number;
    radius?: number;
  };
  
  /** Is element visible? */
  visible: boolean;
  
  /** Render function */
  render(ctx: RenderContext): void;
}

/**
 * Health bar rendering options
 */
export interface HealthBarOptions {
  /** Current health */
  current: number;
  
  /** Maximum health */
  max: number;
  
  /** Bar width */
  width: number;
  
  /** Bar height */
  height: number;
  
  /** Bar colors */
  colors: {
    background: string;
    fill: string;
    border: string;
  };
  
  /** Show numerical value? */
  showValue?: boolean;
}

/**
 * Animation frame data
 */
export interface AnimationFrame {
  /** Frame index */
  index: number;
  
  /** Frame duration (ms) */
  duration: number;
  
  /** Frame offset */
  offset?: { x: number; y: number };
  
  /** Frame scale */
  scale?: { x: number; y: number };
}

/**
 * Animation sequence
 */
export interface AnimationSequence {
  /** Animation name */
  name: string;
  
  /** Animation frames */
  frames: AnimationFrame[];
  
  /** Loop animation? */
  loop: boolean;
  
  /** Current frame index */
  currentFrame: number;
  
  /** Time in current frame */
  frameTime: number;
}

/**
 * Rendering utilities
 */
export interface RenderUtils {
  /** Draw circle */
  drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    stroke?: { color: string; width: number }
  ): void;
  
  /** Draw rectangle */
  drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    stroke?: { color: string; width: number }
  ): void;
  
  /** Draw rounded rectangle */
  drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: string,
    stroke?: { color: string; width: number }
  ): void;
  
  /** World to screen coordinates */
  worldToScreen(
    worldPos: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number };
  
  /** Screen to world coordinates */
  screenToWorld(
    screenPos: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number };
}

/**
 * Debug rendering options
 */
export interface DebugRenderOptions {
  /** Show physics bodies? */
  showBodies: boolean;
  
  /** Show collision boundaries? */
  showCollisions: boolean;
  
  /** Show AI paths? */
  showAIPaths: boolean;
  
  /** Show FPS counter? */
  showFPS: boolean;
  
  /** Show entity IDs? */
  showEntityIDs: boolean;
  
  /** Show camera bounds? */
  showCameraBounds: boolean;
}

/**
 * Canvas layer for depth sorting
 */
export interface CanvasLayer {
  /** Layer name */
  name: string;
  
  /** Layer z-index */
  zIndex: number;
  
  /** Layer canvas */
  canvas: HTMLCanvasElement;
  
  /** Layer context */
  ctx: CanvasRenderingContext2D;
  
  /** Layer opacity */
  opacity: number;
  
  /** Is layer visible? */
  visible: boolean;
}

/**
 * Render pipeline stages
 */
export type RenderStage = 
  | 'background'
  | 'environment'
  | 'entities'
  | 'particles'
  | 'ui'
  | 'debug';

/**
 * Render pipeline
 */
export interface RenderPipeline {
  /** Render stages */
  stages: Map<RenderStage, (() => void)[]>;
  
  /** Register render function for stage */
  register(stage: RenderStage, fn: () => void): void;
  
  /** Unregister render function */
  unregister(stage: RenderStage, fn: () => void): void;
  
  /** Execute render pipeline */
  execute(ctx: RenderContext): void;
}
