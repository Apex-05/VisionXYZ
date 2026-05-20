import { BaseCreativeMode } from '../base-mode';
import type { FrameData } from '@/types/camera';
import type { ProcessorResult } from '@/types/engine';

export class HUDMode extends BaseCreativeMode {
  readonly id = 'hud';
  readonly label = 'HUD';
  private frameCount = 0;
  private offscreen: OffscreenCanvas | null = null;
  private offCtx: OffscreenCanvasRenderingContext2D | null = null;

  process(frame: FrameData): ProcessorResult {
    const t0 = performance.now();
    const { imageData, width, height } = frame;
    this.frameCount++;

    // Ensure offscreen canvas
    if (!this.offscreen || this.offscreen.width !== width || this.offscreen.height !== height) {
      this.offscreen = new OffscreenCanvas(width, height);
      this.offCtx = this.offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
    }

    const ctx = this.offCtx!;

    // Draw base frame
    ctx.putImageData(imageData, 0, 0);

    // Scanlines overlay
    ctx.fillStyle = 'rgba(0, 255, 136, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    // Corner brackets
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
    ctx.lineWidth = 2;
    const bs = 30; // bracket size
    this.drawCornerBracket(ctx, 20, 20, bs, 1, 1);
    this.drawCornerBracket(ctx, width - 20, 20, bs, -1, 1);
    this.drawCornerBracket(ctx, 20, height - 20, bs, 1, -1);
    this.drawCornerBracket(ctx, width - 20, height - 20, bs, -1, -1);

    // Center reticle
    const cx = width / 2, cy = height / 2;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy); ctx.lineTo(cx - 22, cy);
    ctx.moveTo(cx + 22, cy); ctx.lineTo(cx + 28, cy);
    ctx.moveTo(cx, cy - 28); ctx.lineTo(cx, cy - 22);
    ctx.moveTo(cx, cy + 22); ctx.lineTo(cx, cy + 28);
    ctx.stroke();

    // Data readouts top-left
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(0, 212, 255, 0.9)';
    const ts = new Date().toISOString().slice(11, 19);
    ctx.fillText(`TIME: ${ts}`, 20, height - 50);
    ctx.fillText(`FRAME: ${this.frameCount.toString().padStart(6, '0')}`, 20, height - 36);
    ctx.fillText(`RES: ${width}x${height}`, 20, height - 22);

    // Top-right status
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.9)';
    ctx.fillText('● LIVE', width - 20, 35);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.fillText('SYS: OK', width - 20, 50);
    ctx.fillText('AI: ACTIVE', width - 20, 65);
    ctx.textAlign = 'left';

    // Horizontal HUD line top
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 18); ctx.lineTo(width - 80, 18);
    ctx.stroke();

    // Pulsing scan line
    const scanY = ((this.frameCount * 2) % height);
    const grad = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, 'rgba(0, 212, 255, 0.12)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 3, width, 6);

    const result = ctx.getImageData(0, 0, width, height);

    return {
      imageData: result,
      processingTime: performance.now() - t0,
    };
  }

  private drawCornerBracket(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    sx: number,
    sy: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + sx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * size);
    ctx.stroke();
  }

  destroy(): void {
    this.offscreen = null;
    this.offCtx = null;
  }
}
