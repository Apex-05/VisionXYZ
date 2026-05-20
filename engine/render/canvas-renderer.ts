import type { FrameData } from '@/types/camera';
import type { RenderMetrics } from '@/types/engine';

export interface CanvasRendererOptions {
  canvas: HTMLCanvasElement;
  showFps?: boolean;
  showLatency?: boolean;
  mirrorX?: boolean;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<CanvasRendererOptions>;

  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private metrics: RenderMetrics = {
    fps: 0,
    frameTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    memoryUsageMB: 0,
    gpuLoad: 0,
    latencyMs: 0,
  };

  constructor(options: CanvasRendererOptions) {
    this.canvas = options.canvas;
    this.ctx = options.canvas.getContext('2d', { alpha: false })!;
    this.options = {
      canvas: options.canvas,
      showFps: options.showFps ?? false,
      showLatency: options.showLatency ?? false,
      mirrorX: options.mirrorX ?? false,
    };
  }

  drawFrame(frame: FrameData): void {
    const { imageData, width, height, timestamp } = frame;

    this.canvas.width = width;
    this.canvas.height = height;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    if (this.options.mirrorX) {
      this.ctx.save();
      this.ctx.scale(-1, 1);
      this.ctx.translate(-width, 0);
    }

    this.ctx.putImageData(imageData, 0, 0);

    if (this.options.mirrorX) {
      this.ctx.restore();
    }

    this.updateMetrics(frameTime, timestamp);
    this.metrics.totalFrames++;
  }

  drawImageData(imageData: ImageData): void {
    if (this.canvas.width !== imageData.width || this.canvas.height !== imageData.height) {
      this.canvas.width = imageData.width;
      this.canvas.height = imageData.height;
    }
    this.ctx.putImageData(imageData, 0, 0);
    this.metrics.totalFrames++;
  }

  // Draw a bitmap (faster than ImageData for display)
  async drawBitmap(bitmap: ImageBitmap): Promise<void> {
    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;
    this.ctx.drawImage(bitmap, 0, 0);
    this.metrics.totalFrames++;
  }

  clear(color = '#000000'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  private updateMetrics(frameTime: number, captureTimestamp: number): void {
    const avgFrameTime =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    this.metrics.frameTime = avgFrameTime;
    this.metrics.fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;
    this.metrics.latencyMs = performance.now() - captureTimestamp;

    // Estimate memory from performance API if available
    if ('memory' in performance) {
      const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      this.metrics.memoryUsageMB = Math.round(mem.usedJSHeapSize / 1024 / 1024);
    }
  }

  getMetrics(): RenderMetrics {
    return { ...this.metrics };
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
