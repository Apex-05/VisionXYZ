export type ModeCategory = 'none' | 'photography' | 'creative' | 'vision';

export type PhotographyMode = 'night' | 'night-plus' | 'extreme-night' | 'moon' | 'portrait' | 'landscape' | 'scene-auto';

export type CreativeMode =
  | 'anime'
  | 'sketch'
  | 'thermal'
  | 'cyberpunk'
  | 'vintage'
  | 'noir'
  | 'watercolor'
  | 'comic'
  | 'heatmap'
  | 'infrared'
  | 'edge-vision'
  | 'hud'
  | 'cartoon'
  | 'vhs'
  | 'crt'
  | 'pixel-art'
  | 'matrix'
  | 'hologram'
  | 'glitch';

export type VisionMode = 'detection' | 'tracking' | 'gesture' | 'detection+tracking';

export type ActiveMode = PhotographyMode | CreativeMode | VisionMode | 'passthrough';

export interface ModeConfig {
  id: ActiveMode;
  label: string;
  category: ModeCategory;
  icon?: string;
  description: string;
  requiresModel: boolean;
  modelId?: string;
  realtime: boolean;
}

export interface ModeState {
  active: ActiveMode;
  isProcessing: boolean;
  processingTime: number;
}

export const PHOTOGRAPHY_MODES: ModeConfig[] = [
  { id: 'night-plus', label: 'Night+', category: 'photography', description: 'Enhanced night mode with CLAHE', requiresModel: false, realtime: true },
  { id: 'extreme-night', label: 'Extreme Night', category: 'photography', description: 'Maximum night enhancement', requiresModel: false, realtime: true },
  { id: 'moon', label: 'Moon Vision', category: 'photography', description: 'Ultra-low light amplification', requiresModel: false, realtime: true },
  { id: 'portrait', label: 'Portrait', category: 'photography', description: 'Background blur + subject enhancement', requiresModel: true, modelId: 'selfie-segmentation', realtime: true },
  { id: 'landscape', label: 'Landscape', category: 'photography', description: 'HDR-like enhancement for outdoors', requiresModel: false, realtime: true },
  { id: 'scene-auto', label: 'Scene Auto', category: 'photography', description: 'Auto scene detection + adaptation', requiresModel: true, modelId: 'scene-classifier', realtime: false },
];

export const CREATIVE_MODES: ModeConfig[] = [
  { id: 'anime', label: 'Anime', category: 'creative', description: 'Anime / cartoon stylization', requiresModel: true, modelId: 'anime-gan', realtime: false },
  { id: 'sketch', label: 'Sketch', category: 'creative', description: 'Pencil sketch effect', requiresModel: false, realtime: true },
  { id: 'thermal', label: 'Thermal', category: 'creative', description: 'Thermal camera simulation', requiresModel: false, realtime: true },
  { id: 'cyberpunk', label: 'Cyberpunk', category: 'creative', description: 'Neon cyberpunk aesthetic', requiresModel: false, realtime: true },
  { id: 'vintage', label: 'Vintage', category: 'creative', description: 'Film vintage look', requiresModel: false, realtime: true },
  { id: 'noir', label: 'Noir', category: 'creative', description: 'Black & white noir film', requiresModel: false, realtime: true },
  { id: 'watercolor', label: 'Watercolor', category: 'creative', description: 'Watercolor painting effect', requiresModel: false, realtime: true },
  { id: 'comic', label: 'Comic', category: 'creative', description: 'Comic book style', requiresModel: false, realtime: true },
  { id: 'heatmap', label: 'Heatmap', category: 'creative', description: 'Intensity heatmap visualization', requiresModel: false, realtime: true },
  { id: 'infrared', label: 'Infrared', category: 'creative', description: 'False color infrared style', requiresModel: false, realtime: true },
  { id: 'edge-vision', label: 'Edge Vision', category: 'creative', description: 'Edge detection overlay', requiresModel: false, realtime: true },
  { id: 'hud', label: 'HUD', category: 'creative', description: 'Sci-fi HUD overlay', requiresModel: false, realtime: true },
  { id: 'vhs', label: 'VHS', category: 'creative', description: 'VHS tape distortion effect', requiresModel: false, realtime: true },
  { id: 'crt', label: 'CRT', category: 'creative', description: 'CRT monitor phosphor effect', requiresModel: false, realtime: true },
  { id: 'pixel-art', label: 'Pixel Art', category: 'creative', description: 'Pixel art downsampling', requiresModel: false, realtime: true },
  { id: 'matrix', label: 'Matrix', category: 'creative', description: 'Green matrix digital rain', requiresModel: false, realtime: true },
  { id: 'hologram', label: 'Hologram', category: 'creative', description: 'Cyan holographic projection', requiresModel: false, realtime: true },
  { id: 'glitch', label: 'Glitch', category: 'creative', description: 'Digital glitch artifacts', requiresModel: false, realtime: true },
];

export const VISION_MODES: ModeConfig[] = [
  { id: 'detection', label: 'Detection', category: 'vision', description: 'Object detection with YOLO', requiresModel: true, modelId: 'yolo', realtime: true },
  { id: 'tracking', label: 'Tracking', category: 'vision', description: 'Multi-object tracking', requiresModel: true, modelId: 'yolo', realtime: true },
  { id: 'gesture', label: 'Gesture', category: 'vision', description: 'Hand gesture recognition', requiresModel: true, modelId: 'mediapipe-hands', realtime: true },
  { id: 'detection+tracking', label: 'Det + Track', category: 'vision', description: 'Detection with persistent IDs', requiresModel: true, modelId: 'yolo', realtime: true },
];
