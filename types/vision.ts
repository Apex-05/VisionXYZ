export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classId: number;
  label: string;
  trackId?: number;
}

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  confidence: number;
  name?: string;
}

export interface Hand {
  landmarks: Keypoint[];
  gesture: GestureType | null;
  handedness: 'left' | 'right';
  confidence: number;
}

export type GestureType = 'palm' | 'peace' | 'thumb-up' | 'thumb-down' | 'fist' | 'point' | 'ok' | 'unknown';

export interface GestureAction {
  gesture: GestureType;
  action: string;
  description: string;
}

export interface Track {
  id: number;
  bbox: BoundingBox;
  trail: Array<{ x: number; y: number; t: number }>;
  age: number;
  isActive: boolean;
}

export interface DetectionResult {
  boxes: BoundingBox[];
  processingTime: number;
  modelName: string;
}

export const GESTURE_ACTIONS: GestureAction[] = [
  { gesture: 'palm', action: 'open-menu', description: 'Open mode menu' },
  { gesture: 'peace', action: 'switch-mode', description: 'Cycle to next mode' },
  { gesture: 'thumb-up', action: 'capture', description: 'Capture snapshot' },
  { gesture: 'thumb-down', action: 'toggle-record', description: 'Start/stop recording' },
  { gesture: 'fist', action: 'reset', description: 'Reset to passthrough' },
];

export const COCO_LABELS = [
  'person','bicycle','car','motorbike','aeroplane','bus','train','truck','boat',
  'traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat',
  'dog','horse','sheep','cow','elephant','bear','zebra','giraffe','backpack',
  'umbrella','handbag','tie','suitcase','frisbee','skis','snowboard','sports ball',
  'kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket',
  'bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple',
  'sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair',
  'sofa','pottedplant','bed','diningtable','toilet','tvmonitor','laptop','mouse',
  'remote','keyboard','cell phone','microwave','oven','toaster','sink','refrigerator',
  'book','clock','vase','scissors','teddy bear','hair drier','toothbrush',
];
