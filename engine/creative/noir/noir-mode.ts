import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class NoirMode extends BaseCreativeMode {
  readonly id = 'noir';
  readonly label = 'Noir';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = src[i], g = src[i + 1], b = src[i + 2];

        // Luminance-weighted grayscale (more contrasty)
        let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // S-curve contrast
        gray = this.sCurve(gray);

        // Film grain
        const noise = Math.round((Math.random() - 0.5) * 24);
        gray = this.clamp(gray + noise);

        // Hard vignette
        const cx = width / 2, cy = height / 2;
        const dx = (x - cx) / (cx * 0.9), dy = (y - cy) / (cy * 0.9);
        const dist = dx * dx + dy * dy;
        const vig = dist > 0.8 ? Math.max(0, 1 - (dist - 0.8) * 2) : 1;
        gray = Math.round(gray * vig);

        dst[i] = gray;
        dst[i + 1] = gray;
        dst[i + 2] = gray;
        dst[i + 3] = 255;
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  private sCurve(v: number): number {
    const t = v / 255;
    // Sigmoid-like S-curve
    const s = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return Math.round(s * 255);
  }
}
