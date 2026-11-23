import { brightness, sharpness, averageHash } from './photoChecks';

const MAX_SIDE = 1280;
const QUALITY = 0.85;
const SHARP_BOX = 512;

const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const loadImage = src => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

const draw = (source, w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return { canvas, ctx };
};

// Re-drawing the photo shrinks it and drops its location and camera details.
export const readPhoto = async file => {
  const original = await readFile(file);
  const img = await loadImage(original);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const full = draw(img, w, h);
  if (!full) return { src: original, light: null, sharp: null, hash: null };

  const box = Math.min(SHARP_BOX, w, h);
  const small = draw(full.canvas, 64, 64);
  const tiny = draw(small.canvas, 8, 8);
  return {
    src: full.canvas.toDataURL('image/jpeg', QUALITY),
    light: brightness(small.ctx.getImageData(0, 0, 64, 64)),
    sharp: sharpness(full.ctx.getImageData(Math.floor((w - box) / 2), Math.floor((h - box) / 2), box, box)),
    hash: averageHash(tiny.ctx.getImageData(0, 0, 8, 8))
  };
};
