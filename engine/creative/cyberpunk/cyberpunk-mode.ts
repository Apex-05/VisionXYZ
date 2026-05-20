import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class CyberpunkMode extends BaseCreativeMode {
  readonly id = 'cyberpunk';
  readonly label = 'Cyberpunk';
  private frameCount = 0;

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    this.frameCount++;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        let r = src[i], g = src[i + 1], b = src[i + 2];

        // Shift hues toward cyan/magenta/purple
        const cyan_boost = b * 0.4;
        const magenta_boost = r * 0.3;
        r = this.clamp(r * 0.8 + magenta_boost + 20);
        g = this.clamp(g * 0.6 + cyan_boost * 0.5);
        b = this.clamp(b * 1.4 + cyan_boost * 0.3);

        // Neon glow: boost high saturation pixels
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        if (sat > 0.5) {
          r = this.clamp(r * 1.3);
          g = this.clamp(g * 1.1);
          b = this.clamp(b * 1.5);
        }

        // Scanlines every 2px
        const scanFactor = y % 2 === 0 ? 1.0 : 0.85;
        dst[i] = this.clamp(r * scanFactor);
        dst[i + 1] = this.clamp(g * scanFactor);
        dst[i + 2] = this.clamp(b * scanFactor);
        dst[i + 3] = 255;
      }
    }

    // Chromatic aberration: offset R channel slightly
    const aberration = 2;
    const final = new Uint8ClampedArray(dst);
    for (let y = 0; y < height; y++) {
      for (let x = aberration; x < width - aberration; x++) {
        const i = (y * width + x) * 4;
        final[i] = dst[(y * width + x - aberration) * 4]; // R shifted left
        final[i + 2] = dst[(y * width + x + aberration) * 4 + 2]; // B shifted right
      }
    }

    return {
      imageData: new ImageData(final, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
