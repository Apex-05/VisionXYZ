import type { SceneClass } from './classifier';

export function applySceneAdaptation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  scene: SceneClass
): void {
  switch (scene) {
    case 'food':
      boostSaturation(data, 1.35);
      adjustWarmth(data, 18, 5);
      adjustContrast(data, 1.08);
      break;
    case 'landscape':
      adjustContrast(data, 1.18);
      boostSaturation(data, 1.2);
      boostGreen(data, 8);
      break;
    case 'document':
      applyAutoLevels(data);
      adjustContrast(data, 1.4);
      applySharpenSimple(data, width, height, 0.55);
      break;
    case 'sky':
      adjustContrast(data, 1.12);
      boostBlue(data, 12);
      boostSaturation(data, 1.1);
      break;
    case 'night':
      applyGammaBoost(data, 1.7);
      boostSaturation(data, 0.75);
      adjustWarmth(data, 8, 4);
      break;
    case 'human':
      boostSaturation(data, 1.08);
      adjustContrast(data, 1.06);
      adjustWarmth(data, 5, 2);
      break;
    case 'indoor':
      adjustContrast(data, 1.1);
      boostSaturation(data, 1.05);
      adjustWarmth(data, 10, 5);
      break;
    default:
      adjustContrast(data, 1.05);
      break;
  }
}

function boostSaturation(data: Uint8ClampedArray, factor: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i]     = clamp(gray + (r - gray) * factor);
    data[i + 1] = clamp(gray + (g - gray) * factor);
    data[i + 2] = clamp(gray + (b - gray) * factor);
  }
}

function adjustContrast(data: Uint8ClampedArray, factor: number): void {
  const mid = 127.5;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp((data[i]     - mid) * factor + mid);
    data[i + 1] = clamp((data[i + 1] - mid) * factor + mid);
    data[i + 2] = clamp((data[i + 2] - mid) * factor + mid);
  }
}

function adjustWarmth(data: Uint8ClampedArray, rAdd: number, bSub: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(data[i]     + rAdd);
    data[i + 2] = clamp(data[i + 2] - bSub);
  }
}

function boostBlue(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i + 2] = clamp(data[i + 2] + amount);
  }
}

function boostGreen(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const g = data[i + 1];
    if (g > data[i] && g > data[i + 2]) {
      data[i + 1] = clamp(g + amount);
    }
  }
}

function applyGammaBoost(data: Uint8ClampedArray, gamma: number): void {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(Math.pow(i / 255, 1 / gamma) * 255);
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

// Stretch full tonal range to 0–255 (per-channel auto levels)
function applyAutoLevels(data: Uint8ClampedArray): void {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i]     < minR) minR = data[i];     if (data[i]     > maxR) maxR = data[i];
    if (data[i + 1] < minG) minG = data[i + 1]; if (data[i + 1] > maxG) maxG = data[i + 1];
    if (data[i + 2] < minB) minB = data[i + 2]; if (data[i + 2] > maxB) maxB = data[i + 2];
  }
  const rRange = maxR - minR || 1, gRange = maxG - minG || 1, bRange = maxB - minB || 1;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(((data[i]     - minR) / rRange) * 255);
    data[i + 1] = clamp(((data[i + 1] - minG) / gRange) * 255);
    data[i + 2] = clamp(((data[i + 2] - minB) / bRange) * 255);
  }
}

function applySharpenSimple(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): void {
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const n = src[((y-1)*width+x)*4+c];
        const s = src[((y+1)*width+x)*4+c];
        const e = src[(y*width+x+1)*4+c];
        const w = src[(y*width+x-1)*4+c];
        data[idx + c] = clamp(center + amount * (4*center - n - s - e - w));
      }
    }
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
