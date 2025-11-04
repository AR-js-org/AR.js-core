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

## Frame Pump: streaming frames to detection plugins

Most detection plugins (e.g., ArtoolkitPlugin) expect frames to arrive as `ImageBitmap` objects via the engine event bus (`engine:update`). The webcam source plugin provides a playing `<video>` element, but it doesn’t emit frames. A small “frame pump” bridges the gap:

- Reads frames from the active `<video>` (provided by `CaptureSystem` + `source:webcam`)
- Prefers `HTMLVideoElement.requestVideoFrameCallback` for precise timing
- Falls back to `requestAnimationFrame` when RVFC isn’t available
- Emits `engine:update` with `{ id, imageBitmap, width, height }` every frame

Minimal example

```js
import { CaptureSystem } from './src/systems/capture-system.js';
import { SOURCE_TYPES } from './src/core/components.js';
import { FramePumpSystem } from './src/systems/frame-pump-system.js';

// 1) Initialize capture (provides a playing <video>)
await CaptureSystem.initialize(
  { sourceType: SOURCE_TYPES.WEBCAM, sourceWidth: 640, sourceHeight: 480 },
  ctx,
);

// 2) Start the frame pump (streams ImageBitmaps to detection plugins)
FramePumpSystem.start(ctx);

// 3) When done, stop the pump
FramePumpSystem.stop(ctx);
```

Why it’s separate from the webcam plugin

- The webcam plugin’s responsibility is to acquire and expose a video stream. Emitting frames is a reusable concern that multiple detection plugins can share, so it lives in a small system instead of being tied to a single plugin.

Notes

- If your detection plugin isn’t seeing detections:
  - Ensure the frame pump is running
  - Confirm the plugin listens for `engine:update`
  - Check network paths for any assets (e.g., worker files, camera parameters, patterns)

### Features

- Core ECS: Entity-Component-System with queries and resources
- Event Bus: Lightweight pub/sub for decoupled communication
- Plugin System: Modular plugins for capture, tracking, and more
- Capture System: Unified interface for webcam, video, and image sources
- Profile Policies: Automatic device detection and performance tuning

### Documentation

- ECS Architecture Guide (docs/ECS_ARCHITECTURE.md)
- Plugins Guide (plugins/README.md) — Plugin contract, lifecycle, events, and device profile migration (QUALITY_TIERS)
- Examples Index (examples/index.html)

### Running Examples

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

## Legacy API

The original Source and Profile classes are still available and fully supported:

```javascript
import { Source, Profile } from 'arjs-core';
```

See existing documentation for legacy API usage.
