// MediaPipe SelfieSegmentation integration for portrait mode
// Adapter pattern — works with @mediapipe/tasks-vision

export interface SegmentationMask {
  data: Float32Array; // 0=background, 1=person per pixel
  width: number;
  height: number;
}

export type SegmentationBackend = 'mediapipe' | 'cpu-heuristic';

export class Segmenter {
  private initialized = false;
  private backend: SegmentationBackend = 'cpu-heuristic';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mpSegmenter: any = null;

  async init(backend: SegmentationBackend = 'mediapipe'): Promise<void> {
    this.backend = backend;

    if (backend === 'mediapipe') {
      try {
        const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        this.mpSegmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          outputCategoryMask: true,
          runningMode: 'VIDEO',
        });
        this.initialized = true;
      } catch {
        console.warn('[Segmenter] MediaPipe init failed, falling back to heuristic');
        this.backend = 'cpu-heuristic';
        this.initialized = true;
      }
    } else {
      this.initialized = true;
    }
  }

  async segment(
    imageData: ImageData,
    timestamp: number
  ): Promise<SegmentationMask> {
    if (!this.initialized) await this.init();

    if (this.backend === 'mediapipe' && this.mpSegmenter) {
      return this.segmentMediaPipe(imageData, timestamp);
    }
    return this.segmentHeuristic(imageData);
  }

  private async segmentMediaPipe(
    imageData: ImageData,
    timestamp: number
  ): Promise<SegmentationMask> {
    const bitmap = await createImageBitmap(imageData);
    const result = this.mpSegmenter.segmentForVideo(bitmap, timestamp);
    bitmap.close();

    const mask = result.categoryMask;
    if (!mask) return this.segmentHeuristic(imageData);

    const { width, height } = mask;
    const raw = mask.getAsFloat32Array();
    // MediaPipe: 0 = background, 1 = person
    const data = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      data[i] = raw[i] > 0.5 ? 1 : 0;
    }

    mask.close();
    return { data, width, height };
  }

  private segmentHeuristic(imageData: ImageData): SegmentationMask {
    // Simple center-weighted heuristic when MediaPipe unavailable
    const { width, height, data } = imageData;
    const mask = new Float32Array(width * height);
    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.35;
    const ry = height * 0.45;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const dist = dx * dx + dy * dy;

        // Skin tone bonus
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const isSkinTone = r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;

        mask[y * width + x] = dist < 1 ? (isSkinTone ? 1.0 : 0.7) : 0;
      }
    }

    return { data: mask, width, height };
  }

  destroy(): void {
    if (this.mpSegmenter) {
      this.mpSegmenter.close();
      this.mpSegmenter = null;
    }
    this.initialized = false;
  }
}
