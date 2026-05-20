import type { BoundingBox } from '@/types/vision';
import type { FrameData } from '@/types/camera';
import type { DetectorBackend } from './detector';
import { COCO_LABELS } from '@/types/vision';

export class YOLODetector implements DetectorBackend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  private modelPath: string;
  private inputSize = 640;
  private confThreshold = 0.45;
  private nmsThreshold = 0.5;

  constructor(modelPath: string, inputSize = 640) {
    this.modelPath = modelPath;
    this.inputSize = inputSize;
  }

  async init(): Promise<void> {
    const ort = await import('onnxruntime-web');

    const executionProviders: string[] = [];
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      executionProviders.push('webgpu');
    }
    executionProviders.push('wasm');

    ort.env.wasm.wasmPaths = '/ort-wasm/';

    this.session = await ort.InferenceSession.create(this.modelPath, {
      executionProviders,
      graphOptimizationLevel: 'all',
    });
  }

  async detect(frame: FrameData): Promise<BoundingBox[]> {
    if (!this.session) return [];

    const ort = await import('onnxruntime-web');
    const { imageData, width, height } = frame;

    const tensor = this.preprocessFrame(imageData, width, height);
    const inputTensor = new ort.Tensor('float32', tensor, [1, 3, this.inputSize, this.inputSize]);

    const outputs = await this.session.run({ images: inputTensor });
    const outputTensor = Object.values(outputs)[0] as InstanceType<typeof ort.Tensor>;

    return this.parseOutput(outputTensor.data as Float32Array, width, height);
  }

  private preprocessFrame(
    imageData: ImageData,
    srcW: number,
    srcH: number
  ): Float32Array {
    const size = this.inputSize;
    const offscreen = new OffscreenCanvas(size, size);
    const ctx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;

    const scale = Math.min(size / srcW, size / srcH);
    const newW = Math.round(srcW * scale);
    const newH = Math.round(srcH * scale);
    const padX = (size - newW) / 2;
    const padY = (size - newH) / 2;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const tempCanvas = new OffscreenCanvas(srcW, srcH);
    const tempCtx = tempCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, padX, padY, newW, newH);

    const resized = ctx.getImageData(0, 0, size, size);
    const float = new Float32Array(3 * size * size);
    const data = resized.data;

    for (let i = 0; i < size * size; i++) {
      float[i] = data[i * 4] / 255;
      float[size * size + i] = data[i * 4 + 1] / 255;
      float[2 * size * size + i] = data[i * 4 + 2] / 255;
    }

    return float;
  }

  private parseOutput(
    data: Float32Array,
    imgW: number,
    imgH: number
  ): BoundingBox[] {
    const numProposals = data.length / 84;
    const boxes: BoundingBox[] = [];
    const size = this.inputSize;
    const scale = Math.min(size / imgW, size / imgH);
    const padX = (size - imgW * scale) / 2;
    const padY = (size - imgH * scale) / 2;

    for (let i = 0; i < numProposals; i++) {
      const cx = data[i];
      const cy = data[numProposals + i];
      const w = data[2 * numProposals + i];
      const h = data[3 * numProposals + i];

      let maxConf = 0, classId = 0;
      for (let c = 0; c < 80; c++) {
        const conf = data[(4 + c) * numProposals + i];
        if (conf > maxConf) {
          maxConf = conf;
          classId = c;
        }
      }

      if (maxConf < this.confThreshold) continue;

      const x = (cx - w / 2 - padX) / scale;
      const y = (cy - h / 2 - padY) / scale;
      const bw = w / scale;
      const bh = h / scale;

      if (bw <= 0 || bh <= 0) continue;

      boxes.push({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.min(imgW - x, bw),
        height: Math.min(imgH - y, bh),
        confidence: maxConf,
        classId,
        label: COCO_LABELS[classId] ?? `class${classId}`,
      });
    }

    return this.nms(boxes);
  }

  private nms(boxes: BoundingBox[]): BoundingBox[] {
    boxes.sort((a, b) => b.confidence - a.confidence);
    const kept: BoundingBox[] = [];

    for (const box of boxes) {
      const overlap = kept.some((k) => iou(box, k) > this.nmsThreshold && k.classId === box.classId);
      if (!overlap) kept.push(box);
    }

    return kept;
  }

  destroy(): void {
    this.session?.release?.();
    this.session = null;
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
