'use client';

import { useStatsStore } from '@/store/stats-store';
import { useModeStore } from '@/store/mode-store';
import { useCameraStore } from '@/store/camera-store';

export function StatsPanel() {
  const stats = useStatsStore();
  const mode = useModeStore();
  const camera = useCameraStore();
  const { renderMetrics } = stats;

  const fpsColor =
    renderMetrics.fps >= 25
      ? 'text-status-active'
      : renderMetrics.fps >= 15
      ? 'text-status-warning'
      : 'text-status-error';

  return (
    <aside className="hidden md:flex w-44 flex-shrink-0 flex-col h-full bg-surface-200 border-l border-gray-800 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">Metrics</span>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* FPS */}
        <Metric
          label="FPS"
          value={renderMetrics.fps.toString()}
          unit=""
          valueClass={fpsColor}
          bar
          barValue={renderMetrics.fps / 60}
          barColor="#00ff88"
        />

        {/* Latency */}
        <Metric
          label="Latency"
          value={renderMetrics.latencyMs.toFixed(1)}
          unit="ms"
          valueClass="text-accent-cyan"
        />

        {/* Processing Time */}
        <Metric
          label="Process"
          value={mode.processingTime.toFixed(1)}
          unit="ms"
          valueClass="text-accent-cyan"
        />

        {/* Resolution */}
        <Metric
          label="Resolution"
          value={camera.constraints.width > 0 ? `${camera.constraints.width}×${camera.constraints.height}` : '—'}
          unit=""
          valueClass="text-gray-300"
          small
        />

        {/* Memory */}
        <Metric
          label="Memory"
          value={renderMetrics.memoryUsageMB.toString()}
          unit="MB"
          valueClass="text-gray-300"
          bar
          barValue={Math.min(1, renderMetrics.memoryUsageMB / 500)}
          barColor="#f59e0b"
        />

        {/* Backend */}
        <div className="border-t border-gray-800 pt-3">
          <div className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-1">Runtime</div>
          <div className="text-xs text-accent-cyan font-mono">
            {stats.isGPUAvailable ? 'WebGPU' : 'WASM CPU'}
          </div>
        </div>

        {/* Active mode */}
        <div>
          <div className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-1">Mode</div>
          <div className="text-xs text-white font-mono capitalize truncate">
            {mode.activeMode}
          </div>
        </div>

        {/* Total frames */}
        <div>
          <div className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-1">Frames</div>
          <div className="text-xs text-gray-400 font-mono">
            {renderMetrics.totalFrames.toLocaleString()}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface MetricProps {
  label: string;
  value: string;
  unit: string;
  valueClass?: string;
  bar?: boolean;
  barValue?: number;
  barColor?: string;
  small?: boolean;
}

function Metric({ label, value, unit, valueClass = 'text-white', bar, barValue = 0, barColor = '#00d4ff', small }: MetricProps) {
  return (
    <div>
      <div className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`font-mono font-bold ${small ? 'text-xs' : 'text-lg'} ${valueClass}`}>
        {value}<span className="text-gray-500 text-xs ml-0.5 font-normal">{unit}</span>
      </div>
      {bar && (
        <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, barValue * 100)}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
}
