import { Canvas } from '@react-three/fiber';
import { Component, type ReactNode, Suspense, useEffect, useState } from 'react';
import { Level } from './Level';
import { PhysicsWrapper } from './Physics';
import { Player } from './Player';
import { useStore } from './store';
import { initializeTestAPI } from './test-api';

function KeyboardControls() {
  const setControl = useStore((s) => s.setControl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setControl('left', true);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setControl('right', true);
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setControl('up', true);
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'ControlLeft')
        setControl('slink', true);
      if (e.code === 'Space') {
        e.preventDefault();
        setControl('jump', true);
      }
      if (e.code === 'KeyK' || e.code === 'KeyX') setControl('attack', true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setControl('left', false);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setControl('right', false);
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setControl('up', false);
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'ControlLeft')
        setControl('slink', false);
      if (e.code === 'Space') {
        e.preventDefault();
        setControl('jump', false);
      }
      if (e.code === 'KeyK' || e.code === 'KeyX') setControl('attack', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setControl]);

  return null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function WebGLFallback() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-sky-400 mb-4">WebGL Required</h1>
        <p className="text-slate-400 max-w-md">
          Otterblade Odyssey requires WebGL to run. Please use a browser with WebGL support (Chrome,
          Firefox, Safari, or Edge).
        </p>
      </div>
    </div>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export default function Game() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
    
    // Initialize test API for E2E testing
    if (import.meta.env.MODE !== 'production') {
      initializeTestAPI();
    }
  }, []);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  return (
    <div className="w-full h-screen bg-black" data-testid="game-container">
      <KeyboardControls />
      <WebGLErrorBoundary fallback={<WebGLFallback />}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <color attach="background" args={['#1a1a2e']} />
          <Suspense fallback={null}>
            <PhysicsWrapper>
              <Player />
              <Level />
            </PhysicsWrapper>
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
