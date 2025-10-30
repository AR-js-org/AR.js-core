# AR.js Core Plugins

This directory contains plugins for the AR.js Core ECS architecture.

## Available Plugins

### Source Plugins

Source plugins handle media capture and frame sources:

- **webcam.js** - Capture video from user's webcam using getUserMedia
- **video.js** - Play video from local or remote video files
- **image.js** - Load static images for AR tracking

### Profile Plugins

Profile plugins manage performance and device configuration:

- **default-policy.js** - Automatically detect device type and set performance profiles

## Using Plugins

### Import Individual Plugins

```javascript
import { webcamPlugin } from "./plugins/source/webcam.js";
import { defaultProfilePlugin } from "./plugins/profile/default-policy.js";
```

### Import All Plugins

```javascript
import {
  webcamPlugin,
  videoPlugin,
  imagePlugin,
  defaultProfilePlugin,
} from "./plugins/index.js";
```

### Register and Enable Plugins

```javascript
import { Engine } from "ar.js-core";
import { webcamPlugin } from "./plugins/source/webcam.js";

const engine = new Engine();

// Register plugin
engine.pluginManager.register(webcamPlugin.id, webcamPlugin);

// Enable plugin
await engine.pluginManager.enable(webcamPlugin.id, engine.getContext());
```

## Creating Custom Plugins

Plugins are simple objects with lifecycle methods:

```javascript
const myPlugin = {
  id: "category:name", // Unique identifier
  name: "My Plugin", // Human-readable name
  type: "category", // Plugin category

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
```

### Source Plugin Interface

Source plugins should implement a `capture` method:

```javascript
async capture(config, context) {
  // config contains sourceWidth, sourceHeight, etc.
  // Return an object with:
  return {
    element: domElement,  // HTMLVideoElement or HTMLImageElement
    stream: mediaStream,  // MediaStream (for webcam) or null
    width: actualWidth,   // Actual media width
    height: actualHeight, // Actual media height
    type: 'webcam',      // Source type
  };
}
```

### Profile Plugin Interface

Profile plugins should set device profile resources:

```javascript
async init(context) {
  const profile = this.detectProfile();
  context.ecs.setResource(RESOURCES.DEVICE_PROFILE, profile);
}
```

## Plugin Categories

- **source** - Media capture and frame sources
- **profile** - Performance and device configuration
- **tracking** - AR tracking backends (future)
- **render** - Rendering systems (future)

## See Also

- [ECS Architecture Documentation](../docs/ECS_ARCHITECTURE.md)
- [Minimal Example](../examples/minimal/)
