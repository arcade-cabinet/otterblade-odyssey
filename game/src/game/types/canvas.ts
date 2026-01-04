/**
 * Canvas Rendering Type Definitions
 * 
 * Types for procedural rendering using Canvas 2D API
 * All entities are rendered procedurally (no sprite sheets)
 */

/**
 * Canvas context with type safety
 */
export type RenderContext = CanvasRenderingContext2D;

/**
 * Color in hex format
 */
export type HexColor = `#${string}`;

/**
 * Rendering layer priorities (higher = rendered on top)
 */
export enum RenderLayer {
  BACKGROUND = 0,
  PARALLAX_FAR = 10,
  PARALLAX_MID = 20,
  PARALLAX_NEAR = 30,
  PLATFORMS = 40,
  ITEMS = 50,
  HAZARDS = 60,
  NPCS = 70,
  ENEMIES = 80,
  PLAYER = 90,
  PARTICLES = 100,
  UI = 110,
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  
  // Follow behavior
  followSmoothing: number;
  followOffset: { x: number; y: number };
  
  // Bounds
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Procedural rendering configuration for Finn (player)
 */
export interface FinnRenderConfig {
  // Body colors
  bodyColor: HexColor;
  bellyColor: HexColor;
  tailColor: HexColor;
  eyeColor: HexColor;
  noseColor: HexColor;
  
  // Sizes
  headRadius: number;
  bodyWidth: number;
  bodyHeight: number;
  tailWidth: number;
  tailLength: number;
  
  // Animation
  bobAmount: number;
  bobSpeed: number;
  tailSwayAmount: number;
  tailSwaySpeed: number;
}

/**
 * Procedural rendering configuration for enemies
 */
export interface EnemyRenderConfig {
  // Colors
  primaryColor: HexColor;
  secondaryColor: HexColor;
  eyeColor: HexColor;
  
  // Size
  width: number;
  height: number;
  
  // Features
  hasHelmet: boolean;
  hasWeapon: boolean;
  hasCape: boolean;
  hasArmor: boolean;
  
  // Animation
  bobAmount: number;
  bobSpeed: number;
}

/**
 * Particle effect configuration
 */
export interface ParticleConfig {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  
  color: HexColor;
  size: number;
  lifetime: number;
  fadeOut: boolean;
  
  // Visual effects
  glow: boolean;
  glowRadius?: number;
  trail: boolean;
}

/**
 * Particle emitter configuration
 */
export interface ParticleEmitterConfig {
  position: { x: number; y: number };
  rate: number; // Particles per second
  
  // Spawn area
  spawnRadius: number;
  
  // Particle properties
  particleConfig: Partial<ParticleConfig>;
  
  // Randomization
  velocityVariance: number;
  sizeVariance: number;
  lifetimeVariance: number;
  
  // Emitter lifetime
  duration: number; // -1 for infinite
  autoDestroy: boolean;
}

/**
 * Parallax layer configuration
 */
export interface ParallaxLayerConfig {
  // Scroll factor (0 = static, 1 = moves with camera)
  scrollFactor: { x: number; y: number };
  
  // Repeat behavior
  repeatX: boolean;
  repeatY: boolean;
  
  // Rendering
  render: (ctx: RenderContext, camera: CameraConfig, offset: { x: number; y: number }) => void;
  
  // Layer depth (for sorting)
  depth: number;
}

/**
 * Animation frame
 */
export interface AnimationFrame {
  duration: number; // in milliseconds
  render: (ctx: RenderContext, x: number, y: number, facing: number) => void;
}

/**
 * Animation sequence
 */
export interface AnimationSequence {
  frames: AnimationFrame[];
  loop: boolean;
  onComplete?: () => void;
}

/**
 * Procedural rendering utilities
 */
export interface ProceduralRenderer {
  // Finn rendering
  renderFinn(
    ctx: RenderContext,
    x: number,
    y: number,
    facing: number,
    animState: string,
    animFrame: number
  ): void;
  
  // Enemy rendering
  renderEnemy(
    ctx: RenderContext,
    x: number,
    y: number,
    facing: number,
    enemyType: string,
    animFrame: number,
    health: number,
    maxHealth: number
  ): void;
  
  // Boss rendering
  renderBoss(
    ctx: RenderContext,
    x: number,
    y: number,
    bossType: string,
    phase: number,
    health: number,
    maxHealth: number
  ): void;
  
  // NPC rendering
  renderNPC(
    ctx: RenderContext,
    x: number,
    y: number,
    npcType: string,
    animState: string,
    facing: number
  ): void;
  
  // Platform rendering
  renderPlatform(
    ctx: RenderContext,
    x: number,
    y: number,
    width: number,
    height: number,
    platformType: string
  ): void;
  
  // Item rendering
  renderItem(
    ctx: RenderContext,
    x: number,
    y: number,
    itemType: string,
    bobOffset: number
  ): void;
  
  // Hazard rendering
  renderHazard(
    ctx: RenderContext,
    x: number,
    y: number,
    width: number,
    height: number,
    hazardType: string,
    active: boolean
  ): void;
}

/**
 * Debug rendering options
 */
export interface DebugRenderOptions {
  showPhysicsBodies: boolean;
  showCollisionBoxes: boolean;
  showVelocityVectors: boolean;
  showAIDebug: boolean;
  showCameraDebug: boolean;
  showPerformanceStats: boolean;
}

/**
 * Scene rendering function signature
 */
export type SceneRenderer = (ctx: RenderContext, camera: CameraConfig) => void;
