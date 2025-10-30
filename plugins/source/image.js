/**
 * Image Capture Plugin
 * Loads a static image from a local or remote URL
 * Emits lifecycle events for source initialization
 */

export class ImagePlugin {
  constructor() {
    this.engine = null;
    this.domElement = null;
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
    // Clean up image
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.remove();
    }
    this.domElement = null;
  }

  /**
   * Initialize image capture from file
   * @param {Object} config - capture configuration
   * @returns {Promise<Object>} result with success, domElement, or error
   */
  async initCapture(config) {
    const {
      sourceUrl,
      sourceWidth,
      sourceHeight,
      displayWidth,
      displayHeight,
    } = config;

    return new Promise((resolve) => {
      if (!sourceUrl) {
        resolve({
          success: false,
          error: "sourceUrl is required for image capture",
        });
        return;
      }

      // Create image element
      const domElement = document.createElement("img");
      domElement.src = sourceUrl;
      domElement.width = sourceWidth;
      domElement.height = sourceHeight;
      domElement.style.width = displayWidth + "px";
      domElement.style.height = displayHeight + "px";
      domElement.style.position = "absolute";
      domElement.style.top = "0px";
      domElement.style.left = "0px";
      domElement.style.zIndex = "-2";
      domElement.setAttribute("id", "arjs-video");

      // Setup load handler
      domElement.onload = () => {
        // Store reference
        this.domElement = domElement;

        // Append to document
        document.body.appendChild(domElement);

        // Emit custom event for compatibility
        window.dispatchEvent(
          new CustomEvent("arjs-video-loaded", {
            detail: { component: domElement },
          }),
        );

        // Emit engine event
        if (this.engine) {
          this.engine.events.emit("image:initialized", { domElement });
        }

        resolve({
          success: true,
          domElement,
        });
      };

      // Setup error handler
      domElement.onerror = (error) => {
        const errorMsg = `Image load error: ${sourceUrl}`;

        // Emit engine event
        if (this.engine) {
          this.engine.events.emit("image:error", { error: errorMsg });
        }

        resolve({
          success: false,
          error: errorMsg,
        });
      };
    });
  }

  /**
   * Destroy the plugin
   */
  destroy() {
    this.disable();
    this.engine = null;
  }
}
