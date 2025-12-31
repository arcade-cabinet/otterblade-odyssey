import { useState } from 'react';
import { AnimationPlayer } from './components/AnimationPlayer';
import { ChromaKeyPreview } from './components/ChromaKeyPreview';
import { SpritePreview } from './components/SpritePreview';

export function App() {
  const [activeTab, setActiveTab] = useState<'sprites' | 'animation' | 'chroma'>('sprites');

  return (
    <div className="container">
      <h1>Otterblade Proofs</h1>
      <p style={{ marginBottom: '1.5rem', color: '#8a8a9e' }}>
        Sprite sheet testing and asset validation without WebGL dependency
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('sprites')}
          style={{ opacity: activeTab === 'sprites' ? 1 : 0.6 }}
        >
          Sprite Sheets
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          style={{ opacity: activeTab === 'animation' ? 1 : 0.6 }}
        >
          Animation Player
        </button>
        <button
          onClick={() => setActiveTab('chroma')}
          style={{ opacity: activeTab === 'chroma' ? 1 : 0.6 }}
        >
          Chroma Key
        </button>
      </div>

      {activeTab === 'sprites' && <SpritePreview />}
      {activeTab === 'animation' && <AnimationPlayer />}
      {activeTab === 'chroma' && <ChromaKeyPreview />}
    </div>
  );
}
