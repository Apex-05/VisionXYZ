import type { FrameData } from '@/types/camera';
import type { ProcessorResult, FrameProcessor } from '@/types/engine';

export abstract class BaseCreativeMode implements FrameProcessor {
  abstract readonly id: string;
  abstract readonly label: string;

  abstract process(frame: FrameData): ProcessorResult | Promise<ProcessorResult>;

  reset(): void {}
  destroy(): void {}

  protected clamp(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
  }

  protected toGrayscale(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}
