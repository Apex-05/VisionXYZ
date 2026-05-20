// Fast box-blur denoise: processes every 2nd pixel in a 2×2 block, 4× fewer iterations.
export function applyDenoise(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  if (strength <= 0) return;

  const src = new Uint8ClampedArray(data);
  const alpha256 = Math.round(Math.min(1, strength) * 256);

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      for (let c = 0; c < 3; c++) {
        // 3×3 integer box average
        const sum =
          src[((y - 1) * width + (x - 1)) * 4 + c] +
          src[((y - 1) * width +  x     ) * 4 + c] +
          src[((y - 1) * width + (x + 1)) * 4 + c] +
          src[( y      * width + (x - 1)) * 4 + c] +
          src[( y      * width +  x     ) * 4 + c] +
          src[( y      * width + (x + 1)) * 4 + c] +
          src[((y + 1) * width + (x - 1)) * 4 + c] +
          src[((y + 1) * width +  x     ) * 4 + c] +
          src[((y + 1) * width + (x + 1)) * 4 + c];
        const blur = (sum * 0.1111) | 0;
        const orig = src[(y * width + x) * 4 + c];
        const val = orig + (((blur - orig) * alpha256) >> 8);

        // Fill 2×2 block with the same blended value
        data[( y      * width +  x     ) * 4 + c] = val;
        data[( y      * width + (x + 1)) * 4 + c] = val;
        data[((y + 1) * width +  x     ) * 4 + c] = val;
        data[((y + 1) * width + (x + 1)) * 4 + c] = val;
      }
    }
  }
}
