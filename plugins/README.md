# AR.js Core Plugins

This guide explains how plugins work in the AR.js Core ECS architecture, including the plugin contract, lifecycle, and events.

## Overview

Plugins extend the core with modular functionality. Common categories include:

- source: Media capture and frame sources (webcam, video, image)
- profile: Performance and device configuration
- tracking: AR tracking backends (future)
- render: Rendering systems (future)

Recommended ID pattern: "<category>:<name>" (for example, "source:webcam").

## Plugin Contract

A plugin is a simple object with lifecycle methods. All methods are optional, but the shape below is recommended.

```javascript
const myPlugin = {
  id: "category:name", // Unique identifier (required)
  name: "My Plugin", // Human-readable name
  type: "category", // Plugin category

  // Called when the plugin is enabled (via PluginManager.enable)
  async init(context) {
    const { ecs, eventBus, pluginManager, engine } = context;
    // Initialize plugin state, store references, emit any setup events
  },

  // Called once per frame if implemented and the plugin is enabled
  update(deltaTime, context) {
    // Per-frame logic
  },

  // Called when the plugin is disabled or the engine is disposed
  async dispose() {
    // Cleanup, detach DOM elements, stop streams, release resources
  },
};
```

## Lifecycle

- Register: engine.pluginManager.register(id, plugin)
- Enable: await engine.pluginManager.enable(id, context)
  - Calls plugin.init(context)
  - Emits plugin:enabled
- Update: engine drives plugin.update(deltaTime, context) every frame while enabled
- Disable: await engine.pluginManager.disable(id)
  - Calls plugin.dispose()
  - Emits plugin:disabled
- Clear: await engine.pluginManager.clear() disables all and clears the registry

## Events

Plugins use the Event Bus to communicate. The following event types are emitted by core systems and plugins.

Capture lifecycle:

- capture:init:start
- capture:init:success
- capture:init:error
- capture:ready
- capture:disposed

Source lifecycle:

- source:loaded
- source:error
- source:playing
- source:paused

Engine lifecycle:

- engine:start
- engine:stop
- engine:update

Plugin lifecycle:

- plugin:registered
- plugin:enabled
- plugin:disabled

Listening to events:

```javascript
import { EVENTS } from "../src/core/components.js";

engine.eventBus.on(EVENTS.CAPTURE_READY, ({ frameSource }) => {
  console.log("Capture ready:", frameSource);
});
```

## Using Plugins

Register and enable a plugin:

```javascript
import { Engine } from "../src/core/engine.js";
import { webcamPlugin } from "./source/webcam.js";
import { defaultProfilePlugin } from "./profile/default-policy.js";

const engine = new Engine();

// Register plugins
engine.pluginManager.register(webcamPlugin.id, webcamPlugin);
engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);

// Enable profile (writes device profile resources)
await engine.pluginManager.enable(defaultProfilePlugin.id, engine.getContext());

// Enable other plugins as needed
await engine.pluginManager.enable(webcamPlugin.id, engine.getContext());

// Start the engine loop
engine.start();
```

## Source Plugins

Source plugins provide media sources (HTMLVideoElement/HTMLImageElement) for downstream processing.

Capture interface:

```javascript
// Called by your app when you want to start capture
async capture(config, context) {
  // config example:
  // { sourceUrl, sourceWidth, sourceHeight, displayWidth, displayHeight, deviceId, autoplay, loop, muted, playsInline }
  // context: { ecs, eventBus, pluginManager, engine }

  // Return an object with:
  return {
    element,       // HTMLVideoElement or HTMLImageElement
    stream,        // MediaStream (for webcam) or null
    width,         // Actual media width
    height,        // Actual media height
    type,          // 'webcam' | 'video' | 'image'
  };
}
```

Available source plugins in this repository:

- plugins/source/webcam.js – getUserMedia-based capture
- plugins/source/video.js – File/URL-based HTMLVideoElement playback
- plugins/source/image.js – Static HTMLImageElement loading

Example (webcam):

```javascript
import { Engine } from "../../src/core/engine.js";
import { webcamPlugin } from "../../plugins/source/webcam.js";

const engine = new Engine();
await webcamPlugin.init(engine.getContext());

const frame = await webcamPlugin.capture(
  {
    sourceWidth: 640,
    sourceHeight: 480,
    displayWidth: 640,
    displayHeight: 480,
  },
  engine.getContext(),
);

// Video element is appended by the plugin; you can also use frame.element directly.
console.log("Webcam source:", frame);
```

Example (image):

```javascript
import { imagePlugin } from "../../plugins/source/image.js";

await imagePlugin.init(engine.getContext());

const frame = await imagePlugin.capture(
  {
    sourceUrl: "https://example.com/picture.jpg",
    sourceWidth: 640,
    sourceHeight: 480,
    displayWidth: 640,
    displayHeight: 480,
  },
  engine.getContext(),
);

console.log("Image source:", frame);
```

## Profile Plugins

Profile plugins compute and publish device profiles and processing parameters into ECS resources. A typical profile plugin detects device class (mobile vs desktop) and sets performance-related hints.

Minimal example:

```javascript
export const defaultProfilePlugin = {
  id: "profile:default",
  name: "Default Profile",
  type: "profile",

  async init(context) {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const profile = {
      label: isMobile ? "phone-normal" : "desktop-normal",
      sourceWidth: 640,
      sourceHeight: 480,
      displayWidth: 640,
      displayHeight: 480,
    };
    context.ecs.setResource("DeviceProfile", profile);
    // Optionally emit profile-updated event
    context.eventBus.emit("profile:applied", { profile });
  },

  async dispose() {
    // Cleanup if needed
  },
};
```

## Migration note: Device profiles

- Legacy DEVICE_PROFILES (desktop-fast, desktop-normal, phone-normal, phone-slow) remain available for backward compatibility.
- New QUALITY_TIERS (low, medium, high, ultra) are computed at runtime based on device capabilities and a short micro-benchmark. The default profile plugin writes a structured object to `RESOURCES.DEVICE_PROFILE` with:
  - `label`: e.g., "auto-high"
  - `qualityTier`: one of QUALITY_TIERS
  - `score`: number (0..100)
  - `caps`: capability signals (cores, memoryGB, webgl2, wasmSIMD, screenLongSide, camera)
  - `capture`: sizing hints (sourceWidth, sourceHeight, displayWidth, displayHeight, fpsHint)
  - `processing`: budget hints (budgetMsPerFrame, complexity)
- Overriding:
  - To force a legacy profile, call `defaultProfilePlugin.setProfile("<legacy-label>", context)`.
  - To apply custom app-specific sizing, set your own object to `RESOURCES.DEVICE_PROFILE` after enabling the profile plugin.
- Compatibility:
  - The new profile object still includes top-level `label`, `sourceWidth`, `sourceHeight`, `displayWidth`, `displayHeight` to minimize changes in existing examples.

## See Also

- ECS Architecture Documentation (docs/ECS_ARCHITECTURE.md)
- Examples:
  - Examples Index: ../examples/index.html
  - Minimal: ../examples/minimal/index.html
  - Image Source: ../examples/basic-ecs/image-example.html
