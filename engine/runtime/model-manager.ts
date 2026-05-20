import type { ModelInfo, RuntimeBackend } from '@/types/engine';

export interface ModelEntry {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
}

const MODEL_REGISTRY: ModelEntry[] = [
  {
    id: 'yolov8n',
    name: 'YOLOv8 Nano',
    url: '/models/yolov8n.onnx',
    sizeBytes: 6_400_000,
  },
  {
    id: 'selfie-segmentation',
    name: 'MediaPipe Selfie',
    url: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
    sizeBytes: 1_000_000,
  },
  {
    id: 'anime-gan',
    name: 'AnimeGAN v2',
    url: '/models/animegan_v2.onnx',
    sizeBytes: 8_000_000,
  },
];

class ModelManager {
  private loadedModels = new Map<string, ArrayBuffer>();
  private downloadProgress = new Map<string, number>();
  private listeners = new Map<string, Array<(progress: number) => void>>();

  getRegistry(): ModelEntry[] {
    return [...MODEL_REGISTRY];
  }

  onProgress(modelId: string, cb: (progress: number) => void): () => void {
    if (!this.listeners.has(modelId)) this.listeners.set(modelId, []);
    this.listeners.get(modelId)!.push(cb);
    return () => {
      const arr = this.listeners.get(modelId);
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  private emit(modelId: string, progress: number): void {
    this.downloadProgress.set(modelId, progress);
    this.listeners.get(modelId)?.forEach((cb) => cb(progress));
  }

  isLoaded(modelId: string): boolean {
    return this.loadedModels.has(modelId);
  }

  getProgress(modelId: string): number {
    return this.downloadProgress.get(modelId) ?? 0;
  }

  async load(modelId: string): Promise<ArrayBuffer | null> {
    if (this.loadedModels.has(modelId)) return this.loadedModels.get(modelId)!;

    // Check IndexedDB cache first
    const cached = await this.loadFromCache(modelId);
    if (cached) {
      this.loadedModels.set(modelId, cached);
      this.emit(modelId, 1);
      return cached;
    }

    const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
    if (!entry) {
      console.warn(`[ModelManager] Unknown model: ${modelId}`);
      return null;
    }

    try {
      const buffer = await this.downloadWithProgress(entry);
      this.loadedModels.set(modelId, buffer);
      await this.saveToCache(modelId, buffer);
      return buffer;
    } catch (e) {
      console.warn(`[ModelManager] Failed to load ${modelId}:`, e);
      return null;
    }
  }

  private async downloadWithProgress(entry: ModelEntry): Promise<ArrayBuffer> {
    const response = await fetch(entry.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = Number(response.headers.get('content-length') ?? entry.sizeBytes);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      this.emit(entry.id, received / contentLength);
    }

    const buffer = new ArrayBuffer(received);
    const view = new Uint8Array(buffer);
    let offset = 0;
    for (const chunk of chunks) {
      view.set(chunk, offset);
      offset += chunk.length;
    }

    return buffer;
  }

  private async loadFromCache(modelId: string): Promise<ArrayBuffer | null> {
    try {
      const db = await openModelDB();
      return new Promise((resolve) => {
        const tx = db.transaction('models', 'readonly');
        const req = tx.objectStore('models').get(modelId);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async saveToCache(modelId: string, buffer: ArrayBuffer): Promise<void> {
    try {
      const db = await openModelDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('models', 'readwrite');
        tx.objectStore('models').put(buffer, modelId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[ModelManager] Cache save failed:', e);
    }
  }

  async clearCache(modelId?: string): Promise<void> {
    try {
      const db = await openModelDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('models', 'readwrite');
        const store = tx.objectStore('models');
        const req = modelId ? store.delete(modelId) : store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      if (modelId) this.loadedModels.delete(modelId);
      else this.loadedModels.clear();
    } catch (e) {
      console.warn('[ModelManager] Cache clear failed:', e);
    }
  }

  async getModelInfo(): Promise<ModelInfo[]> {
    return MODEL_REGISTRY.map((entry) => ({
      id: entry.id,
      name: entry.name,
      url: entry.url,
      sizeBytes: entry.sizeBytes,
      cached: this.loadedModels.has(entry.id),
      backend: 'wasm' as RuntimeBackend,
    }));
  }
}

function openModelDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('visionxyz-models', 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const modelManager = new ModelManager();
