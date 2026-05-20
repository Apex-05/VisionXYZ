export class MetricsCollector {
  private fps = 0;
  private frameCount = 0;
  private fpsWindowStart = 0;
  private fpsFrames = 0;
  private frameTimes: number[] = [];
  private lastFrame = 0;

  tick(): void {
    const now = performance.now();
    if (this.lastFrame > 0) {
      this.frameTimes.push(now - this.lastFrame);
      if (this.frameTimes.length > 30) this.frameTimes.shift();
    }
    this.lastFrame = now;

    this.fpsFrames++;
    this.frameCount++;

    if (now - this.fpsWindowStart >= 1000) {
      this.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsWindowStart = now;
    }
  }

  getFps(): number {
    return this.fps;
  }

  getAvgFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getMemoryMB(): number {
    if ('memory' in performance) {
      const mem = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return Math.round(mem.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  reset(): void {
    this.fps = 0;
    this.frameCount = 0;
    this.fpsWindowStart = performance.now();
    this.fpsFrames = 0;
    this.frameTimes = [];
    this.lastFrame = 0;
  }
}
