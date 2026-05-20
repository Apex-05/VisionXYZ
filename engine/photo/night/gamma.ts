// Build a lookup table for fast gamma correction
export function buildGammaLUT(gamma: number): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const inv = 1 / gamma;
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(Math.pow(i / 255, inv) * 255);
  }
  return lut;
}

export function applyGammaCorrection(data: Uint8ClampedArray, gamma: number): void {
  const lut = buildGammaLUT(gamma);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}
