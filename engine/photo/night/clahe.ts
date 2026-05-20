// CPU CLAHE (Contrast Limited Adaptive Histogram Equalization)
// Operates on luminance channel for performance

export function applyCLAHE(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  clipLimit = 2.0,
  tileSize = 128
): void {
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);

  // Build per-tile histograms and LUTs
  const luts: Uint8ClampedArray[][] = Array.from({ length: tilesY }, () =>
    Array.from({ length: tilesX }, () => new Uint8ClampedArray(256))
  );

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const hist = new Float32Array(256);
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(x0 + tileSize, width);
      const y1 = Math.min(y0 + tileSize, height);
      let count = 0;

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * width + x) * 4;
          // Luminance approximation
          const l = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          hist[l]++;
          count++;
        }
      }

      // Clip histogram
      const clip = (clipLimit * count) / 256;
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clip) {
          excess += hist[i] - clip;
          hist[i] = clip;
        }
      }
      // Redistribute excess uniformly
      const add = excess / 256;
      for (let i = 0; i < 256; i++) {
        hist[i] += add;
      }

      // Build CDF → LUT
      let cdf = 0;
      const lut = luts[ty][tx];
      for (let i = 0; i < 256; i++) {
        cdf += hist[i];
        lut[i] = Math.round((cdf / count) * 255);
      }
    }
  }

  // Apply with bilinear interpolation between tile LUTs
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const tx = (x / tileSize) - 0.5;
      const ty = (y / tileSize) - 0.5;
      const tx0 = Math.max(0, Math.floor(tx));
      const ty0 = Math.max(0, Math.floor(ty));
      const tx1 = Math.min(tilesX - 1, tx0 + 1);
      const ty1 = Math.min(tilesY - 1, ty0 + 1);
      const fx = tx - tx0;
      const fy = ty - ty0;

      for (let c = 0; c < 3; c++) {
        const v = data[idx + c];
        const v00 = luts[ty0][tx0][v];
        const v10 = luts[ty0][tx1][v];
        const v01 = luts[ty1][tx0][v];
        const v11 = luts[ty1][tx1][v];

        data[idx + c] = Math.round(
          v00 * (1 - fx) * (1 - fy) +
          v10 * fx * (1 - fy) +
          v01 * (1 - fx) * fy +
          v11 * fx * fy
        );
      }
    }
  }
}
