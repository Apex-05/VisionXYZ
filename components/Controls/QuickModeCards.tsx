'use client';

import { clsx } from 'clsx';
import type { ActiveMode, ModeConfig } from '@/types/modes';

interface QuickModeCardsProps {
  modes: ModeConfig[];
  activeMode: ActiveMode;
  onSelect: (mode: ActiveMode) => void;
  label?: string;
}

export function QuickModeCards({ modes, activeMode, onSelect, label }: QuickModeCardsProps) {
  if (modes.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto border-b border-gray-800/60 scrollbar-hide">
      {label && (
        <span className="flex-shrink-0 text-xs font-mono text-gray-600 uppercase tracking-wider mr-1">
          {label}
        </span>
      )}
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={clsx(
            'flex-shrink-0 px-2.5 py-1 rounded text-xs font-mono transition-all whitespace-nowrap border',
            activeMode === mode.id
              ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40'
              : 'bg-surface-300 text-gray-400 hover:text-white border-gray-700 hover:border-gray-600'
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
