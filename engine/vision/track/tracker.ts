import type { BoundingBox, Track } from '@/types/vision';

// ByteTrack-compatible lightweight multi-object tracker
export class ByteTracker {
  private tracks: Map<number, Track> = new Map();
  private nextId = 1;
  private maxAge: number;
  private minHits: number;
  private iouThreshold: number;
  private maxTrailLength: number;

  constructor(options: {
    maxAge?: number;
    minHits?: number;
    iouThreshold?: number;
    maxTrailLength?: number;
  } = {}) {
    this.maxAge = options.maxAge ?? 30;
    this.minHits = options.minHits ?? 2;
    this.iouThreshold = options.iouThreshold ?? 0.3;
    this.maxTrailLength = options.maxTrailLength ?? 30;
  }

  update(detections: BoundingBox[], timestamp: number): Track[] {
    const activeTracks = Array.from(this.tracks.values()).filter((t) => t.isActive);
    const matched = new Set<number>();
    const matchedDet = new Set<number>();

    // Hungarian-ish greedy matching by IoU
    for (const track of activeTracks) {
      let bestIou = this.iouThreshold;
      let bestDetIdx = -1;

      for (let i = 0; i < detections.length; i++) {
        if (matchedDet.has(i)) continue;
        const iouVal = iou(track.bbox, detections[i]);
        if (iouVal > bestIou) {
          bestIou = iouVal;
          bestDetIdx = i;
        }
      }

      if (bestDetIdx >= 0) {
        const det = detections[bestDetIdx];
        const cx = det.x + det.width / 2;
        const cy = det.y + det.height / 2;

        track.bbox = { ...det, trackId: track.id };
        track.trail.push({ x: cx, y: cy, t: timestamp });
        if (track.trail.length > this.maxTrailLength) track.trail.shift();
        track.age = 0; // reset miss counter on successful match
        track.isActive = true;

        matched.add(track.id);
        matchedDet.add(bestDetIdx);
      }
    }

    // Age unmatched tracks — only missed tracks accumulate age
    for (const track of activeTracks) {
      if (!matched.has(track.id)) {
        track.age++;
        if (track.age > this.maxAge) {
          track.isActive = false;
        }
      }
    }

    // Create new tracks for unmatched detections
    for (let i = 0; i < detections.length; i++) {
      if (!matchedDet.has(i)) {
        const det = detections[i];
        const id = this.nextId++;
        const cx = det.x + det.width / 2;
        const cy = det.y + det.height / 2;

        this.tracks.set(id, {
          id,
          bbox: { ...det, trackId: id },
          trail: [{ x: cx, y: cy, t: timestamp }],
          age: 1,
          isActive: true,
        });
      }
    }

    // Clean up very old inactive tracks
    for (const [id, track] of this.tracks) {
      if (!track.isActive && track.age > this.maxAge * 2) {
        this.tracks.delete(id);
      }
    }

    // Use trail length as hit count — each match adds a trail point
    return Array.from(this.tracks.values()).filter((t) => t.isActive && t.trail.length >= this.minHits);
  }

  reset(): void {
    this.tracks.clear();
    this.nextId = 1;
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values()).filter((t) => t.isActive);
  }
}

function iou(a: BoundingBox, b: BoundingBox): number {
  const ax2 = a.x + a.width, ay2 = a.y + a.height;
  const bx2 = b.x + b.width, by2 = b.y + b.height;

  const ix1 = Math.max(a.x, b.x), iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2);

  const iArea = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const uArea = a.width * a.height + b.width * b.height - iArea;

  return uArea > 0 ? iArea / uArea : 0;
}
