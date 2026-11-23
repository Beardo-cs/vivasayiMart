// Quick photo quality hints, worked out on the phone from raw pixels ({ data, width, height }
// as in canvas ImageData). They only suggest a retake; they never block a photo.
export const DARK_BELOW = 45;   // average brightness, 0-255
export const BLURRY_BELOW = 50; // edge strength at full size (variance of the Laplacian)
export const SAME_WITHIN = 5;   // differing bits out of 64

const luma = (data, i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

export const brightness = ({ data }) => {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += luma(data, i);
  return sum / (data.length / 4);
};

export const sharpness = ({ data, width, height }) => {
  const gray = new Float32Array(width * height);
  for (let p = 0; p < gray.length; p++) gray[p] = luma(data, p * 4);
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      const v = gray[p - width] + gray[p + width] + gray[p - 1] + gray[p + 1] - 4 * gray[p];
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  if (!n) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
};

// Expects an 8x8 image: one bit per pixel, set when brighter than the average.
export const averageHash = ({ data }) => {
  const values = [];
  for (let i = 0; i < data.length; i += 4) values.push(luma(data, i));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.map(v => (v > mean ? '1' : '0')).join('');
};

export const hashDistance = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
};

// A measurement is null when the phone couldn't read the pixels; then there is nothing to say.
export const photoWarnings = ({ light, sharp, hash }, otherHashes = []) => {
  const warnings = [];
  if (light != null && light < DARK_BELOW) warnings.push('dark');
  else if (sharp != null && sharp < BLURRY_BELOW) warnings.push('blurry');
  if (hash && otherHashes.some(h => h && hashDistance(h, hash) <= SAME_WITHIN)) warnings.push('duplicate');
  return warnings;
};
