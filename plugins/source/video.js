/**
 * Video File Capture Plugin
 * Loads and plays video from a local or remote URL
 * Emits lifecycle events for source initialization
 */

export class VideoPlugin {
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
    // Stop and clean up video
    if (this.domElement) {
      if (this.domElement.parentNode) {
        this.domElement.pause();
        this.domElement.removeAttribute("src");
        this.domElement.load();
        this.domElement.remove();
      }
      this.domElement = null;
    }
  }

  /**
   * Initialize video capture from file
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
          error: "sourceUrl is required for video capture",
        });
        return;
      }

      // Create video element
      const domElement = document.createElement("video");
      domElement.src = sourceUrl;
      domElement.style.objectFit = "initial";
      domElement.autoplay = true;
      domElement.webkitPlaysinline = true;
      domElement.controls = false;
      domElement.loop = true;
      domElement.muted = true;
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
      domElement.onloadeddata = () => {
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
          this.engine.events.emit("video:initialized", { domElement });
        }

        resolve({
          success: true,
          domElement,
        });
      };

      // Setup error handler
      domElement.onerror = (error) => {
        const errorMsg = `Video load error: ${sourceUrl}`;

        // Emit engine event
        if (this.engine) {
          this.engine.events.emit("video:error", { error: errorMsg });
        }

        resolve({
          success: false,
          error: errorMsg,
        });
      };

      // Setup click handler for autoplay
      const onInitialClick = () => {
        if (domElement && domElement.play) {
          domElement.play().catch(console.error);
        }
      };
      document.body.addEventListener("click", onInitialClick, { once: true });
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
