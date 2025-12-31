import { useState, useEffect, useRef } from "react";

interface AnimationConfig {
  spriteSheet: string | null;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
}

export function AnimationPlayer() {
  const [config, setConfig] = useState<AnimationConfig>({
    spriteSheet: null,
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 8,
    fps: 12,
    loop: true,
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= config.frameCount) {
          return config.loop ? 0 : prev;
        }
        return next;
      });
    }, 1000 / config.fps);

    return () => clearInterval(interval);
  }, [isPlaying, config.fps, config.frameCount, config.loop]);

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, config.frameWidth * 3, config.frameHeight * 3);
    ctx.imageSmoothingEnabled = false;

    const sx = currentFrame * config.frameWidth;
    ctx.drawImage(
      imageRef.current,
      sx,
      0,
      config.frameWidth,
      config.frameHeight,
      0,
      0,
      config.frameWidth * 3,
      config.frameHeight * 3
    );
  }, [currentFrame, config]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setConfig((prev) => ({ ...prev, spriteSheet: event.target?.result as string }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 style={{ color: "#d4a574", marginBottom: "1rem" }}>Animation Player</h2>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ color: "#e0e0e0", marginBottom: "0.5rem" }}>Load Sprite Sheet</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ color: "#e0e0e0" }}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <h3 style={{ color: "#e0e0e0", marginBottom: "0.5rem" }}>Preview</h3>
          <div
            className="sprite-preview"
            style={{
              minHeight: "250px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {config.spriteSheet ? (
              <canvas
                ref={canvasRef}
                width={config.frameWidth * 3}
                height={config.frameHeight * 3}
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <span style={{ color: "#4a4a5e" }}>Upload a sprite sheet to preview</span>
            )}
          </div>
          <div className="controls">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={() => setCurrentFrame(0)}>Reset</button>
            <span style={{ color: "#8a8a9e", marginLeft: "auto" }}>
              Frame: {currentFrame + 1} / {config.frameCount}
            </span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: "#e0e0e0", marginBottom: "0.5rem" }}>Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Frame Width:</span>
              <input
                type="number"
                value={config.frameWidth}
                onChange={(e) => setConfig({ ...config, frameWidth: Number(e.target.value) })}
                style={{ width: "80px", padding: "0.25rem" }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Frame Height:</span>
              <input
                type="number"
                value={config.frameHeight}
                onChange={(e) => setConfig({ ...config, frameHeight: Number(e.target.value) })}
                style={{ width: "80px", padding: "0.25rem" }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Frame Count:</span>
              <input
                type="number"
                value={config.frameCount}
                onChange={(e) => setConfig({ ...config, frameCount: Number(e.target.value) })}
                style={{ width: "80px", padding: "0.25rem" }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>FPS:</span>
              <input
                type="number"
                value={config.fps}
                onChange={(e) => setConfig({ ...config, fps: Number(e.target.value) })}
                style={{ width: "80px", padding: "0.25rem" }}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Loop:</span>
              <input
                type="checkbox"
                checked={config.loop}
                onChange={(e) => setConfig({ ...config, loop: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
