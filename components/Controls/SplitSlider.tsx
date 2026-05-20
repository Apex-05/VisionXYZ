'use client';

import { useCallback, useRef, useState } from 'react';

interface SplitSliderProps {
  position: number; // 0-100
  onChange: (pos: number) => void;
  onClose: () => void;
}

export function SplitSlider({ position, onChange, onClose }: SplitSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const calcPos = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return position;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, [position]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    onChange(calcPos(e.clientX));

    const onMove = (ev: MouseEvent) => {
      if (dragging.current) onChange(calcPos(ev.clientX));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [calcPos, onChange]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    onChange(calcPos(e.touches[0].clientX));

    const onMove = (ev: TouchEvent) => {
      if (dragging.current) onChange(calcPos(ev.touches[0].clientX));
    };
    const onEnd = () => {
      dragging.current = false;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }, [calcPos, onChange]);

  return (
    <div className="flex items-center gap-2">
      {/* Labels */}
      <span className="text-xs font-mono text-gray-500">ORIG</span>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-5 flex-1 flex items-center cursor-col-resize"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-accent-cyan/50 transition-none"
            style={{ width: `${position}%` }}
          />
        </div>
        {/* Thumb */}
        <div
          className={`absolute w-3 h-3 rounded-full border-2 border-accent-cyan bg-surface-200 -translate-x-1/2 transition-transform ${isHovered ? 'scale-125' : 'scale-100'}`}
          style={{ left: `${position}%` }}
        />
      </div>

      <span className="text-xs font-mono text-accent-cyan">FX</span>

      {/* Close button */}
      <button
        onClick={onClose}
        className="text-gray-600 hover:text-gray-400 text-xs ml-1"
        title="Close split view"
      >
        ✕
      </button>
    </div>
  );
}
