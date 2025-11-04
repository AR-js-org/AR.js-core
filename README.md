# AR.js-core

An attempt to convert the Ar.js threex library into an agnostic library that can be used with any 3D library.

## New: ECS Architecture

AR.js Core now includes a modern Entity-Component-System (ECS) architecture with a plugin system! This provides:

- Modular design with a clean plugin system
- Data-oriented ECS for efficient processing
- Event-driven architecture with pub/sub messaging
- Backward compatible with existing Source and Profile APIs

### Quick Start with ECS

```javascript
import { Engine, CaptureSystem, SOURCE_TYPES } from 'ar.js-core';
import { webcamPlugin } from './plugins/source/webcam.js';
import { defaultProfilePlugin } from './plugins/profile/default-policy.js';

// Create engine and register plugins
const engine = new Engine();
engine.pluginManager.register(webcamPlugin.id, webcamPlugin);
engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);

// Enable profile plugin (computes capability-based profile)
await engine.pluginManager.enable(defaultProfilePlugin.id, engine.getContext());

// Initialize webcam capture
await CaptureSystem.initialize(
  {
    sourceType: SOURCE_TYPES.WEBCAM,
    sourceWidth: 640,
    sourceHeight: 480,
  },
  engine.getContext(),
);

// Start the engine
engine.start();
```

## Frame Pump + Video Viewport: streaming frames to detection plugins

Detection plugins (e.g., ArtoolkitPlugin) expect frames to arrive as `ImageBitmap` via `engine:update`. The webcam source plugin provides a playing `<video>` but does not emit frames or show it on screen. Use a small frame pump and attach the video to a visible container.

### Basic integration

```js
import { CaptureSystem } from './src/systems/capture-system.js';
import { SOURCE_TYPES } from './src/core/components.js';
import { FramePumpSystem } from './src/systems/frame-pump-system.js';

// 1) Initialize capture (provides a playing <video>)
await CaptureSystem.initialize(
  { sourceType: SOURCE_TYPES.WEBCAM, sourceWidth: 640, sourceHeight: 480 },
  ctx,
);

// 2) Show the live video
const frameSource = CaptureSystem.getFrameSource(ctx);
const videoEl = frameSource.element;
const viewport = document.getElementById('viewport');
viewport.innerHTML = '';
viewport.appendChild(videoEl);
// Override offscreen styles if needed
Object.assign(videoEl.style, {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  height: 'auto',
  display: 'block',
});

// 3) Start pumping frames to detection plugins
FramePumpSystem.start(ctx);

// 4) When done
FramePumpSystem.stop(ctx);
```

#### Why separate from the webcam plugin?

- The webcam plugin is responsible for media capture and a playable `<video>`
- Pumping frames and UI display are reusable concerns that multiple detection plugins can share

#### Browser API and linting

- Guard browser globals: `globalThis.createImageBitmap`, `globalThis.OffscreenCanvas`
- Cancel rVFC via `video.cancelVideoFrameCallback(id)`, not a global
- Use `globalThis.requestAnimationFrame`/`globalThis.cancelAnimationFrame` with fallbacks when needed

## Features

- Core ECS: Entity-Component-System with queries and resources
- Event Bus: Lightweight pub/sub for decoupled communication
- Plugin System: Modular plugins for capture, tracking, and more
- Capture System: Unified interface for webcam, video, and image sources
- Profile Policies: Automatic device detection and performance tuning

## Build library bundle with Vite

AR.js Core can be bundled with Vite in library mode to produce importable ESM and CommonJS files.

**Commands**

```bash
npm run build:vite
```

**Outputs** (written to dist/)

- `dist/arjs-core.es.js` (ESM — used by `exports.import` / `module`)
- `dist/arjs-core.js` (CommonJS — used by `exports.require` / `main`)

**Notes**

- Webpack scripts remain for legacy/dev workflows; Vite handles the library bundles.
- Large/peer dependencies like `@ar-js-org/artoolkit5-js` are marked external and not bundled.

## Documentation

- ECS Architecture Guide (docs/ECS_ARCHITECTURE.md)
- Plugins Guide (plugins/README.md) — Plugin contract, lifecycle, events, and device profile migration (QUALITY_TIERS)
- Examples Index (examples/index.html)

## Running Examples

You can use either webpack (existing) or Vite (new) during development.

**Webpack:**

```bash
npm install
npm run dev
# or watch:
npm run dev:watch
```

**Vite:**

```bash
npm install
npm run dev:vite
# Opens the Examples index page in your browser

# Build ES module library:
npm run build:vite

# Preview build:
npm run serve:vite
```

**Examples:**

