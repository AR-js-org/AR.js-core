# AR.js Core - ECS Architecture

## Overview

AR.js Core now includes a modern Entity-Component-System (ECS) architecture with a plugin system. This provides a modular, data-oriented approach to building AR applications while maintaining backward compatibility with the existing API.

## Core Components

### Engine (`src/core/engine.js`)

The Engine orchestrates the entire system, managing:

- ECS (Entity-Component-System)
- Event Bus (pub/sub messaging)
- Plugin Manager (plugin lifecycle)
- Game Loop (frame updates)
- Systems (processing logic)

**Usage:**

```javascript
import { Engine } from "ar.js-core";

const engine = new Engine();
engine.start(); // Start the game loop
```

### ECS (`src/core/ecs.js`)

Minimal Entity-Component-System implementation:

- **Entities**: Numeric IDs representing objects
- **Components**: Data containers attached to entities
- **Resources**: Global singleton data
- **Queries**: Find entities with specific components

**Usage:**

```javascript
const entityId = engine.ecs.createEntity();
engine.ecs.setComponent(entityId, "Transform", { x: 0, y: 0, z: 0 });
engine.ecs.setResource("ProcessingConfig", { threshold: 0.5 });
```

### Event Bus (`src/core/event-bus.js`)

Lightweight publish-subscribe system for loose coupling:

**Usage:**

```javascript
// Subscribe to events
engine.eventBus.on("capture:ready", (data) => {
  console.log("Capture ready:", data);
});

// Emit events
engine.eventBus.emit("custom:event", { message: "Hello" });
```

### Plugin Manager (`src/core/plugin-manager.js`)

Manages plugin registration, enabling, and disabling:

**Usage:**

```javascript
// Register a plugin
engine.pluginManager.register("my-plugin", {
  async init(context) {
    console.log("Plugin initialized");
  },
  async dispose() {
    console.log("Plugin disposed");
  },
  update(deltaTime, context) {
    // Called each frame
  },
});

// Enable the plugin
await engine.pluginManager.enable("my-plugin", engine.getContext());
```

## Systems

### Capture System (`src/systems/capture-system.js`)

Manages video/image capture from various sources:

**Usage:**

```javascript
import { CaptureSystem, SOURCE_TYPES } from "ar.js-core";

await CaptureSystem.initialize(
  {
    sourceType: SOURCE_TYPES.WEBCAM,
    sourceWidth: 640,
    sourceHeight: 480,
  },
  engine.getContext(),
);
```

## Built-in Plugins

### Source Plugins

#### Webcam Plugin (`plugins/source/webcam.js`)

Captures video from user's webcam using getUserMedia API.

Features:

- Device selection
- Resolution control
- Mobile torch support
- Error handling

#### Video Plugin (`plugins/source/video.js`)

Plays video from local or remote files.

Features:

- Local/remote video files
- Loop and autoplay controls
- Fallback for autoplay restrictions

#### Image Plugin (`plugins/source/image.js`)

Loads static images for AR tracking.

Features:

- Local/remote images
- Dimension control
- Load error handling

### Profile Plugin

#### Default Profile Plugin (`plugins/profile/default-policy.js`)

Automatically detects device type and sets performance profiles.

Profiles:

- `desktop-fast`: High performance desktop (1920x1440)
- `desktop-normal`: Standard desktop (640x480)
- `phone-normal`: Standard mobile (320x240)
- `phone-slow`: Low-end mobile (240x180)

**Usage:**

```javascript
import { defaultProfilePlugin } from "./plugins/profile/default-policy.js";

engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);
await engine.pluginManager.enable(defaultProfilePlugin.id, engine.getContext());

const profile = engine.ecs.getResource(RESOURCES.DEVICE_PROFILE);
console.log("Device profile:", profile.label);
```

## Component and Resource Keys

Standardized keys are defined in `src/core/components.js`:

```javascript
import { COMPONENTS, RESOURCES, EVENTS } from "ar.js-core";

// Component keys (entity-specific)
COMPONENTS.TRACKING_TARGET;
COMPONENTS.TRANSFORM;
COMPONENTS.VISIBLE;

// Resource keys (global)
RESOURCES.PROCESSING_CONFIG;
RESOURCES.CAPTURE_STATE;
RESOURCES.FRAME_SOURCE_REF;
RESOURCES.DEVICE_PROFILE;

// Event types
EVENTS.CAPTURE_READY;
EVENTS.SOURCE_LOADED;
EVENTS.ENGINE_UPDATE;
```

