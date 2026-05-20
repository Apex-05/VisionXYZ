'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FrameScheduler } from '@/engine/frame/scheduler';
import { FrameQueue } from '@/engine/frame/queue';
import { CanvasRenderer } from '@/engine/render/canvas-renderer';
import { MetricsCollector } from '@/engine/render/metrics';
import { useStatsStore } from '@/store/stats-store';
import { useCameraStore } from '@/store/camera-store';
import { useModeStore } from '@/store/mode-store';
import type { FrameData } from '@/types/camera';
import type { ActiveMode } from '@/types/modes';
import type { ProcessorResult } from '@/types/engine';

type FrameProcessorFn = (frame: FrameData, mode: ActiveMode) => Promise<ProcessorResult | null>;

// Draw split view: original on left, processed on right.
// putImageData ignores canvas clipping, so we go via OffscreenCanvas.
function drawSplit(
  canvas: HTMLCanvasElement,
  original: ImageData,
  processed: ImageData,
  splitPct: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = original;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const splitX = Math.round((splitPct / 100) * width);

  // Draw processed frame covering the whole canvas
  ctx.putImageData(processed, 0, 0);

  // Stamp original over the left portion using drawImage (respects clipping)
  if (splitX > 0) {
    const tmp = new OffscreenCanvas(width, height);
    (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).putImageData(original, 0, 0);
    ctx.drawImage(tmp, 0, 0, splitX, height, 0, 0, splitX, height);
  }

  // Divider line
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();
  // Handle circle
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(splitX, height / 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Arrows inside handle
  ctx.fillStyle = '#000';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⇔', splitX, height / 2);
  ctx.restore();
}

export function useRenderLoop(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  videoRef: React.RefObject<HTMLVideoElement>,
  processFrame: FrameProcessorFn,
  splitPositionRef?: React.RefObject<number | null>
) {
  // Stable selector subscriptions — only exact values needed to avoid re-creating startLoop every frame
  const setRenderMetrics = useStatsStore((s) => s.setRenderMetrics);
  const setCameraMetrics = useCameraStore((s) => s.setMetrics);
  const targetFps = useCameraStore((s) => s.constraints.frameRate);
  const setProcessingTime = useModeStore((s) => s.setProcessingTime);

  const schedulerRef = useRef<FrameScheduler | null>(null);
  const queueRef = useRef<FrameQueue | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const metricsRef = useRef<MetricsCollector>(new MetricsCollector());
  const unsubRef = useRef<(() => void) | null>(null);

  const stopLoop = useCallback(() => {
    schedulerRef.current?.stop();
    unsubRef.current?.();
    schedulerRef.current = null;
    queueRef.current = null;
  }, []);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    stopLoop();

    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer({ canvas });
    }

    const queue = new FrameQueue();
    queueRef.current = queue;

    const scheduler = new FrameScheduler(video, queue, {
      targetFps,
      onMetrics: (m) => setCameraMetrics(m),
    });
    schedulerRef.current = scheduler;

    const unsub = queue.subscribe(async (frame) => {
      // Read active mode directly from store state — avoids subscribing to the full store
      const mode = useModeStore.getState().activeMode;
      metricsRef.current.tick();

      const result = await processFrame(frame, mode);
      const processedData = result?.imageData ?? frame.imageData;

      const splitPct = splitPositionRef?.current;
      if (splitPct != null && result?.imageData) {
        drawSplit(canvas, frame.imageData, result.imageData, splitPct);
      } else {
        rendererRef.current!.drawImageData(processedData);
      }

      // Draw overlays (e.g. vision bounding boxes) after the base frame is on canvas
      if (result?.postDraw) {
        const ctx = canvas.getContext('2d');
        if (ctx) await result.postDraw(ctx);
      }

      const renderMetrics = rendererRef.current!.getMetrics();
      setRenderMetrics({
        fps: metricsRef.current.getFps(),
        memoryUsageMB: metricsRef.current.getMemoryMB(),
      });

      if (result) setProcessingTime(result.processingTime);
    });

    unsubRef.current = unsub;
    scheduler.start();
  }, [canvasRef, videoRef, targetFps, setCameraMetrics, setRenderMetrics, setProcessingTime, processFrame, stopLoop, splitPositionRef]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return { startLoop, stopLoop };
}
