'use client';

import { Camera, RefreshCw } from 'lucide-react';
import type { CameraDevice } from '@/types/camera';

interface CameraSelectorProps {
  devices: CameraDevice[];
  activeDeviceId: string | null;
  onSelect: (deviceId: string) => void;
  onRefresh: () => void;
}

export function CameraSelector({ devices, activeDeviceId, onSelect, onRefresh }: CameraSelectorProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Sources</span>
        <button onClick={onRefresh} className="text-gray-600 hover:text-gray-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="px-2 py-1.5 text-xs text-gray-600">No cameras found</div>
      ) : (
        devices.map((device) => (
          <button
            key={device.deviceId}
            onClick={() => onSelect(device.deviceId)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
              activeDeviceId === device.deviceId
                ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-mono">{device.label}</span>
            {device.facing !== 'unknown' && (
              <span className="ml-auto text-gray-600 text-xs">{device.facing}</span>
            )}
          </button>
        ))
      )}
    </div>
  );
}
