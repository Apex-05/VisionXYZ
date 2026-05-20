import type { FrameData } from '@/types/camera';

type FrameConsumer = (frame: FrameData) => void | Promise<void>;

// Priority frame queue — always delivers the most recent frame to consumers
export class FrameQueue {
  private consumers: Set<FrameConsumer> = new Set();
  private latestFrame: FrameData | null = null;
  private isDispatching = false;

  push(frame: FrameData): void {
    this.latestFrame = frame;
    if (!this.isDispatching) {
      this.dispatch();
    }
  }

  private async dispatch(): Promise<void> {
    if (!this.latestFrame || this.consumers.size === 0) return;

    this.isDispatching = true;
    const frame = this.latestFrame;
    this.latestFrame = null;

    for (const consumer of this.consumers) {
      try {
        await consumer(frame);
      } catch (e) {
        console.warn('[FrameQueue] Consumer error:', e);
      }
    }

    this.isDispatching = false;

    // If a new frame arrived while dispatching, process it
    if (this.latestFrame) {
      this.dispatch();
    }
  }

  subscribe(consumer: FrameConsumer): () => void {
    this.consumers.add(consumer);
    return () => this.consumers.delete(consumer);
  }

  clear(): void {
    this.latestFrame = null;
    this.consumers.clear();
  }
}
