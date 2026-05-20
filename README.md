# VisionXYZ

**Privacy-first edge AI computational photography platform — by Apex-05**

> A learning project. Everything runs on your device. No cloud. No uploads. No backend.

---

## About

VisionXYZ is a semester-break learning project exploring what is possible when you combine real-time computer vision, computational photography, and in-browser AI inference — all without sending a single frame to a server.

**This is explicitly a learning project.** Some functionalities may be unstable, break on certain browsers/devices, or produce unexpected results. Contributions, fixes, and ideas are very welcome.

---

## What Works

### Photography Modes
| Mode | What it does |
|---|---|
| Night+ | CLAHE + gamma lift + chroma denoise + sharpen |
| Extreme Night | Maximum brightness recovery for near-dark scenes |
| Moon Vision | Ultra-low light amplification |
| Portrait | Background blur via MediaPipe selfie segmentation |
| Landscape | Filmic tone mapping + vibrance + foliage and sky boost |
| Scene Auto | Auto-detects scene type (food, landscape, night, document, indoor) and adapts |

### Creative Modes
| Mode | Technique |
|---|---|
| Thermal | JET colormap (cold→warm) |
| Sketch | Invert + Gaussian + colour-dodge blend |
| Cyberpunk | Cyan/magenta shift + chromatic aberration + scanlines |
| Vintage | Sepia + grain + vignette |
| Noir | B&W + S-curve contrast + grain + hard vignette |
| Watercolor | Bilateral smooth + colour boost + paper texture |
| Comic | Posterize + Sobel edge lines |
| Heatmap | 6-stop intensity colormap |
| Infrared | False-colour NIR channel simulation |
| Edge Vision | Sobel edge detection on dark background |
| HUD | Sci-fi overlay with reticle, scanlines, data readouts |
| Anime | Bilateral smooth + colour quantize + edge lines |
| VHS | Scan-line flicker + colour bleed |
| CRT | Phosphor-dot grid + curvature simulation |
| Pixel Art | Mosaic downsampling |
| Matrix | Green digital rain with falling characters |
| Hologram | Cyan projection with scan lines and flicker |
| Glitch | Horizontal slice displacement + channel offset |

### Vision AI
| Mode | Model | Notes |
|---|---|---|
| Detection | MediaPipe EfficientDet-Lite0 | 90 COCO classes, loads from CDN |
| Tracking | EfficientDet + ByteTracker | Persistent IDs with motion trails |
| Gesture | MediaPipe HandLandmarker | 21 landmarks, 6 gesture classes |
| Det + Track | EfficientDet + ByteTracker | Combined pipeline |

Gesture vocabulary: Palm, Fist, Peace, Thumb Up, Thumb Down, Point.

### Infrastructure
- **Split screen** — drag handle to compare original vs processed
- **Mobile camera** — connect phone via local network URL (QR code) or IP webcam stream
- **Favorites & recents** — sidebar persists preferences to localStorage
- **PWA** — installable, works offline after first load
- **Recording** — MediaRecorder captures processed canvas to WebM/MP4
- **Snapshots** — PNG/JPEG export of current processed frame
- **Stats panel** — live FPS, latency, memory, active mode

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The camera permission prompt appears immediately.

The `postinstall` script copies ONNX Runtime WASM files to `public/ort-wasm/` automatically. No model files are required — Vision AI loads models from CDN at runtime.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14, React 18, TypeScript |
| Styling | TailwindCSS |
| State | Zustand |
| AI Runtime | ONNX Runtime Web (WebGPU → WASM fallback) |
| Computer Vision | MediaPipe Tasks Vision |
| Rendering | Canvas 2D API, OffscreenCanvas |
| Storage | IndexedDB (model cache), localStorage (preferences) |
| Export | MediaRecorder, Canvas.toBlob |
| PWA | Service Worker, Web App Manifest |
| Deploy | Vercel |

---

## Architecture

```
Camera (getUserMedia / IP stream / phone browser)
        ↓
Frame Capture — circular buffer, scheduler, queue
        ↓
Mode Processor
   ├── Photography (CPU pixel ops — night / portrait / landscape / scene)
   ├── Creative    (CPU canvas effects — 18 modes)
   └── Vision AI   (MediaPipe CDN inference — detection / tracking / gesture)
        ↓
Canvas Renderer — split view, vision overlay, FPS counter
        ↓
Export — MediaRecorder / toBlob
```

---

## Project Structure

```
engine/
  frame/        camera capture, circular buffer, scheduler, queue
  render/       canvas renderer, metrics collector
  photo/        night, portrait, scene, landscape engines
  creative/     18 creative effect modes
  vision/       detect (MediaPipe EfficientDet), track (ByteTracker), gesture (HandLandmarker)
  export/       MediaRecorder, snapshot

components/
  Dashboard/    main application shell
  Camera/       permission screen, preview, selector, mobile connect modal
  Sidebar/      collapsible left nav with search and favorites
  Stats/        right metrics panel
  Controls/     bottom bar — capture, record, split slider

hooks/          useCamera, useMode, useVision, useRenderLoop, useExport, usePreferences
store/          Zustand — camera-store, mode-store, stats-store
app/            Next.js app router, layout, PWA service worker
public/         manifest.json, sw.js, icons, ONNX WASM binaries
```

---

## Deployment

Push to GitHub, import on [vercel.com/new](https://vercel.com/new). No environment variables needed. The build is entirely static/client-side.

```bash
git init
git add .
git commit -m "Initial commit"
# push to GitHub, then import on Vercel
```

---

## Known Limitations

- **Portrait mode** may be slow on lower-end devices (MediaPipe segmentation cost)
- **Vision AI** requires an internet connection on first load to download CDN models (~10–30 MB cached afterwards)
- **Night modes** are CPU-only; performance drops on very large camera resolutions
- **IP webcam** connection depends on browser support for `captureStream()` — not available on Firefox
- **Gesture recognition** accuracy is basic; complex gestures are not supported
- Some creative modes may appear differently across browsers due to Canvas 2D implementation variance

---

## Roadmap

- [ ] WebGPU compute shaders for real-time style transfer
- [ ] RAW pipeline — HDR merge, multi-exposure, tone mapping
- [ ] AnimeGAN ONNX integration
- [ ] Local LLM natural language mode switching
- [ ] AR face mesh + virtual overlays
- [ ] Multi-camera fusion (phone + webcam)

---

## Contributing

This project welcomes collaborations of all kinds — bug fixes, new modes, performance improvements, documentation, or ideas.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Make your changes and open a pull request

If something is broken or behaving unexpectedly, please open an issue. Given this is a learning project, expect rough edges and please be patient.

---

## Privacy

- Zero backend inference
- Zero image uploads
- Zero telemetry
- Camera frames never leave the browser
- Models downloaded once, cached locally
- Works fully offline after first load

---

*VisionXYZ — semester break project by Apex-05. Built to learn, not to ship.*
