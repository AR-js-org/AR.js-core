/**
 * Capture System
 * Initializes the chosen capture plugin, manages capture state,
 * and writes FrameSourceRef + CaptureState resources
 */

import {
  RESOURCES,
  EVENTS,
  CAPTURE_STATES,
  SOURCE_TYPES,
} from "../core/components.js";

export class CaptureSystem {
  /**
   * Initialize capture system with configuration
   * @param {Object} config
   * @param {string} config.sourceType - Type of source (webcam, video, image)
   * @param {string} [config.sourceUrl] - URL for video/image sources
   * @param {string} [config.deviceId] - Specific camera device ID
   * @param {number} [config.sourceWidth] - Desired source width
   * @param {number} [config.sourceHeight] - Desired source height
   */
  static async initialize(config, context) {
    const { ecs, eventBus, pluginManager } = context;

    // Set initial capture state
    ecs.setResource(RESOURCES.CAPTURE_STATE, {
      state: CAPTURE_STATES.INITIALIZING,
      error: null,
    });

    eventBus.emit(EVENTS.CAPTURE_INIT_START, { config });

    try {
      // Determine which plugin to use based on source type
      const sourceType = config.sourceType || SOURCE_TYPES.WEBCAM;
      let pluginId;

      switch (sourceType) {
        case SOURCE_TYPES.WEBCAM:
          pluginId = "source:webcam";
          break;
        case SOURCE_TYPES.VIDEO:
          pluginId = "source:video";
          break;
        case SOURCE_TYPES.IMAGE:
          pluginId = "source:image";
          break;
        default:
          throw new Error(`Unknown source type: ${sourceType}`);
      }

      // Check if the plugin is registered
      if (!pluginManager.isRegistered(pluginId)) {
        throw new Error(`Plugin ${pluginId} is not registered`);
      }

      // Enable the plugin if not already enabled
      if (!pluginManager.isEnabled(pluginId)) {
        const success = await pluginManager.enable(pluginId, context);
        if (!success) {
          throw new Error(`Failed to enable plugin ${pluginId}`);
        }
      }

      // Get the plugin and call its capture method
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin || typeof plugin.capture !== "function") {
        throw new Error(`Plugin ${pluginId} does not have a capture method`);
      }

      // Call the plugin's capture method
      const frameSource = await plugin.capture(config, context);

      // Store the frame source reference
      ecs.setResource(RESOURCES.FRAME_SOURCE_REF, {
        element: frameSource.element,
        stream: frameSource.stream,
        type: sourceType,
        width: frameSource.width || config.sourceWidth || 640,
        height: frameSource.height || config.sourceHeight || 480,
      });

      // Update capture state to ready
      ecs.setResource(RESOURCES.CAPTURE_STATE, {
        state: CAPTURE_STATES.READY,
        error: null,
      });

      eventBus.emit(EVENTS.CAPTURE_INIT_SUCCESS, { frameSource });
      eventBus.emit(EVENTS.CAPTURE_READY, { frameSource });

      return frameSource;
    } catch (error) {
      console.error("Capture initialization failed:", error);

      // Update capture state to error
      ecs.setResource(RESOURCES.CAPTURE_STATE, {
        state: CAPTURE_STATES.ERROR,
        error: error.message || "Unknown error",
      });

      eventBus.emit(EVENTS.CAPTURE_INIT_ERROR, { error });

      throw error;
    }
  }

  /**
   * Dispose the capture system and clean up resources
   */
  static async dispose(context) {
    const { ecs, eventBus, pluginManager } = context;

    // Get the current frame source
    const frameSourceRef = ecs.getResource(RESOURCES.FRAME_SOURCE_REF);

    // Disable source plugins
    const sourcePlugins = ["source:webcam", "source:video", "source:image"];
    for (const pluginId of sourcePlugins) {
      if (pluginManager.isEnabled(pluginId)) {
        await pluginManager.disable(pluginId);
      }
    }

    // Remove resources
    ecs.removeResource(RESOURCES.FRAME_SOURCE_REF);
    ecs.setResource(RESOURCES.CAPTURE_STATE, {
      state: CAPTURE_STATES.DISPOSED,
      error: null,
    });

    eventBus.emit(EVENTS.CAPTURE_DISPOSED, { frameSourceRef });
  }

  /**
   * Get the current capture state
   */
  static getState(context) {
    return context.ecs.getResource(RESOURCES.CAPTURE_STATE);
  }

  /**
   * Get the current frame source
   */
  static getFrameSource(context) {
    return context.ecs.getResource(RESOURCES.FRAME_SOURCE_REF);
  }
}
