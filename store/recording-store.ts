import { create } from 'zustand';
import type { RecordingFormat } from '@/engine/export/recorder';

interface RecordingStore {
  isRecording: boolean;
  recordingDuration: number;
  recordingStartTime: number | null;
  format: RecordingFormat;
  lastRecordingBlob: Blob | null;
  lastSnapshotBlob: Blob | null;

  setRecording: (v: boolean) => void;
  setDuration: (s: number) => void;
  setStartTime: (t: number | null) => void;
  setFormat: (f: RecordingFormat) => void;
  setLastRecording: (b: Blob | null) => void;
  setLastSnapshot: (b: Blob | null) => void;
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  isRecording: false,
  recordingDuration: 0,
  recordingStartTime: null,
  format: 'webm',
  lastRecordingBlob: null,
  lastSnapshotBlob: null,

  setRecording: (isRecording) => set({ isRecording }),
  setDuration: (recordingDuration) => set({ recordingDuration }),
  setStartTime: (recordingStartTime) => set({ recordingStartTime }),
  setFormat: (format) => set({ format }),
  setLastRecording: (lastRecordingBlob) => set({ lastRecordingBlob }),
  setLastSnapshot: (lastSnapshotBlob) => set({ lastSnapshotBlob }),
}));
