export type ColormapEntry = [number, number, number];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// Build JET colormap (blue→cyan→green→yellow→red)
function buildJet(): ColormapEntry[] {
  const map: ColormapEntry[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const r = clamp01(1.5 - Math.abs(4 * t - 3));
    const g = clamp01(1.5 - Math.abs(4 * t - 2));
    const b = clamp01(1.5 - Math.abs(4 * t - 1));
    map.push([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]);
  }
  return map;
}

// IRON colormap (black→purple→red→orange→white)
function buildIron(): ColormapEntry[] {
  const stops: Array<[number, ColormapEntry]> = [
    [0,   [0, 0, 0]],
    [0.2, [64, 0, 128]],
    [0.4, [192, 0, 64]],
    [0.6, [255, 64, 0]],
    [0.8, [255, 192, 64]],
    [1.0, [255, 255, 255]],
  ];

  const map: ColormapEntry[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j][0] && t <= stops[j + 1][0]) {
        lo = stops[j];
        hi = stops[j + 1];
        break;
      }
    }
    const f = (t - lo[0]) / Math.max(0.001, hi[0] - lo[0]);
    map.push([
      Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * f),
      Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * f),
      Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * f),
    ]);
  }
  return map;
}

export const THERMAL_COLORMAP: ColormapEntry[] = buildJet();
export const IRON_COLORMAP: ColormapEntry[] = buildIron();
