'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { LeftSidebar } from '../Sidebar/LeftSidebar';
import { StatsPanel } from '../Stats/StatsPanel';
import { BottomControls } from '../Controls/BottomControls';
import { CameraPermission } from '../Camera/CameraPermission';
import { CameraPreview } from '../Camera/CameraPreview';
import { MobileConnect } from '../Camera/MobileConnect';
import { QuickModeCards } from '../Controls/QuickModeCards';
import { useCamera } from '@/hooks/useCamera';
import { useMode } from '@/hooks/useMode';
import { useVision } from '@/hooks/useVision';
import { useExport } from '@/hooks/useExport';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { usePreferences } from '@/hooks/usePreferences';
import { useStatsStore } from '@/store/stats-store';
import { CREATIVE_MODES } from '@/types/modes';
import type { FrameData } from '@/types/camera';
import type { ActiveMode, ModeConfig } from '@/types/modes';
import type { ProcessorResult } from '@/types/engine';

export function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camera = useCamera();
  const { activeMode, setMode, processFrame } = useMode();
  const { processVisionFrame, renderVisionOverlay, isVisionMode } = useVision();
  const exportHook = useExport(canvasRef);
  const fps = useStatsStore((s) => s.renderMetrics.fps);
  const prefs = usePreferences();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileConnectOpen, setMobileConnectOpen] = useState(false);

  // Split view state
  const [splitPosition, setSplitPosition] = useState<number | null>(null);
  const splitPositionRef = useRef<number | null>(null);

  const handleSplitChange = useCallback((pos: number) => {
    setSplitPosition(pos);
    splitPositionRef.current = pos;
  }, []);

  const handleSplitToggle = useCallback(() => {
    setSplitPosition((prev) => {
      const next = prev == null ? 50 : null;
      splitPositionRef.current = next;
      return next;
    });
  }, []);

  const handleModeChange = useCallback(
    (mode: ActiveMode) => {
      setMode(mode);
      prefs.addRecent(mode);
    },
    [setMode, prefs]
  );

  const handleConnectIPStream = useCallback(
    async (url: string) => {
      try {
        const { initIPStream } = await import('@/engine/frame/capture');
        const stream = await initIPStream(url);
        // Inject the stream directly via the camera hook's internal setter
        // We use the camera start path with a synthetic device approach:
        // attach the stream to the video element manually
        const video = camera.videoRef.current;
        if (!video) return;
        const { attachStreamToVideo } = await import('@/engine/frame/capture');
        await attachStreamToVideo(video, stream);
        // Notify store
        const { useCameraStore } = await import('@/store/camera-store');
        useCameraStore.getState().setStream(stream);
        useCameraStore.getState().setActive(true);
      } catch (e) {
        console.error('[Dashboard] IP stream connection failed:', e);
      }
    },
    [camera.videoRef]
  );

  // Combined frame handler
  const handleFrame = useCallback(
    async (frame: FrameData, mode: ActiveMode): Promise<ProcessorResult | null> => {
      if (isVisionMode(mode)) {
        // Run vision detection, then hand off a postDraw so the overlay is
        // painted AFTER useRenderLoop draws the base frame (not before).
        const visionResult = await processVisionFrame(frame, mode);
        return {
          imageData: frame.imageData,
          processingTime: visionResult?.processingTime ?? 0,
          postDraw: visionResult
            ? async (ctx) => renderVisionOverlay(ctx, visionResult)
            : undefined,
        };
      }

      return processFrame(frame, mode);
    },
    [processFrame, processVisionFrame, renderVisionOverlay, isVisionMode]
  );

  const { startLoop, stopLoop } = useRenderLoop(
    canvasRef,
    camera.videoRef,
    handleFrame,
    splitPositionRef
  );

  // Detect WebGPU once on mount — getState() avoids any subscription
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      useStatsStore.getState().setGPUAvailable(true);
      useStatsStore.getState().setActiveBackend('webgpu');
    }
  }, []);

  useEffect(() => {
    if (camera.isActive) startLoop();
    else stopLoop();
  }, [camera.isActive, startLoop, stopLoop]);

  const handleToggleCamera = useCallback(async () => {
    if (camera.isActive) camera.stop();
    else await camera.start();
  }, [camera]);

  const isVision = isVisionMode(activeMode);
  const modeLabelColor = isVision
    ? 'text-yellow-400 border-yellow-400/30'
    : 'text-accent-cyan border-accent-cyan/30';

  const quickModes = useMemo<ModeConfig[]>(() => {
    const favSet = new Set(prefs.favorites);
    const recentSet = new Set(prefs.recents);
    const favModes = CREATIVE_MODES.filter((m) => favSet.has(m.id));
    const recentModes = CREATIVE_MODES.filter((m) => recentSet.has(m.id) && !favSet.has(m.id));
    return [...favModes, ...recentModes].slice(0, 10);
  }, [prefs.favorites, prefs.recents]);

  return (
    <div className="flex flex-col h-screen bg-surface-400 text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left sidebar */}
        <LeftSidebar
          activeMode={activeMode}
          onModeChange={handleModeChange}
          devices={camera.devices}
          activeDeviceId={camera.activeDeviceId}
          onDeviceSelect={camera.switchDevice}
          onDeviceRefresh={camera.refreshDevices}
          isConnected={camera.isActive}
          recents={prefs.recents}
          isFavorite={prefs.isFavorite}
          onToggleFavorite={prefs.toggleFavorite}
          onOpenMobileConnect={() => setMobileConnectOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />

        {/* Center: Preview */}
        <main className="flex-1 relative bg-black overflow-hidden flex items-center justify-center min-w-0">
          <CameraPreview ref={camera.videoRef} isActive={camera.isActive} />

          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{ display: camera.isActive ? 'block' : 'none' }}
          />

          {/* Welcome screen */}
          {!camera.isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CameraPermission
                onRequestAccess={() => camera.start()}
                error={camera.error}
                isInitializing={camera.isInitializing}
              />
            </div>
          )}

          {/* Mode label */}
          {camera.isActive && activeMode !== 'passthrough' && (
            <div
              className={`absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded font-mono text-xs border transition-all duration-200 ${modeLabelColor}`}
            >
              {activeMode.toUpperCase()}
            </div>
          )}

          {/* Mini FPS */}
          {camera.isActive && fps > 0 && (
            <div
              className={`absolute bottom-3 left-3 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded font-mono text-xs tabular-nums ${
                fps >= 25 ? 'text-green-400' : fps >= 15 ? 'text-yellow-400' : 'text-red-400'
              }`}
            >
              {fps.toFixed(0)} FPS
            </div>
          )}

          {/* Split-view ORIG/FX labels */}
          {splitPosition != null && camera.isActive && (
            <>
              <div className="absolute top-3 pointer-events-none" style={{ left: `${Math.max(4, splitPosition / 2)}%` }}>
                <span className="px-1.5 py-0.5 bg-black/50 rounded font-mono text-xs text-gray-400">ORIG</span>
              </div>
              <div className="absolute top-3 pointer-events-none" style={{ left: `${Math.min(90, splitPosition + (100 - splitPosition) / 2)}%` }}>
                <span className="px-1.5 py-0.5 bg-black/50 rounded font-mono text-xs text-accent-cyan">EFFECT</span>
              </div>
            </>
          )}

          {/* REC badge */}
          {exportHook.isRecording && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-sm rounded">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs text-red-400">REC</span>
            </div>
          )}

          {/* Camera initializing */}
          {camera.isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-mono">Initializing camera…</p>
              </div>
            </div>
          )}
        </main>

        {/* Right stats panel */}
        <StatsPanel />
      </div>

      {/* Quick mode cards */}
      {camera.isActive && quickModes.length > 0 && (
        <QuickModeCards
          modes={quickModes}
          activeMode={activeMode}
          onSelect={handleModeChange}
          label="Quick"
        />
      )}

      {/* Bottom controls */}
      <BottomControls
        isRecording={exportHook.isRecording}
        isActive={camera.isActive}
        recordingDuration={exportHook.duration}
        onCapture={() => exportHook.captureSnapshot('png')}
        onToggleRecording={exportHook.toggleRecording}
        onSaveSnapshot={() => exportHook.captureSnapshot('jpeg')}
        onToggleCamera={handleToggleCamera}
        splitPosition={splitPosition}
        onSplitChange={handleSplitChange}
        onSplitToggle={handleSplitToggle}
      />

      {/* Mobile connect modal */}
      {mobileConnectOpen && (
        <MobileConnect
          onClose={() => setMobileConnectOpen(false)}
          onConnectIPStream={handleConnectIPStream}
        />
      )}
    </div>
  );
}
