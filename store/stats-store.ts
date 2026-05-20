import { create } from 'zustand';
import type { RenderMetrics } from '@/types/engine';

interface StatsStore {
  renderMetrics: RenderMetrics;
  activeBackend: string;
  isGPUAvailable: boolean;
  setRenderMetrics: (m: Partial<RenderMetrics>) => void;
  setActiveBackend: (b: string) => void;
  setGPUAvailable: (v: boolean) => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  renderMetrics: {
    fps: 0,
    frameTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    memoryUsageMB: 0,
    gpuLoad: 0,
    latencyMs: 0,
  },
  activeBackend: 'cpu',
  isGPUAvailable: false,

  setRenderMetrics: (partial) => set((s) => ({ renderMetrics: { ...s.renderMetrics, ...partial } })),
  setActiveBackend: (activeBackend) => set({ activeBackend }),
  setGPUAvailable: (isGPUAvailable) => set({ isGPUAvailable }),
}));