- Examples Index: examples/index.html (Vite: http://localhost:5173/examples/index.html)
- Minimal Example: examples/minimal/index.html (Vite: http://localhost:5173/examples/minimal/index.html)
- Image Source Example: examples/basic-ecs/image-example.html (Vite: http://localhost:5173/examples/basic-ecs/image-example.html)

If the camera doesn’t start automatically, click or tap once to allow autoplay. For Safari or stricter policies, consider enabling HTTPS in `vite.config.js` (see comments in the file).

## Browser API and linting

- Guard browser globals: `globalThis.createImageBitmap`, `globalThis.OffscreenCanvas`
- Cancel rVFC via `video.cancelVideoFrameCallback(id)`, not a global
- Use `globalThis.requestAnimationFrame`/`globalThis.cancelAnimationFrame` with fallbacks when needed

## Troubleshooting

Use this checklist when the example or your integration doesn’t behave as expected.

### Network checklist (open DevTools → Network)

- Worker asset 200 OK:
  - examples/vite-artoolkit/vendor/arjs-plugin-artoolkit/assets/worker-\*.js
  - If 404: copy the plugin’s dist assets next to the ESM, or import from CDN:
    ```js
    const mod = await import(
      'https://cdn.jsdelivr.net/gh/AR-js-org/arjs-plugin-artoolkit@main/dist/arjs-plugin-artoolkit.esm.js'
    );
    ```
- ARToolKit chunk 200 OK:
  - examples/vite-artoolkit/vendor/arjs-plugin-artoolkit/assets/ARToolkit-\*.js
- Camera parameters 200 OK:
  - /examples/vite-artoolkit/data/camera_para.dat
- Pattern file 200 OK:
  - /examples/vite-artoolkit/data/patt.hiro

### Worker not ready (Load Marker stays disabled)

- Ensure you register event listeners before enabling the plugin:
  ```js
  engine.eventBus.on('ar:workerReady', onReady);
  await artoolkit.init(ctx);
  await artoolkit.enable();
  ```
- Serve via HTTP/HTTPS (not file://).
- If using a local vendor ESM, ensure the ESM and its assets/ folder live together:
  ```
  vendor/arjs-plugin-artoolkit/
  ├─ arjs-plugin-artoolkit.esm.js
  └─ assets/
     ├─ worker-XXXX.js
     └─ ARToolkit-XXXX.js
  ```

### No detections (no markerFound/Updated/Lost)

- Start the frame pump after webcam capture:
  ```js
  await CaptureSystem.initialize({ sourceType: SOURCE_TYPES.WEBCAM }, ctx);
  FramePumpSystem.start(ctx); // emits engine:update with ImageBitmap
  ```
- Confirm engine:update is firing and ar:getMarker logs appear.
- If createImageBitmap is unavailable, the pump falls back to a canvas path automatically.

### Video not visible

- Attach the webcam <video> to a visible container and override offscreen styles:
  ```js
  const { element: videoEl } = CaptureSystem.getFrameSource(ctx);
  Object.assign(videoEl.style, {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: 'auto',
    display: 'block',
  });
  document.getElementById('viewport').appendChild(videoEl);
  ```

### 404s for assets (worker/ARToolKit chunks)

- If importing the plugin ESM from a local vendor path, copy the entire dist contents:
  - arjs-plugin-artoolkit.esm.js
  - assets/worker-\*.js
  - assets/ARToolKit-\*.js
- Or import the plugin from CDN to avoid local asset wiring:
  ```js
  const mod = await import(
    'https://cdn.jsdelivr.net/gh/AR-js-org/arjs-plugin-artoolkit@main/dist/arjs-plugin-artoolkit.esm.js'
  );
  ```

### Autoplay/permissions (mobile)

- Ensure the video element is muted and has playsinline for iOS:
  ```js
  videoEl.muted = true;
  videoEl.setAttribute('playsinline', '');
  ```
- Use HTTPS on mobile browsers to access the camera.

### Browser API and linting

- Guard browser globals:
  - `globalThis.createImageBitmap`, `globalThis.OffscreenCanvas`
- Cancel rVFC via `video.cancelVideoFrameCallback(id)`, not a global.
- Use `globalThis.requestAnimationFrame`/`globalThis.cancelAnimationFrame` with fallbacks when needed.

### CORS

- If serving from a custom dev server, ensure it serves:
  - the vendor ESM and its assets folder
  - example data files under /examples/...
- Avoid cross-origin requests without proper CORS headers.

### Performance tips

- Prefer `HTMLVideoElement.requestVideoFrameCallback` when available; it syncs to decoder frames.
- If needed, throttle frame emission in the pump to reduce CPU usage (e.g., skip frames).

## Legacy API

The original Source and Profile classes are still available and fully supported:

```javascript
import { Source, Profile } from 'arjs-core';
```

See existing documentation for legacy API usage.
