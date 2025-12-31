/**
 * @fileoverview Vitest test setup configuration
 * Sets up testing environment with proper mocks for React Three Fiber and DOM testing
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock WebGL context for Three.js tests
const mockWebGLContext = {
  getExtension: vi.fn(() => null),
  getParameter: vi.fn(() => 'WebGL'),
  getShaderPrecisionFormat: vi.fn(() => ({ precision: 1, rangeMin: 1, rangeMax: 1 })),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  depthFunc: vi.fn(),
  depthMask: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  activeTexture: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  createFramebuffer: vi.fn(() => ({})),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
  deleteTexture: vi.fn(),
  deleteFramebuffer: vi.fn(),
  pixelStorei: vi.fn(),
  generateMipmap: vi.fn(),
  scissor: vi.fn(),
  cullFace: vi.fn(),
  frontFace: vi.fn(),
  colorMask: vi.fn(),
  stencilFunc: vi.fn(),
  stencilOp: vi.fn(),
  stencilMask: vi.fn(),
  clearStencil: vi.fn(),
  clearDepth: vi.fn(),
  lineWidth: vi.fn(),
  polygonOffset: vi.fn(),
  sampleCoverage: vi.fn(),
  blendColor: vi.fn(),
  blendEquation: vi.fn(),
  blendEquationSeparate: vi.fn(),
  blendFuncSeparate: vi.fn(),
  getContextAttributes: vi.fn(() => ({
    alpha: true,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  })),
  isContextLost: vi.fn(() => false),
  getSupportedExtensions: vi.fn(() => []),
  canvas: { width: 800, height: 600 },
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
};

// Mock canvas getContext for WebGL
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock PointerEvent for touch controls testing
class MockPointerEvent extends Event {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 0;
    this.pointerType = props.pointerType ?? 'mouse';
    this.clientX = props.clientX ?? 0;
    this.clientY = props.clientY ?? 0;
  }
}

global.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
