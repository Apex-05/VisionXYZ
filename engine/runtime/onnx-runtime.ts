import type { RuntimeBackend, InferenceResult } from '@/types/engine';

export class ONNXRuntime {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  private backend: RuntimeBackend = 'wasm';

  async init(modelBuffer: ArrayBuffer, preferredBackend: RuntimeBackend = 'webgpu'): Promise<void> {
    const ort = await import('onnxruntime-web');

    ort.env.wasm.wasmPaths = '/ort-wasm/';
    ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency ?? 2);

    const providers: string[] = [];

    if (preferredBackend === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      providers.push('webgpu');
      this.backend = 'webgpu';
    }

    providers.push('wasm');

    this.session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
      enableMemPattern: true,
    });

    if (!providers.includes('webgpu') || providers[0] !== 'webgpu') {
      this.backend = 'wasm';
    }
  }

  async run(
    inputs: Record<string, { data: Float32Array; shape: number[] }>
  ): Promise<Record<string, InferenceResult>> {
    if (!this.session) throw new Error('Runtime not initialized');

    const ort = await import('onnxruntime-web');
    const feeds: Record<string, InstanceType<typeof ort.Tensor>> = {};

    for (const [name, input] of Object.entries(inputs)) {
      feeds[name] = new ort.Tensor('float32', input.data, input.shape);
    }

    const t0 = performance.now();
    const results = await this.session.run(feeds);
    const elapsed = performance.now() - t0;

    const output: Record<string, InferenceResult> = {};
    for (const [name, tensor] of Object.entries(results)) {
      const t = tensor as InstanceType<typeof ort.Tensor>;
      output[name] = {
        output: t.data as Float32Array,
        shape: t.dims as number[],
        processingTime: elapsed,
      };
    }

    return output;
  }

  getBackend(): RuntimeBackend {
    return this.backend;
  }

  async destroy(): Promise<void> {
    await this.session?.release?.();
    this.session = null;
  }
}
