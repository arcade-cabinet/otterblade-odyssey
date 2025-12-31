import { useEffect, useRef, useState } from 'react';

interface ChromaSettings {
  keyColor: string;
  tolerance: number;
  softness: number;
}

export function ChromaKeyPreview() {
  const [settings, setSettings] = useState<ChromaSettings>({
    keyColor: '#00ff00',
    tolerance: 30,
    softness: 10,
  });
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 0 };
  };

  const applyChromaKey = () => {
    if (!canvasRef.current || !originalImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalImageRef.current.width;
    canvas.height = originalImageRef.current.height;

    ctx.drawImage(originalImageRef.current, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const keyRgb = hexToRgb(settings.keyColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const distance = Math.sqrt((r - keyRgb.r) ** 2 + (g - keyRgb.g) ** 2 + (b - keyRgb.b) ** 2);

      if (distance < settings.tolerance) {
        data[i + 3] = 0;
      } else if (distance < settings.tolerance + settings.softness) {
        const alpha = ((distance - settings.tolerance) / settings.softness) * 255;
        data[i + 3] = Math.min(255, alpha);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (sourceImage) {
      applyChromaKey();
    }
  }, [sourceImage, applyChromaKey]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setSourceImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'keyed-sprite.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div>
      <h2 style={{ color: '#d4a574', marginBottom: '1rem' }}>Chroma Key Tool</h2>
      <p style={{ color: '#8a8a9e', marginBottom: '1rem' }}>
        Remove green screen backgrounds from sprite images for transparency
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: '#e0e0e0', marginBottom: '0.5rem' }}>Upload Image</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ color: '#e0e0e0' }}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <h3 style={{ color: '#e0e0e0', marginBottom: '0.5rem' }}>Result</h3>
          <div
            className="sprite-preview"
            style={{
              minHeight: '300px',
              background:
                'repeating-conic-gradient(#2a2a3e 0% 25%, #1a1a2e 0% 50%) 50% / 20px 20px',
            }}
          >
            {sourceImage ? (
              <canvas ref={canvasRef} style={{ maxWidth: '100%', imageRendering: 'pixelated' }} />
            ) : (
              <span style={{ color: '#4a4a5e' }}>Upload an image to chroma key</span>
            )}
          </div>
          <div className="controls">
            <button onClick={applyChromaKey}>Apply</button>
            <button onClick={handleDownload} disabled={!sourceImage}>
              Download PNG
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: '#e0e0e0', marginBottom: '0.5rem' }}>Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>Key Color:</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settings.keyColor}
                  onChange={(e) => setSettings({ ...settings, keyColor: e.target.value })}
                  style={{ width: '50px', height: '30px' }}
                />
                <input
                  type="text"
                  value={settings.keyColor}
                  onChange={(e) => setSettings({ ...settings, keyColor: e.target.value })}
                  style={{ flex: 1, padding: '0.25rem' }}
                />
              </div>
            </label>
            <label>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>
                Tolerance: {settings.tolerance}
              </span>
              <input
                type="range"
                min="0"
                max="150"
                value={settings.tolerance}
                onChange={(e) => setSettings({ ...settings, tolerance: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <span style={{ display: 'block', marginBottom: '0.25rem' }}>
                Softness: {settings.softness}
              </span>
              <input
                type="range"
                min="0"
                max="50"
                value={settings.softness}
                onChange={(e) => setSettings({ ...settings, softness: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
