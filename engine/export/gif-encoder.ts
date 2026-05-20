export interface GifFrame {
  imageData: ImageData;
  delay: number; // ms
}

export class GifEncoder {
  private frames: GifFrame[] = [];
  private maxFrames: number;
  private quality: number;

  constructor(maxFrames = 60, quality = 10) {
    this.maxFrames = maxFrames;
    this.quality = quality;
  }

  addFrame(imageData: ImageData, delay = 100): void {
    if (this.frames.length >= this.maxFrames) {
      this.frames.shift();
    }
    this.frames.push({ imageData, delay });
  }

  async encode(): Promise<Blob> {
    // Attempt to use gif.js dynamically if installed
    try {
      // @ts-expect-error gif.js is optional dependency
      const GIF = (await import('gif.js')).default;
      return await this.encodeWithGifJs(GIF);
    } catch {
      return this.encodeFallback();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async encodeWithGifJs(GIF: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const gif = new GIF({ quality: this.quality, workers: 2 });

      for (const frame of this.frames) {
        const canvas = document.createElement('canvas');
        canvas.width = frame.imageData.width;
        canvas.height = frame.imageData.height;
        canvas.getContext('2d')!.putImageData(frame.imageData, 0, 0);
        gif.addFrame(canvas, { delay: frame.delay });
      }

      gif.on('finished', (blob: Blob) => resolve(blob));
      gif.on('error', reject);
      gif.render();
    });
  }

  private encodeFallback(): Blob {
    if (this.frames.length === 0) return new Blob([], { type: 'image/png' });
    const canvas = document.createElement('canvas');
    const f = this.frames[0];
    canvas.width = f.imageData.width;
    canvas.height = f.imageData.height;
    canvas.getContext('2d')!.putImageData(f.imageData, 0, 0);
    // Synchronous canvas.toBlob is not available; return PNG data URL as blob
    const dataUrl = canvas.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
  }

  clear(): void {
    this.frames = [];
  }

  get frameCount(): number {
    return this.frames.length;
  }
}
