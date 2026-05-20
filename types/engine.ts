import type { FrameData } from './camera';

export interface ProcessorResult {
  imageData: ImageData;
  metadata?: Record<string, unknown>;
  processingTime: number;
  /** Called after the base frame is drawn — used for overlays that must render on top */
  postDraw?: (ctx: CanvasRenderingContext2D) => Promise<void>;
}

export interface FrameProcessor {
  process(frame: FrameData): Promise<ProcessorResult> | ProcessorResult;
  reset(): void;
  destroy(): void;
}

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  showOverlay: boolean;
}

export interface RenderMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  totalFrames: number;
  memoryUsageMB: number;
  gpuLoad: number;
  latencyMs: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  cached: boolean;
  backend: 'webgpu' | 'wasm' | 'cpu';
}

export type RuntimeBackend = 'webgpu' | 'wasm' | 'cpu';

export interface InferenceResult {
  output: Float32Array | Int32Array | Uint8Array;
  shape: number[];
  processingTime: number;
}
