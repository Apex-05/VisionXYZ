import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';
import { applyCLAHE } from './clahe';
import { applyGammaCorrection } from './gamma';
import { applySharpen } from './sharpen';
import { applyDenoise } from './denoise';

export type NightMode = 'night-plus' | 'extreme-night' | 'moon';

export interface NightEngineOptions {
  mode: NightMode;
  gammaBoost: number;
  claheClipLimit: number;
  sharpenAmount: number;
  denoiseStrength: number;
  noiseGate: number;      // crush values below this to black (kill hot pixels)
  warmShift: number;      // +R/-B to counteract bluish noise cast
  colorDenoiseStrength: number; // extra smoothing on Cb/Cr channels
}

const PRESETS: Record<NightMode, NightEngineOptions> = {
  'night-plus': {
    mode: 'night-plus',
    gammaBoost: 1.9,
    claheClipLimit: 2.2,
    sharpenAmount: 0.3,
    denoiseStrength: 0.35,
    noiseGate: 8,
    warmShift: 6,
    colorDenoiseStrength: 0.55,
  },
  'extreme-night': {
    mode: 'extreme-night',
    gammaBoost: 3.0,
    claheClipLimit: 3.8,
    sharpenAmount: 0.45,
    denoiseStrength: 0.55,
    noiseGate: 14,
    warmShift: 10,
    colorDenoiseStrength: 0.70,
  },
  'moon': {
    mode: 'moon',
    gammaBoost: 4.5,
    claheClipLimit: 5.5,
    sharpenAmount: 0.65,
    denoiseStrength: 0.25,
    noiseGate: 4,
    warmShift: 4,
    colorDenoiseStrength: 0.40,
  },
};

export class NightEngine {
  private options: NightEngineOptions;

  constructor(mode: NightMode = 'night-plus') {
    this.options = { ...PRESETS[mode] };
  }

  setMode(mode: NightMode): void {
    this.options = { ...PRESETS[mode] };
  }

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const data = new Uint8ClampedArray(imageData.data);
    const o = this.options;

    // 1. Noise gate: crush sub-threshold values to prevent noise amplification
    if (o.noiseGate > 0) applyNoiseGate(data, o.noiseGate);

    // 2. Color denoise in Cb/Cr (chroma channels only — preserves luminance detail)
    if (o.colorDenoiseStrength > 0) applyChromaDenoise(data, width, height, o.colorDenoiseStrength);

    // 3. Luma denoise (box blur blend)
    applyDenoise(data, width, height, o.denoiseStrength);

    // 4. Gamma lift
    applyGammaCorrection(data, o.gammaBoost);

    // 5. CLAHE for local contrast recovery
    applyCLAHE(data, width, height, o.claheClipLimit);

    // 6. Warm the shadows slightly (counteract blue sensor noise)
    if (o.warmShift > 0) applyWarmShift(data, o.warmShift);

    // 7. Sharpen to recover edges lost in denoise
    applySharpen(data, width, height, o.sharpenAmount);

    return {
      imageData: new ImageData(data, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void {}
  destroy(): void {}
}

// Crush near-black pixels to prevent noise from getting amplified
function applyNoiseGate(data: Uint8ClampedArray, threshold: number): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < threshold) data[i] = 0;
    if (data[i + 1] < threshold) data[i + 1] = 0;
    if (data[i + 2] < threshold) data[i + 2] = 0;
  }
}

// Chroma denoise: box-blur R and B channels (the primary chroma signals) at stride 2.
// Avoids costly YCbCr conversion while still smoothing colour noise effectively.
function applyChromaDenoise(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  const src = new Uint8ClampedArray(data);
  const alpha256 = Math.round(Math.min(1, strength) * 256);

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      let sumR = 0, sumB = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * width + (x + dx)) * 4;
          sumR += src[ni];
          sumB += src[ni + 2];
        }
      }
      const blurR = (sumR * 0.1111) | 0;
      const blurB = (sumB * 0.1111) | 0;
      const origR = src[(y * width + x) * 4];
      const origB = src[(y * width + x) * 4 + 2];
      const valR = origR + (((blurR - origR) * alpha256) >> 8);
      const valB = origB + (((blurB - origB) * alpha256) >> 8);

      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          const ni = ((y + dy) * width + (x + dx)) * 4;
          data[ni]     = valR;
          data[ni + 2] = valB;
        }
      }
    }
  }
}

// Slightly warm the image: +R in shadows, -B in shadows
function applyWarmShift(data: Uint8ClampedArray, amount: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    // Strongest in shadows (lum < 128), fades out in highlights
    const weight = Math.max(0, 1 - lum / 128);
    data[i]     = Math.min(255, data[i]     + Math.round(amount * weight));
    data[i + 2] = Math.max(0,   data[i + 2] - Math.round(amount * 0.5 * weight));
  }
}
