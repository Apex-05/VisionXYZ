export type SceneClass = 'food' | 'sky' | 'night' | 'document' | 'landscape' | 'human' | 'indoor' | 'unknown';

// Heuristic scene classifier — samples every 4th pixel for performance (~16× faster)
export function classifyScene(
  data: Uint8ClampedArray,
  width: number,
  height: number
): SceneClass {
  const stats = computeColorStats(data, width, height);

  if (stats.meanBrightness < 45) return 'night';
  if (stats.meanBrightness > 200 && stats.meanSaturation < 25) return 'document';
  if (stats.upperBlueRatio > 0.5 && stats.meanBrightness > 90 && stats.greenDominance < 0.3) return 'sky';
  if (stats.greenDominance > 0.35 && stats.meanBrightness > 60) return 'landscape';
  if (stats.skinRatio > 0.10) return 'human';
  if (stats.meanSaturation > 70 && stats.warmRatio > 0.45) return 'food';
  if (stats.meanBrightness > 80 && stats.meanSaturation < 40) return 'indoor';

  return 'unknown';
}

interface ColorStats {
  meanBrightness: number;
  meanSaturation: number;
  upperBlueRatio: number;
  greenDominance: number;
  warmRatio: number;
  skinRatio: number;
}

function computeColorStats(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ColorStats {
  let totalBright = 0, totalSat = 0;
  let upperBlueCount = 0, upperTotal = 0;
  let greenCount = 0, warmCount = 0, skinCount = 0;
  const upperY = Math.floor(height * 0.35);
  let total = 0;

  // Sample every 4th pixel in both dimensions — 16× fewer ops
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      const brightness = (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : ((max - min) / max) * 255;

      totalBright += brightness;
      totalSat += sat;
      total++;

      if (y < upperY) {
        upperTotal++;
        if (b > r * 1.15 && b > g * 0.9 && brightness > 75) upperBlueCount++;
      }

      if (g > r * 1.08 && g > b * 1.08 && g > 50) greenCount++;
      if (r > 160 && r > g * 1.1 && r > b * 1.1) warmCount++;

      // Skin tone: Kovac range with HSV guard
      if (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 &&
        r - Math.min(g, b) > 10 &&
        brightness > 80
      ) {
        skinCount++;
      }
    }
  }

  if (total === 0) return { meanBrightness: 128, meanSaturation: 50, upperBlueRatio: 0, greenDominance: 0, warmRatio: 0, skinRatio: 0 };

  return {
    meanBrightness: totalBright / total,
    meanSaturation: totalSat / total,
    upperBlueRatio: upperTotal > 0 ? upperBlueCount / upperTotal : 0,
    greenDominance: greenCount / total,
    warmRatio: warmCount / total,
    skinRatio: skinCount / total,
  };
}
