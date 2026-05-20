'use client';

import { clsx } from 'clsx';

interface SidebarItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  requiresModel?: boolean;
  badge?: string;
  icon?: React.ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function SidebarItem({
  label,
  isActive,
  onClick,
  requiresModel,
  badge,
  icon,
  isFavorite,
  onToggleFavorite,
}: SidebarItemProps) {
  return (
    <div className="group/item relative flex items-center">
      <button
        onClick={onClick}
        className={clsx(
          'flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-all',
          isActive
            ? 'bg-accent-cyan/15 text-accent-cyan border-l-2 border-accent-cyan pl-2'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
        )}
      >
        {icon && <span className="flex-shrink-0 w-3.5 h-3.5">{icon}</span>}
        <span className="font-mono flex-1 truncate">{label}</span>
        {requiresModel && !isActive && !badge && (
          <span className="text-gray-600 text-xs">AI</span>
        )}
        {badge && (
          <span className="text-xs bg-accent-cyan/20 text-accent-cyan px-1 rounded">{badge}</span>
        )}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse ml-auto flex-shrink-0" />
        )}
      </button>

      {/* Favorite toggle — appears on row hover */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={clsx(
            'absolute right-1 px-0.5 text-xs transition-opacity',
            isFavorite
              ? 'opacity-100 text-yellow-400 hover:text-yellow-300'
              : 'opacity-0 group-hover/item:opacity-100 text-gray-600 hover:text-yellow-400'
          )}
          title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  );
}
