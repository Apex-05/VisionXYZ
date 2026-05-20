import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';
import { THERMAL_COLORMAP, IRON_COLORMAP, type ColormapEntry } from './colormaps';

export type ThermalVariant = 'jet' | 'iron';

export class ThermalMode extends BaseCreativeMode {
  readonly id = 'thermal';
  readonly label = 'Thermal';
  private colormap: ColormapEntry[];

  constructor(variant: ThermalVariant = 'jet') {
    super();
    this.colormap = variant === 'iron' ? IRON_COLORMAP : THERMAL_COLORMAP;
  }

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const gray = this.toGrayscale(src[i], src[i + 1], src[i + 2]);
      const idx = Math.min(255, Math.round(gray));
      const [r, g, b] = this.colormap[idx];
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
