import type { BoundingBox } from '@/types/vision';
import type { FrameData } from '@/types/camera';
import type { DetectorBackend } from './detector';

// EfficientDet-Lite0 via MediaPipe Tasks — CDN model, no local file needed.
// 90 COCO classes, ~320ms cold start, ~30-50ms per frame on WebGPU.
export class MediaPipeDetector implements DetectorBackend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private objectDetector: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const { ObjectDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    this.objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite',
        delegate: 'GPU',
      },
      scoreThreshold: 0.40,
      maxResults: 25,
      runningMode: 'VIDEO',
    });

    this.initialized = true;
  }

  async detect(frame: FrameData): Promise<BoundingBox[]> {
    if (!this.initialized || !this.objectDetector) return [];

    const bitmap = await createImageBitmap(frame.imageData);
    let result;
    try {
      result = this.objectDetector.detectForVideo(bitmap, frame.timestamp);
    } finally {
      bitmap.close();
    }

    if (!result?.detections) return [];

    return result.detections.map(
      (det: {
        boundingBox: { originX: number; originY: number; width: number; height: number };
        categories: Array<{ index: number; score: number; categoryName: string }>;
      }): BoundingBox => {
        const bbox = det.boundingBox;
        const cat = det.categories[0] ?? { index: 0, score: 0, categoryName: 'object' };
        return {
          x: bbox.originX,
          y: bbox.originY,
          width: bbox.width,
          height: bbox.height,
          confidence: cat.score,
          classId: cat.index,
          label: cat.categoryName,
        };
      }
    );
  }

  destroy(): void {
    try { this.objectDetector?.close(); } catch { /* ignore */ }
    this.objectDetector = null;
    this.initialized = false;
  }
}
