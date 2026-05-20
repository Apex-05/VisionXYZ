import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class MatrixMode extends BaseCreativeMode {
  readonly id = 'matrix';
  readonly label = 'Matrix';
  private frame = 0;
  private dropPositions: Float32Array | null = null;
  private lastWidth = 0;

  process(frameData: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frameData;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);
    this.frame++;

    // Initialize column drop positions
    if (!this.dropPositions || this.lastWidth !== width) {
      const cols = Math.ceil(width / 8);
      this.dropPositions = new Float32Array(cols);
      for (let c = 0; c < cols; c++) {
        this.dropPositions[c] = Math.random() * height;
      }
      this.lastWidth = width;
    }

    const drops = this.dropPositions;
    const cols = drops.length;

    // Advance drops
    if (this.frame % 2 === 0) {
      for (let c = 0; c < cols; c++) {
        drops[c] += 8;
        if (drops[c] > height + 80) drops[c] = -Math.random() * 40;
      }
    }

    // Build per-column brightness map for the scan overlay
    const colBrightness = new Float32Array(cols);
    for (let c = 0; c < cols; c++) {
      colBrightness[c] = drops[c];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const si = (y * width + x) * 4;
        const di = si;

        // Convert to luminance
        const r = src[si], g = src[si + 1], b = src[si + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Greenify: map luminance to green channel
        let green = lum;
        let red = lum * 0.05;
        let blue = lum * 0.05;

        // Column scan glow: brighten near the active drop tip
        const col = Math.floor(x / 8);
        if (col < cols) {
          const dropY = colBrightness[col];
          const dist = Math.abs(y - dropY);
          if (dist < 40) {
            const glow = Math.max(0, 1 - dist / 40);
            green = Math.min(255, green + glow * 120);
            red = Math.min(255, red + glow * 10);
          }
          // Bright tip
          if (dist < 4) {
            green = 255;
            red = 200;
            blue = 200;
          }
        }

        // Scanline dimming
        if (y % 2 === 1) {
          green *= 0.7;
          red *= 0.7;
          blue *= 0.7;
        }

        // Subtle noise
        const noise = (Math.random() - 0.5) * 10;
        dst[di]   = this.clamp(red + noise);
        dst[di+1] = this.clamp(green + noise);
        dst[di+2] = this.clamp(blue + noise);
        dst[di+3] = 255;
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void {
    this.frame = 0;
    this.dropPositions = null;
  }
}
