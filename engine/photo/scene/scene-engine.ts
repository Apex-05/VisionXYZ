import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';
import { classifyScene, SceneClass } from './classifier';
import { applySceneAdaptation } from './adaptations';

export class SceneEngine {
  private lastScene: SceneClass = 'unknown';
  private smoothingBuffer: SceneClass[] = [];
  private readonly smoothingWindow = 10;

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    const data = new Uint8ClampedArray(imageData.data);

    const scene = classifyScene(data, width, height);

    // Temporal smoothing — prevent flickering
    this.smoothingBuffer.push(scene);
    if (this.smoothingBuffer.length > this.smoothingWindow) {
      this.smoothingBuffer.shift();
    }

    const stableScene = this.getMajority();
    this.lastScene = stableScene;

    applySceneAdaptation(data, width, height, stableScene);

    return {
      imageData: new ImageData(data, width, height),
      metadata: { scene: stableScene },
      processingTime: performance.now() - t0,
    };
  }

  private getMajority(): SceneClass {
    const counts = new Map<SceneClass, number>();
    for (const s of this.smoothingBuffer) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    let max = 0;
    let best: SceneClass = 'unknown';
    for (const [scene, count] of counts) {
      if (count > max) {
        max = count;
        best = scene;
      }
    }
    return best;
  }

  getLastScene(): SceneClass {
    return this.lastScene;
  }

  reset(): void {
    this.smoothingBuffer = [];
    this.lastScene = 'unknown';
  }

  destroy(): void {}
}
