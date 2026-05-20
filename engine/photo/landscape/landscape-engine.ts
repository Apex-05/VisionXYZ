import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

// Precomputed filmic S-curve LUT: lifts shadows, compresses highlights
const FILM_LUT = (() => {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    // Reinhard-extended tone map with contrast S-curve
    const tm = x * (1 + x / (1.2 * 1.2)) / (1 + x);
    // S-curve: slightly lift shadows, compress highlights
    const sc = tm < 0.5
      ? 2 * tm * tm
      : 1 - Math.pow(-2 * tm + 2, 2) / 2;
    lut[i] = Math.round(Math.max(0, Math.min(1, sc * 0.92 + tm * 0.08)) * 255);
  }
  return lut;
})();

export class LandscapeEngine {
  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const data = new Uint8ClampedArray(imageData.data);

    applyFilmicTone(data);        // lift shadows, compress highlights
    applyVibrance(data, 0.45);    // boost under-saturated areas selectively
    applyFoliageBoost(data, 8);   // make greens richer
    applySkyEnhancement(data, width, height); // deepen blues in upper sky region
    applyClarity(data, width, height, 0.25);  // local midtone contrast

    return {
      imageData: new ImageData(data, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void {}
  destroy(): void {}
}

// Filmic tone map via precomputed LUT
function applyFilmicTone(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = FILM_LUT[data[i]];
    data[i + 1] = FILM_LUT[data[i + 1]];
    data[i + 2] = FILM_LUT[data[i + 2]];
  }
}

// Vibrance: boost saturation on already-desaturated pixels more, protect skin tones
function applyVibrance(data: Uint8ClampedArray, strength: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max; // 0..1
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Skin tone guard: don't over-saturate warm skin tones
    const isSkin = r > 140 && r > g && r > b && r - b > 20;
    const boost = isSkin ? strength * 0.3 : strength * (1 - sat * 0.8);

    data[i]     = clamp(gray + (r - gray) * (1 + boost));
    data[i + 1] = clamp(gray + (g - gray) * (1 + boost));
    data[i + 2] = clamp(gray + (b - gray) * (1 + boost));
  }
}

// Foliage: gently boost green channel when green-dominant
function applyFoliageBoost(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (g > r * 1.05 && g > b * 1.05 && g > 60) {
      const excess = g - Math.max(r, b);
      const weight = Math.min(1, excess / 60);
      data[i + 1] = clamp(g + amount * weight);
    }
  }
}

// Sky: deepen blue in upper 45% where blue is already dominant
function applySkyEnhancement(data: Uint8ClampedArray, width: number, height: number): void {
  const upperH = Math.floor(height * 0.45);
  for (let y = 0; y < upperH; y++) {
    const skyFade = 1 - y / upperH; // strongest at top, fades to horizon
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const bright = (r + g + b) / 3;
      // Only touch pixels that are already blue-dominant (actual sky, not clouds)
      if (b > r * 1.05 && b > g * 0.9 && bright > 60 && bright < 230) {
        const deepenB = Math.round(skyFade * 18);
        const coolR = Math.round(skyFade * 6);
        data[i]     = clamp(r - coolR);
        data[i + 2] = clamp(b + deepenB);
      }
    }
  }
}

// Clarity: unsharp mask targeting midtones only (skips very dark/bright)
function applyClarity(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): void {
  const src = new Uint8ClampedArray(data);
  const step = 2; // subsample — process every other pixel for performance

  for (let y = step; y < height - step; y += 1) {
    for (let x = step; x < width - step; x += 1) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[i + c];
        // Skip shadows and highlights
        if (center < 30 || center > 225) continue;
        // Laplacian of 5-tap cross
        const n = src[((y - step) * width + x) * 4 + c];
        const s = src[((y + step) * width + x) * 4 + c];
        const e = src[(y * width + (x + step)) * 4 + c];
        const w = src[(y * width + (x - step)) * 4 + c];
        const lap = center - (n + s + e + w) / 4;
        data[i + c] = clamp(center + lap * amount);
      }
    }
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
