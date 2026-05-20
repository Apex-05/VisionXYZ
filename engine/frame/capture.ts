import type { CameraConstraints, CameraDevice, CameraState, FrameData } from '@/types/camera';

export const DEFAULT_CONSTRAINTS: CameraConstraints = {
  width: 1280,
  height: 720,
  frameRate: 30,
};

export async function enumerateDevices(): Promise<CameraDevice[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === 'videoinput')
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
      kind: 'videoinput' as const,
      facing: guessFacing(d.label),
    }));
}

function guessFacing(label: string): 'user' | 'environment' | 'unknown' {
  const l = label.toLowerCase();
  if (l.includes('front') || l.includes('user') || l.includes('facetime')) return 'user';
  if (l.includes('back') || l.includes('rear') || l.includes('environment')) return 'environment';
  return 'unknown';
}

export async function initCamera(constraints: CameraConstraints): Promise<MediaStream> {
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: constraints.width },
    height: { ideal: constraints.height },
    frameRate: { ideal: constraints.frameRate },
  };

  if (constraints.deviceId) {
    videoConstraints.deviceId = { exact: constraints.deviceId };
  } else if (constraints.facingMode) {
    videoConstraints.facingMode = constraints.facingMode;
  }

  return navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
}

export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
}

export function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
  return new Promise((resolve, reject) => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().then(resolve).catch(reject);
    };
    video.onerror = reject;
  });
}

export function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): FrameData | null {
  if (video.readyState < 2) return null;

  const w = video.videoWidth;
  const h = video.videoHeight;

  if (w === 0 || h === 0) return null;

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);

  return {
    imageData,
    timestamp: performance.now(),
    width: w,
    height: h,
  };
}

// Connect to an IP webcam / MJPEG stream URL by attaching it to a video element.
// Returns a synthetic MediaStream captured from the video element's display.
export async function initIPStream(streamURL: string): Promise<MediaStream> {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.src = streamURL;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => video.play().then(() => resolve()).catch(reject);
    video.onerror = () => reject(new Error(`Cannot load stream: ${streamURL}`));
    setTimeout(() => reject(new Error('Stream connection timeout (10s)')), 10_000);
  });

  // Capture the video element as a MediaStream
  const stream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
  if (!stream) throw new Error('captureStream() not supported in this browser');
  return stream;
}

export function getStreamInfo(stream: MediaStream): {
  width: number;
  height: number;
  frameRate: number;
  deviceLabel: string;
} {
  const track = stream.getVideoTracks()[0];
  if (!track) return { width: 0, height: 0, frameRate: 0, deviceLabel: 'Unknown' };

  const settings = track.getSettings();
  return {
    width: settings.width ?? 0,
    height: settings.height ?? 0,
    frameRate: settings.frameRate ?? 0,
    deviceLabel: track.label,
  };
}
