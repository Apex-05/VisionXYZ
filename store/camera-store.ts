import { create } from 'zustand';
import type { CameraDevice, CameraConstraints, CaptureMetrics } from '@/types/camera';
import { DEFAULT_CONSTRAINTS } from '@/engine/frame/capture';

interface CameraStore {
  stream: MediaStream | null;
  isActive: boolean;
  isInitializing: boolean;
  error: string | null;
  devices: CameraDevice[];
  activeDeviceId: string | null;
  constraints: CameraConstraints;
  metrics: CaptureMetrics;

  setStream: (stream: MediaStream | null) => void;
  setActive: (active: boolean) => void;
  setInitializing: (v: boolean) => void;
  setError: (err: string | null) => void;
  setDevices: (devices: CameraDevice[]) => void;
  setActiveDevice: (id: string | null) => void;
  setConstraints: (c: Partial<CameraConstraints>) => void;
  setMetrics: (m: CaptureMetrics) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  stream: null,
  isActive: false,
  isInitializing: false,
  error: null,
  devices: [],
  activeDeviceId: null,
  constraints: DEFAULT_CONSTRAINTS,
  metrics: {
    fps: 0,
    frameCount: 0,
    droppedFrames: 0,
    avgProcessingTime: 0,
    latency: 0,
  },

  setStream: (stream) => set({ stream }),
  setActive: (isActive) => set({ isActive }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setError: (error) => set({ error }),
  setDevices: (devices) => set({ devices }),
  setActiveDevice: (activeDeviceId) => set({ activeDeviceId }),
  setConstraints: (c) => set((s) => ({ constraints: { ...s.constraints, ...c } })),
  setMetrics: (metrics) => set({ metrics }),
}));
