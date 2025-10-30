/**
 * Capture System
 * Initializes the chosen capture plugin, manages capture state,
 * and provides frame source resources to other systems
 */

import {
  ResourceType,
  CaptureState,
  FrameSourceRef,
} from "../core/components.js";

export class CaptureSystem {
  constructor(options = {}) {
    this.sourceType = options.sourceType || "webcam";
    this.sourceUrl = options.sourceUrl || null;
    this.deviceId = options.deviceId || null;
    this.sourceWidth = options.sourceWidth || 640;
    this.sourceHeight = options.sourceHeight || 480;
    this.displayWidth = options.displayWidth || 640;
    this.displayHeight = options.displayHeight || 480;
    this.initialized = false;
  }

  /**
   * Initialize the capture system
   * @param {Engine} engine
   */
  async init(engine) {
    // Initialize resources
    const captureState = new CaptureState();
    captureState.status = "initializing";
    captureState.sourceType = this.sourceType;

    const frameSourceRef = new FrameSourceRef();
    frameSourceRef.sourceType = this.sourceType;

    engine.ecs.setResource(ResourceType.CAPTURE_STATE, captureState);
    engine.ecs.setResource(ResourceType.FRAME_SOURCE_REF, frameSourceRef);

    engine.events.emit("capture:initializing", {
      sourceType: this.sourceType,
    });

    // Get the appropriate capture plugin
    const pluginId = `source:${this.sourceType}`;
    const plugin = engine.plugins.get(pluginId);

    if (!plugin) {
      captureState.status = "error";
      captureState.error = `Capture plugin '${pluginId}' not found`;
      engine.events.emit("capture:error", { error: captureState.error });
      return;
    }

    // Initialize the plugin with configuration
    try {
      const config = {
        sourceUrl: this.sourceUrl,
        deviceId: this.deviceId,
        sourceWidth: this.sourceWidth,
        sourceHeight: this.sourceHeight,
        displayWidth: this.displayWidth,
        displayHeight: this.displayHeight,
      };

      const result = await plugin.initCapture(config);

      if (result.success) {
        frameSourceRef.domElement = result.domElement;
        frameSourceRef.stream = result.stream || null;

        captureState.status = "ready";
        captureState.width = this.sourceWidth;
        captureState.height = this.sourceHeight;

        this.initialized = true;

        engine.events.emit("capture:ready", {
          sourceType: this.sourceType,
          domElement: result.domElement,
        });
      } else {
        captureState.status = "error";
        captureState.error = result.error || "Unknown error";
        engine.events.emit("capture:error", { error: captureState.error });
      }
    } catch (error) {
      captureState.status = "error";
      captureState.error = error.message;
      engine.events.emit("capture:error", { error: error.message });
    }
  }

  /**
   * System update function - called each frame
   * @param {Engine} engine
   * @param {number} deltaTime
   */
  static update(engine, deltaTime) {
    // The capture system is mostly event-driven
    // This update function can be used for monitoring or periodic checks
    const captureState = engine.ecs.getResource(ResourceType.CAPTURE_STATE);
    if (captureState && captureState.status === "ready") {
      // Capture is ready, nothing to do per-frame currently
      // Future: could add frame rate monitoring, health checks, etc.
    }
  }

  /**
   * Shutdown the capture system
   * @param {Engine} engine
   */
  shutdown(engine) {
    const frameSourceRef = engine.ecs.getResource(
      ResourceType.FRAME_SOURCE_REF,
    );

    if (frameSourceRef && frameSourceRef.domElement) {
      // Stop media streams if active
      if (
        frameSourceRef.stream &&
        typeof frameSourceRef.stream.getTracks === "function"
      ) {
        frameSourceRef.stream.getTracks().forEach((track) => track.stop());
      }

      // Remove DOM element
      if (
        frameSourceRef.domElement.parentNode &&
        frameSourceRef.domElement.id === "arjs-video"
      ) {
        frameSourceRef.domElement.remove();
      }
    }

    const captureState = engine.ecs.getResource(ResourceType.CAPTURE_STATE);
    if (captureState) {
      captureState.status = "uninitialized";
    }

    this.initialized = false;

    engine.events.emit("capture:shutdown");
  }
}

/**
 * Factory function to create the system update function
 * @returns {Function} system function
 */
export function createCaptureSystem(options) {
  const system = new CaptureSystem(options);
  return (engine, deltaTime) => CaptureSystem.update(engine, deltaTime);
}
