import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class VHSMode extends BaseCreativeMode {
  readonly id = 'vhs';
  readonly label = 'VHS';
  private frame = 0;

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    this.frame++;

    // --- RGB channel displacement ---
    const rShift = 4;
    const bShift = -3;

    for (let y = 0; y < height; y++) {
      // Tape tracking wobble: sinusoidal horizontal offset per line
      const wobble = Math.round(Math.sin(y * 0.08 + this.frame * 0.12) * 1.5);
      // Occasional tape dropout glitch
      const isGlitchLine = Math.random() < 0.003;
      const glitchOffset = isGlitchLine ? Math.round((Math.random() - 0.5) * 20) : 0;

      for (let x = 0; x < width; x++) {
        const di = (y * width + x) * 4;

        // Clamp sample positions
        const rx = Math.max(0, Math.min(width - 1, x + rShift + wobble + glitchOffset));
        const gx = Math.max(0, Math.min(width - 1, x + wobble + glitchOffset));
        const bx = Math.max(0, Math.min(width - 1, x + bShift + wobble + glitchOffset));

        const ri = (y * width + rx) * 4;
        const gi = (y * width + gx) * 4;
        const bi = (y * width + bx) * 4;

        dst[di] = src[ri];       // R
        dst[di + 1] = src[gi + 1]; // G
        dst[di + 2] = src[bi + 2]; // B
        dst[di + 3] = 255;
      }

      // Tape noise line — occasional full horizontal replacement with gray noise
      if (Math.random() < 0.005) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4;
          const v = this.clamp(180 + Math.random() * 40);
          dst[di] = v; dst[di+1] = v; dst[di+2] = v; dst[di+3] = 255;
        }
      }
    }

    // Desaturate slightly (VHS color compression)
    for (let i = 0; i < dst.length; i += 4) {
      const gray = 0.299 * dst[i] + 0.587 * dst[i+1] + 0.114 * dst[i+2];
      dst[i]   = this.clamp(gray * 0.3 + dst[i]   * 0.7);
      dst[i+1] = this.clamp(gray * 0.3 + dst[i+1] * 0.7);
      dst[i+2] = this.clamp(gray * 0.3 + dst[i+2] * 0.7);
    }

    // Scanlines every 2px (mild)
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        dst[i]   = Math.round(dst[i]   * 0.9);
        dst[i+1] = Math.round(dst[i+1] * 0.9);
        dst[i+2] = Math.round(dst[i+2] * 0.9);
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void { this.frame = 0; }
}
