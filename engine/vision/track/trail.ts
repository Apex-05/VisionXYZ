import type { Track } from '@/types/vision';
import { paintTrail, paintDetectionBox } from '@/engine/render/frame-painter';

const TRACK_COLORS = [
  '#00ff88', '#00d4ff', '#ff6b00', '#f59e0b', '#ec4899',
  '#a855f7', '#ef4444', '#3b82f6', '#10b981', '#f97316',
];

export function renderTracks(ctx: CanvasRenderingContext2D, tracks: Track[]): void {
  for (const track of tracks) {
    const color = TRACK_COLORS[track.id % TRACK_COLORS.length];
    paintTrail(ctx, track.trail, color);
    paintDetectionBox(
      ctx,
      track.bbox.x,
      track.bbox.y,
      track.bbox.width,
      track.bbox.height,
      track.bbox.label,
      track.bbox.confidence,
      color,
      track.id
    );
  }
}
