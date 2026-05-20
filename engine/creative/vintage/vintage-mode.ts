import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class VintageMode extends BaseCreativeMode {
  readonly id = 'vintage';
  readonly label = 'Vintage';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = src[i], g = src[i + 1], b = src[i + 2];

        // Sepia tone
        let sr = this.clamp(r * 0.393 + g * 0.769 + b * 0.189);
        let sg = this.clamp(r * 0.349 + g * 0.686 + b * 0.168);
        let sb = this.clamp(r * 0.272 + g * 0.534 + b * 0.131);

        // Warm highlights
        sr = this.clamp(sr + 15);
        sg = this.clamp(sg + 5);

        // Film grain
        const noise = (Math.random() - 0.5) * 20;
        sr = this.clamp(sr + noise);
        sg = this.clamp(sg + noise * 0.8);
        sb = this.clamp(sb + noise * 0.6);

        // Vignette
        const cx = width / 2, cy = height / 2;
        const dx = (x - cx) / cx, dy = (y - cy) / cy;
        const vignette = Math.max(0, 1 - (dx * dx + dy * dy) * 0.8);

        dst[i] = this.clamp(sr * vignette);
        dst[i + 1] = this.clamp(sg * vignette);
        dst[i + 2] = this.clamp(sb * vignette);
        dst[i + 3] = 255;
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
