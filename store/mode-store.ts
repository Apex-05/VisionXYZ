import { create } from 'zustand';
import type { ActiveMode } from '@/types/modes';

interface ModeStore {
  activeMode: ActiveMode;
  isProcessing: boolean;
  processingTime: number;
  pendingMode: ActiveMode | null;

  setMode: (mode: ActiveMode) => void;
  setProcessing: (v: boolean) => void;
  setProcessingTime: (ms: number) => void;
  setPendingMode: (mode: ActiveMode | null) => void;
}

export const useModeStore = create<ModeStore>((set) => ({
  activeMode: 'passthrough',
  isProcessing: false,
  processingTime: 0,
  pendingMode: null,

  setMode: (activeMode) => set({ activeMode }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProcessingTime: (processingTime) => set({ processingTime }),
  setPendingMode: (pendingMode) => set({ pendingMode }),
}));
