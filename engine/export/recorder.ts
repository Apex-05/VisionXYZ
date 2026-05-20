export type RecordingFormat = 'mp4' | 'webm';

export interface RecordingOptions {
  format: RecordingFormat;
  videoBitsPerSecond?: number;
  frameRate?: number;
}

export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private onComplete: ((blob: Blob) => void) | null = null;

  startRecording(canvas: HTMLCanvasElement, options: RecordingOptions = { format: 'webm' }): void {
    if (this.isRecording) return;

    this.chunks = [];
    this.stream = canvas.captureStream(options.frameRate ?? 30);

    // Prefer mp4/h264 if supported
    const mimeType = this.selectMimeType(options.format);

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecond ?? 5_000_000,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: mimeType });
      this.onComplete?.(blob);
      this.chunks = [];
    };

    this.mediaRecorder.start(100); // 100ms chunks
    this.isRecording = true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.onComplete = resolve;
      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach((t) => t.stop());
      this.isRecording = false;
    });
  }

  get recording(): boolean {
    return this.isRecording;
  }

  private selectMimeType(format: RecordingFormat): string {
    const candidates =
      format === 'mp4'
        ? ['video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=h264', 'video/webm']
        : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }

    return 'video/webm';
  }
}
