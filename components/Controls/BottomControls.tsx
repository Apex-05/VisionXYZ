'use client';

import { Camera, Circle, Square, Download, Image, Wifi, WifiOff, SplitSquareHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { SplitSlider } from './SplitSlider';

interface BottomControlsProps {
  isRecording: boolean;
  isActive: boolean;
  recordingDuration: number;
  onCapture: () => void;
  onToggleRecording: () => void;
  onSaveSnapshot: () => void;
  onToggleCamera: () => void;
  splitPosition?: number | null;
  onSplitChange?: (pos: number) => void;
  onSplitToggle?: () => void;
}

export function BottomControls({
  isRecording,
  isActive,
  recordingDuration,
  onCapture,
  onToggleRecording,
  onSaveSnapshot,
  onToggleCamera,
  splitPosition,
  onSplitChange,
  onSplitToggle,
}: BottomControlsProps) {
  const formatDuration = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const splitActive = splitPosition != null;

  return (
    <div className="flex-shrink-0 bg-surface-200 border-t border-gray-800">
      {/* Split slider row */}
      {splitActive && onSplitChange && onSplitToggle && (
        <div className="px-4 py-1.5 border-b border-gray-800/60">
          <SplitSlider
            position={splitPosition}
            onChange={onSplitChange}
            onClose={onSplitToggle}
          />
        </div>
      )}

      {/* Main controls row */}
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Camera toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCamera}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs transition-all',
              isActive
                ? 'bg-status-active/10 text-status-active border border-status-active/40 hover:bg-status-active/20'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            )}
          >
            {isActive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isActive ? 'Camera On' : 'Start Camera'}</span>
          </button>

          {/* Split view toggle */}
          {isActive && onSplitToggle && (
            <button
              onClick={onSplitToggle}
              title="Before / After split view"
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-xs transition-all border',
                splitActive
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40'
                  : 'bg-gray-800 text-gray-500 hover:text-white border-gray-700'
              )}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
          )}
        </div>

        {/* Center: Main controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSaveSnapshot}
            disabled={!isActive}
            title="Save Snapshot"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
          >
            <Image className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={onToggleRecording}
            disabled={!isActive}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 disabled:opacity-30 disabled:cursor-not-allowed',
              isRecording
                ? 'bg-red-600 border-red-500 hover:bg-red-700 animate-pulse'
                : 'bg-surface-300 border-gray-600 hover:border-red-500 hover:text-red-400'
            )}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-white fill-white" />
            ) : (
              <Circle className="w-5 h-5 text-red-500 fill-red-500" />
            )}
          </button>

          <button
            onClick={onCapture}
            disabled={!isActive}
            title="Capture Photo"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Right: REC timer / export */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-mono text-sm tabular-nums">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          ) : (
            <button
              disabled={!isActive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all disabled:opacity-30 border border-gray-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
