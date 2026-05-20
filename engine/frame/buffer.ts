import type { FrameData } from '@/types/camera';

// Circular buffer — newest frame overwrites oldest when full
export class FrameBuffer {
  private buffer: (FrameData | null)[];
  private writeIndex = 0;
  private readIndex = 0;
  private count = 0;
  readonly capacity: number;

  constructor(capacity = 4) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  push(frame: FrameData): void {
    this.buffer[this.writeIndex] = frame;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      // Overwrite oldest — advance read pointer
      this.readIndex = (this.readIndex + 1) % this.capacity;
    }
  }

  pop(): FrameData | null {
    if (this.count === 0) return null;

    const frame = this.buffer[this.readIndex];
    this.buffer[this.readIndex] = null;
    this.readIndex = (this.readIndex + 1) % this.capacity;
    this.count--;
    return frame;
  }

  // Get latest frame without consuming it
  peek(): FrameData | null {
    if (this.count === 0) return null;
    const latestIndex = (this.writeIndex - 1 + this.capacity) % this.capacity;
    return this.buffer[latestIndex];
  }

  get size(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  clear(): void {
    this.buffer.fill(null);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.count = 0;
  }
}
