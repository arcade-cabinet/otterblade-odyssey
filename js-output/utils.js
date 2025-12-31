const clamp01 = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const hash1 = (n) => {
  const x = Math.sin(n * 999.123) * 43758.5453;
  return x - Math.floor(x);
};
const damp = (cur, target, lambda, dt) => {
  const k = 1 - Math.exp(-lambda * dt);
  return cur + (target - cur) * k;
};
export {
  clamp01,
  damp,
  hash1,
  lerp,
  smooth
};
