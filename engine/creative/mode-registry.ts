import type { FrameProcessor } from '@/types/engine';
import type { CreativeMode } from '@/types/modes';

class ModeRegistry {
  private modes = new Map<CreativeMode, () => FrameProcessor>();

  register(id: CreativeMode, factory: () => FrameProcessor): void {
    this.modes.set(id, factory);
  }

  create(id: CreativeMode): FrameProcessor | null {
    const factory = this.modes.get(id);
    return factory ? factory() : null;
  }

  has(id: CreativeMode): boolean {
    return this.modes.has(id);
  }

  list(): CreativeMode[] {
    return Array.from(this.modes.keys());
  }
}

export const modeRegistry = new ModeRegistry();
