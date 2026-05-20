'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { CameraSelector } from '../Camera/CameraSelector';
import type { ActiveMode } from '@/types/modes';
import type { CameraDevice } from '@/types/camera';
import { PHOTOGRAPHY_MODES, CREATIVE_MODES, VISION_MODES } from '@/types/modes';

interface LeftSidebarProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  devices: CameraDevice[];
  activeDeviceId: string | null;
  onDeviceSelect: (id: string) => void;
  onDeviceRefresh: () => void;
  isConnected: boolean;
  recents?: ActiveMode[];
  isFavorite?: (mode: ActiveMode) => boolean;
  onToggleFavorite?: (mode: ActiveMode) => void;
  onOpenMobileConnect?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ALL_MODES = [...PHOTOGRAPHY_MODES, ...CREATIVE_MODES, ...VISION_MODES];

export function LeftSidebar({
  activeMode,
  onModeChange,
  devices,
  activeDeviceId,
  onDeviceSelect,
  onDeviceRefresh,
  isConnected,
  recents = [],
  isFavorite,
  onToggleFavorite,
  onOpenMobileConnect,
  collapsed = false,
  onToggleCollapse,
}: LeftSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredModes = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return ALL_MODES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [search]);

  const recentModes = useMemo(
    () =>
      recents
        .map((id) => ALL_MODES.find((m) => m.id === id))
        .filter(Boolean) as typeof ALL_MODES,
    [recents]
  );

  if (collapsed) {
    return (
      <aside className="flex-shrink-0 flex flex-col h-full bg-surface-200 border-r border-gray-800 w-10 items-center py-3 gap-3">
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-1 h-1 rounded-full bg-accent-cyan/60 mt-1" />
        <div
          className={`w-2 h-2 rounded-full mt-auto mb-2 ${isConnected ? 'bg-status-active' : 'bg-gray-700'}`}
          title={isConnected ? 'Camera live' : 'No camera'}
        />
      </aside>
    );
  }

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col h-full bg-surface-200 border-r border-gray-800 overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-cyan text-xs font-bold">V</span>
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-bold font-mono tracking-tight truncate">VisionXYZ</div>
              <div className="text-gray-600 text-xs font-mono truncate">by Apex-05</div>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors ml-1"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-status-active animate-pulse' : 'bg-gray-700'}`} />
          <span className={`text-xs font-mono ${isConnected ? 'text-status-active' : 'text-gray-600'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-gray-800 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search effects…"
            className="w-full bg-surface-300 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-cyan/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mode list */}
      <div className="flex-1 px-1 py-2 space-y-0.5 overflow-y-auto">
        {/* Search results */}
        {filteredModes && (
          <SidebarSection title={`Results (${filteredModes.length})`}>
            {filteredModes.length === 0 ? (
              <p className="text-xs text-gray-600 font-mono px-2 py-1">No matches</p>
            ) : (
              filteredModes.map((mode) => (
                <SidebarItem
                  key={mode.id}
                  label={mode.label}
                  isActive={activeMode === mode.id}
                  onClick={() => onModeChange(mode.id)}
                  requiresModel={mode.requiresModel}
                  isFavorite={isFavorite?.(mode.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(mode.id) : undefined}
                />
              ))
            )}
          </SidebarSection>
        )}

        {!filteredModes && (
          <>
            {/* Recents */}
            {recentModes.length > 0 && (
              <SidebarSection title="Recent">
                {recentModes.map((mode) => (
                  <SidebarItem
                    key={mode.id}
                    label={mode.label}
                    isActive={activeMode === mode.id}
                    onClick={() => onModeChange(mode.id)}
                    requiresModel={mode.requiresModel}
                    isFavorite={isFavorite?.(mode.id)}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(mode.id) : undefined}
                  />
                ))}
              </SidebarSection>
            )}

            {/* Sources */}
            <SidebarSection title="Sources">
              <CameraSelector
                devices={devices}
                activeDeviceId={activeDeviceId}
                onSelect={onDeviceSelect}
                onRefresh={onDeviceRefresh}
              />
              {onOpenMobileConnect && (
                <button
                  onClick={onOpenMobileConnect}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-mono text-gray-500 hover:text-accent-cyan hover:bg-accent-cyan/5 rounded transition-colors border border-dashed border-gray-700 hover:border-accent-cyan/40 mt-1"
                >
                  + Mobile / IP Camera
                </button>
              )}
            </SidebarSection>

            {/* Passthrough */}
            <div className="ml-1">
              <SidebarItem
                label="Passthrough"
                isActive={activeMode === 'passthrough'}
                onClick={() => onModeChange('passthrough')}
              />
            </div>

            <SidebarSection title="Photography">
              {PHOTOGRAPHY_MODES.map((mode) => (
                <SidebarItem
                  key={mode.id}
                  label={mode.label}
                  isActive={activeMode === mode.id}
                  onClick={() => onModeChange(mode.id)}
                  requiresModel={mode.requiresModel}
                  isFavorite={isFavorite?.(mode.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(mode.id) : undefined}
                />
              ))}
            </SidebarSection>

            <SidebarSection title="Creative">
              {CREATIVE_MODES.map((mode) => (
                <SidebarItem
                  key={mode.id}
                  label={mode.label}
                  isActive={activeMode === mode.id}
                  onClick={() => onModeChange(mode.id)}
                  requiresModel={mode.requiresModel}
                  isFavorite={isFavorite?.(mode.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(mode.id) : undefined}
                />
              ))}
            </SidebarSection>

            <SidebarSection title="Vision AI">
              {VISION_MODES.map((mode) => (
                <SidebarItem
                  key={mode.id}
                  label={mode.label}
                  isActive={activeMode === mode.id}
                  onClick={() => onModeChange(mode.id)}
                  requiresModel={mode.requiresModel}
                  isFavorite={isFavorite?.(mode.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(mode.id) : undefined}
                  badge="AI"
                />
              ))}
            </SidebarSection>
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-800 text-center flex-shrink-0">
        <span className="text-xs text-gray-700 font-mono">Privacy-first · Zero upload</span>
      </div>
    </aside>
  );
}
