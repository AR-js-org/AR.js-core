/**
 * Webcam Capture Plugin
 * Uses getUserMedia to capture webcam video
 * Emits lifecycle events for source initialization and errors
 */

export class WebcamPlugin {
  constructor() {
    this.engine = null;
    this.domElement = null;
    this.stream = null;
  }

  /**
   * Initialize the plugin
   * @param {Engine} engine
   */
  init(engine) {
    this.engine = engine;
  }

  /**
   * Enable the plugin
   */
  enable() {
    // Plugin is enabled and ready to capture
  }

  /**
   * Disable the plugin
   */
  disable() {
    // Stop any active capture
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.remove();
    }
    this.domElement = null;
  }

  /**
   * Initialize webcam capture
   * @param {Object} config - capture configuration
   * @returns {Promise<Object>} result with success, domElement, stream, or error
   */
  async initCapture(config) {
    const { deviceId, sourceWidth, sourceHeight, displayWidth, displayHeight } =
      config;

    return new Promise((resolve) => {
      // Check API availability
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.enumerateDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        resolve({
          success: false,
          error:
            "WebRTC not supported: navigator.mediaDevices.getUserMedia not available",
        });
        return;
      }

      // Create video element
      const domElement = document.createElement("video");
      domElement.setAttribute("autoplay", "");
      domElement.setAttribute("muted", "");
      domElement.setAttribute("playsinline", "");
      domElement.style.width = displayWidth + "px";
      domElement.style.height = displayHeight + "px";
      domElement.style.position = "absolute";
      domElement.style.top = "0px";
      domElement.style.left = "0px";
      domElement.style.zIndex = "-2";
      domElement.setAttribute("id", "arjs-video");

      // Setup constraints
      const constraints = {
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: sourceWidth },
          height: { ideal: sourceHeight },
        },
      };

      if (deviceId !== null) {
        constraints.video.deviceId = { exact: deviceId };
      }

      // Enumerate devices first
      navigator.mediaDevices
        .enumerateDevices()
        .then(() => {
          // Get user media
          return navigator.mediaDevices.getUserMedia(constraints);
        })
        .then((stream) => {
          // Set video source
          domElement.srcObject = stream;

          // Store references
          this.domElement = domElement;
          this.stream = stream;

          // Append to document
          document.body.appendChild(domElement);

          // Emit custom events for compatibility
          window.dispatchEvent(
            new CustomEvent("camera-init", { detail: { stream } }),
          );
          window.dispatchEvent(
            new CustomEvent("arjs-video-loaded", {
              detail: { component: domElement },
            }),
          );

          // Emit engine event
          if (this.engine) {
            this.engine.events.emit("webcam:initialized", {
              domElement,
              stream,
            });
          }

          // Setup click handler for autoplay
          const onInitialClick = () => {
            if (domElement && domElement.play) {
              domElement.play().catch(console.error);
            }
          };
          document.body.addEventListener("click", onInitialClick, {
            once: true,
          });

          resolve({
            success: true,
            domElement,
            stream,
          });
        })
        .catch((error) => {
          const errorMsg = `Webcam error: ${error.name} - ${error.message}`;

          // Emit custom error event
          window.dispatchEvent(
            new CustomEvent("camera-error", { detail: { error } }),
          );

          // Emit engine event
          if (this.engine) {
            this.engine.events.emit("webcam:error", { error: errorMsg });
          }

          resolve({
            success: false,
            error: errorMsg,
          });
        });
    });
  }

  /**
   * Check if mobile torch is available
   * @returns {boolean}
   */
  hasMobileTorch() {
    if (!this.stream || !(this.stream instanceof MediaStream)) {
      return false;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack || !videoTrack.getCapabilities) {
      return false;
    }

    const capabilities = videoTrack.getCapabilities();
    return capabilities.torch ? true : false;
  }

  /**
   * Toggle mobile torch on/off
   * @returns {Promise<boolean>} success
   */
  async toggleMobileTorch() {
    if (!this.hasMobileTorch()) {
      console.warn("Mobile torch not available");
      return false;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    const currentStatus = this._currentTorchStatus || false;
    const newStatus = !currentStatus;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newStatus }],
      });
      this._currentTorchStatus = newStatus;
      return true;
    } catch (error) {
      console.error("Error toggling torch:", error);
      return false;
    }
  }

  /**
   * Destroy the plugin
   */
  destroy() {
    this.disable();
    this.engine = null;
  }
}
