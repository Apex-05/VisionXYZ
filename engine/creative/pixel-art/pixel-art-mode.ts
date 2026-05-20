import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class PixelArtMode extends BaseCreativeMode {
  readonly id = 'pixel-art';
  readonly label = 'Pixel Art';
  private blockSize: number;

  constructor(blockSize = 8) {
    super();
    this.blockSize = blockSize;
  }

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    const bs = this.blockSize;

    // Downsample then upscale with nearest-neighbor (integer pixels)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Find the top-left corner of this pixel's block
        const bx = Math.floor(x / bs) * bs;
        const by = Math.floor(y / bs) * bs;

        // Average the block (sample center of block for speed)
        const sx = Math.min(width - 1, bx + Math.floor(bs / 2));
        const sy = Math.min(height - 1, by + Math.floor(bs / 2));
        const si = (sy * width + sx) * 4;
        const di = (y * width + x) * 4;

        dst[di]   = src[si];
        dst[di+1] = src[si+1];
        dst[di+2] = src[si+2];
        dst[di+3] = 255;
      }
    }

    // Quantize colors (reduce palette to ~16 levels per channel)
    const levels = 6;
    const step = 255 / levels;
    for (let i = 0; i < dst.length; i += 4) {
      dst[i]   = Math.round(Math.round(dst[i]   / step) * step);
      dst[i+1] = Math.round(Math.round(dst[i+1] / step) * step);
      dst[i+2] = Math.round(Math.round(dst[i+2] / step) * step);
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}
