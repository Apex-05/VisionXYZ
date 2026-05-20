// Unsharp mask sharpen
export function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number // 0..1
): void {
  if (amount <= 0) return;

  const src = new Uint8ClampedArray(data);

  // Sharpening kernel: center = 1 + 8*amount, neighbors = -amount
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const sum =
          src[((y - 1) * width + (x - 1)) * 4 + c] +
          src[((y - 1) * width + x) * 4 + c] +
          src[((y - 1) * width + (x + 1)) * 4 + c] +
          src[(y * width + (x - 1)) * 4 + c] +
          src[(y * width + (x + 1)) * 4 + c] +
          src[((y + 1) * width + (x - 1)) * 4 + c] +
          src[((y + 1) * width + x) * 4 + c] +
          src[((y + 1) * width + (x + 1)) * 4 + c];

        const sharpened = center * (1 + 8 * amount) - sum * amount;
        data[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }
}
