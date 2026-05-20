import { captureFrame } from './capture';
import { FrameBuffer } from './buffer';
import { FrameQueue } from './queue';
import type { FrameData, CaptureMetrics } from '@/types/camera';

export interface SchedulerOptions {
  targetFps: number;
  bufferCapacity: number;
  onMetrics?: (metrics: CaptureMetrics) => void;
}

// Coordinates frame capture from video element and feeds the pipeline
export class FrameScheduler {
  private video: HTMLVideoElement;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private buffer: FrameBuffer;
  private queue: FrameQueue;

  private rafHandle: number | null = null;
  private isRunning = false;

  private frameCount = 0;
  private droppedFrames = 0;
  private fpsCounter = 0;
  private fpsTimer = 0;
  private lastFrameTime = 0;
  private processingTimes: number[] = [];

  private options: SchedulerOptions;
  private metrics: CaptureMetrics = {
    fps: 0,
    frameCount: 0,
    droppedFrames: 0,
    avgProcessingTime: 0,
    latency: 0,
  };

  constructor(video: HTMLVideoElement, queue: FrameQueue, options: Partial<SchedulerOptions> = {}) {
    this.video = video;
    this.queue = queue;
    this.options = {
      targetFps: options.targetFps ?? 30,
      bufferCapacity: options.bufferCapacity ?? 4,
      onMetrics: options.onMetrics,
    };

    this.buffer = new FrameBuffer(this.options.bufferCapacity);
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.fpsTimer = performance.now();
    this.schedule();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.buffer.clear();
  }

  private schedule(): void {
    if (!this.isRunning) return;
    this.rafHandle = requestAnimationFrame((ts) => this.tick(ts));
  }

  private tick(timestamp: number): void {
    if (!this.isRunning) return;

    const elapsed = timestamp - this.lastFrameTime;
    const targetInterval = 1000 / this.options.targetFps;

    if (elapsed >= targetInterval) {
      const t0 = performance.now();
      const frame = captureFrame(this.video, this.offscreenCanvas, this.offscreenCtx);

      if (frame) {
        this.buffer.push(frame);
        this.queue.push(frame);

        const processingTime = performance.now() - t0;
        this.processingTimes.push(processingTime);
        if (this.processingTimes.length > 60) this.processingTimes.shift();

        this.frameCount++;
        this.fpsCounter++;
        this.lastFrameTime = timestamp;

        // Update FPS once per second
        const now = performance.now();
        if (now - this.fpsTimer >= 1000) {
          this.metrics = {
            fps: this.fpsCounter,
            frameCount: this.frameCount,
            droppedFrames: this.droppedFrames,
            avgProcessingTime:
              this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length,
            latency: elapsed,
          };
          this.fpsCounter = 0;
          this.fpsTimer = now;
          this.options.onMetrics?.(this.metrics);
        }
      } else {
        this.droppedFrames++;
      }
    }

    this.schedule();
  }

  getMetrics(): CaptureMetrics {
    return { ...this.metrics };
  }

  getLatestFrame(): FrameData | null {
    return this.buffer.peek();
  }
}
