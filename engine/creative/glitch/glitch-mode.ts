import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class GlitchMode extends BaseCreativeMode {
  readonly id = 'glitch';
  readonly label = 'Glitch';
  private frame = 0;
  private glitchSlices: Array<{ y: number; h: number; offset: number; channel: number }> = [];
  private nextGlitchFrame = 0;

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src);
    this.frame++;

    // Regenerate glitch slices periodically
    if (this.frame >= this.nextGlitchFrame) {
      this.glitchSlices = this.generateSlices(height, width);
      this.nextGlitchFrame = this.frame + Math.floor(3 + Math.random() * 8);
    }

    // Apply horizontal slice offsets
    for (const slice of this.glitchSlices) {
      const endY = Math.min(height, slice.y + slice.h);
      for (let y = slice.y; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4;
          const sx = ((x + slice.offset) % width + width) % width;
          const si = (y * width + sx) * 4;

          if (slice.channel === 0) {
            // Red channel only
            dst[di] = src[si];
          } else if (slice.channel === 1) {
            // Green channel only
            dst[di + 1] = src[si + 1];
          } else if (slice.channel === 2) {
            // Blue channel only
            dst[di + 2] = src[si + 2];
          } else {
            // Full RGB shift
            dst[di]   = src[si];
            dst[di+1] = src[si+1];
            dst[di+2] = src[si+2];
          }
        }
      }
    }

    // Chromatic aberration: red channel left, blue channel right
    const aberration = 4;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const di = (y * width + x) * 4;
        const rxSrc = Math.max(0, x - aberration);
        const bxSrc = Math.min(width - 1, x + aberration);
        const rsi = (y * width + rxSrc) * 4;
        const bsi = (y * width + bxSrc) * 4;
        dst[di]   = src[rsi];
        dst[di+2] = src[bsi + 2];
      }
    }

    // Random single-pixel noise bursts
    const noisePx = Math.floor(width * height * 0.003);
    for (let i = 0; i < noisePx; i++) {
      const idx = Math.floor(Math.random() * width * height) * 4;
      const v = Math.random() > 0.5 ? 255 : 0;
      dst[idx] = dst[idx+1] = dst[idx+2] = v;
    }

    // Occasional full-row color inversion (rare)
    if (Math.random() < 0.05) {
      const y = Math.floor(Math.random() * height);
      for (let x = 0; x < width; x++) {
        const di = (y * width + x) * 4;
        dst[di]   = 255 - dst[di];
        dst[di+1] = 255 - dst[di+1];
        dst[di+2] = 255 - dst[di+2];
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  private generateSlices(height: number, width: number) {
    const count = 2 + Math.floor(Math.random() * 5);
    const slices = [];
    for (let i = 0; i < count; i++) {
      slices.push({
        y: Math.floor(Math.random() * height),
        h: 1 + Math.floor(Math.random() * 12),
        offset: Math.floor((Math.random() - 0.5) * width * 0.15),
        channel: Math.floor(Math.random() * 4),
      });
    }
    return slices;
  }

  reset(): void {
    this.frame = 0;
    this.glitchSlices = [];
    this.nextGlitchFrame = 0;
  }
}
