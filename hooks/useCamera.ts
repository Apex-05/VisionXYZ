'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '@/store/camera-store';
import {
  enumerateDevices,
  initCamera,
  stopStream,
  attachStreamToVideo,
} from '@/engine/frame/capture';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Individual selectors for UI-driving state — only re-render when that specific value changes
  const isActive = useCameraStore((s) => s.isActive);
  const isInitializing = useCameraStore((s) => s.isInitializing);
  const error = useCameraStore((s) => s.error);
  const devices = useCameraStore((s) => s.devices);
  const activeDeviceId = useCameraStore((s) => s.activeDeviceId);
  const stream = useCameraStore((s) => s.stream);
  const metrics = useCameraStore((s) => s.metrics);

  // All mutating callbacks read state via getState() — no store in deps, callbacks are stable
  const refreshDevices = useCallback(async () => {
    try {
      const devs = await enumerateDevices();
      useCameraStore.getState().setDevices(devs);
    } catch (e) {
      console.warn('[useCamera] enumerate failed:', e);
    }
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    const s = useCameraStore.getState();
    if (s.isInitializing) return;

    s.setInitializing(true);
    s.setError(null);

    try {
      const constraints = { ...s.constraints };
      if (deviceId) constraints.deviceId = deviceId;

      const mediaStream = await initCamera(constraints);
      streamRef.current = mediaStream;

      useCameraStore.getState().setStream(mediaStream);
      useCameraStore.getState().setActive(true);
      useCameraStore.getState().setActiveDevice(deviceId ?? null);

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, mediaStream);
      }

      await refreshDevices();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access denied';
      useCameraStore.getState().setError(msg);
      useCameraStore.getState().setActive(false);
    } finally {
      useCameraStore.getState().setInitializing(false);
    }
  }, [refreshDevices]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
      useCameraStore.getState().setStream(null);
      useCameraStore.getState().setActive(false);
    }
  }, []);

  const switchDevice = useCallback(async (deviceId: string) => {
    stop();
    await start(deviceId);
  }, [stop, start]);

  useEffect(() => {
    return () => {
      if (streamRef.current) stopStream(streamRef.current);
    };
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    isInitializing,
    error,
    devices,
    activeDeviceId,
    metrics,
    start,
    stop,
    switchDevice,
    refreshDevices,
  };
}
