export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
  facing?: 'user' | 'environment' | 'unknown';
}

export interface CameraConstraints {
  deviceId?: string;
  width: number;
  height: number;
  frameRate: number;
  facingMode?: 'user' | 'environment';
}

export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  isInitializing: boolean;
  error: string | null;
  devices: CameraDevice[];
  activeDeviceId: string | null;
  constraints: CameraConstraints;
}

export interface FrameData {
  imageData: ImageData;
  timestamp: number;
  width: number;
  height: number;
}

export interface CaptureMetrics {
  fps: number;
  frameCount: number;
  droppedFrames: number;
  avgProcessingTime: number;
  latency: number;
}
