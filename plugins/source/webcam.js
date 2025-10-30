/**
 * Webcam Source Plugin
 * Provides getUserMedia-based video capture from webcam
 * Emits source lifecycle events and provides HTMLVideoElement + MediaStream
 */

import { EVENTS } from "../../src/core/components.js";

export const webcamPlugin = {
  id: "source:webcam",
  name: "Webcam Source",
  type: "source",

  // Internal state
  _videoElement: null,
  _stream: null,
  _context: null,

  /**
   * Initialize the plugin
   */
  async init(context) {
    this._context = context;
  },

  /**
   * Capture video from webcam
   * @param {Object} config
   * @param {string} [config.deviceId] - Specific camera device ID
   * @param {number} [config.sourceWidth] - Desired video width
   * @param {number} [config.sourceHeight] - Desired video height
   * @param {number} [config.displayWidth] - Display width
   * @param {number} [config.displayHeight] - Display height
   * @param {Object} context - Engine context
   * @returns {Promise<Object>} Frame source with element and stream
   */
  async capture(config, context) {
    const { eventBus } = context;

    // Check if MediaDevices API is available
    if (
      !globalThis.navigator?.mediaDevices ||
      !globalThis.navigator.mediaDevices.getUserMedia ||
      !globalThis.navigator.mediaDevices.enumerateDevices
    ) {
      const error = new Error("MediaDevices API not available in this browser");
      eventBus.emit(EVENTS.SOURCE_ERROR, { error, source: "webcam" });
      throw error;
    }

    try {
      // Create video element
      const videoElement =
        globalThis.document?.createElement?.("video") ||
        Object.assign(
          {},
          {
            setAttribute() {},
            style: {},
            play: async () => {},
          },
        );
      videoElement.setAttribute?.("autoplay", "");
      videoElement.setAttribute?.("muted", "");
      videoElement.setAttribute?.("playsinline", "");
      videoElement.setAttribute?.("id", "arjs-video");

      // Set display size
      const displayWidth = config.displayWidth || 640;
      const displayHeight = config.displayHeight || 480;
      if (videoElement.style) {
        videoElement.style.width = displayWidth + "px";
        videoElement.style.height = displayHeight + "px";
        videoElement.style.position = "absolute";
        videoElement.style.top = "0px";
        videoElement.style.left = "0px";
        videoElement.style.zIndex = "-2";
      }

      // Build getUserMedia constraints
      const constraints = {
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: config.sourceWidth || 640 },
          height: { ideal: config.sourceHeight || 480 },
        },
      };

      // Add device ID if specified
      if (config.deviceId) {
        constraints.video.deviceId = { exact: config.deviceId };
      }

      // Get media stream
      const stream =
        await globalThis.navigator.mediaDevices.getUserMedia(constraints);

      // Set video source
      videoElement.srcObject = stream;

      // Store references
      this._videoElement = videoElement;
      this._stream = stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement
            .play?.()
            .then(() => {
              // Append to document (best-effort)
              try {
                globalThis.document?.body?.appendChild?.(videoElement);
              } catch {}

              // Dispatch custom event for backward compatibility
              try {
                globalThis.window?.dispatchEvent?.(
                  new globalThis.CustomEvent("camera-init", {
                    detail: { stream },
                  }),
                );
                globalThis.window?.dispatchEvent?.(
                  new globalThis.CustomEvent("arjs-video-loaded", {
                    detail: { component: videoElement },
                  }),
                );
              } catch {}

              // Emit source events
              eventBus.emit(EVENTS.SOURCE_LOADED, {
                element: videoElement,
                stream,
                source: "webcam",
              });
              eventBus.emit(EVENTS.SOURCE_PLAYING, {
                element: videoElement,
                source: "webcam",
              });

              resolve();
            })
            .catch(reject);
        };

        videoElement.onerror = reject;
      });

      // Get actual video dimensions
      const actualWidth = videoElement.videoWidth || config.sourceWidth || 640;
      const actualHeight =
        videoElement.videoHeight || config.sourceHeight || 480;

      return {
        element: videoElement,
        stream: stream,
        width: actualWidth,
        height: actualHeight,
        type: "webcam",
      };
    } catch (error) {
      // Emit error event
      context?.eventBus?.emit?.(EVENTS.SOURCE_ERROR, {
        error,
        source: "webcam",
        message: error.message,
      });

      // Dispatch custom event for backward compatibility
      try {
        globalThis.window?.dispatchEvent?.(
          new globalThis.CustomEvent("camera-error", { detail: { error } }),
        );
      } catch {}

      throw error;
    }
  },

  /**
   * Dispose the plugin and clean up resources
   */
  async dispose() {
    if (this._stream) {
      try {
        this._stream.getTracks?.().forEach((track) => track.stop?.());
      } catch {}
      this._stream = null;
    }

    if (this._videoElement) {
      try {
        if (this._videoElement.parentNode?.removeChild) {
          this._videoElement.parentNode.removeChild(this._videoElement);
        }
        this._videoElement.srcObject = null;
      } catch {}
      this._videoElement = null;
    }

    if (this._context?.eventBus) {
      this._context.eventBus.emit(EVENTS.CAPTURE_DISPOSED, {
        source: "webcam",
      });
    }
  },

  /**
   * Check if mobile torch is available
   * @returns {boolean}
   */
  hasMobileTorch() {
    if (!this._stream) return false;

    // Guard against environments where MediaStream is undefined
    const hasCtor = typeof globalThis.MediaStream === "function";
    if (!hasCtor) {
      // Fallback: duck-type for getVideoTracks availability
      const vt = this._stream?.getVideoTracks?.();
      return Array.isArray(vt) && vt[0]?.getCapabilities
        ? !!vt[0].getCapabilities().torch
        : false;
    }

    const videoTrack = this._stream.getVideoTracks?.()[0];
    if (!videoTrack || !videoTrack.getCapabilities) {
      return false;
    }
    const capabilities = videoTrack.getCapabilities();
    return !!capabilities.torch;
  },

  /**
   * Toggle mobile torch on/off
   * @param {boolean} [enabled] - Force enable/disable, or toggle if not provided
   * @returns {Promise<boolean>} New torch state
   */
  async toggleMobileTorch(enabled) {
    // Only proceed if torch is available
    if (!this.hasMobileTorch()) {
      console.warn?.("Mobile torch is not available on this device");
      return false;
    }

    const videoTrack = this._stream.getVideoTracks()[0];
    const currentState = this._torchEnabled || false;
    const newState = enabled !== undefined ? enabled : !currentState;

    try {
      await videoTrack.applyConstraints?.({
        advanced: [{ torch: newState }],
      });
      this._torchEnabled = newState;
      return newState;
    } catch (error) {
      console.error?.("Failed to toggle torch:", error);
      return currentState;
    }
  },
};
