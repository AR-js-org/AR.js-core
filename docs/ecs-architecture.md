# AR.js ECS Architecture

## Overview

AR.js-core now includes a modular Entity-Component-System (ECS) architecture with a plugin system. This provides a flexible, data-oriented approach to AR functionality while maintaining backward compatibility with the existing API.

## Core Concepts

### Entity-Component-System (ECS)

The ECS pattern separates data (Components) from behavior (Systems):

- **Entities**: Simple numeric IDs representing objects in the AR scene
- **Components**: Pure data structures attached to entities
- **Systems**: Logic that operates on entities with specific components
- **Resources**: Global singleton data (like capture state, configuration)

### Event Bus

A lightweight pub/sub system for decoupled communication between systems and plugins:

```javascript
// Subscribe to events
engine.events.on("capture:ready", (data) => {
  console.log("Capture ready:", data);
});

// Emit events
engine.events.emit("capture:ready", { domElement });
```

### Plugin System

Modular plugins extend engine functionality:

- **Source Plugins**: Capture from webcam, video, or image
- **Profile Plugins**: Device performance profiling
- **Custom Plugins**: Extend with your own functionality

## Architecture Components

### Core (`src/core/`)

#### `ecs.js`

Minimal ECS implementation with entities, components, queries, and resources.

```javascript
const engine = new Engine();

// Create entity
const entityId = engine.ecs.createEntity();

// Add component
engine.ecs.addComponent(entityId, "Transform", { x: 0, y: 0, z: 0 });

// Query entities
const query = engine.ecs.createQuery("transforms", ["Transform"]);
```

#### `event-bus.js`

Pub/sub event system for inter-system communication.

```javascript
// Subscribe
const unsubscribe = engine.events.on("eventType", callback);

// Emit
engine.events.emit("eventType", { data });

// Unsubscribe
unsubscribe();
```

#### `plugin-manager.js`

Register, enable, and disable plugins.

```javascript
// Register plugin
engine.plugins.register("pluginId", pluginInstance);

// Enable/disable
engine.plugins.enable("pluginId");
engine.plugins.disable("pluginId");
```

#### `engine.js`

Main orchestrator that wires ECS, events, plugins, and game loop.

```javascript
const engine = new Engine();

// Add systems
engine.addSystem((engine, deltaTime) => {
  // System logic
});

// Start/stop
engine.start();
engine.stop();
```

#### `components.js`

Shared component and resource type definitions.

- `ProcessingConfig`: AR processing configuration
- `CaptureState`: Current capture status
- `FrameSourceRef`: Reference to video/image DOM element
- `DeviceProfile`: Device performance profile

### Systems (`src/systems/`)

#### `capture-system.js`

Initializes capture plugins, manages capture state, and provides frame sources.

```javascript
const captureSystem = new CaptureSystem({
  sourceType: "webcam", // or 'video', 'image'
  sourceWidth: 640,
  sourceHeight: 480,
});

await captureSystem.init(engine);
```

### Plugins

#### Source Plugins (`plugins/source/`)

**Webcam** (`webcam.js`):

- Uses getUserMedia API
- Supports device selection
- Mobile torch control

**Video** (`video.js`):

- Loads local or remote video files
- Auto-loop and autoplay

**Image** (`image.js`):

- Loads static images
- Supports local and remote URLs

#### Profile Plugin (`plugins/profile/`)

**Default Profile** (`default-profile.js`):

- Auto-detects device type (mobile/desktop)
- Applies appropriate performance settings
- Profiles: desktop-fast, desktop-normal, phone-normal, phone-slow

## Usage Example

```javascript
import { Engine } from "./src/core/engine.js";
import { CaptureSystem } from "./src/systems/capture-system.js";
import { WebcamPlugin } from "./plugins/source/webcam.js";
import { DefaultProfilePlugin } from "./plugins/profile/default-profile.js";

// Create engine
const engine = new Engine();

// Register plugins
engine.plugins.register("source:webcam", new WebcamPlugin());
engine.plugins.register("profile:default", new DefaultProfilePlugin());

// Enable plugins
engine.plugins.enable("source:webcam");
engine.plugins.enable("profile:default");

// Create capture system
const captureSystem = new CaptureSystem({
  sourceType: "webcam",
});

// Listen to events
engine.events.on("capture:ready", (data) => {
  console.log("Capture ready!", data.domElement);
});

// Initialize and start
await captureSystem.init(engine);
engine.start();
```

## Backward Compatibility

The existing `Source` and `Profile` classes remain intact. Future work will add legacy adapters that map the old API to the new ECS internals, ensuring existing code continues to work without modification.

## Development

### Build

```bash
npm run build
```

### Dev Mode

```bash
npm run dev
```

### Example

Open `examples/basic-ecs/index.html` in a browser to see the ECS architecture in action.

## Plugin Development

To create a custom plugin:

```javascript
class MyPlugin {
  init(engine) {
    // Initialize plugin with engine reference
    this.engine = engine;
  }

  enable() {
    // Called when plugin is enabled
  }

  disable() {
    // Called when plugin is disabled
  }

  destroy() {
    // Cleanup
  }
}

// Register
engine.plugins.register("my:plugin", new MyPlugin());
engine.plugins.enable("my:plugin");
```

## Events Reference

### Capture Events

- `capture:initializing` - Capture initialization started
- `capture:ready` - Capture ready and active
- `capture:error` - Capture error occurred
- `capture:shutdown` - Capture stopped

### Plugin Events

- `plugin:enabled` - Plugin was enabled
- `plugin:disabled` - Plugin was disabled

### Source Events

- `webcam:initialized` - Webcam capture ready
- `webcam:error` - Webcam error
- `video:initialized` - Video loaded
- `video:error` - Video load error
- `image:initialized` - Image loaded
- `image:error` - Image load error

### Profile Events

- `profile:applied` - Profile was applied
- `profile:updated` - Profile settings changed

## Future Enhancements

- Legacy adapters for `Source` and `Profile` classes
- Additional systems (tracking, rendering, etc.)
- More plugin types (tracking backends, marker detection, etc.)
- Performance monitoring and optimization
- Testing infrastructure
