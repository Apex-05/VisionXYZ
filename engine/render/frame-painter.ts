// Utility painters — overlays, HUD elements, detection boxes, etc.

export function paintDetectionBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  confidence: number,
  color = '#00ff88',
  trackId?: number
): void {
  ctx.save();

  // Box
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // Corner accents
  const cs = 12;
  ctx.lineWidth = 3;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x, y + cs);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cs, y);
  // Top-right
  ctx.moveTo(x + w - cs, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + cs);
  // Bottom-left
  ctx.moveTo(x, y + h - cs);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + cs, y + h);
  // Bottom-right
  ctx.moveTo(x + w - cs, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - cs);
  ctx.stroke();

  // Label background
  const text = trackId !== undefined ? `#${trackId} ${label} ${(confidence * 100).toFixed(0)}%` : `${label} ${(confidence * 100).toFixed(0)}%`;
  ctx.font = 'bold 12px monospace';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = `${color}cc`;
  ctx.fillRect(x - 1, y - 20, tw + 8, 18);

  ctx.fillStyle = '#000';
  ctx.fillText(text, x + 3, y - 6);

  ctx.restore();
}

export function paintTrail(
  ctx: CanvasRenderingContext2D,
  trail: Array<{ x: number; y: number; t: number }>,
  color = '#00d4ff'
): void {
  if (trail.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 1; i < trail.length; i++) {
    const alpha = i / trail.length;
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = alpha * 3;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }

  ctx.restore();
}

export function paintFpsCounter(
  ctx: CanvasRenderingContext2D,
  fps: number,
  latency: number,
  x = 10,
  y = 20
): void {
  ctx.save();

  const color = fps >= 25 ? '#00ff88' : fps >= 15 ? '#f59e0b' : '#ef4444';

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - 4, y - 14, 160, 42);

  ctx.fillStyle = color;
  ctx.fillText(`FPS: ${fps}`, x, y);

  ctx.fillStyle = '#00d4ff';
  ctx.fillText(`LAT: ${latency.toFixed(1)}ms`, x, y + 18);

  ctx.restore();
}

export function paintScanLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number // 0..1
): void {
  ctx.save();
  const y = progress * height;
  const grad = ctx.createLinearGradient(0, y - 4, 0, y + 4);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, 'rgba(0, 212, 255, 0.15)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 4, width, 8);
  ctx.restore();
}

export function paintVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.5
): void {
  ctx.save();
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function paintGestureIndicator(
  ctx: CanvasRenderingContext2D,
  gesture: string,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 4, y - 20, ctx.measureText(gesture).width + 16, 28);
  ctx.fillStyle = '#00ff88';
  ctx.fillText(gesture, x + 4, y - 2);
  ctx.restore();
}
