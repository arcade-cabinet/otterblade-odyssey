export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const hash1 = (n: number) => {
  const x = Math.sin(n * 999.123) * 43758.5453;
  return x - Math.floor(x);
};

export const damp = (cur: number, target: number, lambda: number, dt: number) => {
  const k = 1 - Math.exp(-lambda * dt);
  return cur + (target - cur) * k;
};
