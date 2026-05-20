import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class SketchMode extends BaseCreativeMode {
  readonly id = 'sketch';
  readonly label = 'Sketch';
  private lineStrength: number;
  private invertBg: boolean;

  constructor(lineStrength = 0.85, invertBg = true) {
    super();
    this.lineStrength = lineStrength;
    this.invertBg = invertBg;
  }

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // Convert to grayscale
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < src.length; i += 4) {
      gray[i >> 2] = Math.round(this.toGrayscale(src[i], src[i + 1], src[i + 2]));
    }

    // Invert
    const inv = new Uint8ClampedArray(width * height);
    for (let i = 0; i < gray.length; i++) {
      inv[i] = 255 - gray[i];
    }

    // Gaussian blur of inverted (5×5 approx with 3 box passes)
    const blurred = boxBlurGray(inv, width, height, 8);

    // Dodge blend: result = gray / (1 - blurred/255)
    for (let i = 0; i < gray.length; i++) {
      const b = blurred[i] / 255;
      const divisor = Math.max(0.001, 1 - b);
      let sketch = Math.min(255, gray[i] / divisor);
      sketch = this.invertBg ? Math.round(sketch) : 255 - Math.round(sketch);
      const pixIdx = i * 4;
      dst[pixIdx] = sketch;
      dst[pixIdx + 1] = sketch;
      dst[pixIdx + 2] = sketch;
      dst[pixIdx + 3] = 255;
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}

function boxBlurGray(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  let current = new Uint8ClampedArray(src);
  let next = new Uint8ClampedArray(src.length);

  for (let pass = 0; pass < 3; pass++) {
    // Horizontal
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, count = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const sx = Math.max(0, Math.min(width - 1, x + dx));
          sum += current[y * width + sx];
          count++;
        }
        next[y * width + x] = sum / count;
      }
    }
    [current, next] = [next, current];

    // Vertical
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const sy = Math.max(0, Math.min(height - 1, y + dy));
          sum += current[sy * width + x];
          count++;
        }
        next[y * width + x] = sum / count;
      }
    }
    [current, next] = [next, current];
  }

  return current;
}
