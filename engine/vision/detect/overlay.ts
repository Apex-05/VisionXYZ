import type { BoundingBox } from '@/types/vision';
import { paintDetectionBox } from '@/engine/render/frame-painter';

const CLASS_COLORS: Record<number, string> = {
  0: '#00ff88',  // person
  2: '#00d4ff',  // car
  5: '#ff6b00',  // bus
  7: '#f59e0b',  // truck
  16: '#ec4899', // dog
  17: '#a855f7', // horse
};

export function renderDetections(
  ctx: CanvasRenderingContext2D,
  boxes: BoundingBox[],
  showLabels = true
): void {
  for (const box of boxes) {
    const color = CLASS_COLORS[box.classId] ?? '#00d4ff';
    if (showLabels) {
      paintDetectionBox(ctx, box.x, box.y, box.width, box.height, box.label, box.confidence, color, box.trackId);
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
  }
}
