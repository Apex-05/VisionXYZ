import type { Hand, GestureType, Keypoint } from '@/types/vision';

export class GestureEngine {
  private initialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handLandmarker: any = null;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      this.initialized = true;
    } catch (e) {
      console.warn('[GestureEngine] MediaPipe HandLandmarker failed:', e);
      this.initialized = true; // Mark initialized with null landmarker (graceful degradation)
    }
  }

  async detect(imageData: ImageData, timestamp: number): Promise<Hand[]> {
    if (!this.initialized) await this.init();
    if (!this.handLandmarker) return [];

    const bitmap = await createImageBitmap(imageData);
    const result = this.handLandmarker.detectForVideo(bitmap, timestamp);
    bitmap.close();

    const hands: Hand[] = [];

    for (let i = 0; i < (result.landmarks?.length ?? 0); i++) {
      const landmarks: Keypoint[] = result.landmarks[i].map(
        (lm: { x: number; y: number; z: number }) => ({
          x: lm.x * imageData.width,
          y: lm.y * imageData.height,
          z: lm.z,
          confidence: 1,
        })
      );

      const gesture = classifyGesture(landmarks);
      const handedness = result.handedness?.[i]?.[0]?.displayName?.toLowerCase() ?? 'unknown';

      hands.push({
        landmarks,
        gesture,
        handedness: handedness === 'right' ? 'right' : 'left',
        confidence: result.handedness?.[i]?.[0]?.score ?? 1,
      });
    }

    return hands;
  }

  destroy(): void {
    this.handLandmarker?.close();
    this.handLandmarker = null;
    this.initialized = false;
  }
}

// MediaPipe hand landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8, INDEX_MCP = 5;
const MIDDLE_TIP = 12, MIDDLE_MCP = 9;
const RING_TIP = 16, RING_MCP = 13;
const PINKY_TIP = 20, PINKY_MCP = 17;

function isFingerUp(landmarks: Keypoint[], tip: number, mcp: number): boolean {
  return landmarks[tip].y < landmarks[mcp].y;
}

function classifyGesture(landmarks: Keypoint[]): GestureType {
  if (landmarks.length < 21) return 'unknown';

  const thumbUp = landmarks[THUMB_TIP].x > landmarks[THUMB_TIP - 1].x;
  const indexUp = isFingerUp(landmarks, INDEX_TIP, INDEX_MCP);
  const middleUp = isFingerUp(landmarks, MIDDLE_TIP, MIDDLE_MCP);
  const ringUp = isFingerUp(landmarks, RING_TIP, RING_MCP);
  const pinkyUp = isFingerUp(landmarks, PINKY_TIP, PINKY_MCP);

  const allUp = indexUp && middleUp && ringUp && pinkyUp;
  const allDown = !indexUp && !middleUp && !ringUp && !pinkyUp;

  if (allUp && thumbUp) return 'palm';
  if (allDown && !thumbUp) return 'fist';
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'peace';
  if (thumbUp && allDown) return 'thumb-up';
  if (!thumbUp && allDown) return 'thumb-down';
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'point';

  return 'unknown';
}
