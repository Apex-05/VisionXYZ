import type { BoundingBox, DetectionResult } from '@/types/vision';
import type { FrameData } from '@/types/camera';

export interface DetectorBackend {
  init(): Promise<void>;
  detect(frame: FrameData): Promise<BoundingBox[]>;
  destroy(): void;
}

export class Detector {
  private backend: DetectorBackend | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private backendName = 'none';

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1st try: MediaPipe EfficientDet (CDN, no local file needed)
      try {
        const { MediaPipeDetector } = await import('./mediapipe-detector');
        this.backend = new MediaPipeDetector();
        await this.backend.init();
        this.backendName = 'efficientdet-mp';
        this.initialized = true;
        return;
      } catch (e) {
        console.warn('[Detector] MediaPipe init failed, trying YOLO ONNX:', e);
      }

      // 2nd try: local YOLO ONNX (if model file placed in /public/models/)
      try {
        const { YOLODetector } = await import('./yolo-detector');
        this.backend = new YOLODetector('/models/yolov8n.onnx');
        await this.backend.init();
        this.backendName = 'yolov8n';
        this.initialized = true;
        return;
      } catch (e) {
        console.warn('[Detector] YOLO init failed, using mock:', e);
      }

      // Fallback: empty mock
      this.backend = new MockDetector();
      await this.backend.init();
      this.backendName = 'mock';
      this.initialized = true;
    })();

    return this.initPromise;
  }

  async detect(frame: FrameData): Promise<DetectionResult> {
    if (!this.initialized) await this.init();

    const t0 = performance.now();
    const boxes = await this.backend!.detect(frame);

    return {
      boxes,
      processingTime: performance.now() - t0,
      modelName: this.backendName,
    };
  }

  getBackendName(): string { return this.backendName; }
  isReady(): boolean { return this.initialized; }

  destroy(): void {
    this.backend?.destroy();
    this.initialized = false;
    this.initPromise = null;
  }
}

class MockDetector implements DetectorBackend {
  async init(): Promise<void> {}
  async detect(): Promise<BoundingBox[]> { return []; }
  destroy(): void {}
}
