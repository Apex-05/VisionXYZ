import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class EdgeVisionMode extends BaseCreativeMode {
  readonly id = 'edge-vision';
  readonly label = 'Edge Vision';
  private edgeColor: [number, number, number] = [0, 255, 136]; // neon green

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    const gray = new Float32Array(width * height);
    for (let i = 0; i < src.length; i += 4) {
      gray[i >> 2] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    }

    const [er, eg, eb] = this.edgeColor;
    const threshold = 30;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;

        // Sobel
        const tl = gray[(y-1)*width+(x-1)], tc = gray[(y-1)*width+x], tr = gray[(y-1)*width+(x+1)];
        const ml = gray[y*width+(x-1)],                                 mr = gray[y*width+(x+1)];
        const bl = gray[(y+1)*width+(x-1)], bc = gray[(y+1)*width+x], br = gray[(y+1)*width+(x+1)];

        const gx = -tl - 2*ml - bl + tr + 2*mr + br;
        const gy = -tl - 2*tc - tr + bl + 2*bc + br;
        const magnitude = Math.sqrt(gx*gx + gy*gy);

        if (magnitude > threshold) {
          const intensity = Math.min(1, magnitude / 255);
          dst[i] = Math.round(er * intensity);
          dst[i + 1] = Math.round(eg * intensity);
          dst[i + 2] = Math.round(eb * intensity);
        } else {
          // Dark background
          dst[i] = Math.round(src[i] * 0.15);
          dst[i + 1] = Math.round(src[i + 1] * 0.15);
          dst[i + 2] = Math.round(src[i + 2] * 0.15);
        }
        dst[i + 3] = 255;
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
