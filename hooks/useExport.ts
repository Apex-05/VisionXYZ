'use client';

import { useCallback, useRef } from 'react';
import { CanvasRecorder } from '@/engine/export/recorder';
import { takeSnapshot, downloadBlob, generateFilename } from '@/engine/export/snapshot';
import { useRecordingStore } from '@/store/recording-store';

export function useExport(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const store = useRecordingStore();
  const recorderRef = useRef<CanvasRecorder>(new CanvasRecorder());
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || store.isRecording) return;

    recorderRef.current.startRecording(canvas, { format: store.format });
    store.setRecording(true);
    store.setStartTime(Date.now());
    store.setDuration(0);

    durationTimerRef.current = setInterval(() => {
      store.setDuration(Math.floor((Date.now() - (store.recordingStartTime ?? Date.now())) / 1000));
    }, 1000);
  }, [canvasRef, store]);

  const stopRecording = useCallback(async () => {
    if (!store.isRecording) return;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    try {
      const blob = await recorderRef.current.stopRecording();
      store.setLastRecording(blob);
      store.setRecording(false);

      const ext = store.format === 'mp4' ? 'mp4' : 'webm';
      downloadBlob(blob, generateFilename(ext));
    } catch (e) {
      console.error('[useExport] Stop recording failed:', e);
      store.setRecording(false);
    }
  }, [store]);

  const captureSnapshot = useCallback(
    async (format: 'png' | 'jpeg' = 'png') => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const blob = await takeSnapshot(canvas, format);
      store.setLastSnapshot(blob);
      downloadBlob(blob, generateFilename(format));
    },
    [canvasRef, store]
  );

  const toggleRecording = useCallback(() => {
    if (store.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [store.isRecording, startRecording, stopRecording]);

  return {
    isRecording: store.isRecording,
    duration: store.recordingDuration,
    format: store.format,
    startRecording,
    stopRecording,
    captureSnapshot,
    toggleRecording,
  };
}
