export type SnapshotFormat = 'png' | 'jpeg' | 'webp';

export async function takeSnapshot(
  canvas: HTMLCanvasElement,
  format: SnapshotFormat = 'png',
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = `image/${format}`;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function generateFilename(ext: string, prefix = 'visionxyz'): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${ts}.${ext}`;
}
