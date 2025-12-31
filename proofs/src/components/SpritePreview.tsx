import { useState } from 'react';

interface SpriteData {
  id: string;
  name: string;
  animation: string;
  frames: number;
  status: 'complete' | 'needed' | 'testing';
  file?: string;
}

const SPRITE_MANIFEST: SpriteData[] = [
  { id: 'finn_idle', name: 'Finn - Idle', animation: 'idle', frames: 4, status: 'needed' },
  { id: 'finn_run', name: 'Finn - Run', animation: 'run', frames: 8, status: 'needed' },
  { id: 'finn_walk', name: 'Finn - Walk', animation: 'walk', frames: 6, status: 'needed' },
  { id: 'finn_jump', name: 'Finn - Jump', animation: 'jump', frames: 4, status: 'needed' },
  { id: 'finn_fall', name: 'Finn - Fall', animation: 'fall', frames: 2, status: 'needed' },
  { id: 'finn_crouch', name: 'Finn - Crouch', animation: 'crouch', frames: 2, status: 'needed' },
  { id: 'finn_attack', name: 'Finn - Attack', animation: 'attack', frames: 6, status: 'needed' },
  { id: 'finn_parry', name: 'Finn - Parry', animation: 'parry', frames: 4, status: 'needed' },
  {
    id: 'finn_wall_climb',
    name: 'Finn - Wall Climb',
    animation: 'wall_climb',
    frames: 4,
    status: 'needed',
  },
];

export function SpritePreview() {
  const [selected, setSelected] = useState<string | null>(null);

  const getStatusColor = (status: SpriteData['status']) => {
    switch (status) {
      case 'complete':
        return '#8fbc8f';
      case 'testing':
        return '#d4a574';
      case 'needed':
        return '#bc8f8f';
    }
  };

  return (
    <div>
      <h2 style={{ color: '#d4a574', marginBottom: '1rem' }}>Sprite Sheet Manifest</h2>
      <div className="grid">
        {SPRITE_MANIFEST.map((sprite) => (
          <div
            key={sprite.id}
            className="card"
            onClick={() => setSelected(sprite.id)}
            style={{
              cursor: 'pointer',
              border: selected === sprite.id ? '2px solid #8fbc8f' : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#e0e0e0', fontSize: '1rem' }}>{sprite.name}</h3>
              <span
                style={{
                  background: getStatusColor(sprite.status),
                  color: '#1a1a2e',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {sprite.status}
              </span>
            </div>
            <p style={{ color: '#8a8a9e', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {sprite.frames} frames • {sprite.animation}
            </p>
            <div className="sprite-preview">
              {sprite.file ? (
                <img
                  src={sprite.file}
                  alt={sprite.name}
                  style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
                />
              ) : (
                <span style={{ color: '#4a4a5e' }}>No sprite sheet yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
