'use client';

import { useCallback, useRef } from 'react';
import { useModeStore } from '@/store/mode-store';
import type { ActiveMode } from '@/types/modes';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

// Lazily imported processors — avoid bundling all on initial load
async function getProcessor(mode: ActiveMode) {
  switch (mode) {
    case 'night-plus':
    case 'extreme-night':
    case 'moon': {
      const { NightEngine } = await import('@/engine/photo/night/night-engine');
      return new NightEngine(mode as 'night-plus' | 'extreme-night' | 'moon');
    }
    case 'portrait': {
      const { PortraitEngine } = await import('@/engine/photo/portrait/portrait-engine');
      return new PortraitEngine();
    }
    case 'scene-auto': {
      const { SceneEngine } = await import('@/engine/photo/scene/scene-engine');
      return new SceneEngine();
    }
    case 'thermal': {
      const { ThermalMode } = await import('@/engine/creative/thermal/thermal-mode');
      return new ThermalMode();
    }
    case 'sketch': {
      const { SketchMode } = await import('@/engine/creative/sketch/sketch-mode');
      return new SketchMode();
    }
    case 'cyberpunk': {
      const { CyberpunkMode } = await import('@/engine/creative/cyberpunk/cyberpunk-mode');
      return new CyberpunkMode();
    }
    case 'vintage': {
      const { VintageMode } = await import('@/engine/creative/vintage/vintage-mode');
      return new VintageMode();
    }
    case 'noir': {
      const { NoirMode } = await import('@/engine/creative/noir/noir-mode');
      return new NoirMode();
    }
    case 'watercolor': {
      const { WatercolorMode } = await import('@/engine/creative/watercolor/watercolor-mode');
      return new WatercolorMode();
    }
    case 'comic': {
      const { ComicMode } = await import('@/engine/creative/comic/comic-mode');
      return new ComicMode();
    }
    case 'heatmap': {
      const { HeatmapMode } = await import('@/engine/creative/heatmap/heatmap-mode');
      return new HeatmapMode();
    }
    case 'infrared': {
      const { InfraredMode } = await import('@/engine/creative/infrared/infrared-mode');
      return new InfraredMode();
    }
    case 'edge-vision': {
      const { EdgeVisionMode } = await import('@/engine/creative/edge-vision/edge-vision-mode');
      return new EdgeVisionMode();
    }
    case 'hud': {
      const { HUDMode } = await import('@/engine/creative/hud/hud-mode');
      return new HUDMode();
    }
    case 'anime': {
      const { AnimeMode } = await import('@/engine/creative/anime/anime-mode');
      return new AnimeMode();
    }
    case 'landscape': {
      const { LandscapeEngine } = await import('@/engine/photo/landscape/landscape-engine');
      return new LandscapeEngine();
    }
    case 'vhs': {
      const { VHSMode } = await import('@/engine/creative/vhs/vhs-mode');
      return new VHSMode();
    }
    case 'crt': {
      const { CRTMode } = await import('@/engine/creative/crt/crt-mode');
      return new CRTMode();
    }
    case 'pixel-art': {
      const { PixelArtMode } = await import('@/engine/creative/pixel-art/pixel-art-mode');
      return new PixelArtMode();
    }
    case 'matrix': {
      const { MatrixMode } = await import('@/engine/creative/matrix/matrix-mode');
      return new MatrixMode();
    }
    case 'hologram': {
      const { HologramMode } = await import('@/engine/creative/hologram/hologram-mode');
      return new HologramMode();
    }
    case 'glitch': {
      const { GlitchMode } = await import('@/engine/creative/glitch/glitch-mode');
      return new GlitchMode();
    }
    // Vision modes don't transform pixels — handled by useVision overlay
    case 'detection':
    case 'tracking':
    case 'gesture':
    case 'detection+tracking':
      return null;
    default:
      return null;
  }
}

export function useMode() {
  // Individual selectors — only re-render when the specific value changes,
  // not on every processingTime/isProcessing update from the render loop
  const activeMode = useModeStore((s) => s.activeMode);
  const isProcessing = useModeStore((s) => s.isProcessing);
  const processingTime = useModeStore((s) => s.processingTime);

  const processorRef = useRef<Awaited<ReturnType<typeof getProcessor>>>(null);
  const currentModeRef = useRef<ActiveMode>('passthrough');

  const processFrame = useCallback(
    async (frame: FrameData, mode: ActiveMode): Promise<ProcessorResult | null> => {
      if (mode === 'passthrough') return null;

      // Swap processor when mode changes
      if (mode !== currentModeRef.current) {
        processorRef.current?.destroy();
        processorRef.current = await getProcessor(mode);
        currentModeRef.current = mode;
        if ((processorRef.current as { init?: () => Promise<void> })?.init) {
          await (processorRef.current as { init: () => Promise<void> }).init();
        }
      }

      if (!processorRef.current) return null;

      return processorRef.current.process(frame);
    },
    []
  );

  // setMode uses getState() — no store subscription needed in this callback
  const setMode = useCallback((mode: ActiveMode) => {
    useModeStore.getState().setMode(mode);
  }, []);

  return { activeMode, isProcessing, processingTime, setMode, processFrame };
}
