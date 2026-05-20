import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class ComicMode extends BaseCreativeMode {
  readonly id = 'comic';
  readonly label = 'Comic';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // Step 1: Posterize (reduce color levels)
    const levels = 4;
    const step = 255 / (levels - 1);
    for (let i = 0; i < src.length; i += 4) {
      dst[i] = Math.round(Math.round(src[i] / step) * step);
      dst[i + 1] = Math.round(Math.round(src[i + 1] / step) * step);
      dst[i + 2] = Math.round(Math.round(src[i + 2] / step) * step);
      dst[i + 3] = 255;
    }

    // Step 2: Black edge lines using Sobel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const gray = (v: number) => 0.299 * src[v] + 0.587 * src[v + 1] + 0.114 * src[v + 2];

        const tl = gray((((y-1)*width)+(x-1))*4);
        const tc = gray((((y-1)*width)+x)*4);
        const tr = gray((((y-1)*width)+(x+1))*4);
        const ml = gray(((y*width)+(x-1))*4);
        const mr = gray(((y*width)+(x+1))*4);
        const bl = gray((((y+1)*width)+(x-1))*4);
        const bc = gray((((y+1)*width)+x)*4);
        const br = gray((((y+1)*width)+(x+1))*4);

        const gx = -tl - 2*ml - bl + tr + 2*mr + br;
        const gy = -tl - 2*tc - tr + bl + 2*bc + br;
        const edge = Math.sqrt(gx*gx + gy*gy);

        if (edge > 40) {
          dst[i] = 0;
          dst[i + 1] = 0;
          dst[i + 2] = 0;
        }
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