## Creating Custom Plugins

Plugins are simple objects with lifecycle methods:

```javascript
const myPlugin = {
  id: "my-plugin",
  name: "My Custom Plugin",
  type: "custom",

  // Called when plugin is enabled
  async init(context) {
    const { ecs, eventBus, pluginManager, engine } = context;
    // Initialize plugin state
  },

  // Called each frame (optional)
  update(deltaTime, context) {
    // Update logic
  },

  // Called when plugin is disabled
  async dispose() {
    // Cleanup
  },
};

engine.pluginManager.register(myPlugin.id, myPlugin);
await engine.pluginManager.enable(myPlugin.id, engine.getContext());
```

## Creating Custom Systems

Systems are functions that process entities each frame:

```javascript
function mySystem(deltaTime, context) {
  const { ecs, eventBus } = context;

  // Query entities with specific components
  const entities = ecs.query("Transform", "Visible");

  for (const entityId of entities) {
    const transform = ecs.getComponent(entityId, "Transform");
    // Process entity
  }
}

engine.addSystem(mySystem);
```

## Events

The system emits various events for different lifecycle stages:

### Capture Events

- `capture:init:start` - Capture initialization started
- `capture:init:success` - Capture initialized successfully
- `capture:init:error` - Capture initialization failed
- `capture:ready` - Capture is ready to use
- `capture:disposed` - Capture has been disposed

### Source Events

- `source:loaded` - Media source loaded
- `source:error` - Media source error
- `source:playing` - Media source started playing
- `source:paused` - Media source paused

### Engine Events

- `engine:start` - Engine started
- `engine:stop` - Engine stopped
- `engine:update` - Engine updated (each frame)

### Plugin Events

- `plugin:registered` - Plugin registered
- `plugin:enabled` - Plugin enabled
- `plugin:disabled` - Plugin disabled

## Example Application

See `examples/minimal/` for a complete working example that demonstrates:

- Engine initialization
- Plugin registration and enabling
- Capture system usage
- Event handling
- UI updates based on system state

To run the example:

```bash
npm install
npm run dev
```

This will start a development server and open the minimal example in your browser.

## Backward Compatibility

The legacy `Source` and `Profile` classes remain unchanged and continue to work as before. They are exported alongside the new ECS components, allowing for gradual migration:

```javascript
// Legacy API (still works)
import { Source, Profile } from "ar.js-core";

// New ECS API
import { Engine, CaptureSystem } from "ar.js-core";
```

Future versions may add adapters that allow the legacy classes to use the new ECS internals while maintaining the same external API.

## Migration Guide

### From Legacy Source to ECS

**Before:**

```javascript
import { Source } from "ar.js-core";

const source = new Source({
  sourceType: "webcam",
  sourceWidth: 640,
  sourceHeight: 480,
});

source.init(
  () => {
    console.log("Source ready");
  },
  (error) => {
    console.error("Source error:", error);
  },
);
```

**After:**

```javascript
import { Engine, CaptureSystem, SOURCE_TYPES } from "ar.js-core";
import { webcamPlugin } from "./plugins/source/webcam.js";

const engine = new Engine();
engine.pluginManager.register(webcamPlugin.id, webcamPlugin);

engine.eventBus.on("capture:ready", () => {
  console.log("Source ready");
});

engine.eventBus.on("capture:init:error", ({ error }) => {
  console.error("Source error:", error);
});

await CaptureSystem.initialize(
  {
    sourceType: SOURCE_TYPES.WEBCAM,
    sourceWidth: 640,
    sourceHeight: 480,
  },
  engine.getContext(),
);
```

## Performance Considerations

- The ECS architecture is designed for efficient iteration over components
- Systems run in order of registration
- Plugin update methods are called after systems
- Use queries sparingly in hot paths; cache results when possible
- Resources are faster to access than component queries for global data

## Future Enhancements

Planned additions to the ECS architecture:

- Legacy adapter that maps old Source/Profile API to new internals
- Additional built-in systems (render, tracking)
- Component archetypes for faster queries
- Marker tracking components and systems
- Integration with AR tracking backends
