# AR.js-core

An attempt to convert the Ar.js threex library into an agnostic library that can be used with any 3D library.

## Features

- **Classic API**: Original `Source` and `Profile` classes for backward compatibility
- **ECS Architecture**: New modular Entity-Component-System with plugin support
- **Source Capture**: Webcam, video file, and image capture plugins
- **Device Profiling**: Automatic performance optimization for mobile and desktop

## ECS Architecture (New)

AR.js-core now includes a data-oriented ECS (Entity-Component-System) architecture with a flexible plugin system.

### Quick Start

```javascript
import { Engine } from "./src/core/engine.js";
import { CaptureSystem } from "./src/systems/capture-system.js";
import { WebcamPlugin } from "./plugins/source/webcam.js";

// Create engine
const engine = new Engine();

// Register and enable webcam plugin
engine.plugins.register("source:webcam", new WebcamPlugin());
engine.plugins.enable("source:webcam");

// Initialize capture
const captureSystem = new CaptureSystem({ sourceType: "webcam" });
await captureSystem.init(engine);

// Start engine
engine.start();
```

### Documentation

- [ECS Architecture Guide](docs/ecs-architecture.md) - Complete documentation
- [Basic Example](examples/basic-ecs/index.html) - Live demo

### Core Components

- **ECS** (`src/core/ecs.js`) - Entity-Component-System base
- **Event Bus** (`src/core/event-bus.js`) - Pub/sub messaging
- **Plugin Manager** (`src/core/plugin-manager.js`) - Plugin system
- **Engine** (`src/core/engine.js`) - Main orchestrator

### Plugins

- **Webcam** (`plugins/source/webcam.js`) - Camera capture
- **Video** (`plugins/source/video.js`) - Video file playback
- **Image** (`plugins/source/image.js`) - Static image loading
- **Default Profile** (`plugins/profile/default-profile.js`) - Device profiling

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode with watch
npm run dev

# Format code
npm run format
```
