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
import { Engine, CaptureSystem, SOURCE_TYPES } from "ar.js-core";
import { webcamPlugin } from "./plugins/source/webcam.js";
import { defaultProfilePlugin } from "./plugins/profile/default-policy.js";

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
import { Source, Profile } from "ar.js-core";
```

See existing documentation for legacy API usage.