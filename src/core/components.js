/**
 * Component and Resource type definitions
 * These are the shared data structures used throughout the ECS
 */

/**
 * Component Names (used as keys in ECS)
 */
export const ComponentType = {
  FRAME_SOURCE: "FrameSource",
  CAPTURE_STATE: "CaptureState",
  DEVICE_PROFILE: "DeviceProfile",
};

/**
 * Resource Names (global singleton data)
 */
export const ResourceType = {
  PROCESSING_CONFIG: "ProcessingConfig",
  FRAME_SOURCE_REF: "FrameSourceRef",
  CAPTURE_STATE: "CaptureState",
  DEVICE_PROFILE: "DeviceProfile",
};

/**
 * ProcessingConfig - Configuration for AR processing
 */
export class ProcessingConfig {
  constructor(options = {}) {
    this.canvasWidth = options.canvasWidth || 640;
    this.canvasHeight = options.canvasHeight || 480;
    this.maxDetectionRate = options.maxDetectionRate || 60;
    this.detectionMode = options.detectionMode || "mono";
    this.trackingBackend = options.trackingBackend || "artoolkit";
  }
}

/**
 * CaptureState - Current state of video/image capture
 */
export class CaptureState {
  constructor() {
    this.status = "uninitialized"; // uninitialized, initializing, ready, error
    this.error = null;
    this.width = 0;
    this.height = 0;
    this.sourceType = null; // webcam, video, image
  }
}

/**
 * FrameSourceRef - Reference to the actual video/image DOM element
 */
export class FrameSourceRef {
  constructor() {
    this.domElement = null; // HTMLVideoElement or HTMLImageElement
    this.stream = null; // MediaStream (for webcam)
    this.sourceType = null; // webcam, video, image
  }
}

/**
 * DeviceProfile - Device performance profile
 */
export class DeviceProfile {
  constructor(options = {}) {
    this.profileLabel = options.profileLabel || "default";
    this.isMobile = this.#detectMobile();
    this.sourceWidth = options.sourceWidth || 640;
    this.sourceHeight = options.sourceHeight || 480;
    this.displayWidth = options.displayWidth || 640;
    this.displayHeight = options.displayHeight || 480;
  }

  #detectMobile() {
    return (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    );
  }
}
