import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class WatercolorMode extends BaseCreativeMode {
  readonly id = 'watercolor';
  readonly label = 'Watercolor';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;

    // Step 1: Bilateral-ish blur (box blur + edge preserve approximation)
    const blurred = softBlur(src, width, height, 6);

    // Step 2: Boost saturation
    const dst = new Uint8ClampedArray(blurred);
    for (let i = 0; i < dst.length; i += 4) {
      const r = dst[i], g = dst[i + 1], b = dst[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      dst[i] = this.clamp(gray + (r - gray) * 1.4);
      dst[i + 1] = this.clamp(gray + (g - gray) * 1.4);
      dst[i + 2] = this.clamp(gray + (b - gray) * 1.4);
    }

    // Step 3: Slight paper texture (brightness noise)
    for (let i = 0; i < dst.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      dst[i] = this.clamp(dst[i] + noise);
      dst[i + 1] = this.clamp(dst[i + 1] + noise);
      dst[i + 2] = this.clamp(dst[i + 2] + noise);
    }

    // Step 4: Soft edge detection overlay (darker lines)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const grayC = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
        const grayR = 0.299 * src[i + 4] + 0.587 * src[i + 5] + 0.114 * src[i + 6];
        const grayD = 0.299 * src[i + width * 4] + 0.587 * src[i + width * 4 + 1] + 0.114 * src[i + width * 4 + 2];
        const edge = Math.abs(grayC - grayR) + Math.abs(grayC - grayD);
        if (edge > 20) {
          const factor = Math.max(0.6, 1 - edge / 200);
          dst[i] = Math.round(dst[i] * factor);
          dst[i + 1] = Math.round(dst[i + 1] * factor);
          dst[i + 2] = Math.round(dst[i + 2] * factor);
        }
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}

function softBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  let cur = new Uint8ClampedArray(src);
  let nxt = new Uint8ClampedArray(src.length);

  for (let p = 0; p < 2; p++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const sx = Math.max(0, Math.min(width - 1, x + dx));
          const i = (y * width + sx) * 4;
          r += cur[i]; g += cur[i + 1]; b += cur[i + 2]; n++;
        }
        const i = (y * width + x) * 4;
        nxt[i] = r / n; nxt[i + 1] = g / n; nxt[i + 2] = b / n; nxt[i + 3] = cur[i + 3];
      }
    }
    [cur, nxt] = [nxt, cur];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const sy = Math.max(0, Math.min(height - 1, y + dy));
          const i = (sy * width + x) * 4;
          r += cur[i]; g += cur[i + 1]; b += cur[i + 2]; n++;
        }
        const i = (y * width + x) * 4;
        nxt[i] = r / n; nxt[i + 1] = g / n; nxt[i + 2] = b / n; nxt[i + 3] = cur[i + 3];
      }
    }
    [cur, nxt] = [nxt, cur];
  }
  return cur;
}
