import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

// Anime mode: software stylization when ONNX model unavailable.
// Uses edge-preserving smoothing + color quantization + edge lines.
// When AnimeGAN ONNX model is loaded by ModelManager, the runtime path
// replaces this CPU path automatically via AnimeONNXMode.
export class AnimeMode extends BaseCreativeMode {
  readonly id = 'anime';
  readonly label = 'Anime';

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const src = imageData.data;
    const dst = new Uint8ClampedArray(src.length);

    // Step 1: Edge-preserving blur (bilateral approximation via guided filter sim)
    const smoothed = bilateralApprox(src, width, height);

    // Step 2: Color quantization to flat anime colors
    for (let i = 0; i < smoothed.length; i += 4) {
      dst[i] = quantize(smoothed[i], 6);
      dst[i + 1] = quantize(smoothed[i + 1], 6);
      dst[i + 2] = quantize(smoothed[i + 2], 6);
      dst[i + 3] = 255;
    }

    // Step 3: Boost saturation
    for (let i = 0; i < dst.length; i += 4) {
      const r = dst[i], g = dst[i + 1], b = dst[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      dst[i] = this.clamp(gray + (r - gray) * 1.5);
      dst[i + 1] = this.clamp(gray + (g - gray) * 1.5);
      dst[i + 2] = this.clamp(gray + (b - gray) * 1.5);
    }

    // Step 4: Dark edge lines using Sobel on original
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const lum = (v: number) => 0.299 * src[v] + 0.587 * src[v + 1] + 0.114 * src[v + 2];
        const gx =
          -lum(((y-1)*width+(x-1))*4) - 2*lum((y*width+(x-1))*4) - lum(((y+1)*width+(x-1))*4) +
           lum(((y-1)*width+(x+1))*4) + 2*lum((y*width+(x+1))*4) + lum(((y+1)*width+(x+1))*4);
        const gy =
          -lum(((y-1)*width+(x-1))*4) - 2*lum(((y-1)*width+x)*4) - lum(((y-1)*width+(x+1))*4) +
           lum(((y+1)*width+(x-1))*4) + 2*lum(((y+1)*width+x)*4) + lum(((y+1)*width+(x+1))*4);
        const edge = Math.sqrt(gx * gx + gy * gy);

        if (edge > 35) {
          dst[i] = 20;
          dst[i + 1] = 20;
          dst[i + 2] = 20;
        }
      }
    }

    return {
      imageData: new ImageData(dst, width, height),
      processingTime: performance.now() - t0,
    };
  }
}

function quantize(v: number, steps: number): number {
  const step = 255 / steps;
  return Math.round(Math.round(v / step) * step);
}

// Fast bilateral approximation: precomputed spatial kernel + range LUT.
// O(49 * W * H) with no per-pixel exp calls — ~8x faster than naive bilateral.
const SPATIAL_KERNEL_S3: number[] = (() => {
  const sigma_s = 3;
  const k: number[] = [];
  for (let dy = -sigma_s; dy <= sigma_s; dy++) {
    for (let dx = -sigma_s; dx <= sigma_s; dx++) {
      k.push(Math.exp(-(dx * dx + dy * dy) / (2 * sigma_s * sigma_s)));
    }
  }
  return k;
})();

// Range LUT: index by squared color distance (0..195075 = 3*255^2), sample every 256
const RANGE_LUT: Float32Array = (() => {
  const sigma_r = 25;
  const inv2sr2 = 1 / (2 * sigma_r * sigma_r);
  const lut = new Float32Array(3 * 256);
  for (let i = 0; i < lut.length; i++) {
    lut[i] = Math.exp(-i * 256 * inv2sr2);
  }
  return lut;
})();

function bilateralApprox(
  src: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  const sigma_s = 3;
  const offsets: Array<[number, number, number]> = [];
  let ki = 0;
  for (let dy = -sigma_s; dy <= sigma_s; dy++) {
    for (let dx = -sigma_s; dx <= sigma_s; dx++) {
      offsets.push([dy, dx, SPATIAL_KERNEL_S3[ki++]]);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ci = (y * width + x) * 4;
      let sr = 0, sg = 0, sb = 0, wSum = 0;
      const cr = src[ci], cg = src[ci + 1], cb = src[ci + 2];

      for (const [dy, dx, spatial] of offsets) {
        const ny = Math.max(0, Math.min(height - 1, y + dy));
        const nx = Math.max(0, Math.min(width - 1, x + dx));
        const ni = (ny * width + nx) * 4;

        const dr = cr - src[ni];
        const dg = cg - src[ni + 1];
        const db = cb - src[ni + 2];
        const lutIdx = Math.min(RANGE_LUT.length - 1, Math.floor((dr*dr + dg*dg + db*db) / 256));
        const weight = spatial * RANGE_LUT[lutIdx];

        sr += src[ni] * weight;
        sg += src[ni + 1] * weight;
        sb += src[ni + 2] * weight;
        wSum += weight;
      }

      // Guard against degenerate zero-weight case
      const inv = wSum > 0 ? 1 / wSum : 0;
      dst[ci]     = sr * inv;
      dst[ci + 1] = sg * inv;
      dst[ci + 2] = sb * inv;
      dst[ci + 3] = src[ci + 3];
    }
  }

  return dst;
}
