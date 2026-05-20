import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';
import { Segmenter } from './segmentation';
import { applyBackgroundBlur } from './background-blur';

export class PortraitEngine {
  private segmenter: Segmenter;
  private blurRadius: number;
  private initialized = false;

  constructor(blurRadius = 14) {
    this.segmenter = new Segmenter();
    this.blurRadius = blurRadius;
  }

  async init(): Promise<void> {
    await this.segmenter.init('mediapipe');
    this.initialized = true;
  }

  async process(frame: FrameData): Promise<ProcessorResult> {
    if (!this.initialized) await this.init();

    const t0 = performance.now();
    const { imageData, width, height, timestamp } = frame;
    const data = new Uint8ClampedArray(imageData.data);

    const mask = await this.segmenter.segment(imageData, timestamp);
    applyBackgroundBlur(data, width, height, mask, this.blurRadius);

    return {
      imageData: new ImageData(data, width, height),
      processingTime: performance.now() - t0,
    };
  }

  reset(): void {}

  destroy(): void {
    this.segmenter.destroy();
    this.initialized = false;
  }
}
