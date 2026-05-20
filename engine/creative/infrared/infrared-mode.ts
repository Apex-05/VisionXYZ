import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

// False-color infrared: foliage turns white/bright, sky turns dark
export class InfraredMode extends BaseCreativeMode {
  readonly id = 'infrared';
  readonly label = 'Infrared';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2];

      // Infrared channel simulation: plants (high green/NIR) → bright
      // Sky (high blue, low NIR) → dark
      const nir = g * 1.2 - b * 0.4; // Approximate NIR from green channel
      const red_channel = this.clamp(nir);
      const green_channel = this.clamp(r * 0.7);
      const blue_channel = this.clamp(b * 0.3 + g * 0.1);

      // Slight desaturate + channel swap for classic Wood Effect
      dst[i] = red_channel;
      dst[i + 1] = green_channel;
      dst[i + 2] = blue_channel;
      dst[i + 3] = 255;
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
