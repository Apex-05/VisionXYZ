import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class CRTMode extends BaseCreativeMode {
  readonly id = 'crt';
  readonly label = 'CRT';
  private frame = 0;

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    this.frame++;

    const cx = width / 2, cy = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Barrel distortion / CRT curvature
        const nx = (x - cx) / cx;  // -1 to 1
        const ny = (y - cy) / cy;
        const r2 = nx * nx + ny * ny;
        const distort = 1 + r2 * 0.12;
        const sx = Math.round(cx + nx * distort * cx);
        const sy = Math.round(cy + ny * distort * cy);

        const di = (y * width + x) * 4;

        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const si = (sy * width + sx) * 4;
          dst[di]   = src[si];
          dst[di+1] = src[si+1];
          dst[di+2] = src[si+2];
        }
        // else: leaves black (CRT edge)

        // Scanlines — every other row
        if (y % 2 === 1) {
          dst[di]   = Math.round(dst[di]   * 0.65);
          dst[di+1] = Math.round(dst[di+1] * 0.65);
          dst[di+2] = Math.round(dst[di+2] * 0.65);
        }

        // Phosphor RGB dot pattern (3px horizontal cycle)
        const phase = x % 3;
        if (phase === 0) {
          dst[di+1] = Math.round(dst[di+1] * 0.85);
          dst[di+2] = Math.round(dst[di+2] * 0.85);
        } else if (phase === 1) {
          dst[di]   = Math.round(dst[di]   * 0.85);
          dst[di+2] = Math.round(dst[di+2] * 0.85);
        } else {
          dst[di]   = Math.round(dst[di]   * 0.85);
          dst[di+1] = Math.round(dst[di+1] * 0.85);
        }

        dst[di+3] = 255;
      }
    }

    // Vignette (CRT corner fade)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const di = (y * width + x) * 4;
        const nx = (x - cx) / cx;
        const ny = (y - cy) / cy;
        const r2 = nx * nx + ny * ny;
        const vig = Math.max(0, 1 - r2 * 0.7);
        dst[di]   = Math.round(dst[di]   * vig);
        dst[di+1] = Math.round(dst[di+1] * vig);
        dst[di+2] = Math.round(dst[di+2] * vig);
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void { this.frame = 0; }
}
