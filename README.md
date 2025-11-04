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

## Legacy API

The original Source and Profile classes are still available and fully supported:

```javascript
import { Source, Profile } from 'arjs-core';
```

See existing documentation for legacy API usage.
