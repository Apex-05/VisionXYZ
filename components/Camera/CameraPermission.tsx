'use client';

interface CameraPermissionProps {
  onRequestAccess: () => void;
  error?: string | null;
  isInitializing?: boolean;
}

const PILLARS = [
  { title: 'Edge AI', desc: 'All inference runs on your device' },
  { title: 'Zero Upload', desc: 'Camera frames never leave your browser' },
  { title: 'No Cloud', desc: 'Works fully offline after first load' },
  { title: 'Real-time', desc: '30–60 FPS with WebGPU acceleration' },
];

export function CameraPermission({ onRequestAccess, error, isInitializing }: CameraPermissionProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {/* Logo */}
      <div className="mb-6 relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/30 flex items-center justify-center">
          <span className="text-accent-cyan text-2xl font-black font-mono">V</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-400 border border-gray-700 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
        </div>
      </div>

      <h1 className="text-xl font-bold font-mono text-white tracking-tight mb-1">VisionXYZ</h1>
      <p className="text-xs font-mono text-gray-600 mb-6">by Apex-05</p>

      {/* Pillars */}
      <div className="grid grid-cols-2 gap-2 mb-7 w-full max-w-xs">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="bg-surface-300 border border-gray-800 rounded-xl p-3 text-left"
          >
            <div className="text-xs font-bold font-mono text-white mb-0.5">{p.title}</div>
            <div className="text-xs text-gray-500 leading-snug">{p.desc}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-2 mb-4 max-w-xs">
          {error}
        </div>
      )}

      <button
        onClick={onRequestAccess}
        disabled={isInitializing}
        className="px-8 py-3 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/50 hover:border-accent-cyan text-accent-cyan font-mono text-sm rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isInitializing ? (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin inline-block" />
            Initializing
          </span>
        ) : (
          'Enable Camera'
        )}
      </button>

      <p className="text-xs text-gray-700 mt-4 font-mono">
        No data leaves your device · Works offline
      </p>
    </div>
  );
}
