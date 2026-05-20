'use client';

import { useCallback, useRef } from 'react';
import type { FrameData } from '@/types/camera';
import type { BoundingBox, Track, Hand } from '@/types/vision';

export interface VisionResult {
  boxes?: BoundingBox[];
  tracks?: Track[];
  hands?: Hand[];
  processingTime: number;
  modelName?: string;
}

export function useVision() {
  const detectorRef = useRef<import('@/engine/vision/detect/detector').Detector | null>(null);
  const trackerRef  = useRef<import('@/engine/vision/track/tracker').ByteTracker | null>(null);
  const gestureRef  = useRef<import('@/engine/vision/gesture/gesture-engine').GestureEngine | null>(null);

  // Read mode from store without creating a subscription — avoids stale closure
  const getActiveMode = useCallback((): string => {
    return (
      (globalThis as { __visionModeOverride?: string }).__visionModeOverride ??
      (require('@/store/mode-store').useModeStore?.getState?.()?.activeMode ?? 'passthrough')
    );
  }, []);

  const processVisionFrame = useCallback(
    async (frame: FrameData, modeOverride?: string): Promise<VisionResult | null> => {
      const mode = modeOverride ?? getActiveMode();
      const t0 = performance.now();

      if (mode === 'detection' || mode === 'detection+tracking') {
        if (!detectorRef.current) {
          const { Detector } = await import('@/engine/vision/detect/detector');
          detectorRef.current = new Detector();
        }

        const result = await detectorRef.current.detect(frame);

        if (mode === 'detection+tracking') {
          if (!trackerRef.current) {
            const { ByteTracker } = await import('@/engine/vision/track/tracker');
            trackerRef.current = new ByteTracker();
          }
          const tracks = trackerRef.current.update(result.boxes, frame.timestamp);
          return { tracks, processingTime: performance.now() - t0, modelName: result.modelName };
        }

        return { boxes: result.boxes, processingTime: performance.now() - t0, modelName: result.modelName };
      }

      if (mode === 'tracking') {
        if (!detectorRef.current) {
          const { Detector } = await import('@/engine/vision/detect/detector');
          detectorRef.current = new Detector();
        }
        if (!trackerRef.current) {
          const { ByteTracker } = await import('@/engine/vision/track/tracker');
          trackerRef.current = new ByteTracker();
        }

        const result = await detectorRef.current.detect(frame);
        const tracks = trackerRef.current.update(result.boxes, frame.timestamp);
        return { tracks, processingTime: performance.now() - t0, modelName: result.modelName };
      }

      if (mode === 'gesture') {
        if (!gestureRef.current) {
          const { GestureEngine } = await import('@/engine/vision/gesture/gesture-engine');
          gestureRef.current = new GestureEngine();
        }
        const hands = await gestureRef.current.detect(frame.imageData, frame.timestamp);
        return { hands, processingTime: performance.now() - t0, modelName: 'mediapipe-hands' };
      }

      return null;
    },
    [getActiveMode]
  );

  const renderVisionOverlay = useCallback(
    async (ctx: CanvasRenderingContext2D, result: VisionResult) => {
      const { width, height } = ctx.canvas;

      // Detection boxes
      if (result.boxes?.length) {
        const { renderDetections } = await import('@/engine/vision/detect/overlay');
        renderDetections(ctx, result.boxes);
      }

      // Tracking trails + boxes
      if (result.tracks?.length) {
        const { renderTracks } = await import('@/engine/vision/track/trail');
        renderTracks(ctx, result.tracks);
      }

      // Hand landmarks + gesture labels
      if (result.hands?.length) {
        for (const hand of result.hands) {
          // Draw skeleton connections
          drawHandSkeleton(ctx, hand.landmarks, hand.handedness === 'right' ? '#00ff88' : '#00d4ff');

          // Gesture label above wrist
          if (hand.gesture && hand.gesture !== 'unknown' && hand.landmarks.length > 0) {
            const wrist = hand.landmarks[0];
            const label = GESTURE_EMOJI[hand.gesture] ?? hand.gesture;
            ctx.save();
            ctx.font = 'bold 13px monospace';
            const tw = ctx.measureText(label).width;
            const lx = Math.max(4, Math.min(width - tw - 8, wrist.x - tw / 2));
            const ly = Math.max(24, wrist.y - 28);
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(lx - 4, ly - 16, tw + 16, 22);
            ctx.fillStyle = '#00ff88';
            ctx.fillText(label, lx + 4, ly - 2);
            ctx.restore();
          }
        }
      }

      // Status badge (bottom-right) showing model + count
      const statusParts: string[] = [];
      if (result.boxes?.length)  statusParts.push(`${result.boxes.length} obj`);
      if (result.tracks?.length) statusParts.push(`${result.tracks.length} tracked`);
      if (result.hands?.length)  statusParts.push(`${result.hands.length} hand${result.hands.length > 1 ? 's' : ''}`);
      if (result.modelName && result.modelName !== 'mock') {
        statusParts.push(result.modelName);
      }

      if (statusParts.length > 0) {
        const text = statusParts.join(' · ');
        ctx.save();
        ctx.font = '11px monospace';
        const tw2 = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(width - tw2 - 16, height - 22, tw2 + 12, 18);
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText(text, width - tw2 - 10, height - 9);
        ctx.restore();
      }

      // "Initializing…" hint when no results yet (model loading)
      if (!result.boxes?.length && !result.tracks?.length && !result.hands?.length) {
        ctx.save();
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(width / 2 - 80, 10, 160, 22);
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ Loading AI model…', width / 2, 25);
        ctx.restore();
      }
    },
    []
  );

  const isVisionMode = useCallback(
    (mode: string) =>
      ['detection', 'tracking', 'gesture', 'detection+tracking'].includes(mode),
    []
  );

  return { processVisionFrame, renderVisionOverlay, isVisionMode };
}

const GESTURE_EMOJI: Record<string, string> = {
  palm: '✋ Palm',
  fist: '✊ Fist',
  peace: '✌️ Peace',
  'thumb-up': '👍 Thumb Up',
  'thumb-down': '👎 Thumb Down',
  point: '☝️ Point',
};

// MediaPipe hand connection pairs (21 landmarks)
const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],           // thumb
  [0,5],[5,6],[6,7],[7,8],           // index
  [0,9],[9,10],[10,11],[11,12],      // middle
  [0,13],[13,14],[14,15],[15,16],    // ring
  [0,17],[17,18],[18,19],[19,20],    // pinky
  [5,9],[9,13],[13,17],              // palm base
];

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  color: string
): void {
  if (landmarks.length < 21) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;

  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x, landmarks[a].y);
    ctx.lineTo(landmarks[b].x, landmarks[b].y);
    ctx.stroke();
  }

  // Fingertip dots
  ctx.fillStyle = color;
  for (let i = 0; i < landmarks.length; i++) {
    const r = [4, 8, 12, 16, 20].includes(i) ? 5 : 3;
    ctx.beginPath();
    ctx.arc(landmarks[i].x, landmarks[i].y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
