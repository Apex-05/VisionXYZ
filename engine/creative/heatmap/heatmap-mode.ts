import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

// Heatmap: shows intensity distribution with cool→hot colormap
export class HeatmapMode extends BaseCreativeMode {
  readonly id = 'heatmap';
  readonly label = 'Heatmap';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const intensity = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;

      // Black→Blue→Cyan→Green→Yellow→Red→White
      const [r, g, b] = intensityToHeatRGB(intensity);
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = 255;
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}

function intensityToHeatRGB(t: number): [number, number, number] {
  // 6-stop gradient
  const stops = [
    [0,    [0,   0,   0  ]],
    [0.17, [0,   0,   255]],
    [0.33, [0,   255, 255]],
    [0.5,  [0,   255, 0  ]],
    [0.67, [255, 255, 0  ]],
    [0.83, [255, 0,   0  ]],
    [1.0,  [255, 255, 255]],
  ] as Array<[number, [number, number, number]]>;

  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return [255, 255, 255];
}
