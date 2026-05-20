import type { SegmentationMask } from './segmentation';

export function applyBackgroundBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mask: SegmentationMask,
  blurRadius = 12,
  subjectBoost = 1.1
): void {
  // First create blurred version using box blur approximation
  const blurred = boxBlur(data, width, height, blurRadius);

  // Composite: subject from original, background from blurred
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const mx = Math.min(x, mask.width - 1);
      const my = Math.min(y, mask.height - 1);
      const maskVal = mask.data[my * mask.width + mx];

      for (let c = 0; c < 3; c++) {
        if (maskVal > 0.5) {
          // Subject: original + slight brightness boost
          data[idx + c] = Math.min(255, Math.round(data[idx + c] * subjectBoost));
        } else if (maskVal > 0) {
          // Edge: blend
          data[idx + c] = Math.round(
            data[idx + c] * maskVal + blurred[idx + c] * (1 - maskVal)
          );
        } else {
          // Background: blurred
          data[idx + c] = blurred[idx + c];
        }
      }
    }
  }
}

function boxBlur(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  const passes = 3; // 3 passes ≈ Gaussian

  let current = new Uint8ClampedArray(src);
  let next = new Uint8ClampedArray(src.length);

  for (let p = 0; p < passes; p++) {
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          const sx = Math.max(0, Math.min(width - 1, x + dx));
          const idx = (y * width + sx) * 4;
          r += current[idx];
          g += current[idx + 1];
          b += current[idx + 2];
          count++;
        }
        const idx = (y * width + x) * 4;
        next[idx] = Math.round(r / count);
        next[idx + 1] = Math.round(g / count);
        next[idx + 2] = Math.round(b / count);
        next[idx + 3] = current[idx + 3];
      }
    }
    [current, next] = [next, current];

    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const sy = Math.max(0, Math.min(height - 1, y + dy));
          const idx = (sy * width + x) * 4;
          r += current[idx];
          g += current[idx + 1];
          b += current[idx + 2];
          count++;
        }
        const idx = (y * width + x) * 4;
        next[idx] = Math.round(r / count);
        next[idx + 1] = Math.round(g / count);
        next[idx + 2] = Math.round(b / count);
        next[idx + 3] = current[idx + 3];
      }
    }
    [current, next] = [next, current];
  }

  dst.set(current);
  return dst;
}
