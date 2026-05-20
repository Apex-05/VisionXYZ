import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class HologramMode extends BaseCreativeMode {
  readonly id = 'hologram';
  readonly label = 'Hologram';
  private frame = 0;

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    this.frame++;

    const f = this.frame;

    // Global flicker: subtle brightness oscillation
    const flicker = 0.85 + 0.15 * Math.sin(f * 0.31) * Math.sin(f * 0.17);

    // Horizontal scan band that sweeps vertically
    const scanBandY = ((f * 3) % (height + 60)) - 30;

    for (let y = 0; y < height; y++) {
      // Per-scanline horizontal offset (hologram shimmer)
      const shimmer = Math.round(Math.sin(y * 0.08 + f * 0.12) * 1.5);

      // Scan band glow contribution
      const scanDist = Math.abs(y - scanBandY);
      const scanGlow = scanDist < 20 ? Math.max(0, 1 - scanDist / 20) * 0.4 : 0;

      for (let x = 0; x < width; x++) {
        // Source pixel with shimmer offset
        const sx = Math.min(width - 1, Math.max(0, x + shimmer));
        const si = (y * width + sx) * 4;
        const di = (y * width + x) * 4;

        const r = src[si], g = src[si + 1], b = src[si + 2];

        // Cyan tint: amplify G+B, suppress R
        let cr = r * 0.15 * flicker;
        let cg = (g * 0.6 + b * 0.2) * flicker;
        let cb = (b * 0.8 + g * 0.3) * flicker;

        // Edge detection contribution for wireframe feel
        // Simple horizontal gradient
        if (x > 0 && x < width - 1) {
          const sl = (y * width + (x - 1)) * 4;
          const sr2 = (y * width + (x + 1)) * 4;
          const edgeR = Math.abs(src[sr2] - src[sl]);
          const edgeG = Math.abs(src[sr2 + 1] - src[sl + 1]);
          const edgeB = Math.abs(src[sr2 + 2] - src[sl + 2]);
          const edge = (edgeR + edgeG + edgeB) / 3;
          if (edge > 20) {
            cg = Math.min(255, cg + edge * 0.5);
            cb = Math.min(255, cb + edge * 0.3);
          }
        }

        // Scan band overlay
        cg = Math.min(255, cg + scanGlow * 80);
        cb = Math.min(255, cb + scanGlow * 60);

        // Scanlines every 3rd row
        const scanFactor = (y % 3 === 0) ? 0.6 : 1.0;

        dst[di]   = this.clamp(cr * scanFactor);
        dst[di+1] = this.clamp(cg * scanFactor);
        dst[di+2] = this.clamp(cb * scanFactor);
        dst[di+3] = 255;
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void { this.frame = 0; }
}
